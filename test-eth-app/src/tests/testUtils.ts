import { WebKwil } from '../../../src';

console.log(import.meta.env.VITE_KWIL_PROVIDER);
console.log(import.meta.env.VITE_CHAIN_ID);

export const kwil = new WebKwil({
  kwilProvider: import.meta.env.VITE_KWIL_PROVIDER || 'http://localhost:8484',
  chainId: import.meta.env.VITE_CHAIN_ID || 'kwil-chain-DpKylppR',
  logging: true,
  timeout: 10000,
});
