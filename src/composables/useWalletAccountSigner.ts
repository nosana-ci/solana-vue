import { computed, type Ref } from 'vue';
import type { TransactionSendingSigner, MessageModifyingSigner, Address } from '@solana/kit';
import type { UiWalletAccount } from '@wallet-standard/ui-core';
import { useWalletAccountTransactionSendingSigner } from './useWalletAccountTransactionSendingSigner';
import { useWalletAccountMessageSigner } from './useWalletAccountMessageSigner';

/**
 * Creates a Wallet signer that combines both TransactionSendingSigner and MessageModifyingSigner.
 * This is the recommended type for Solana wallets as per @solana/kit best practices.
 *
 * A Wallet is defined as: `TransactionSendingSigner & MessageModifyingSigner`
 *
 * @param account - The UI wallet account to create a signer for (can be a ref or direct value)
 * @param chain - The chain identifier (e.g., 'solana:mainnet', 'solana:devnet') - can be a ref or direct value
 * @returns A Wallet object (TransactionSendingSigner & MessageModifyingSigner) or null if account is not available
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useWalletAccountSigner } from '@nosana/solana-vue';
 * import { useWallet } from '@nosana/solana-vue';
 * import type { Wallet } from '@solana/kit';
 *
 * const { account } = useWallet();
 * const wallet = useWalletAccountSigner(account, 'solana:devnet');
 *
 * // wallet.value is now a Wallet (TransactionSendingSigner & MessageModifyingSigner)
 * // You can use it for both transactions and messages
 * </script>
 * ```
 */
export function useWalletAccountSigner(
  account: Ref<UiWalletAccount | null> | UiWalletAccount | null,
  chain: Ref<string> | string = 'solana:devnet'
): Ref<(TransactionSendingSigner & MessageModifyingSigner<Address<string>>) | null> {
  const transactionSigner = useWalletAccountTransactionSendingSigner(account, chain);
  const messageSigner = useWalletAccountMessageSigner(account);

  return computed(() => {
    const txSigner = transactionSigner.value;
    const msgSigner = messageSigner.value;

    if (!txSigner || !msgSigner) {
      return null;
    }

    // Combine both signers into a Wallet type
    // Both signers share the same address, so we can safely combine them
    const wallet: TransactionSendingSigner & MessageModifyingSigner<Address<string>> = {
      ...txSigner,
      ...msgSigner,
      // Ensure address is consistent (both should have the same address)
      address: txSigner.address,
    };

    return wallet;
  });
}
