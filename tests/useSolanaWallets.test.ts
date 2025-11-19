import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { createMockWallet, createMockUiWallet } from './helpers';
import type { UiWallet } from '@wallet-standard/ui-core';

// Mock useWallets directly since useSolanaWallets is just a filter wrapper
const mockWallets = ref<UiWallet[]>([]);
vi.mock('@laurensv/wallet-standard-vue', () => ({
  useWallets: () => ({
    wallets: mockWallets,
  }),
}));

import { useSolanaWallets } from '../src/composables/useSolanaWallets';

describe('useSolanaWallets', () => {
  beforeEach(() => {
    mockWallets.value = [];
  });

  it('should return empty array when no wallets are available', () => {
    const { wallets } = useSolanaWallets();
    expect(wallets.value).toEqual([]);
  });

  it('should filter out non-Solana wallets', () => {
    const solanaWallet = createMockUiWallet(
      createMockWallet({
        name: 'Solana Wallet',
        chains: ['solana:mainnet'],
      }),
      []
    );
    const ethereumWallet = createMockUiWallet(
      createMockWallet({
        name: 'Ethereum Wallet',
        chains: ['eip155:1'],
      }),
      []
    );

    mockWallets.value = [solanaWallet, ethereumWallet];

    const { wallets } = useSolanaWallets();
    expect(wallets.value).toHaveLength(1);
    expect(wallets.value[0].name).toBe('Solana Wallet');
  });

  it('should include wallets with solana:devnet chain', () => {
    const devnetWallet = createMockUiWallet(
      createMockWallet({
        name: 'Devnet Wallet',
        chains: ['solana:devnet'],
      }),
      []
    );

    mockWallets.value = [devnetWallet];

    const { wallets } = useSolanaWallets();
    expect(wallets.value).toHaveLength(1);
    expect(wallets.value[0].name).toBe('Devnet Wallet');
  });

  it('should include wallets with solana:testnet chain', () => {
    const testnetWallet = createMockUiWallet(
      createMockWallet({
        name: 'Testnet Wallet',
        chains: ['solana:testnet'],
      }),
      []
    );

    mockWallets.value = [testnetWallet];

    const { wallets } = useSolanaWallets();
    expect(wallets.value).toHaveLength(1);
    expect(wallets.value[0].name).toBe('Testnet Wallet');
  });

  it('should include wallets with multiple chains if one is Solana', () => {
    const multiChainWallet = createMockUiWallet(
      createMockWallet({
        name: 'Multi-Chain Wallet',
        chains: ['solana:mainnet', 'eip155:1'],
      }),
      []
    );

    mockWallets.value = [multiChainWallet];

    const { wallets } = useSolanaWallets();
    expect(wallets.value).toHaveLength(1);
    expect(wallets.value[0].name).toBe('Multi-Chain Wallet');
  });

  it('should update when wallets change', () => {
    const { wallets } = useSolanaWallets();
    expect(wallets.value).toHaveLength(0);

    const solanaWallet = createMockUiWallet(
      createMockWallet({
        name: 'New Solana Wallet',
        chains: ['solana:mainnet'],
      }),
      []
    );
    mockWallets.value = [solanaWallet];

    expect(wallets.value).toHaveLength(1);
    expect(wallets.value[0].name).toBe('New Solana Wallet');
  });

  it('should return wallets with correct names', () => {
    const wallet1 = createMockUiWallet(
      createMockWallet({
        name: 'Phantom',
        chains: ['solana:mainnet'],
      }),
      []
    );
    const wallet2 = createMockUiWallet(
      createMockWallet({
        name: 'Solflare',
        chains: ['solana:mainnet'],
      }),
      []
    );

    mockWallets.value = [wallet1, wallet2];

    const { wallets } = useSolanaWallets();
    expect(wallets.value).toHaveLength(2);
    expect(wallets.value.map((w) => w.name)).toContain('Phantom');
    expect(wallets.value.map((w) => w.name)).toContain('Solflare');
  });

  it('should filter correctly when wallets array changes reactively', () => {
    const { wallets } = useSolanaWallets();
    expect(wallets.value).toHaveLength(0);

    // Add a non-Solana wallet
    const ethereumWallet = createMockUiWallet(
      createMockWallet({
        name: 'Ethereum Wallet',
        chains: ['eip155:1'],
      }),
      []
    );
    mockWallets.value = [ethereumWallet];
    expect(wallets.value).toHaveLength(0);

    // Add a Solana wallet
    const solanaWallet = createMockUiWallet(
      createMockWallet({
        name: 'Solana Wallet',
        chains: ['solana:mainnet'],
      }),
      []
    );
    mockWallets.value = [ethereumWallet, solanaWallet];
    expect(wallets.value).toHaveLength(1);
    expect(wallets.value[0].name).toBe('Solana Wallet');
  });
});
