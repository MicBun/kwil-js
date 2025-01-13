import { objects } from '../utils/objects';
import { ValueType } from './enums';
import { AuthBody } from './signature';

export type Entry<T extends ValueType | ValueType[]> = [string, T];

export type EntryType = Entry<ValueType> | Entry<ValueType[]>;

export type Entries = { [key: string]: ValueType | ValueType[] };

export type Predicate = (k: [key: string, v: ValueType | ValueType[]]) => boolean;

/**
 * ActionBody is the interface for executing an action with the `kwil.execute()` method.
 */
export interface ActionBody {
  /**
   * @deprecated - This field is deprecated and will be removed in the next major release. Please use the 'namespace' field instead.
   * dbid is the database ID of the record on which to execute the action.
   */
  dbid?: string;
  /**
   * namespace is the namespace of the record on which to execute the action.
   */
  namespace: string;
  /**
   * name is the name of the action or procedure to execute.
   */
  name: string;
  /**
   * inputs is an array of action inputs.
   */
  inputs?: Entries[] | ActionInput[];
  /**
   * description is an optional description of the action.
   */
  description?: string;
  /**
   * nonce is an optional nonce value for the action.
   */
  nonce?: number;
  /**
   * challenge is an optional value for the read/view action to be called in private mode
   * the challenge is generated by the server, requested by the client and sent with messages and signed for verification
   */
  challenge?: string;

  /**
   * authBody is an optional value for the read/view action to be called in private mode
   * AuthBody interface => consisting of the signature and challenge for the message
   */
  authBody?: AuthBody;
}

export interface ActionBodyNode extends ActionBody {
  cookie?: string;
}

/**
 * CallBody is the interface for calling an action with the `kwil.call()` method.
 */
export interface CallBody {
  /**
   * @deprecated - This field is deprecated and will be removed in the next major release. Please use the 'namespace' field instead.
   * dbid is the database ID of the record on which to execute the action.
   */
  dbid?: string;
  /**
   * namespace is the namespace of the record on which to execute the action.
   */
  namespace: string;
  /**
   * name is the name of the action or procedure to execute.
   */
  name: string;
  /**
   * inputs is an array of action inputs.
   */
  inputs?: Entries[] | ActionInput[];

  /**
   * authBody is an optional value for the read/view action to be called in private mode
   * AuthBody interface => consisting of the signature and challenge for the message
   */
  authBody?: AuthBody;
}

export interface CallBodyNode extends CallBody {
  cookie?: string;
}

/**
 * `ActionInput` class is a utility class for creating action inputs.
 */

export class ActionInput implements Iterable<EntryType> {
  private readonly map: Entries;

  constructor() {
    this.map = {};
  }

  /**
   * Adds or replaces a value for a single action input.
   *
   * @param key - The action input name.
   * @param value - The value to put for the action input.
   * @returns The current `ActionInput` instance for chaining.
   */

  public put<T extends ValueType>(key: string, value: T): ActionInput {
    key = lowercaseKey(key);
    this.map[assertKey(key)] = value;
    return this;
  }

  /**
   * Adds a value for a single action input if the key is not already present.
   *
   * @param key - The action input name.
   * @param value - The value to put for the action input.
   * @returns The current `ActionInput` instance for chaining.
   */
  public putIfAbsent<T extends ValueType>(key: string, value: T): ActionInput {
    key = lowercaseKey(key);
    if (!this.containsKey(key)) {
      this.map[key] = value;
    }
    return this;
  }

  /**
   * Replaces a value for a single action input if the key is already present.
   *
   * @param key - The action input name.
   * @param value - The value to replace for the action input.
   * @returns The current `ActionInput` instance for chaining.
   */

  public replace<T extends ValueType>(key: string, value: T): ActionInput {
    key = lowercaseKey(key);
    if (this.containsKey(key)) {
      this.map[key] = value;
    }
    return this;
  }

  /**
   * Retrieves an action input value given its key.
   *
   * @param key - The action input name.
   * @returns The value associated with the action input name.
   */

  public get<T extends ValueType>(key: string): T {
    key = lowercaseKey(key);
    return this.map[assertKey(key)] as T;
  }

  /**
   * Retrieves a value by its action input name, or a default value if the action input name is not present.
   *
   * @param key - The action input name.
   * @param defaultValue - The default value to return if the key is not present.
   * @returns The value associated with the key, or the default value.
   */

  public getOrDefault<T extends ValueType>(key: string, defaultValue: T): T {
    key = lowercaseKey(key);
    return (this.map[assertKey(key)] ?? defaultValue) as T;
  }

  /**
   * Checks if the map contains a specific action input name.
   *
   * @param key - The action input name.
   * @returns True if the action input name is present, false otherwise.
   */

  public containsKey(key: string): boolean {
    key = lowercaseKey(key);
    return this.map.hasOwnProperty(assertKey(key));
  }

  /**
   * Removes a action input name and its associated value from the map.
   *
   * @param key - The action input name to remove.
   * @returns True if the key was present and is now removed, false otherwise.
   */

  public remove(key: string): boolean {
    key = lowercaseKey(key);
    return delete this.map[key];
  }

  /**
   * Converts the map of action inputs to an array of entries.
   *
   * @param filter - An optional filter function.
   * @returns A read-only array of entries.
   */

  public toArray(filter?: Predicate): ReadonlyArray<EntryType> {
    return Object.entries(this.map).filter(filter ?? (() => true)) as ReadonlyArray<EntryType>;
  }

  /**
   * Transforms the `ActionInput` to JSON.
   *
   * @returns A read-only map of entries.
   */

  public toEntries(): Readonly<Entries> {
    return this.map;
  }

  /**
   * Allows `ActionInput` to be iterable.
   *
   * @returns An iterator over the array of entries.
   */

  [Symbol.iterator](): IterableIterator<EntryType> {
    return this.toArray()[Symbol.iterator]();
  }

  /**
   * Adds or replaces values from and object of action name/key-value pairs.
   *
   * @param obj - The object from which to extract action name/key-value pairs.
   * @returns The current `ActionInput` instance for chaining.
   */

  public putFromObject<T extends {}>(obj: T): ActionInput {
    for (let [key, value] of Object.entries(objects.requireNonNil(obj))) {
      key = lowercaseKey(key);
      this.map[assertKey(key)] = value as ValueType;
    }
    return this;
  }

  /**
   * Adds values from and object of action name/key-value pairs if the key is not already present.
   *
   * @param obj - The object from which to extract key-value pairs.
   * @returns The current `ActionInput` instance for chaining.
   */

  public putFromObjectIfAbsent<T extends {}>(obj: T): ActionInput {
    for (let [key, value] of Object.entries(objects.requireNonNil(obj))) {
      key = lowercaseKey(key);
      if (!this.containsKey(key)) {
        this.map[assertKey(key)] = value as ValueType;
      }
    }
    return this;
  }

  /**
   * Replaces values from and object of action name/key-value pairs if the key is already present.
   *
   * @param obj - The object from which to extract key-value pairs.
   * @returns The current `ActionInput` instance for chaining.
   */

  public replaceFromObject<T extends {}>(obj: T): ActionInput {
    for (let [key, value] of Object.entries(objects.requireNonNil(obj))) {
      key = lowercaseKey(key);
      if (this.containsKey(key)) {
        this.map[assertKey(key)] = value as ValueType;
      }
    }
    return this;
  }

  /**
   * Creates multiple `ActionInput` instances from an array of objects.
   *
   * @param objs - An array of objects from which to create `ActionInput` instances.
   * @returns An array of `ActionInput` instances.
   */

  public putFromObjects<T extends {}>(objs: T[]): ActionInput[] {
    const actions: ActionInput[] = [];
    for (const obj of objects.requireNonNil(objs)) {
      actions.push(ActionInput.fromObject(obj));
    }
    return actions;
  }

  /**
   * Factory method to create a new instance of `ActionInput`.
   *
   * @returns A new `ActionInput` instance.
   */

  public static of(): ActionInput {
    return new ActionInput();
  }

  /**
   * Creates a new `ActionInput` instance from an iterable array of entries.
   *
   * @param entries - The iterable of set of entries. Entries should be formatted as an array of `[inputName, value]`.
   * @returns A new `ActionInput` instance.
   */

  public static from(entries: Iterable<EntryType>): ActionInput {
    const action = ActionInput.of();
    for (let [key, value] of entries) {
      key = lowercaseKey(key);
      action.map[assertKey(key)] = value;
    }
    return action;
  }

  /**
   * Creates a new `ActionInput` instance from an object.
   *
   * @param obj - The object from which to create the `ActionInput`.
   * @returns A new `ActionInput` instance.
   */

  public static fromObject<T extends {}>(obj: T): ActionInput {
    const action = ActionInput.of();
    for (let [key, value] of Object.entries(objects.requireNonNil(obj))) {
      key = lowercaseKey(key);
      action.map[assertKey(key)] = value as ValueType;
    }
    return action;
  }

  /**
   * Creates multiple `ActionInput` instances from an array of objects.
   *
   * @param objs - An array of objects from which to create `ActionInput` instances.
   * @returns An array of `ActionInput` instances.
   */

  public static fromObjects<T extends {}>(objs: T[]): ActionInput[] {
    const actions: ActionInput[] = [];
    for (const obj of objects.requireNonNil(objs)) {
      actions.push(ActionInput.fromObject(obj));
    }
    return actions;
  }
}

/**
 * Asserts that a key is not null or undefined.
 *
 * @param key - The key to assert.
 * @returns The key if it is not null or undefined.
 * @throws Will throw an error if the key is null or undefined.
 */

function assertKey(key: string): string {
  return objects.requireNonNil(key, 'key cannot be nil');
}

function lowercaseKey(key: string): string {
  return key.toLowerCase();
}
