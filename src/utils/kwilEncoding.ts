import { DataType } from '../core/database';
import { AccountId } from '../core/network';
import { EncodedValue, UnencodedActionPayload } from '../core/payload';
import { bytesToBase64 } from './base64';
import {
  concatBytes,
  numberToUint16BigEndian,
  numberToUint32BigEndian,
  numberToUint16LittleEndian,
  prefixBytesLength,
} from './bytes';
import { booleanToBytes, hexToBytes, numberToBytes, stringToBytes } from './serial';
import { convertUuidToBytes, isUuid } from './uuid';
import { ValueType } from './types';
import { PayloadType } from '../core/enums';

export function encodeAccountId(accountId: AccountId): Uint8Array {
  const encodedId = prefixBytesLength(hexToBytes(accountId.identifier));
  const encodedKeyType = prefixBytesLength(stringToBytes(accountId.key_type));
  return concatBytes(encodedId, encodedKeyType);
}

export function encodeActionCall(
  actionCall: UnencodedActionPayload<PayloadType.CALL_ACTION>
): string {
  // // The version of the action call encoding used by the Kwil DB Engine
  const actionCallVersion = 0;
  const encodedVersion = numberToUint16LittleEndian(actionCallVersion);
  const encodedDbId = prefixBytesLength(stringToBytes(actionCall.dbid));
  // Action name
  const encodedAction = prefixBytesLength(stringToBytes(actionCall.action));
  const encodedNumArgs = numberToUint16LittleEndian(actionCall.arguments.length);
  let actionArguments: Uint8Array = new Uint8Array();

  actionCall.arguments.forEach((a: EncodedValue) => {
    const aBytes = encodeEncodedValue(a);
    const prefixedABytes = prefixBytesLength(aBytes);

    actionArguments = concatBytes(actionArguments, prefixedABytes);
  });

  const encodedActionArguments = concatBytes(encodedNumArgs, actionArguments);

  return bytesToBase64(
    concatBytes(encodedVersion, encodedDbId, encodedAction, encodedActionArguments)
  );
}

export function encodeActionExecution(
  action: UnencodedActionPayload<PayloadType.EXECUTE_ACTION>
): string {
  // The version of the action execution encoding used by the Kwil DB Engine
  const actionExecutionVersion = 0;

  const encodedVersion = numberToUint16LittleEndian(actionExecutionVersion);
  const encodedDbId = prefixBytesLength(stringToBytes(action.dbid));
  // Action name
  const encodedAction = prefixBytesLength(stringToBytes(action.action));

  const encodedNumArgs = numberToUint16LittleEndian(action.arguments.length);
  let actionArguments: Uint8Array = new Uint8Array();

  action.arguments.forEach((encodedValues) => {
    const argLength = numberToUint16LittleEndian(encodedValues.length);
    let argBytes: Uint8Array = new Uint8Array();
    encodedValues.forEach((value) => {
      const evBytes = encodeEncodedValue(value);
      const prefixedEvBytes = prefixBytesLength(evBytes);

      argBytes = concatBytes(argBytes, prefixedEvBytes);
    });

    actionArguments = concatBytes(actionArguments, argLength, argBytes);
  });

  const encodedActionArguments = concatBytes(encodedNumArgs, actionArguments);

  return bytesToBase64(
    concatBytes(encodedVersion, encodedDbId, encodedAction, encodedActionArguments)
  );
}

function encodeEncodedValue(ev: EncodedValue): Uint8Array {
  // To encode an `EncodedValue` we need to concat a bytes array with all of the necessary elements
  // The order is important.

  // The versioning number for `EncodedValue`
  const evVersion = 0;
  // convert evVersion to Uint16
  const encodedVersion = numberToUint16LittleEndian(evVersion);

  // EncodedValue.type - the `encodeDataType` function to get the bytes
  const dataTypeBytes = encodeDataType(ev.type);
  const encodedType = prefixBytesLength(dataTypeBytes);

  // EncodedValue.data - first, prepend 4 bytes (uint32) for the length of bytes
  const dataLength = numberToUint16LittleEndian(ev.data.length);
  let encodedData = concatBytes(dataLength);
  // then, for each element in the data array
  for (const data of ev.data) {
    encodedData = concatBytes(encodedData, prefixBytesLength(data));
  }

  // Concact bytes together in correct order
  return concatBytes(encodedVersion, encodedType, encodedData);
}

function encodeDataType(dt: DataType): Uint8Array {
  // I will use less comments here, since the general encoding flow follows the same as previous
  const dtVersion = 0;

  // note that this one uses big endian - I don't think there is a reason, just a kwil-db inconsistency
  const versionBytes = numberToUint16BigEndian(dtVersion);

  const nameBytes = stringToBytes(dt.name);
  const nameLength = numberToUint32BigEndian(nameBytes.length);
  const isArray = booleanToBytes(dt.is_array);
  const metadataLength = numberToUint16BigEndian(dt.metadata?.[0] || 0);
  const precisionLength = numberToUint16BigEndian(dt.metadata?.[1] || 0);

  return concatBytes(versionBytes, nameLength, nameBytes, isArray, metadataLength, precisionLength);
}

export function encodeValue(value: ValueType): Uint8Array {
  // handle uuid case
  if (typeof value === 'string' && isUuid(value)) {
    return encodeNotNull(convertUuidToBytes(value));
  }

  // handle null case
  if (value === null) {
    return encodeNull();
  }

  // handle Uint8Array case
  if (value instanceof Uint8Array) {
    return encodeNotNull(value);
  }

  // handle decimal case
  if (typeof value === 'number' && isDecimal(value)) {
    return encodeNotNull(stringToBytes(value.toString()));
  }

  // handle other scalar value cases
  switch (typeof value) {
    case 'string':
      return encodeNotNull(stringToBytes(value));
    case 'boolean':
      return encodeNotNull(booleanToBytes(value));
    case 'number':
      return encodeNotNull(numberToBytes(value));
    case 'undefined':
      return encodeNull();
    case 'bigint':
      throw new Error('bigint not supported. convert to string.');
    default:
      throw new Error('invalid scalar value');
  }
}

function isDecimal(n: number): boolean {
  const numStr = Math.abs(n).toString();
  const decimalIdx = numStr.indexOf('.');
  return decimalIdx !== -1;
}

function encodeNull(): Uint8Array {
  return new Uint8Array([0]);
}

function encodeNotNull(v: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(v.length + 1);
  bytes[0] = 1;
  bytes.set(v, 1);
  return bytes;
}
