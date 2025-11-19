<template>
  <WalletButton :wallets="solanaWallets" />
</template>

<script setup lang="ts">
import { WalletButton } from '@laurensv/wallet-standard-vue';
import { useSolanaWallets } from '../composables/useSolanaWallets';

const { wallets: solanaWallets } = useSolanaWallets();
</script>
