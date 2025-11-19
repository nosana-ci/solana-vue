import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useSignIn } from '../src/composables/useSignIn';
import { SolanaSignIn } from '@solana/wallet-standard-features';
import type { SolanaSignInFeature } from '@solana/wallet-standard-features';
import {
  createMockWallet,
  createMockWalletAccount,
  createMockUiWallet,
} from './helpers';

// Mock @solana/kit
vi.mock('@solana/kit', () => ({
  Address: class {},
  address: (addr: string) => addr,
}));

const mockGetWalletAccountFeature = vi.fn();
const mockGetWalletFeature = vi.fn();
vi.mock('@wallet-standard/ui-features', () => ({
  getWalletAccountFeature: (account: unknown, feature: unknown) =>
    mockGetWalletAccountFeature(account, feature),
  getWalletFeature: (wallet: unknown, feature: unknown) =>
    mockGetWalletFeature(wallet, feature),
}));

const mockGetWalletAccountForUiWalletAccount = vi.fn();
const mockGetWalletForHandle = vi.fn();
const mockGetOrCreateUiWalletAccountForStandardWalletAccount = vi.fn();
vi.mock('@wallet-standard/ui-registry', () => ({
  getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: (account: unknown) =>
    mockGetWalletAccountForUiWalletAccount(account),
  getWalletForHandle_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: (handle: unknown) =>
    mockGetWalletForHandle(handle),
  getOrCreateUiWalletAccountForStandardWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: (
    wallet: unknown,
    account: unknown
  ) => mockGetOrCreateUiWalletAccountForStandardWalletAccount(wallet, account),
}));

describe('useSignIn', () => {
  let mockSignInFeature: SolanaSignInFeature[typeof SolanaSignIn];
  let mockStandardAccount: ReturnType<typeof createMockWalletAccount>;
  let mockWallet: ReturnType<typeof createMockWallet>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockStandardAccount = createMockWalletAccount({
      address: 'test-address-123',
    });

    mockWallet = createMockWallet({
      name: 'Test Wallet',
    });

    mockSignInFeature = {
      signIn: vi.fn().mockResolvedValue([
        {
          account: mockStandardAccount,
          signedMessage: new Uint8Array([1, 2, 3]),
          signature: new Uint8Array([4, 5, 6]),
          signatureType: 'ed25519',
        },
      ]),
    } as unknown as SolanaSignInFeature[typeof SolanaSignIn];

    mockGetWalletAccountFeature.mockReturnValue(mockSignInFeature);
    mockGetWalletFeature.mockReturnValue(mockSignInFeature);
    mockGetWalletAccountForUiWalletAccount.mockReturnValue(mockStandardAccount);
    mockGetWalletForHandle.mockReturnValue(mockWallet);
    mockGetOrCreateUiWalletAccountForStandardWalletAccount.mockImplementation(
      (wallet, account) => ({
        ...account,
        wallet,
      })
    );
  });

  it('should return null when account is null', () => {
    const accountRef = ref(null);
    const signIn = useSignIn(accountRef);

    expect(signIn.value).toBeNull();
  });

  it('should return null when wallet is null', () => {
    const walletRef = ref(null);
    const signIn = useSignIn(walletRef);

    expect(signIn.value).toBeNull();
  });

  it('should return sign in function when account is provided', () => {
    const account = createMockWalletAccount({
      address: 'test-address',
    });
    const wallet = createMockUiWallet(mockWallet, [account]);
    const uiAccount = {
      ...account,
      wallet,
    };

    const signIn = useSignIn(uiAccount);

    expect(signIn.value).toBeDefined();
    expect(typeof signIn.value).toBe('function');
  });

  it('should return sign in function when wallet is provided', () => {
    const wallet = createMockUiWallet(mockWallet, []);

    const signIn = useSignIn(wallet);

    expect(signIn.value).toBeDefined();
    expect(typeof signIn.value).toBe('function');
  });

  it('should sign in with account successfully', async () => {
    const account = createMockWalletAccount({
      address: 'test-address',
    });
    const wallet = createMockUiWallet(mockWallet, [account]);
    const uiAccount = {
      ...account,
      wallet,
    };

    const signIn = useSignIn(uiAccount);

    const result = await signIn.value!({
      requestId: 'test-request-id',
    });

    expect(result).toBeDefined();
    expect(result.account).toBeDefined();
    expect(result.signedMessage).toBeInstanceOf(Uint8Array);
    expect(result.signature).toBeInstanceOf(Uint8Array);
    expect(mockSignInFeature.signIn).toHaveBeenCalledWith({
      requestId: 'test-request-id',
      address: 'test-address',
    });
  });

  it('should sign in with wallet successfully', async () => {
    const wallet = createMockUiWallet(mockWallet, []);

    const signIn = useSignIn(wallet);

    const result = await signIn.value!({
      requestId: 'test-request-id',
      address: 'test-address',
    });

    expect(result).toBeDefined();
    expect(mockSignInFeature.signIn).toHaveBeenCalledWith({
      requestId: 'test-request-id',
      address: 'test-address',
    });
  });

  it('should work with ref account', async () => {
    const account = createMockWalletAccount({
      address: 'test-address',
    });
    const wallet = createMockUiWallet(mockWallet, [account]);
    const uiAccount = {
      ...account,
      wallet,
    };

    const accountRef = ref(uiAccount);
    const signIn = useSignIn(accountRef);

    expect(signIn.value).toBeDefined();

    await signIn.value!({
      requestId: 'test-request-id',
    });

    expect(mockSignInFeature.signIn).toHaveBeenCalled();
  });

  it('should use account address when signing in with account', async () => {
    const account = createMockWalletAccount({
      address: 'account-address-123',
    });
    const wallet = createMockUiWallet(mockWallet, [account]);
    const uiAccount = {
      ...account,
      wallet,
    };

    const signIn = useSignIn(uiAccount);

    await signIn.value!({
      requestId: 'test-request-id',
    });

    expect(mockSignInFeature.signIn).toHaveBeenCalledWith({
      requestId: 'test-request-id',
      address: 'account-address-123',
    });
  });
});

