import { computed, type Ref } from 'vue';
import type {
  SolanaSignAndSendTransactionFeature,
  SolanaSignAndSendTransactionInput,
  SolanaSignAndSendTransactionOutput,
} from '@solana/wallet-standard-features';
import { SolanaSignAndSendTransaction } from '@solana/wallet-standard-features';
import {
  WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED,
  WalletStandardError,
} from '@wallet-standard/errors';
import { getWalletAccountFeature } from '@wallet-standard/ui-features';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from '@wallet-standard/ui-registry';
import type { UiWalletAccount } from '@wallet-standard/ui-core';

import { OnlySolanaChains } from './chain';

type Input = Readonly<
  Omit<SolanaSignAndSendTransactionInput, 'account' | 'chain' | 'options'> & {
    options?: Readonly<{
      minContextSlot?: bigint;
    }>;
  }
>;
type Output = SolanaSignAndSendTransactionOutput;

/**
 * Use this to get a function capable of signing a serialized transaction with the private key of a
 * {@link UiWalletAccount} and sending it to the network for processing.
 *
 * @param uiWalletAccount The UI wallet account to sign with
 * @param chain The identifier of the chain the transaction is destined for. Wallets may use this to
 * simulate the transaction for the user.
 * @returns A function that signs and sends a transaction
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useSignAndSendTransaction } from '@nosana/solana-vue';
 * import { useWallet } from '@nosana/solana-vue';
 *
 * const { account } = useWallet();
 * const signAndSendTransaction = useSignAndSendTransaction(account, 'solana:devnet');
 *
 * const handleSend = async () => {
 *   if (!account.value || !signAndSendTransaction.value) return;
 *   try {
 *     const { signature } = await signAndSendTransaction.value({
 *       transaction: transactionBytes,
 *     });
 *     console.log('Transaction signature:', signature);
 *   } catch (e) {
 *     console.error('Failed to send transaction', e);
 *   }
 * };
 * </script>
 * ```
 */
export function useSignAndSendTransaction<TWalletAccount extends UiWalletAccount>(
  uiWalletAccount: Ref<TWalletAccount | null> | TWalletAccount | null,
  chain: OnlySolanaChains<TWalletAccount['chains']> | `solana:${string}`
): Ref<((input: Input) => Promise<Output>) | null> {
  // Normalize account to a ref
  const accountRef: Ref<TWalletAccount | null> =
    typeof uiWalletAccount === 'object' && uiWalletAccount !== null && 'value' in uiWalletAccount
      ? (uiWalletAccount as Ref<TWalletAccount | null>)
      : computed(() => uiWalletAccount as TWalletAccount | null);

  // Normalize chain to a ref
  const chainRef = typeof chain === 'string' ? computed(() => chain) : (chain as Ref<string>);

  return computed(() => {
    const account = accountRef.value;
    if (!account) {
      return null;
    }

    const chainId = (
      typeof chainRef === 'string' ? chainRef : chainRef.value
    ) as `solana:${string}`;

    if (!account.chains.includes(chainId)) {
      throw new WalletStandardError(
        WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED,
        {
          address: account.address,
          chain: chainId,
          featureName: SolanaSignAndSendTransaction,
          supportedChains: [...account.chains],
          supportedFeatures: [...account.features],
        }
      );
    }

    const signAndSendTransactionFeature = getWalletAccountFeature(
      account,
      SolanaSignAndSendTransaction
    ) as SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction];

    const standardAccount =
      getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(account);

    return async (input: Input): Promise<Output> => {
      const { options, ...rest } = input;
      const minContextSlot = options?.minContextSlot;

      const inputWithChainAndAccount = {
        ...rest,
        account: standardAccount,
        chain: chainId,
        ...(minContextSlot != null
          ? {
            options: {
              minContextSlot: Number(minContextSlot),
            },
          }
          : null),
      };

      const results =
        await signAndSendTransactionFeature.signAndSendTransaction(inputWithChainAndAccount);
      return results[0];
    };
  });
}
