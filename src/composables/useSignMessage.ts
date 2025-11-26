import { computed, type Ref } from 'vue';
import type {
  SolanaSignMessageFeature,
  SolanaSignMessageInput,
  SolanaSignMessageOutput,
} from '@solana/wallet-standard-features';
import { SolanaSignMessage } from '@solana/wallet-standard-features';
import { getWalletAccountFeature } from '@wallet-standard/ui-features';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from '@wallet-standard/ui-registry';
import type { UiWalletAccount } from '@wallet-standard/ui-core';

type Input = Omit<SolanaSignMessageInput, 'account'>;
type Output = Omit<SolanaSignMessageOutput, 'signatureType'>;

/**
 * Use this to get a function capable of signing a message with the private key of a
 * {@link UiWalletAccount}
 *
 * @param uiWalletAccount The UI wallet account to sign with
 * @returns A function that signs a message
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useSignMessage } from '@nosana/solana-vue';
 * import { useWallet } from '@nosana/solana-vue';
 *
 * const { account } = useWallet();
 * const signMessage = useSignMessage(account);
 *
 * const handleSign = async () => {
 *   if (!account.value || !signMessage.value) return;
 *   try {
 *     const { signature } = await signMessage.value({
 *       message: messageBytes,
 *     });
 *     console.log('Signature:', signature);
 *   } catch (e) {
 *     console.error('Failed to sign message', e);
 *   }
 * };
 * </script>
 * ```
 */
export function useSignMessage<TWalletAccount extends UiWalletAccount>(
  uiWalletAccount: Ref<TWalletAccount | null> | TWalletAccount | null
): Ref<((input: Input) => Promise<Output>) | null> {
  // Normalize account to a ref
  const accountRef: Ref<TWalletAccount | null> =
    typeof uiWalletAccount === 'object' && uiWalletAccount !== null && 'value' in uiWalletAccount
      ? (uiWalletAccount as Ref<TWalletAccount | null>)
      : computed(() => uiWalletAccount as TWalletAccount | null);

  return computed(() => {
    const account = accountRef.value;
    if (!account) {
      return null;
    }

    const signMessageFeature = getWalletAccountFeature(
      account,
      SolanaSignMessage
    ) as SolanaSignMessageFeature[typeof SolanaSignMessage];

    const standardAccount =
      getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(account);

    return async (input: Input): Promise<Output> => {
      const inputWithAccount = {
        ...input,
        account: standardAccount,
      };

      const results = await signMessageFeature.signMessage(inputWithAccount);
      const result = results[0];

      // Solana signatures are always of type `ed25519` so drop this property
      const { signatureType: _, ...rest } = result;
      return rest;
    };
  });
}
