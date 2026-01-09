import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { createMockWalletAccount, createMockUiWallet } from './helpers';
import { SolanaSignTransaction } from '@solana/wallet-standard-features';
import type { SolanaSignTransactionFeature } from '@solana/wallet-standard-features';

// Mock wallet-standard/ui-features and ui-registry (used by useSignTransaction)
const mockGetWalletAccountFeature = vi.fn();
vi.mock('@wallet-standard/ui-features', () => ({
  getWalletAccountFeature: (account: unknown, feature: unknown) =>
    mockGetWalletAccountFeature(account, feature),
}));

const mockGetWalletAccountForUiWalletAccount = vi.fn();
vi.mock('@wallet-standard/ui-registry', () => ({
  getOrCreateUiWalletAccountForStandardWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: (
    wallet: unknown,
    account: unknown
  ) => ({
    ...account,
    wallet,
  }),
  getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: (account: unknown) =>
    mockGetWalletAccountForUiWalletAccount(account),
}));

// Import after all mocks are set up
import { useWalletAccountTransactionModifyingSigner } from '../src/composables/useWalletAccountTransactionModifyingSigner';

describe('useWalletAccountTransactionModifyingSigner', () => {
  let mockAccount: ReturnType<typeof createMockWalletAccount>;
  let mockUiAccount: ReturnType<typeof createMockUiWallet>['accounts'][0];

  beforeEach(() => {
    vi.clearAllMocks();

    mockAccount = createMockWalletAccount({
      address: 'test-address-123',
      chains: ['solana:devnet'], // Ensure the account supports devnet
    });

    const wallet = createMockUiWallet(
      {
        name: 'Test Wallet',
        chains: ['solana:devnet'],
        features: {},
      } as any,
      [mockAccount]
    );

    mockUiAccount = {
      ...mockAccount,
      wallet,
    };

    // Mock the sign transaction feature
    const mockSignFeature: SolanaSignTransactionFeature[typeof SolanaSignTransaction] = {
      signTransaction: vi
        .fn()
        .mockImplementation(async (input: { account: any; transaction: Uint8Array }) => {
          // Return the transaction as-is (not modified) and a signature
          return [
            {
              signedTransaction: input.transaction, // Return the same transaction
              signatureType: 'ed25519',
            },
          ];
        }),
    } as unknown as SolanaSignTransactionFeature[typeof SolanaSignTransaction];

    mockGetWalletAccountFeature.mockReturnValue(mockSignFeature);
    mockGetWalletAccountForUiWalletAccount.mockReturnValue(mockAccount);
  });

  it('should return null when account is null', () => {
    const accountRef = ref(null);
    const signer = useWalletAccountTransactionModifyingSigner(accountRef, 'solana:devnet');

    expect(signer.value).toBeNull();
  });

  it('should return signer when account is provided', () => {
    const signer = useWalletAccountTransactionModifyingSigner(mockUiAccount, 'solana:devnet');

    expect(signer.value).toBeDefined();
    expect(signer.value?.address).toBe('test-address-123');
    expect(typeof signer.value?.modifyAndSignTransactions).toBe('function');
  });

  it('should sign a single transaction', async () => {
    const signer = useWalletAccountTransactionModifyingSigner(mockUiAccount, 'solana:devnet');
    const transaction = {
      messageBytes: new Uint8Array([1, 2, 3, 4, 5]),
    } as any;

    const result = await signer.value!.modifyAndSignTransactions([transaction]);

    expect(result).toHaveLength(1);
    expect(result[0]).toBeDefined();
  });

  it('should throw error for multiple transactions', async () => {
    const signer = useWalletAccountTransactionModifyingSigner(mockUiAccount, 'solana:devnet');
    const transaction = {
      messageBytes: new Uint8Array([1, 2, 3]),
    } as any;

    await expect(
      signer.value!.modifyAndSignTransactions([transaction, transaction])
    ).rejects.toThrow();
  });

  it('should return empty array for empty transactions', async () => {
    const signer = useWalletAccountTransactionModifyingSigner(mockUiAccount, 'solana:devnet');

    const result = await signer.value!.modifyAndSignTransactions([]);

    expect(result).toEqual([]);
  });

  it('should work with ref account', () => {
    const accountRef = ref(mockUiAccount);
    const signer = useWalletAccountTransactionModifyingSigner(accountRef, 'solana:devnet');

    expect(signer.value).toBeDefined();
  });

  it('should work with different chain', () => {
    // Create account with mainnet chain
    const mainnetAccount = createMockWalletAccount({
      address: 'test-address-mainnet',
      chains: ['solana:mainnet'],
    });
    const mainnetWallet = createMockUiWallet(
      {
        name: 'Test Wallet Mainnet',
        chains: ['solana:mainnet'],
        features: {},
      } as any,
      [mainnetAccount]
    );
    const mainnetUiAccount = {
      ...mainnetAccount,
      wallet: mainnetWallet,
    };

    const signer = useWalletAccountTransactionModifyingSigner(mainnetUiAccount, 'solana:mainnet');

    expect(signer.value).toBeDefined();
  });
});
