import type { AppIdentity } from '@solana-mobile/mobile-wallet-adapter-protocol';
import type { IdentifierArray } from '@wallet-standard/base';
import {
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  createDefaultWalletNotFoundHandler,
  registerMwa,
} from '@solana-mobile/wallet-standard-mobile';

/**
 * Configuration options for Mobile Wallet Adapter registration
 */
export interface UseMobileWalletAdapterOptions {
  /**
   * App identity information
   */
  appIdentity: AppIdentity;
  /**
   * Chains to support (default: ['solana:devnet', 'solana:mainnet'])
   */
  chains?: IdentifierArray;
  /**
   * Remote host authority for desktop QR code connection (optional, not available yet)
   */
  remoteHostAuthority?: string;
}

/**
 * Register the Solana Mobile Wallet Adapter for your Vue app.
 * This composable automatically handles SSR checks and registers the wallet adapter
 * immediately (client-side only). Can be used in components, plugins, or any setup context.
 *
 * Once registered, the wallet behavior automatically adapts to the user's device:
 * - **Mobile**: Local connection via Android Intents (same as native Android apps)
 * - **Desktop** (Not available yet): If `remoteHostAuthority` is provided, remote connection via QR Code
 *
 * @param options Configuration options for Mobile Wallet Adapter
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useMobileWalletAdapter } from '@nosana/solana-vue';
 *
 * useMobileWalletAdapter({
 *   appIdentity: {
 *     name: 'My App',
 *     uri: 'https://myapp.io',
 *     icon: '/icon.png', // relative path resolves to https://myapp.io/icon.png
 *   },
 * });
 * </script>
 * ```
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useMobileWalletAdapter } from '@nosana/solana-vue';
 *
 * // Customize chains
 * useMobileWalletAdapter({
 *   appIdentity: {
 *     name: 'My App',
 *     uri: 'https://myapp.io',
 *     icon: '/icon.png',
 *   },
 *   chains: ['solana:mainnet'], // Only mainnet
 * });
 * </script>
 * ```
 *
 * @example
 * ```ts
 * // Can also be used in Nuxt plugins
 * export default defineNuxtPlugin({
 *   setup() {
 *     useMobileWalletAdapter({
 *       appIdentity: {
 *         name: 'My App',
 *         uri: 'https://myapp.io',
 *         icon: '/icon.png',
 *       },
 *     });
 *   }
 * });
 * ```
 */
export function useMobileWalletAdapter(options: UseMobileWalletAdapterOptions): void {
  // Only register on client-side (not SSR)
  if (typeof window === 'undefined') {
    return;
  }

  // Register immediately (not in onMounted) so it works in plugins and components
  registerMwa({
    appIdentity: options.appIdentity,
    authorizationCache: createDefaultAuthorizationCache(),
    chains: options.chains ?? ['solana:devnet', 'solana:mainnet'],
    chainSelector: createDefaultChainSelector(),
    onWalletNotFound: createDefaultWalletNotFoundHandler(),
    ...(options.remoteHostAuthority && { remoteHostAuthority: options.remoteHostAuthority }),
  });
}
