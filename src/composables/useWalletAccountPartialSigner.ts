import { computed, type Ref } from 'vue';
import type { TransactionPartialSigner, MessagePartialSigner, Address } from '@solana/kit';
import type { UiWalletAccount } from '@wallet-standard/ui-core';
import { useWalletAccountTransactionPartialSigner } from './useWalletAccountTransactionPartialSigner';
import { useWalletAccountMessagePartialSigner } from './useWalletAccountMessagePartialSigner';
import { OnlySolanaChains } from './chain';

/**
 * Creates a combined signer that provides both TransactionPartialSigner and MessagePartialSigner.
 * This is useful for partial signing scenarios (e.g., multi-sig) where you need to collect
 * signatures from multiple signers without modifying the transactions or messages.
 *
 * @param account - The UI wallet account to create a signer for (can be a ref or direct value)
 * @param chain - The chain identifier (e.g., 'solana:mainnet', 'solana:devnet') - can be a ref or direct value
 * @returns A combined signer (TransactionPartialSigner & MessagePartialSigner) or null if account is not available
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useWalletAccountPartialSigner } from '@nosana/solana-vue';
 * import { useWallet } from '@nosana/solana-vue';
 *
 * const { account } = useWallet();
 * const signer = useWalletAccountPartialSigner(account, 'solana:devnet');
 *
 * // signer.value can be used for both partial transaction and message signing
 * const [txSignatures] = await signer.value.signTransactions([transaction]);
 * const [msgSignatures] = await signer.value.signMessages([message]);
 * </script>
 * ```
 */
export function useWalletAccountPartialSigner<TWalletAccount extends UiWalletAccount>(
  account: Ref<TWalletAccount | null> | TWalletAccount | null,
  chain: OnlySolanaChains<TWalletAccount['chains']> | `solana:${string}` = 'solana:devnet'
): Ref<(TransactionPartialSigner<Address<string>> & MessagePartialSigner<Address<string>>) | null> {
  const transactionSigner = useWalletAccountTransactionPartialSigner(account, chain);
  const messageSigner = useWalletAccountMessagePartialSigner(account);

  return computed(() => {
    const txSigner = transactionSigner.value;
    const msgSigner = messageSigner.value;

    if (!txSigner || !msgSigner) {
      return null;
    }

    // Combine both signers
    // Both signers share the same address, so we can safely combine them
    const combinedSigner: TransactionPartialSigner<Address<string>> &
      MessagePartialSigner<Address<string>> = {
      ...txSigner,
      ...msgSigner,
      // Ensure address is consistent (both should have the same address)
      address: txSigner.address,
    };

    return combinedSigner;
  });
}
