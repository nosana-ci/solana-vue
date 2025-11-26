# @nosana/solana-vue

Vue composables and components for Solana wallet-standard, built on top of [`@nosana/wallet-standard-vue`](https://www.npmjs.com/package/@nosana/wallet-standard-vue).

## Installation

```bash
npm install @nosana/solana-vue
```

**Note:** This package depends on [`@nosana/wallet-standard-vue`](https://www.npmjs.com/package/@nosana/wallet-standard-vue) and re-exports essential generic functionality (`WalletProvider`, `useWallet`) plus Solana-specific features. For generic components like `WalletButton` or `useWallets`, import directly from [`@nosana/wallet-standard-vue`](https://www.npmjs.com/package/@nosana/wallet-standard-vue).

## Usage

### For Solana Apps (Recommended)

**Import Solana-specific features from `@nosana/solana-vue`** - it re-exports essential generic functionality (`WalletProvider`, `useWallet`) plus Solana-specific features:

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
  SolanaWalletButton, // Shows only Solana wallets
  useWallet,
  useSolanaWallets, // Returns only Solana wallets
  useSignAndSendTransaction,
} from '@nosana/solana-vue';
// Don't forget to import the styles if you want the default styling
import '@nosana/solana-vue/styles';

const { account } = useWallet();
const signAndSendTransaction = useSignAndSendTransaction(account, 'solana:devnet');
</script>
```

**WalletProvider Props:**

- `autoConnect` (optional, default: `false`): Automatically reconnect to the last connected wallet when the app loads. The wallet name is stored in localStorage and will be automatically reconnected on subsequent visits.

- `localStorageKey` (optional, default: `'walletName'`): The key used to store the last connected wallet name in localStorage. Useful if you want to use a custom key or have multiple instances.

**Example - With auto-connect enabled:**

```vue
<template>
  <WalletProvider :auto-connect="true">
    <SolanaWalletButton />
    <!-- Your app content -->
  </WalletProvider>
</template>

<script setup lang="ts">
import { WalletProvider, SolanaWalletButton, useWallet } from '@nosana/solana-vue';
import '@nosana/solana-vue/styles';
</script>
```

### For Multi-Chain Apps

If you're building a multi-chain app, import the generic functionality from [`@nosana/wallet-standard-vue`](https://www.npmjs.com/package/@nosana/wallet-standard-vue):

```vue
<script setup lang="ts">
import { WalletProvider, useWallet, WalletButton, useWallets } from '@nosana/wallet-standard-vue';
import { useSignAndSendTransaction } from '@nosana/solana-vue';
</script>
```

## Styling

The UI components (`SolanaWalletButton` and `SolanaWalletModal`) come with default styles that you can optionally import:

```javascript
// Import all styles
import '@nosana/solana-vue/styles';

// Or import individual component styles
import '@nosana/solana-vue/styles/wallet-button';
import '@nosana/solana-vue/styles/wallet-modal';
```

**Note:** The styles are the same as `@nosana/wallet-standard-vue/styles` - you can import from either package. For detailed styling documentation including CSS variables and customization options, see the [@nosana/wallet-standard-vue package](https://www.npmjs.com/package/@nosana/wallet-standard-vue).

## API

### Re-exported from [`@nosana/wallet-standard-vue`](https://www.npmjs.com/package/@nosana/wallet-standard-vue)

Essential generic functionality needed for Solana apps:

- `WalletProvider` - Provider component (required)
- `useWallet()` - Wallet connection state management (generic, works for any chain)
- `WALLET_CONTEXT_KEY` - Context key for advanced usage

**Note:** For generic components (`WalletButton`, `WalletModal`, `useWallets`), import directly from [`@nosana/wallet-standard-vue`](https://www.npmjs.com/package/@nosana/wallet-standard-vue) if you need them. For Solana apps, use the Solana-specific versions below.

### Solana-Specific Composables (Recommended for Solana Apps)

- `useSolanaWallets()` - **Recommended** - Filtered list of Solana-compatible wallets (use instead of `useWallets()`)
- `useSignTransaction()` - Sign Solana transactions
- `useSignAndSendTransaction()` - Sign and send Solana transactions
- `useSignMessage()` - Sign messages
- `useSignIn()` - Sign In With Solana
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
