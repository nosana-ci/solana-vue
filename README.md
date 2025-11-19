# @laurensv/solana-vue

Vue composables and components for Solana wallet-standard, built on top of `@laurensv/wallet-standard-vue`.

## Installation

```bash
npm install @laurensv/solana-vue
```

**Note:** This package depends on `@laurensv/wallet-standard-vue` and re-exports essential generic functionality (`WalletProvider`, `useWallet`) plus Solana-specific features. For generic components like `WalletButton` or `useWallets`, import directly from `@laurensv/wallet-standard-vue`.

## Usage

### For Solana Apps (Recommended)

**Import Solana-specific features from `@laurensv/solana-vue`** - it re-exports essential generic functionality (`WalletProvider`, `useWallet`) plus Solana-specific features:

```vue
<template>
  <WalletProvider>
    <SolanaWalletButton />
    <!-- Your app content -->
  </WalletProvider>
</template>

<script setup lang="ts">
// Import Solana-specific features from solana-vue
// WalletProvider and useWallet are re-exported (they're generic but needed)
// Use Solana-specific components and composables (recommended)
import { 
  WalletProvider,
  SolanaWalletButton,  // Shows only Solana wallets
  useWallet,
  useSolanaWallets,    // Returns only Solana wallets
  useSignAndSendTransaction 
} from '@laurensv/solana-vue';

const { account } = useWallet();
const signAndSendTransaction = useSignAndSendTransaction(account, 'solana:devnet');
</script>
```

### For Multi-Chain Apps

If you're building a multi-chain app, import the generic functionality from `@laurensv/wallet-standard-vue`:

```vue
<script setup lang="ts">
import { WalletProvider, useWallet, WalletButton, useWallets } from '@laurensv/wallet-standard-vue';
import { useSignAndSendTransaction } from '@laurensv/solana-vue';
</script>
```

## API

### Re-exported from `@laurensv/wallet-standard-vue`

Essential generic functionality needed for Solana apps:

- `WalletProvider` - Provider component (required)
- `useWallet()` - Wallet connection state management (generic, works for any chain)
- `WALLET_CONTEXT_KEY` - Context key for advanced usage

**Note:** For generic components (`WalletButton`, `WalletModal`, `useWallets`), import directly from `@laurensv/wallet-standard-vue` if you need them. For Solana apps, use the Solana-specific versions below.

### Solana-Specific Composables (Recommended for Solana Apps)

- `useSolanaWallets()` - **Recommended** - Filtered list of Solana-compatible wallets (use instead of `useWallets()`)
- `useSignTransaction()` - Sign Solana transactions
- `useSignAndSendTransaction()` - Sign and send Solana transactions
- `useSignMessage()` - Sign messages
- `useSignIn()` - Sign In With Solana
- `useSolanaTransaction()` - Legacy base64 transaction signing (for backward compatibility)
- `useWalletAccountMessageSigner()` - Create a message signer
- `useWalletAccountTransactionSigner()` - Create a transaction signer (non-sending)
- `useWalletAccountTransactionSendingSigner()` - Create a transaction signer (sending)

### Solana-Specific Components (Recommended for Solana Apps)

- `SolanaWalletButton` - **Recommended** - Wallet button that only shows Solana-compatible wallets (use instead of `WalletButton`)
- `SolanaWalletModal` - **Recommended** - Wallet modal that only shows Solana-compatible wallets (use instead of `WalletModal`)

## Examples

See the [examples/vue-app](../examples/vue-app) directory for a complete example application.

## TypeScript Support

This package is written in TypeScript and includes type definitions.

## License

MIT
