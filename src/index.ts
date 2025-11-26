// Re-export only the essential generic functionality that's needed for Solana apps
// useWallet is generic behavior that works the same for any chain (managing connection state)
// WalletProvider is required for the context
// For generic components (WalletButton, WalletModal, useWallets), import from @nosana/wallet-standard-vue
export { useWallet, WalletProvider, WALLET_CONTEXT_KEY } from '@nosana/wallet-standard-vue';
export type * from '@nosana/wallet-standard-vue';
export type { WalletContext } from '@nosana/wallet-standard-vue';

// Export Solana-specific composables
export { useSignIn } from './composables/useSignIn';
export { useSignMessage } from './composables/useSignMessage';
export { useSignTransaction } from './composables/useSignTransaction';
export { useSignAndSendTransaction } from './composables/useSignAndSendTransaction';
export { useSolanaWallets } from './composables/useSolanaWallets';
export { useWalletAccountMessageSigner } from './composables/useWalletAccountMessageSigner';
export { useWalletAccountTransactionSigner } from './composables/useWalletAccountTransactionSigner';
export { useWalletAccountTransactionSendingSigner } from './composables/useWalletAccountTransactionSendingSigner';

// Export Solana-specific types
export type { OnlySolanaChains } from './composables/chain';

// Export Solana-specific UI components
export { default as SolanaWalletButton } from './components/SolanaWalletButton.vue';
export { default as SolanaWalletModal } from './components/SolanaWalletModal.vue';
