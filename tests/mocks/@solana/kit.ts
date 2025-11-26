// Mock module for @solana/kit
export const address = (addr: string) => addr;
export class SolanaError extends Error {}
export const SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED =
  'SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED';

// Export types that might be needed
export type Address<T extends string = string> = T;
export type SignatureBytes = Uint8Array;
export type ReadonlyUint8Array = Readonly<Uint8Array>;
export type MessageModifyingSigner<_TAddress extends string = string> = any;
export type SignableMessage = any;
export type TransactionModifyingSigner<_TAddress extends string = string> = any;
export type TransactionSendingSigner<_TAddress extends string = string> = any;
export type Transaction = any;
export type TransactionWithinSizeLimit = any;
export type TransactionWithLifetime = any;

export const getCompiledTransactionMessageDecoder = () => ({
  decode: (bytes: Uint8Array) => ({
    lifetimeToken: 'mock-token',
  }),
});

export const getTransactionCodec = () => ({
  encode: (tx: any) => {
    // Return a mock transaction bytes
    return new Uint8Array([1, 2, 3, 4, 5]);
  },
  decode: (bytes: Uint8Array) => {
    // Return a mock transaction object
    return {
      messageBytes: bytes,
    };
  },
});

export const getTransactionEncoder = () => ({
  encode: (tx: any) => new Uint8Array([1, 2, 3]),
});

export const assertIsTransactionWithinSizeLimit = (tx: any) => {};

export const getTransactionLifetimeConstraintFromCompiledTransactionMessage = async (msg: any) => ({
  blockhash: 'mock-blockhash',
});
