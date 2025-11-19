import type { Wallet, WalletAccount } from '@wallet-standard/base';
import type { UiWallet } from '@wallet-standard/ui-core';

export function createMockWalletAccount(overrides?: Partial<WalletAccount>): WalletAccount {
  return {
    address: 'test-address-123',
    publicKey: new Uint8Array([1, 2, 3, 4, 5]),
    chains: ['solana:mainnet'],
    features: [],
    ...overrides,
  };
}

export function createMockWallet(overrides?: Partial<Wallet>): Wallet {
  return {
    version: '1.0.0',
    name: 'Test Wallet',
    icon: 'data:image/png;base64,test',
    chains: ['solana:mainnet'],
    features: {},
    accounts: [],
    ...overrides,
  } as Wallet;
}

export function createMockUiWallet(wallet: Wallet, accounts: WalletAccount[] = []): UiWallet {
  return {
    ...wallet,
    accounts: accounts.map((acc) => ({ ...acc, wallet })),
  } as UiWallet;
}

export function createWalletsMock() {
  const wallets: Wallet[] = [];
  const listeners: { [key: string]: Array<() => void> } = {};

  return {
    get: () => wallets,
    on: (event: string, listener: () => void) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(listener);
      return () => {
        const index = listeners[event].indexOf(listener);
        if (index > -1) {
          listeners[event].splice(index, 1);
        }
      };
    },
    addWallet: (wallet: Wallet) => {
      wallets.push(wallet);
      listeners['register']?.forEach((listener) => listener());
    },
    removeWallet: (wallet: Wallet) => {
      const index = wallets.indexOf(wallet);
      if (index > -1) {
        wallets.splice(index, 1);
        listeners['unregister']?.forEach((listener) => listener());
      }
    },
    clear: () => {
      wallets.length = 0;
    },
  };
}
