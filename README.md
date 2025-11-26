# @nosana/solana-vue

Vue composables and components for Solana wallet-standard, built on top of `@nosana/wallet-standard-vue`.

## Installation

```bash
npm install @nosana/solana-vue
```

**Note:** This package depends on `@nosana/wallet-standard-vue` and re-exports essential generic functionality (`WalletProvider`, `useWallet`) plus Solana-specific features. For generic components like `WalletButton` or `useWallets`, import directly from `@nosana/wallet-standard-vue`.

## Styling

The UI components (`SolanaWalletButton` and `SolanaWalletModal`) come with default styles that you can optionally import. If you prefer to style them yourself, you can skip importing the CSS.

### Import all styles

```javascript
import '@nosana/solana-vue/styles';
```

### Import individual component styles

```javascript
// Import only WalletButton styles
import '@nosana/solana-vue/styles/wallet-button';

// Import only WalletModal styles
import '@nosana/solana-vue/styles/wallet-modal';
```

### In your main entry file

```javascript
// main.js or main.ts
import { createApp } from 'vue';
import App from './App.vue';
import '@nosana/solana-vue/styles'; // Add this line

createApp(App).mount('#app');
```

**Note:** The styles are the same as `@nosana/wallet-standard-vue/styles` - you can import from either package.

### Customizing with CSS Variables

The default styles can be customized using CSS variables. You can override these variables in your own stylesheet to match your app's design.

#### Shared Variables

These variables are shared across all components and can be overridden globally:

```css
:root {
  /* Primary Colors */
  --wallet-primary: #3b82f6;
  --wallet-primary-hover: #2563eb;
  
  /* Text Colors */
  --wallet-text-primary: #111827;
  --wallet-text-secondary: #6b7280;
  
  /* Border Colors */
  --wallet-border: #e5e7eb;
  --wallet-border-hover: #d1d5db;
  
  /* Background Colors */
  --wallet-bg: white;
  --wallet-bg-gray: #f3f4f6;
  --wallet-bg-hover: #f9fafb;
  --wallet-bg-accent: #eff6ff;
  
  /* Typography */
  --wallet-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
```

#### WalletButton Variables

```css
:root {
  /* Button Colors */
  --wallet-button-connect-bg: var(--wallet-primary);
  --wallet-button-connect-bg-hover: var(--wallet-primary-hover);
  --wallet-button-connect-text: var(--wallet-bg);
  --wallet-button-disconnect-bg: var(--wallet-bg);
  --wallet-button-disconnect-bg-hover: var(--wallet-bg-hover);
  --wallet-button-disconnect-text: var(--wallet-text-primary);
  --wallet-button-disconnect-border: var(--wallet-border);
  --wallet-button-disconnect-border-hover: var(--wallet-border-hover);
  
  /* Text Colors */
  --wallet-button-text-secondary: var(--wallet-text-secondary);
  
  /* Icon & Placeholder */
  --wallet-button-icon-placeholder-bg: var(--wallet-bg-gray);
  --wallet-button-icon-placeholder-text: var(--wallet-text-secondary);
  
  /* Spinner */
  --wallet-button-spinner-color: var(--wallet-button-connect-bg);
  
  /* Typography - can override shared variable */
  --wallet-button-font-family: var(--wallet-font-family);
}
```

#### WalletModal Variables

```css
:root {
  /* Modal Overlay */
  --wallet-modal-overlay-bg: rgba(0, 0, 0, 0.5);
  
  /* Modal Container */
  --wallet-modal-bg: var(--wallet-bg);
  --wallet-modal-border-radius: 12px;
  --wallet-modal-max-width: 400px;
  
  /* Modal Header */
  --wallet-modal-header-border: var(--wallet-border);
  --wallet-modal-title-color: var(--wallet-text-primary);
  
  /* Modal Close Button */
  --wallet-modal-close-color: var(--wallet-text-secondary);
  --wallet-modal-close-bg-hover: var(--wallet-bg-gray);
  --wallet-modal-close-border-radius: 0.375rem;
  
  /* Modal Content */
  --wallet-modal-empty-text: var(--wallet-text-secondary);
  
  /* Wallet Item */
  --wallet-item-bg: var(--wallet-bg);
  --wallet-item-border: var(--wallet-border);
  --wallet-item-border-hover: var(--wallet-primary);
  --wallet-item-bg-hover: var(--wallet-bg-accent);
  --wallet-item-border-radius: 0.5rem;
  
  /* Wallet Item Icon */
  --wallet-item-icon-bg: var(--wallet-bg-gray);
  --wallet-item-icon-placeholder-text: var(--wallet-text-secondary);
  
  /* Wallet Item Text */
  --wallet-item-name-color: var(--wallet-text-primary);
  
  /* Wallet Item Spinner */
  --wallet-item-spinner-color: var(--wallet-primary);
  
  /* Typography - can override shared variable */
  --wallet-modal-font-family: var(--wallet-font-family);
}
```

**Example - Customizing colors:**

```css
/* In your app's CSS file */
:root {
  /* Change the primary color globally */
  --wallet-primary: #8b5cf6;
  --wallet-primary-hover: #7c3aed;
  
  /* Or override specific button colors */
  --wallet-button-connect-bg: #10b981;
  --wallet-button-connect-bg-hover: #059669;
}
```

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
  SolanaWalletButton,  // Shows only Solana wallets
  useWallet,
  useSolanaWallets,    // Returns only Solana wallets
  useSignAndSendTransaction 
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

If you're building a multi-chain app, import the generic functionality from `@nosana/wallet-standard-vue`:

```vue
<script setup lang="ts">
import { WalletProvider, useWallet, WalletButton, useWallets } from '@nosana/wallet-standard-vue';
import { useSignAndSendTransaction } from '@nosana/solana-vue';
</script>
```

## API

### Re-exported from `@nosana/wallet-standard-vue`

Essential generic functionality needed for Solana apps:

- `WalletProvider` - Provider component (required)
- `useWallet()` - Wallet connection state management (generic, works for any chain)
- `WALLET_CONTEXT_KEY` - Context key for advanced usage

**Note:** For generic components (`WalletButton`, `WalletModal`, `useWallets`), import directly from `@nosana/wallet-standard-vue` if you need them. For Solana apps, use the Solana-specific versions below.

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
