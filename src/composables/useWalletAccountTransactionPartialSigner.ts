import { computed, type Ref } from 'vue';
import type { SignatureDictionary } from '@solana/kit';
import { address } from '@solana/kit';
import { SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED, SolanaError } from '@solana/kit';
import { getAbortablePromise } from '@solana/promises';
import type { TransactionPartialSigner } from '@solana/kit';
import { getTransactionCodec } from '@solana/kit';
import type { Transaction } from '@solana/kit';
import type { UiWalletAccount } from '@wallet-standard/ui-core';

import { OnlySolanaChains } from './chain';
import { useSignTransaction } from './useSignTransaction';

/**
 * Use this to get a {@link TransactionPartialSigner} capable of signing transactions with the
 * private key of a {@link UiWalletAccount}.
 *
 * This signer returns signature dictionaries instead of modified transactions, making it suitable
 * for partial signing scenarios (e.g., multi-sig) where you need to collect signatures from
 * multiple signers.
 *
 * Note: While this signer implements the {@link TransactionPartialSigner} interface (which
 * typically assumes transactions are not modified), wallets may still modify transactions before
 * signing them. The returned signature will be for whatever transaction the wallet actually signed
 * (which may differ from the input transaction).
 *
 * @param uiWalletAccount The UI wallet account to sign with
 * @param chain The chain identifier (e.g., 'solana:mainnet', 'solana:devnet')
 * @returns A {@link TransactionPartialSigner} that returns signature dictionaries for each transaction.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useWalletAccountTransactionPartialSigner } from '@nosana/solana-vue';
 * import { useWallet } from '@nosana/solana-vue';
 *
 * const { account } = useWallet();
 * const transactionSigner = useWalletAccountTransactionPartialSigner(account, 'solana:devnet');
 *
 * const handleSign = async () => {
 *   if (!account.value || !transactionSigner.value) return;
 *   try {
 *     const [signatures] = await transactionSigner.value.signTransactions([transaction]);
 *     const signatureBytes = signatures[transactionSigner.value.address];
 *     console.log('Signature bytes:', signatureBytes);
 *   } catch (e) {
 *     console.error('Failed to sign transaction', e);
 *   }
 * };
 * </script>
 * ```
 */

export function useWalletAccountTransactionPartialSigner<TWalletAccount extends UiWalletAccount>(
  uiWalletAccount: Ref<TWalletAccount | null> | TWalletAccount | null,
  chain: OnlySolanaChains<TWalletAccount['chains']> | `solana:${string}`
): Ref<TransactionPartialSigner<TWalletAccount['address']> | null> {
  // Normalize account to a ref
  const accountRef: Ref<TWalletAccount | null> =
    typeof uiWalletAccount === 'object' && uiWalletAccount !== null && 'value' in uiWalletAccount
      ? (uiWalletAccount as Ref<TWalletAccount | null>)
      : computed(() => uiWalletAccount as TWalletAccount | null);

  // Store encoder ref (similar to React implementation)
  const encoderRef = { current: null as ReturnType<typeof getTransactionCodec> | null };

  const signTransaction = useSignTransaction(accountRef, chain);

  return computed(() => {
    const account = accountRef.value;
    if (!account || !signTransaction.value) {
      return null;
    }

    return {
      address: address(account.address),
      async signTransactions(transactions, config = {}) {
        const { abortSignal, ...options } = config;
        abortSignal?.throwIfAborted();

        const transactionCodec = (encoderRef.current ||= getTransactionCodec());

        if (transactions.length > 1) {
          throw new SolanaError(SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED);
        }

        if (transactions.length === 0) {
          return [];
        }

        const [transaction] = transactions;
        const wireTransactionBytes = transactionCodec.encode(transaction);

        const inputWithOptions = {
          ...options,
          transaction: wireTransactionBytes as Uint8Array,
        };

        const { signedTransaction } = await getAbortablePromise(
          signTransaction.value!(inputWithOptions),
          abortSignal
        );

        const decodedSignedTransaction = transactionCodec.decode(signedTransaction) as Transaction;

        const signerAddress = address(account.address);

        // Extract the signature for this signer from the signed transaction
        // The transaction's signatures dictionary maps addresses to signature bytes
        const signature = decodedSignedTransaction.signatures[signerAddress];

        if (!signature) {
          throw new Error(
            `Signature not found for address ${account.address} in signed transaction`
          );
        }

        // Return a signature dictionary for this signer
        const signatureDictionary: SignatureDictionary = {
          [signerAddress]: signature,
        } as SignatureDictionary;

        return Object.freeze([signatureDictionary]);
      },
    };
  });
}
