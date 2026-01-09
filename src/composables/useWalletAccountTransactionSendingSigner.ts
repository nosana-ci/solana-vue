import { computed, type Ref } from 'vue';
import type { TransactionSendingSigner, SignatureBytes } from '@solana/kit';
import { address } from '@solana/kit';
import { getTransactionEncoder } from '@solana/kit';
import type { SolanaSignAndSendTransactionFeature } from '@solana/wallet-standard-features';
import { SolanaSignAndSendTransaction } from '@solana/wallet-standard-features';
import { SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED, SolanaError } from '@solana/kit';
import { getWalletAccountFeature } from '@wallet-standard/ui-features';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from '@wallet-standard/ui-registry';
import type { UiWalletAccount } from '@wallet-standard/ui-core';

import { OnlySolanaChains } from './chain';

/**
 * Creates a TransactionSendingSigner from a wallet account that can be used with
 * `setTransactionMessageFeePayerSigner` and `signAndSendTransactionMessageWithSigners`
 * from `@solana/kit`.
 *
 * This signer will sign and send transactions to the network using the wallet's
 * `solana:signAndSendTransaction` feature.
 *
 * @param account - The UI wallet account to create a signer for (can be a ref or direct value)
 * @param chain - The chain identifier (e.g., 'solana:mainnet', 'solana:devnet')
 * @returns A TransactionSendingSigner object or null if account is not available
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useWalletAccountTransactionSendingSigner } from '@nosana/solana-vue';
 * import { useWallet } from '@nosana/solana-vue';
 * import {
 *   pipe,
 *   createTransactionMessage,
 *   setTransactionMessageFeePayerSigner,
 *   signAndSendTransactionMessageWithSigners,
 * } from '@solana/kit';
 *
 * const { account } = useWallet();
 * const signer = useWalletAccountTransactionSendingSigner(account, 'solana:devnet');
 *
 * const sendTransaction = async () => {
 *   if (!signer.value) return;
 *
 *   const message = pipe(
 *     createTransactionMessage({ version: 0 }),
 *     (m) => setTransactionMessageFeePayerSigner(signer.value!, m),
 *     // ... rest of transaction building
 *   );
 *
 *   const signature = await signAndSendTransactionMessageWithSigners(message);
 * };
 * </script>
 * ```
 */
export function useWalletAccountTransactionSendingSigner<TWalletAccount extends UiWalletAccount>(
  account: Ref<TWalletAccount | null> | TWalletAccount | null,
  chain: OnlySolanaChains<TWalletAccount['chains']> | `solana:${string}` = 'solana:devnet'
): Ref<TransactionSendingSigner | null> {
  // Normalize account to a ref
  const accountRef: Ref<TWalletAccount | null> =
    typeof account === 'object' && account !== null && 'value' in account
      ? (account as Ref<TWalletAccount | null>)
      : computed(() => account as TWalletAccount | null);

  // Store encoder ref (similar to React implementation)
  // Using a plain object since we're outside the computed
  const encoderRef = { current: null as ReturnType<typeof getTransactionEncoder> | null };

  return computed(() => {
    const uiAccount = accountRef.value;
    if (!uiAccount) {
      return null;
    }

    const chainId = chain;

    // Get the Solana sign and send transaction feature
    const signAndSendTransactionFeature = getWalletAccountFeature(
      uiAccount,
      SolanaSignAndSendTransaction
    ) as SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction];

    // Get the standard account
    const standardAccount =
      getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(uiAccount);

    const signerAddress = address(uiAccount.address);

    // Create a TransactionSendingSigner that implements the @solana/kit interface
    const signer: TransactionSendingSigner = {
      address: signerAddress,
      async signAndSendTransactions(transactions, config = {}) {
        const { abortSignal, ...options } = config;
        abortSignal?.throwIfAborted();

        const transactionEncoder = (encoderRef.current ||= getTransactionEncoder());

        if (transactions.length > 1) {
          throw new SolanaError(SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED);
        }

        if (transactions.length === 0) {
          return [];
        }

        const [transaction] = transactions;
        const wireTransactionBytes = transactionEncoder.encode(transaction);

        const inputsWithChainAndAccount = {
          account: standardAccount,
          chain: chainId as `${string}:${string}`,
          transaction: wireTransactionBytes as Uint8Array,
          ...(options.minContextSlot != null
            ? {
              options: {
                minContextSlot: Number(options.minContextSlot),
              },
            }
            : null),
        };

        const results =
          await signAndSendTransactionFeature.signAndSendTransaction(inputsWithChainAndAccount);
        const { signature } = results[0];

        return Object.freeze([signature as SignatureBytes]);
      },
    };

    return signer;
  });
}
