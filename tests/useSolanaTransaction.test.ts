import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { useSolanaTransaction, WalletProvider } from '@laurensv/solana-vue';
import { SolanaSignTransaction } from '@solana/wallet-standard-features';
import type { SolanaSignTransactionFeature } from '@solana/wallet-standard-features';
import {
  createMockWallet,
  createMockWalletAccount,
  createMockUiWallet,
  createWalletsMock,
} from './helpers';

const mockGetWallets = vi.fn();
vi.mock('@wallet-standard/app', () => ({
  getWallets: () => mockGetWallets(),
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

describe('useSolanaTransaction', () => {
  let walletsMock: ReturnType<typeof createWalletsMock>;
  let mockSignFeature: SolanaSignTransactionFeature[typeof SolanaSignTransaction];
  let mockStandardAccount: ReturnType<typeof createMockWalletAccount>;

  beforeEach(() => {
    vi.clearAllMocks();
    walletsMock = createWalletsMock();
    mockGetWallets.mockReturnValue(walletsMock);

    mockStandardAccount = createMockWalletAccount({
      address: 'test-address-123',
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

  it('should throw error when used outside WalletProvider', () => {
    const TestComponent = defineComponent({
      setup() {
        try {
          useSolanaTransaction();
          return { error: null };
        } catch (error) {
          return { error: (error as Error).message };
        }
      },
      template: '<div>{{ error }}</div>',
    });

    const wrapper = mount(TestComponent);
    expect(wrapper.text()).toContain('useWallet must be used within WalletProvider');
  });

  it('should throw error when no account is connected', async () => {
    const TestComponent = defineComponent({
      setup() {
        const { signTransaction } = useSolanaTransaction();
        return { signTransaction };
      },
      template: '<div>Test</div>',
    });

    const wrapper = mount(WalletProvider, {
      slots: {
        default: TestComponent,
      },
    });

    await nextTick();

    const testComponent = wrapper.findComponent(TestComponent);
    // Try to sign without connected account
    try {
      await testComponent.vm.signTransaction('dGVzdA==');
      expect.fail('Should have thrown error');
    } catch (error) {
      expect((error as Error).message).toBe('No wallet account connected');
    }
  });

  it('should sign transaction successfully', async () => {
    const wallet = createMockWallet({
      name: 'Test Wallet',
      features: {
        [SolanaSignTransaction]: mockSignFeature,
      },
    });
    const account = createMockWalletAccount({
      address: 'test-address-123',
      features: [SolanaSignTransaction],
    });
    wallet.accounts = [account];
    walletsMock.addWallet(wallet);

    const uiWallet = createMockUiWallet(wallet, [account]);
    const uiAccount = {
      ...account,
      wallet: uiWallet,
    };

    let signedTransactionResult: string | null = null;

    const TestComponent = defineComponent({
      setup() {
        const { signTransaction } = useSolanaTransaction();
        return {
          signTransaction: async (tx: string) => {
            signedTransactionResult = await signTransaction(tx);
          },
        };
      },
      template: '<div>Test</div>',
    });

    const wrapper = mount(WalletProvider, {
      slots: {
        default: TestComponent,
      },
    });

    // Set up the wallet context manually
    const provider = wrapper.findComponent({ name: 'WalletProvider' });
    const context = (provider.vm as any).context;
    context.setWallet(uiWallet);
    context.setAccount(uiAccount);
    context.setAccounts([uiAccount]);

    await nextTick();

    const testComponent = wrapper.findComponent(TestComponent);
    const testTransaction = btoa('test transaction data');
    await testComponent.vm.signTransaction(testTransaction);

    expect(mockGetWalletAccountFeature).toHaveBeenCalledWith(uiAccount, SolanaSignTransaction);
    expect(mockGetWalletAccountForUiWalletAccount).toHaveBeenCalledWith(uiAccount);
    expect(mockSignFeature.signTransaction).toHaveBeenCalledWith({
      account: mockStandardAccount,
      transaction: new Uint8Array([
        116, 101, 115, 116, 32, 116, 114, 97, 110, 115, 97, 99, 116, 105, 111, 110, 32, 100, 97,
        116, 97,
      ]),
      chain: 'solana:devnet',
    });
    expect(signedTransactionResult).toBeTruthy();
  });

  it('should use custom chain when provided', async () => {
    const wallet = createMockWallet({
      name: 'Test Wallet',
      features: {
        [SolanaSignTransaction]: mockSignFeature,
      },
    });
    const account = createMockWalletAccount({
      address: 'test-address-123',
      features: [SolanaSignTransaction],
    });
    wallet.accounts = [account];
    walletsMock.addWallet(wallet);

    const uiWallet = createMockUiWallet(wallet, [account]);
    const uiAccount = {
      ...account,
      wallet: uiWallet,
    };

    const TestComponent = defineComponent({
      setup() {
        const { signTransaction } = useSolanaTransaction();
        return { signTransaction };
      },
      template: '<div>Test</div>',
    });

    const wrapper = mount(WalletProvider, {
      slots: {
        default: TestComponent,
      },
    });

    const provider = wrapper.findComponent({ name: 'WalletProvider' });
    const context = (provider.vm as any).context;
    context.setWallet(uiWallet);
    context.setAccount(uiAccount);
    context.setAccounts([uiAccount]);

    await nextTick();

    const testComponent = wrapper.findComponent(TestComponent);
    const testTransaction = btoa('test');
    await testComponent.vm.signTransaction(testTransaction, { chain: 'solana:mainnet' });

    expect(mockSignFeature.signTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        chain: 'solana:mainnet',
      })
    );
  });

  it('should handle signing errors', async () => {
    const wallet = createMockWallet({
      name: 'Test Wallet',
      features: {
        [SolanaSignTransaction]: mockSignFeature,
      },
    });
    const account = createMockWalletAccount({
      address: 'test-address-123',
      features: [SolanaSignTransaction],
    });
    wallet.accounts = [account];
    walletsMock.addWallet(wallet);

    const uiWallet = createMockUiWallet(wallet, [account]);
    const uiAccount = {
      ...account,
      wallet: uiWallet,
    };

    const errorMessage = 'Signing failed';
    mockSignFeature.signTransaction = vi
      .fn()
      .mockRejectedValue(new Error(errorMessage)) as typeof mockSignFeature.signTransaction;

    let caughtError: Error | null = null;

    const TestComponent = defineComponent({
      setup() {
        const { signTransaction } = useSolanaTransaction();
        return {
          signTransaction: async (tx: string) => {
            try {
              await signTransaction(tx);
            } catch (error) {
              caughtError = error as Error;
            }
          },
        };
      },
      template: '<div>Test</div>',
    });

    const wrapper = mount(WalletProvider, {
      slots: {
        default: TestComponent,
      },
    });

    const provider = wrapper.findComponent({ name: 'WalletProvider' });
    const context = (provider.vm as any).context;
    context.setWallet(uiWallet);
    context.setAccount(uiAccount);
    context.setAccounts([uiAccount]);

    await nextTick();

    const testComponent = wrapper.findComponent(TestComponent);
    const testTransaction = btoa('test');
    await testComponent.vm.signTransaction(testTransaction);

    expect(caughtError).toBeTruthy();
    expect(caughtError?.message).toBe(errorMessage);
  });

  it('should handle case when no signed transaction is returned', async () => {
    const wallet = createMockWallet({
      name: 'Test Wallet',
      features: {
        [SolanaSignTransaction]: mockSignFeature,
      },
    });
    const account = createMockWalletAccount({
      address: 'test-address-123',
      features: [SolanaSignTransaction],
    });
    wallet.accounts = [account];
    walletsMock.addWallet(wallet);

    const uiWallet = createMockUiWallet(wallet, [account]);
    const uiAccount = {
      ...account,
      wallet: uiWallet,
    };

    mockSignFeature.signTransaction = vi.fn().mockResolvedValue([
      {
        signedTransaction: undefined,
      },
    ]) as typeof mockSignFeature.signTransaction;

    let caughtError: Error | null = null;

    const TestComponent = defineComponent({
      setup() {
        const { signTransaction } = useSolanaTransaction();
        return {
          signTransaction: async (tx: string) => {
            try {
              await signTransaction(tx);
            } catch (error) {
              caughtError = error as Error;
            }
          },
        };
      },
      template: '<div>Test</div>',
    });

    const wrapper = mount(WalletProvider, {
      slots: {
        default: TestComponent,
      },
    });

    const provider = wrapper.findComponent({ name: 'WalletProvider' });
    const context = (provider.vm as any).context;
    context.setWallet(uiWallet);
    context.setAccount(uiAccount);
    context.setAccounts([uiAccount]);

    await nextTick();

    const testComponent = wrapper.findComponent(TestComponent);
    const testTransaction = btoa('test');
    await testComponent.vm.signTransaction(testTransaction);

    expect(caughtError).toBeTruthy();
    expect(caughtError?.message).toBe('No signed transaction returned');
  });

  it('should update signing state correctly', async () => {
    const wallet = createMockWallet({
      name: 'Test Wallet',
      features: {
        [SolanaSignTransaction]: mockSignFeature,
      },
    });
    const account = createMockWalletAccount({
      address: 'test-address-123',
      features: [SolanaSignTransaction],
    });
    wallet.accounts = [account];
    walletsMock.addWallet(wallet);

    const uiWallet = createMockUiWallet(wallet, [account]);
    const uiAccount = {
      ...account,
      wallet: uiWallet,
    };

    // Add delay to signing to test state changes
    let resolveSign: (value: unknown) => void;
    const signPromise = new Promise((resolve) => {
      resolveSign = resolve;
    });
    mockSignFeature.signTransaction = vi
      .fn()
      .mockReturnValue(signPromise) as typeof mockSignFeature.signTransaction;

    const TestComponent = defineComponent({
      setup() {
        const { signing, signTransaction } = useSolanaTransaction();
        return {
          signing,
          signTransaction,
        };
      },
      template: '<div>{{ signing ? "Signing" : "Not Signing" }}</div>',
    });

    const wrapper = mount(WalletProvider, {
      slots: {
        default: TestComponent,
      },
    });

    const provider = wrapper.findComponent({ name: 'WalletProvider' });
    const context = (provider.vm as any).context;
    context.setWallet(uiWallet);
    context.setAccount(uiAccount);
    context.setAccounts([uiAccount]);

    await nextTick();

    const testComponent = wrapper.findComponent(TestComponent);
    expect(testComponent.text()).toBe('Not Signing');

    const testTransaction = btoa('test');
    const signPromise2 = testComponent.vm.signTransaction(testTransaction);

    // Wait a bit for the signing state to update
    await new Promise((resolve) => setTimeout(resolve, 10));
    await nextTick();

    // Check that signing state is true during signing
    expect(testComponent.text()).toBe('Signing');

    // Resolve the signing
    resolveSign!([
      {
        signedTransaction: new Uint8Array([1, 2, 3]),
      },
    ]);
    await signPromise2;
    await nextTick();

    // Check that signing state is false after completion
    expect(testComponent.text()).toBe('Not Signing');
  });

  it('should convert base64 transaction correctly', async () => {
    const wallet = createMockWallet({
      name: 'Test Wallet',
      features: {
        [SolanaSignTransaction]: mockSignFeature,
      },
    });
    const account = createMockWalletAccount({
      address: 'test-address-123',
      features: [SolanaSignTransaction],
    });
    wallet.accounts = [account];
    walletsMock.addWallet(wallet);

    const uiWallet = createMockUiWallet(wallet, [account]);
    const uiAccount = {
      ...account,
      wallet: uiWallet,
    };

    const TestComponent = defineComponent({
      setup() {
        const { signTransaction } = useSolanaTransaction();
        return { signTransaction };
      },
      template: '<div>Test</div>',
    });

    const wrapper = mount(WalletProvider, {
      slots: {
        default: TestComponent,
      },
    });

    const provider = wrapper.findComponent({ name: 'WalletProvider' });
    const context = (provider.vm as any).context;
    context.setWallet(uiWallet);
    context.setAccount(uiAccount);
    context.setAccounts([uiAccount]);

    await nextTick();

    const testComponent = wrapper.findComponent(TestComponent);
    // Test with specific base64 data
    const originalData = 'Hello, World!';
    const base64Transaction = btoa(originalData);
    await testComponent.vm.signTransaction(base64Transaction);

    // Verify the transaction was converted to Uint8Array correctly
    const expectedBytes = new Uint8Array(originalData.split('').map((c) => c.charCodeAt(0)));
    expect(mockSignFeature.signTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction: expectedBytes,
      })
    );
  });

  it('should return base64 encoded signed transaction', async () => {
    const wallet = createMockWallet({
      name: 'Test Wallet',
      features: {
        [SolanaSignTransaction]: mockSignFeature,
      },
    });
    const account = createMockWalletAccount({
      address: 'test-address-123',
      features: [SolanaSignTransaction],
    });
    wallet.accounts = [account];
    walletsMock.addWallet(wallet);

    const uiWallet = createMockUiWallet(wallet, [account]);
    const uiAccount = {
      ...account,
      wallet: uiWallet,
    };

    const signedBytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" in bytes
    mockSignFeature.signTransaction = vi.fn().mockResolvedValue([
      {
        signedTransaction: signedBytes,
      },
    ]) as typeof mockSignFeature.signTransaction;

    let signedResult: string | null = null;

    const TestComponent = defineComponent({
      setup() {
        const { signTransaction } = useSolanaTransaction();
        return {
          signTransaction: async (tx: string) => {
            signedResult = await signTransaction(tx);
          },
        };
      },
      template: '<div>Test</div>',
    });

    const wrapper = mount(WalletProvider, {
      slots: {
        default: TestComponent,
      },
    });

    const provider = wrapper.findComponent({ name: 'WalletProvider' });
    const context = (provider.vm as any).context;
    context.setWallet(uiWallet);
    context.setAccount(uiAccount);
    context.setAccounts([uiAccount]);

    await nextTick();

    const testComponent = wrapper.findComponent(TestComponent);
    const testTransaction = btoa('test');
    await testComponent.vm.signTransaction(testTransaction);

    // Verify the result is base64 encoded
    expect(signedResult).toBe(btoa(String.fromCharCode(...signedBytes)));
  });
});
