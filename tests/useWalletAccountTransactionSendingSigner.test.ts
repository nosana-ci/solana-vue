import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { createMockWalletAccount, createMockUiWallet } from './helpers';
import { SolanaSignAndSendTransaction } from '@solana/wallet-standard-features';
import type { SolanaSignAndSendTransactionFeature } from '@solana/wallet-standard-features';

// Mock wallet-standard/ui-features and ui-registry
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

// Import after all mocks are set up
import { useWalletAccountTransactionSendingSigner } from '../src/composables/useWalletAccountTransactionSendingSigner';

describe('useWalletAccountTransactionSendingSigner', () => {
  let mockAccount: ReturnType<typeof createMockWalletAccount>;
  let mockUiAccount: ReturnType<typeof createMockUiWallet>['accounts'][0];

  beforeEach(() => {
    vi.clearAllMocks();

    mockAccount = createMockWalletAccount({
      address: 'test-address-123',
      chains: ['solana:devnet'],
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

    // Mock the sign and send transaction feature
    const mockSignAndSendFeature: SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction] = {
      signAndSendTransaction: vi.fn().mockImplementation(async (input: { account: any; transaction: Uint8Array }) => {
        // Return an array with the result
        return [
          {
            signature: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
          },
        ];
      }),
    } as unknown as SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction];

    mockGetWalletAccountFeature.mockReturnValue(mockSignAndSendFeature);
    mockGetWalletAccountForUiWalletAccount.mockReturnValue(mockAccount);
  });

  it('should return null when account is null', () => {
    const accountRef = ref(null);
    const signer = useWalletAccountTransactionSendingSigner(accountRef, 'solana:devnet');

    expect(signer.value).toBeNull();
  });


  it('should return signer when account is provided', () => {
    const signer = useWalletAccountTransactionSendingSigner(mockUiAccount, 'solana:devnet');

    expect(signer.value).toBeDefined();
    expect(signer.value?.address).toBe('test-address-123');
    expect(typeof signer.value?.signAndSendTransactions).toBe('function');
  });

  it('should sign and send a single transaction', async () => {
    const signer = useWalletAccountTransactionSendingSigner(mockUiAccount, 'solana:devnet');
    const transaction = {
      messageBytes: new Uint8Array([1, 2, 3, 4, 5]),
    } as any;

    const result = await signer.value!.signAndSendTransactions([transaction]);

    expect(result).toHaveLength(1);
    // The result is an array of signatures (SignatureBytes), not objects
    expect(result[0]).toBeInstanceOf(Uint8Array);
  });

  it('should throw error for multiple transactions', async () => {
    const signer = useWalletAccountTransactionSendingSigner(mockUiAccount, 'solana:devnet');
    const transaction = {
      messageBytes: new Uint8Array([1, 2, 3]),
    } as any;

    await expect(
      signer.value!.signAndSendTransactions([transaction, transaction])
    ).rejects.toThrow();
  });

  it('should return empty array for empty transactions', async () => {
    const signer = useWalletAccountTransactionSendingSigner(mockUiAccount, 'solana:devnet');

    const result = await signer.value!.signAndSendTransactions([]);

    expect(result).toEqual([]);
  });

  it('should work with ref account', () => {
    const accountRef = ref(mockUiAccount);
    const signer = useWalletAccountTransactionSendingSigner(accountRef, 'solana:devnet');

    expect(signer.value).toBeDefined();
  });

  it('should work with ref chain', () => {
    const chainRef = ref('solana:devnet');
    const signer = useWalletAccountTransactionSendingSigner(mockUiAccount, chainRef);

    expect(signer.value).toBeDefined();
  });
});

