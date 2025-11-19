<template>
  <WalletModal
    :model-value="modelValue"
    :wallets="solanaWallets"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { WalletModal } from '@laurensv/wallet-standard-vue';
import { useSolanaWallets } from '../composables/useSolanaWallets';

interface Props {
  modelValue: boolean;
}

interface Emits {
  'update:modelValue': [value: boolean];
}

defineProps<Props>();
defineEmits<Emits>();

const { wallets: solanaWallets } = useSolanaWallets();
</script>
