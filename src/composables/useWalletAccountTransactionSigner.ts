import { computed, type Ref } from 'vue';
import type { ReadonlyUint8Array } from '@solana/kit';
import { address } from '@solana/kit';
import { SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED, SolanaError } from '@solana/kit';
import { getAbortablePromise } from '@solana/promises';
import type { TransactionModifyingSigner } from '@solana/kit';
import { getCompiledTransactionMessageDecoder } from '@solana/kit';
import {
  assertIsTransactionWithinSizeLimit,
  getTransactionCodec,
  getTransactionLifetimeConstraintFromCompiledTransactionMessage,
  type Transaction,
  type TransactionWithinSizeLimit,
  type TransactionWithLifetime,
} from '@solana/kit';
import type { UiWalletAccount } from '@wallet-standard/ui-core';

import { OnlySolanaChains } from './chain';
import { useSignTransaction } from './useSignTransaction';

/**
 * Use this to get a {@link TransactionSigner} capable of signing serialized transactions with the
 * private key of a {@link UiWalletAccount}
 *
 * @param uiWalletAccount The UI wallet account to sign with
 * @param chain The chain identifier (e.g., 'solana:mainnet', 'solana:devnet')
 * @returns A {@link TransactionModifyingSigner}. This is a conservative assumption based on the
 * fact that your application can not control whether or not the wallet will modify the transaction
 * before signing it (eg. to add guard instructions, or a priority fee budget). Otherwise this
 * method could more specifically return a {@link TransactionSigner} or a
 * {@link TransactionPartialSigner}.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useWalletAccountTransactionSigner } from '@laurensv/solana-vue';
 * import { useWallet } from '@laurensv/solana-vue';
 *
 * const { account } = useWallet();
 * const transactionSigner = useWalletAccountTransactionSigner(account, 'solana:devnet');
 *
 * const handleSign = async () => {
 *   if (!account.value || !transactionSigner.value) return;
 *   try {
 *     const [{ signatures }] = await transactionSigner.value.modifyAndSignTransactions([transaction]);
 *     const signatureBytes = signatures[transactionSigner.value.address];
 *     console.log('Signature bytes:', signatureBytes);
 *   } catch (e) {
 *     console.error('Failed to sign transaction', e);
 *   }
 * };
 * </script>
 * ```
 */

export function useWalletAccountTransactionSigner<TWalletAccount extends UiWalletAccount>(
  uiWalletAccount: Ref<TWalletAccount | null> | TWalletAccount | null,
  chain: OnlySolanaChains<TWalletAccount['chains']> | `solana:${string}`
): Ref<TransactionModifyingSigner<TWalletAccount['address']> | null> {
  // Normalize account to a ref
  const accountRef: Ref<TWalletAccount | null> =
    typeof uiWalletAccount === 'object' && uiWalletAccount !== null && 'value' in uiWalletAccount
      ? (uiWalletAccount as Ref<TWalletAccount | null>)
      : computed(() => uiWalletAccount as TWalletAccount | null);

  // Store encoder ref (similar to React implementation)
  const encoderRef = { current: null as ReturnType<typeof getTransactionCodec> | null };

  const signTransaction = useSignTransaction(accountRef, chain as `solana:${string}`);

  return computed(() => {
    const account = accountRef.value;
    if (!account || !signTransaction.value) {
      return null;
    }

    return {
      address: address(account.address),
      async modifyAndSignTransactions(transactions, config = {}) {
        const { abortSignal, ...options } = config;
        abortSignal?.throwIfAborted();

        const transactionCodec = (encoderRef.current ||= getTransactionCodec());

        if (transactions.length > 1) {
          throw new SolanaError(SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED);
        }

        if (transactions.length === 0) {
          return transactions as readonly (Transaction &
            TransactionWithinSizeLimit &
            TransactionWithLifetime)[];
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

        const decodedSignedTransaction = transactionCodec.decode(
          signedTransaction
        ) as (typeof transactions)[number];

        assertIsTransactionWithinSizeLimit(decodedSignedTransaction);

        const existingLifetime =
          'lifetimeConstraint' in transaction
            ? (transaction as TransactionWithLifetime).lifetimeConstraint
            : undefined;

        if (existingLifetime) {
          if (uint8ArraysEqual(decodedSignedTransaction.messageBytes, transaction.messageBytes)) {
            // If the transaction has identical bytes, the lifetime won't have changed
            return Object.freeze([
              {
                ...decodedSignedTransaction,
                lifetimeConstraint: existingLifetime,
              },
            ]);
          }

          // If the transaction has changed, check the lifetime constraint field
          const compiledTransactionMessage = getCompiledTransactionMessageDecoder().decode(
            decodedSignedTransaction.messageBytes
          );
          const currentToken =
            'blockhash' in existingLifetime ? existingLifetime.blockhash : existingLifetime.nonce;

          if (compiledTransactionMessage.lifetimeToken === currentToken) {
            return Object.freeze([
              {
                ...decodedSignedTransaction,
                lifetimeConstraint: existingLifetime,
              },
            ]);
          }
        }

        // If we get here then there is no existing lifetime, or the lifetime has changed. We need to attach a new lifetime
        const compiledTransactionMessage = getCompiledTransactionMessageDecoder().decode(
          decodedSignedTransaction.messageBytes
        );
        const lifetimeConstraint =
          await getTransactionLifetimeConstraintFromCompiledTransactionMessage(
            compiledTransactionMessage
          );

        return Object.freeze([
          {
            ...decodedSignedTransaction,
            lifetimeConstraint,
          },
        ]);
      },
    };
  });
}

function uint8ArraysEqual(arr1: ReadonlyUint8Array, arr2: ReadonlyUint8Array): boolean {
  return arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
}
