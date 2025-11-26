import { computed } from 'vue';
import type { UiWallet } from '@wallet-standard/ui-core';
import { isSolanaChain } from '@solana/wallet-standard-chains';
import { useWallets } from '@nosana/wallet-standard-vue';
import type { UseWalletsReturn } from '@nosana/wallet-standard-vue';

/**
 * Convenience composable that filters wallets to only show Solana-compatible wallets.
 * This is a wrapper around `useWallets()` that filters for wallets supporting Solana chains.
 *
 * @returns Filtered wallets that support Solana chains
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useSolanaWallets } from '@nosana/solana-vue';
 *
 * const { wallets } = useSolanaWallets();
 * // wallets only contains wallets that support Solana
 * </script>
 * ```
 */
export function useSolanaWallets(): UseWalletsReturn {
  const { wallets } = useWallets();

  // Filter for Solana wallets
  const solanaWallets = computed(() => {
    return wallets.value.filter((wallet: UiWallet) =>
      wallet.chains?.some((chain) => isSolanaChain(chain))
    );
  });

  return {
    wallets: solanaWallets,
  };
}
