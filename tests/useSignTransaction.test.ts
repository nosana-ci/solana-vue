import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useSignTransaction } from '../src/composables/useSignTransaction';
import { SolanaSignTransaction } from '@solana/wallet-standard-features';
import type { SolanaSignTransactionFeature } from '@solana/wallet-standard-features';
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

describe('useSignTransaction', () => {
  let mockSignFeature: SolanaSignTransactionFeature[typeof SolanaSignTransaction];
  let mockStandardAccount: ReturnType<typeof createMockWalletAccount>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStandardAccount = createMockWalletAccount({
      address: 'test-address-123',
      chains: ['solana:devnet'],
    });

    mockSignFeature = {
      signTransaction: vi.fn().mockResolvedValue([
        {
          signedTransaction: new Uint8Array([1, 2, 3, 4, 5]),
        },
      ]),
    } as unknown as SolanaSignTransactionFeature[typeof SolanaSignTransaction];

    mockGetWalletAccountFeature.mockReturnValue(mockSignFeature);
    mockGetWalletAccountForUiWalletAccount.mockReturnValue(mockStandardAccount);
  });

  it('should return null when account is null', () => {
    const accountRef = ref(null);
    const signTransaction = useSignTransaction(accountRef, 'solana:devnet');

    expect(signTransaction.value).toBeNull();
  });

  it('should return null when account is not provided', () => {
    const signTransaction = useSignTransaction(null, 'solana:devnet');

    expect(signTransaction.value).toBeNull();
  });

  it('should return sign function when account is provided', () => {
    const account = createMockWalletAccount({
      address: 'test-address',
      chains: ['solana:devnet'],
      features: [SolanaSignTransaction],
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

    const signTransaction = useSignTransaction(uiAccount, 'solana:devnet');

    expect(signTransaction.value).toBeDefined();
    expect(typeof signTransaction.value).toBe('function');
  });

  it('should sign transaction successfully', async () => {
    const account = createMockWalletAccount({
      address: 'test-address',
      chains: ['solana:devnet'],
      features: [SolanaSignTransaction],
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

    const signTransaction = useSignTransaction(uiAccount, 'solana:devnet');

    const transactionBytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const result = await signTransaction.value!({
      transaction: transactionBytes,
    });

    expect(result).toBeDefined();
    expect(result.signedTransaction).toBeInstanceOf(Uint8Array);
    expect(mockSignFeature.signTransaction).toHaveBeenCalledWith({
      account: mockStandardAccount,
      transaction: transactionBytes,
      chain: 'solana:devnet',
    });
  });

  it('should work with ref account', async () => {
    const account = createMockWalletAccount({
      address: 'test-address',
      chains: ['solana:devnet'],
      features: [SolanaSignTransaction],
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
    const signTransaction = useSignTransaction(accountRef, 'solana:devnet');

    expect(signTransaction.value).toBeDefined();

    const transactionBytes = new Uint8Array([72, 101, 108, 108, 111]);
    await signTransaction.value!({
      transaction: transactionBytes,
    });

    expect(mockSignFeature.signTransaction).toHaveBeenCalled();
  });

  it('should throw error when chain is not supported', () => {
    const account = createMockWalletAccount({
      address: 'test-address',
      chains: ['solana:devnet'], // Only devnet
      features: [SolanaSignTransaction],
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

    const signTransaction = useSignTransaction(uiAccount, 'solana:mainnet'); // mainnet not supported

    expect(() => {
      const fn = signTransaction.value;
      if (fn) {
        // Accessing the function will trigger the chain check
        fn({ transaction: new Uint8Array([1]) });
      }
    }).toThrow(WalletStandardError);
  });

  it('should support minContextSlot option', async () => {
    const account = createMockWalletAccount({
      address: 'test-address',
      chains: ['solana:devnet'],
      features: [SolanaSignTransaction],
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

    const signTransaction = useSignTransaction(uiAccount, 'solana:devnet');

    const transactionBytes = new Uint8Array([1, 2, 3]);
    await signTransaction.value!({
      transaction: transactionBytes,
      options: {
        minContextSlot: BigInt(12345),
      },
    });

    expect(mockSignFeature.signTransaction).toHaveBeenCalledWith({
      account: mockStandardAccount,
      transaction: transactionBytes,
      chain: 'solana:devnet',
      options: {
        minContextSlot: 12345,
      },
    });
  });

  it('should update when account ref changes', async () => {
    const account1 = createMockWalletAccount({
      address: 'test-address-1',
      chains: ['solana:devnet'],
      features: [SolanaSignTransaction],
    });
    const account2 = createMockWalletAccount({
      address: 'test-address-2',
      chains: ['solana:devnet'],
      features: [SolanaSignTransaction],
    });
    const wallet = createMockUiWallet(
      {
        name: 'Test Wallet',
        chains: ['solana:devnet'],
        features: {},
      } as any,
      [account1, account2]
    );
    const uiAccount1 = {
      ...account1,
      wallet,
    };
    const uiAccount2 = {
      ...account2,
      wallet,
    };

    const accountRef = ref(uiAccount1);
    const signTransaction = useSignTransaction(accountRef, 'solana:devnet');

    expect(signTransaction.value).toBeDefined();

    accountRef.value = uiAccount2;
    // Wait for computed to update
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(signTransaction.value).toBeDefined();
  });

  it('should return null when account ref becomes null', async () => {
    const account = createMockWalletAccount({
      address: 'test-address',
      chains: ['solana:devnet'],
      features: [SolanaSignTransaction],
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
    const signTransaction = useSignTransaction(accountRef, 'solana:devnet');

    expect(signTransaction.value).toBeDefined();

    accountRef.value = null;
    // Wait for computed to update
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(signTransaction.value).toBeNull();
  });
});
