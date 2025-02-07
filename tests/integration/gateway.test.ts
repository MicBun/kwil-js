import { CallBody, CallBodyNode } from '../../src/core/action';
import { AuthSuccess, LogoutResponse } from '../../src/core/auth';
import { EnvironmentType } from '../../src/core/enums';
import { MsgReceipt } from '../../src/core/message';
import { isKgwOn, kwil, kwilSigner } from './setup';
import { NodeKwil } from '../../src';

// TODO: These tests have been updated to work with new API but KGW but it is not fully implemented
// TODO: There will be changes to schema creation to enable the KGW tests to work (i.e. with the write definition of the actions)
(isKgwOn ? describe : describe.skip)('Testing authentication', () => {
  const namespace = 'gateway_test';

  beforeAll(async () => {
    // await createTestSchema(namespace, kwil, kwilSigner);
  }, 10000);

  afterAll(async () => {
    // await dropTestSchema(namespace, kwil, kwilSigner);
  }, 10000);

  it('should authenticate and return data automatically', async () => {
    const body: CallBody = {
      name: 'view_must_sign',
      namespace,
    };

    const result = await kwil.call(body, kwilSigner);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<MsgReceipt>({
      result: expect.any(Array),
    });
  });

  // cookies are not needed in private mode
  it('should return an expired cookie when logging out', async () => {
    // @ts-ignore
    const preCookie = kwil.cookie;
    const result = await kwil.auth.logoutKGW();

    //@ts-ignore
    const postCookie = kwil.cookie;

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<LogoutResponse<EnvironmentType.NODE>>({
      result: 'ok',
      cookie: expect.any(String),
    });

    expect(preCookie).not.toBe(postCookie);
  });

  // it('should allow a new signer after logging out', async () => {
  //   // Log out
  //   await kwil.auth.logoutKGW();

  //   // Create a new signer
  //   const newWallet = Wallet.createRandom();

  //   const newSigner = new KwilSigner(newWallet, newWallet.address);

  //   const body: CallBody = {
  //     name: 'view_caller',
  //     namespace,
  //   };

  //   let result;
  //   if (isKwildPrivateOn || isKgwOn) {
  //     result = await kwil.call(body, newSigner);
  //   } else {
  //     result = await kwil.call(body);
  //   }

  //   const returnedCaller = result.data?.result;

  //   expect(result.data).toMatchObject<MsgReceipt>({
  //     result: expect.any(Array),
  //   });
  //   expect(returnedCaller?.caller).toBe(newWallet.address);
  // });

  (isKgwOn ? describe : describe.skip)(
    'Testing authentication without autoAuthenticate in KGW',
    () => {
      const newKwil = new NodeKwil({
        kwilProvider: process.env.KWIL_PROVIDER || '',
        chainId: process.env.CHAIN_ID || '',
        autoAuthenticate: false,
      });

      it('should not authenticate automatically', async () => {
        const body: CallBody = {
          name: 'view_must_sign',
          namespace,
        };

        const result = await newKwil.call(body, kwilSigner);

        expect(result.status).toBe(401);
        expect(result.data).toBe(null);
      });

      it('should authenticate after calling the authenticate method', async () => {
        const result = await newKwil.auth.authenticateKGW(kwilSigner);

        await newKwil.auth.logoutKGW();

        expect(result.data).toMatchObject<AuthSuccess<EnvironmentType.NODE>>({
          result: 'ok',
          cookie: expect.any(String),
        });
      });

      it('should authenticate when the cookie is passed back to the action', async () => {
        const authRes = await newKwil.auth.authenticateKGW(kwilSigner);
        const cookie = authRes.data?.cookie;

        if (!cookie) throw new Error('No cookie found');

        const body: CallBodyNode = {
          name: 'view_must_sign',
          namespace,
          cookie,
        };

        const result = await newKwil.call(body, kwilSigner);

        expect(result.data).toBeDefined();
        expect(result.data).toMatchObject<MsgReceipt>({
          result: expect.any(Array),
        });
      });

      it('should not authenticate when a bad cookie is passed back to the action', async () => {
        const body: CallBodyNode = {
          name: 'view_must_sign',
          namespace,
          cookie: 'badCookie',
        };

        const result = await newKwil.call(body, kwilSigner);

        expect(result.status).toBe(401);
        expect(result.data).toBe(null);
      });

      // cookies are not needed in private mode
      it('should continue authenticating after a bad cookie was passed to the previous action', async () => {
        const body: CallBody = {
          name: 'view_must_sign',
          namespace,
        };

        const result = await newKwil.call(body, kwilSigner);

        expect(result.data).toBeDefined();
        expect(result.data).toMatchObject<MsgReceipt>({
          result: expect.any(Array),
        });
      });
    }
  );
});
