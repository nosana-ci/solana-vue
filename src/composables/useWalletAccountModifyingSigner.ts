import { computed, type Ref } from 'vue';
import type { TransactionModifyingSigner, MessageModifyingSigner, Address } from '@solana/kit';
import type { UiWalletAccount } from '@wallet-standard/ui-core';
import { useWalletAccountTransactionModifyingSigner } from './useWalletAccountTransactionModifyingSigner';
import { useWalletAccountMessageModifyingSigner } from './useWalletAccountMessageModifyingSigner';
import { OnlySolanaChains } from './chain';

/**
 * Creates a combined signer that provides both TransactionModifyingSigner and MessageModifyingSigner.
 * This is useful when you need signers that can modify transactions and messages before signing them.
 *
 * @param account - The UI wallet account to create a signer for (can be a ref or direct value)
 * @param chain - The chain identifier (e.g., 'solana:mainnet', 'solana:devnet') - can be a ref or direct value
 * @returns A combined signer (TransactionModifyingSigner & MessageModifyingSigner) or null if account is not available
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useWalletAccountModifyingSigner } from '@nosana/solana-vue';
 * import { useWallet } from '@nosana/solana-vue';
 *
 * const { account } = useWallet();
 * const signer = useWalletAccountModifyingSigner(account, 'solana:devnet');
 *
 * // signer.value can be used for both modifying transaction and message signing
 * const [modifiedTx] = await signer.value.modifyAndSignTransactions([transaction]);
 * const [modifiedMsg] = await signer.value.modifyAndSignMessages([message]);
 * </script>
 * ```
 */
export function useWalletAccountModifyingSigner<TWalletAccount extends UiWalletAccount>(
  account: Ref<TWalletAccount | null> | TWalletAccount | null,
  chain: OnlySolanaChains<TWalletAccount['chains']> | `solana:${string}` = 'solana:devnet'
): Ref<
  (TransactionModifyingSigner<Address<string>> & MessageModifyingSigner<Address<string>>) | null
> {
  const transactionSigner = useWalletAccountTransactionModifyingSigner(account, chain);
  const messageSigner = useWalletAccountMessageModifyingSigner(account);

  return computed(() => {
    const txSigner = transactionSigner.value;
    const msgSigner = messageSigner.value;

    if (!txSigner || !msgSigner) {
      return null;
    }

    // Combine both signers
    // Both signers share the same address, so we can safely combine them
    const combinedSigner: TransactionModifyingSigner<Address<string>> &
      MessageModifyingSigner<Address<string>> = {
      ...txSigner,
      ...msgSigner,
      // Ensure address is consistent (both should have the same address)
      address: txSigner.address,
    };

    return combinedSigner;
  });
}
