import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useSignAndSendTransaction } from '../src/composables/useSignAndSendTransaction';
import { SolanaSignAndSendTransaction } from '@solana/wallet-standard-features';
import type { SolanaSignAndSendTransactionFeature } from '@solana/wallet-standard-features';
import {
  WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED,
  WalletStandardError,
} from '@wallet-standard/errors';
import { createMockWalletAccount, createMockUiWallet } from './helpers';

// Mock @solana/kit
vi.mock('@solana/kit', () => ({
  address: (addr: string) => addr,
  SolanaError: class extends Error {},
  SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED:
    'SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED',
}));

// Mock @solana/promises
vi.mock('@solana/promises', () => ({
  getAbortablePromise: (promise: Promise<any>) => promise,
}));

const mockGetWalletAccountFeature = vi.fn();
vi.mock('@wallet-standard/ui-features', () => ({
  getWalletAccountFeature: (account: unknown, feature: unknown) =>
    mockGetWalletAccountFeature(account, feature),
}));

const mockGetWalletAccountForUiWalletAccount = vi.fn();
vi.mock('@wallet-standard/ui-registry', () => ({
  getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: (account: unknown) =>
    mockGetWalletAccountForUiWalletAccount(account),
}));

describe('useSignAndSendTransaction', () => {
  let mockSignAndSendFeature: SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction];
  let mockStandardAccount: ReturnType<typeof createMockWalletAccount>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStandardAccount = createMockWalletAccount({
      address: 'test-address-123',
      chains: ['solana:devnet'],
    });

    mockSignAndSendFeature = {
      signAndSendTransaction: vi.fn().mockResolvedValue([
        {
          signature: new Uint8Array([1, 2, 3, 4, 5]),
        },
      ]),
    } as unknown as SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction];

    mockGetWalletAccountFeature.mockReturnValue(mockSignAndSendFeature);
    mockGetWalletAccountForUiWalletAccount.mockReturnValue(mockStandardAccount);
  });

  it('should return null when account is null', () => {
    const accountRef = ref(null);
    const signAndSendTransaction = useSignAndSendTransaction(accountRef, 'solana:devnet');

    expect(signAndSendTransaction.value).toBeNull();
  });

  it('should return null when account is not provided', () => {
    const signAndSendTransaction = useSignAndSendTransaction(null, 'solana:devnet');

    expect(signAndSendTransaction.value).toBeNull();
  });

  it('should return sign and send function when account is provided', () => {
    const account = createMockWalletAccount({
      address: 'test-address',
      chains: ['solana:devnet'],
      features: [SolanaSignAndSendTransaction],
    });
    const wallet = createMockUiWallet(
      {
        name: 'Test Wallet',
        chains: ['solana:devnet'],
        features: {},
      } as any,
      [account]
    );
    const uiAccount = {
      ...account,
      wallet,
    };

    const signAndSendTransaction = useSignAndSendTransaction(uiAccount, 'solana:devnet');

    expect(signAndSendTransaction.value).toBeDefined();
    expect(typeof signAndSendTransaction.value).toBe('function');
  });

  it('should sign and send transaction successfully', async () => {
    const account = createMockWalletAccount({
      address: 'test-address',
      chains: ['solana:devnet'],
      features: [SolanaSignAndSendTransaction],
    });
    const wallet = createMockUiWallet(
      {
        name: 'Test Wallet',
        chains: ['solana:devnet'],
        features: {},
      } as any,
      [account]
    );
    const uiAccount = {
      ...account,
      wallet,
    };

    const signAndSendTransaction = useSignAndSendTransaction(uiAccount, 'solana:devnet');

    const transactionBytes = new Uint8Array([72, 101, 108, 108, 111]);
    const result = await signAndSendTransaction.value!({
      transaction: transactionBytes,
    });

    expect(result).toBeDefined();
    expect(result.signature).toBeInstanceOf(Uint8Array);
    expect(mockSignAndSendFeature.signAndSendTransaction).toHaveBeenCalledWith({
      account: mockStandardAccount,
      transaction: transactionBytes,
      chain: 'solana:devnet',
    });
  });

  it('should work with ref account', async () => {
    const account = createMockWalletAccount({
      address: 'test-address',
      chains: ['solana:devnet'],
      features: [SolanaSignAndSendTransaction],
    });
    const wallet = createMockUiWallet(
      {
        name: 'Test Wallet',
        chains: ['solana:devnet'],
        features: {},
      } as any,
      [account]
    );
    const uiAccount = {
      ...account,
      wallet,
    };

    const accountRef = ref(uiAccount);
    const signAndSendTransaction = useSignAndSendTransaction(accountRef, 'solana:devnet');

    expect(signAndSendTransaction.value).toBeDefined();

    const transactionBytes = new Uint8Array([72, 101, 108, 108, 111]);
    await signAndSendTransaction.value!({
      transaction: transactionBytes,
    });

    expect(mockSignAndSendFeature.signAndSendTransaction).toHaveBeenCalled();
  });

  it('should throw error when chain is not supported', () => {
    const account = createMockWalletAccount({
      address: 'test-address',
      chains: ['solana:devnet'],
      features: [SolanaSignAndSendTransaction],
    });
    const wallet = createMockUiWallet(
      {
        name: 'Test Wallet',
        chains: ['solana:devnet'],
        features: {},
      } as any,
      [account]
    );
    const uiAccount = {
      ...account,
      wallet,
    };

    const signAndSendTransaction = useSignAndSendTransaction(uiAccount, 'solana:mainnet');

    expect(() => {
      const fn = signAndSendTransaction.value;
      if (fn) {
        fn({ transaction: new Uint8Array([1]) });
      }
    }).toThrow(WalletStandardError);
  });

  it('should support minContextSlot option', async () => {
    const account = createMockWalletAccount({
      address: 'test-address',
      chains: ['solana:devnet'],
      features: [SolanaSignAndSendTransaction],
    });
    const wallet = createMockUiWallet(
      {
        name: 'Test Wallet',
        chains: ['solana:devnet'],
        features: {},
      } as any,
      [account]
    );
    const uiAccount = {
      ...account,
      wallet,
    };

    const signAndSendTransaction = useSignAndSendTransaction(uiAccount, 'solana:devnet');

    const transactionBytes = new Uint8Array([1, 2, 3]);
    await signAndSendTransaction.value!({
      transaction: transactionBytes,
      options: {
        minContextSlot: BigInt(12345),
      },
    });

    expect(mockSignAndSendFeature.signAndSendTransaction).toHaveBeenCalledWith({
      account: mockStandardAccount,
      transaction: transactionBytes,
      chain: 'solana:devnet',
      options: {
        minContextSlot: 12345,
      },
    });
  });
});
