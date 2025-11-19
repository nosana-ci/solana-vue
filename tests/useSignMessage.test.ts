import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref, nextTick } from 'vue';
import { useSignMessage } from '../src/composables/useSignMessage';
import { SolanaSignMessage } from '@solana/wallet-standard-features';
import type { SolanaSignMessageFeature } from '@solana/wallet-standard-features';
import {
  createMockWalletAccount,
  createMockUiWallet,
} from './helpers';

// Mock @solana/kit before any imports that use it
vi.mock('@solana/kit', () => ({
  address: (addr: string) => addr,
  SolanaError: class extends Error {},
  SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED: 'SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED',
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

describe('useSignMessage', () => {
  let mockSignFeature: SolanaSignMessageFeature[typeof SolanaSignMessage];
  let mockStandardAccount: ReturnType<typeof createMockWalletAccount>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStandardAccount = createMockWalletAccount({
      address: 'test-address-123',
    });

    mockSignFeature = {
      signMessage: vi.fn().mockResolvedValue([
        {
          signature: new Uint8Array([1, 2, 3, 4, 5]),
          signatureType: 'ed25519',
        },
      ]),
    } as unknown as SolanaSignMessageFeature[typeof SolanaSignMessage];

    mockGetWalletAccountFeature.mockReturnValue(mockSignFeature);
    mockGetWalletAccountForUiWalletAccount.mockReturnValue(mockStandardAccount);
  });

  it('should return null when account is null', () => {
    const accountRef = ref(null);
    const signMessage = useSignMessage(accountRef);

    expect(signMessage.value).toBeNull();
  });

  it('should return null when account is not provided', () => {
    const signMessage = useSignMessage(null);

    expect(signMessage.value).toBeNull();
  });

  it('should return sign function when account is provided', () => {
    const account = createMockWalletAccount({
      address: 'test-address',
      features: [SolanaSignMessage],
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

    const signMessage = useSignMessage(uiAccount);

    expect(signMessage.value).toBeDefined();
    expect(typeof signMessage.value).toBe('function');
  });

  it('should sign message successfully', async () => {
    const account = createMockWalletAccount({
      address: 'test-address',
      features: [SolanaSignMessage],
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

    const signMessage = useSignMessage(uiAccount);

    const messageBytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const result = await signMessage.value!({
      message: messageBytes,
    });

    expect(result).toBeDefined();
    expect(result.signature).toBeInstanceOf(Uint8Array);
    expect(mockSignFeature.signMessage).toHaveBeenCalledWith({
      account: mockStandardAccount,
      message: messageBytes,
    });
  });

  it('should work with ref account', async () => {
    const account = createMockWalletAccount({
      address: 'test-address',
      features: [SolanaSignMessage],
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
    const signMessage = useSignMessage(accountRef);

    expect(signMessage.value).toBeDefined();

    const messageBytes = new Uint8Array([72, 101, 108, 108, 111]);
    await signMessage.value!({
      message: messageBytes,
    });

    expect(mockSignFeature.signMessage).toHaveBeenCalled();
  });

  it('should update when account ref changes', async () => {
    const account1 = createMockWalletAccount({
      address: 'test-address-1',
      features: [SolanaSignMessage],
    });
    const account2 = createMockWalletAccount({
      address: 'test-address-2',
      features: [SolanaSignMessage],
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
    const signMessage = useSignMessage(accountRef);

    expect(signMessage.value).toBeDefined();

    accountRef.value = uiAccount2;
    await nextTick();

    expect(signMessage.value).toBeDefined();
  });

  it('should return null when account ref becomes null', async () => {
    const account = createMockWalletAccount({
      address: 'test-address',
      features: [SolanaSignMessage],
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
    const signMessage = useSignMessage(accountRef);

    expect(signMessage.value).toBeDefined();

    accountRef.value = null;
    await nextTick();

    expect(signMessage.value).toBeNull();
  });
});
