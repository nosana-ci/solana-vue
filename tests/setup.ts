import { vi } from 'vitest';

// Mock wallet-standard/app
vi.mock('@wallet-standard/app', () => {
  const mockWallets = new Map();
  const mockListeners: { [key: string]: Array<() => void> } = {};

  return {
    getWallets: () => ({
      get: () => Array.from(mockWallets.values()),
      on: (event: string, listener: () => void) => {
        if (!mockListeners[event]) {
          mockListeners[event] = [];
        }
        mockListeners[event].push(listener);
        return () => {
          const index = mockListeners[event].indexOf(listener);
          if (index > -1) {
            mockListeners[event].splice(index, 1);
          }
        };
      },
      register: (wallet: any) => {
        mockWallets.set(wallet.name, wallet);
        mockListeners['register']?.forEach((listener) => listener());
      },
    }),
  };
});
