import { computed, type Ref } from 'vue';
import type {
  SolanaSignTransactionFeature,
  SolanaSignTransactionInput,
  SolanaSignTransactionOutput,
} from '@solana/wallet-standard-features';
import { SolanaSignTransaction } from '@solana/wallet-standard-features';
import {
  WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED,
  WalletStandardError,
} from '@wallet-standard/errors';
import { getWalletAccountFeature } from '@wallet-standard/ui-features';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from '@wallet-standard/ui-registry';
import type { UiWalletAccount } from '@wallet-standard/ui-core';

import { OnlySolanaChains } from './chain';

type Input = Readonly<
  Omit<SolanaSignTransactionInput, 'account' | 'chain' | 'options'> & {
    options?: Readonly<{
      minContextSlot?: bigint;
    }>;
  }
>;
type Output = SolanaSignTransactionOutput;

/**
 * Use this to get a function capable of signing a serialized transaction with the private key of a
 * {@link UiWalletAccount}
 *
 * @param uiWalletAccount The UI wallet account to sign with
 * @param chain The identifier of the chain the transaction is destined for. Wallets may use this to
 * simulate the transaction for the user.
 * @returns A function that signs a transaction
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useSignTransaction } from '@nosana/solana-vue';
 * import { useWallet } from '@nosana/solana-vue';
 *
 * const { account } = useWallet();
 * const signTransaction = useSignTransaction(account, 'solana:devnet');
 *
 * const handleSign = async () => {
 *   if (!account.value || !signTransaction.value) return;
 *   try {
 *     const { signedTransaction } = await signTransaction.value({
 *       transaction: transactionBytes,
 *     });
 *     console.log('Signed transaction:', signedTransaction);
 *   } catch (e) {
 *     console.error('Failed to sign transaction', e);
 *   }
 * };
 * </script>
 * ```
 */

export function useSignTransaction<TWalletAccount extends UiWalletAccount>(
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
          featureName: SolanaSignTransaction,
          supportedChains: [...account.chains],
          supportedFeatures: [...account.features],
        }
      );
    }

    const signTransactionFeature = getWalletAccountFeature(
      account,
      SolanaSignTransaction
    ) as SolanaSignTransactionFeature[typeof SolanaSignTransaction];

    const standardAccount =
      getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(account);

    return async (input: Input): Promise<Output> => {
      const { options, ...rest } = input;
      const minContextSlot = options?.minContextSlot;

      const inputWithAccountAndChain = {
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

      const results = await signTransactionFeature.signTransaction(inputWithAccountAndChain);
      return results[0];
    };
  });
}
