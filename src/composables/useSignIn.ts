import { computed, type Ref } from 'vue';
import type {
  SolanaSignInFeature,
  SolanaSignInInput,
  SolanaSignInOutput,
} from '@solana/wallet-standard-features';
import { SolanaSignIn } from '@solana/wallet-standard-features';
import { Address } from '@solana/kit';
import { getWalletAccountFeature, getWalletFeature } from '@wallet-standard/ui-features';
import {
  getOrCreateUiWalletAccountForStandardWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  getWalletForHandle_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
} from '@wallet-standard/ui-registry';
import type { UiWallet, UiWalletAccount, UiWalletHandle } from '@wallet-standard/ui-core';

type Input = SolanaSignInInput;
type Output = Omit<SolanaSignInOutput, 'account' | 'signatureType'> &
  Readonly<{
    account: UiWalletAccount;
  }>;

/**
 * Use the ['Sign In With Solana'](https://phantom.app/learn/developers/sign-in-with-solana) feature
 * of a {@link UiWallet} or {@link UiWalletAccount}.
 *
 * @param uiWalletHandle The UI wallet or UI wallet account to sign in with
 * @returns A function that you can call to sign in with the particular wallet and address specified
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useSignIn } from '@nosana/solana-vue';
 * import { useWallet } from '@nosana/solana-vue';
 *
 * const { wallet } = useWallet();
 * const signIn = useSignIn(wallet);
 *
 * const handleSignIn = async () => {
 *   if (!wallet.value || !signIn.value) return;
 *   try {
 *     const { account, signedMessage, signature } = await signIn.value({
 *       requestId: csrfToken,
 *     });
 *     console.log('Signed in with address:', account.address);
 *   } catch (e) {
 *     console.error('Failed to sign in', e);
 *   }
 * };
 * </script>
 * ```
 */
export function useSignIn(
  uiWalletAccount: Ref<UiWalletAccount | null> | UiWalletAccount | null
): Ref<((input?: Omit<Input, 'address'>) => Promise<Output>) | null>;
export function useSignIn(
  uiWallet: Ref<UiWallet | null> | UiWallet | null
): Ref<((input?: Input) => Promise<Output>) | null>;
export function useSignIn(
  uiWalletHandle: Ref<UiWalletHandle | null> | UiWalletHandle | null
): Ref<((input?: Input) => Promise<Output>) | null> {
  // Normalize handle to a ref
  const handleRef: Ref<UiWalletHandle | null> =
    typeof uiWalletHandle === 'object' && uiWalletHandle !== null && 'value' in uiWalletHandle
      ? (uiWalletHandle as Ref<UiWalletHandle | null>)
      : computed(() => uiWalletHandle as UiWalletHandle | null);

  return computed(() => {
    const handle = handleRef.value;
    if (!handle) {
      return null;
    }

    let signInFeature: SolanaSignInFeature[typeof SolanaSignIn];
    if ('address' in handle && typeof handle.address === 'string') {
      getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(handle as UiWalletAccount);
      signInFeature = getWalletAccountFeature(
        handle as UiWalletAccount,
        SolanaSignIn
      ) as SolanaSignInFeature[typeof SolanaSignIn];
    } else {
      signInFeature = getWalletFeature(
        handle,
        SolanaSignIn
      ) as SolanaSignInFeature[typeof SolanaSignIn];
    }

    const wallet = getWalletForHandle_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(handle);

    return async (input?: Input): Promise<Output> => {
      const inputWithAddress = {
        ...input,
        // Prioritize the `UiWalletAccount` address if it exists.
        ...('address' in handle ? { address: handle.address as Address } : null),
      };

      const results = await signInFeature.signIn(inputWithAddress);
      const result = results[0];

      // Solana signatures are always of type `ed25519` so drop this property
      const { account, signatureType: _, ...rest } = result;

      return {
        ...rest,
        account: getOrCreateUiWalletAccountForStandardWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(
          wallet,
          account
        ),
      };
    };
  });
}
