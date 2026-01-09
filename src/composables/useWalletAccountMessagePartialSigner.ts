import { computed, type Ref } from 'vue';
import type { SignatureDictionary } from '@solana/kit';
import { address } from '@solana/kit';
import { SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED, SolanaError } from '@solana/kit';
import { getAbortablePromise } from '@solana/promises';
import type { MessagePartialSigner, SignableMessage } from '@solana/kit';
import type { UiWalletAccount } from '@wallet-standard/ui-core';

import { useSignMessage } from './useSignMessage';

/**
 * Use this to get a {@link MessagePartialSigner} capable of signing messages with the
 * private key of a {@link UiWalletAccount}.
 *
 * This signer returns signature dictionaries instead of modified messages, making it suitable
 * for partial signing scenarios (e.g., multi-sig) where you need to collect signatures from
 * multiple signers.
 *
 * Note: While this signer implements the {@link MessagePartialSigner} interface (which
 * typically assumes messages are not modified), wallets may still modify messages before
 * signing them. The returned signature will be for whatever message the wallet actually signed
 * (which may differ from the input message).
 *
 * @param uiWalletAccount The UI wallet account to sign with
 * @returns A {@link MessagePartialSigner} that returns signature dictionaries for each message.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useWalletAccountMessagePartialSigner } from '@nosana/solana-vue';
 * import { useWallet } from '@nosana/solana-vue';
 * import { createSignableMessage } from '@solana/kit';
 *
 * const { account } = useWallet();
 * const messageSigner = useWalletAccountMessagePartialSigner(account);
 *
 * const handleSign = async () => {
 *   if (!account.value || !messageSigner.value) return;
 *   try {
 *     const signableMessage = createSignableMessage(text);
 *     const [signatures] = await messageSigner.value.signMessages([signableMessage]);
 *     const signatureBytes = signatures[messageSigner.value.address];
 *     console.log('Signature bytes:', signatureBytes);
 *   } catch (e) {
 *     console.error('Failed to sign message', e);
 *   }
 * };
 * </script>
 * ```
 */

export function useWalletAccountMessagePartialSigner<TWalletAccount extends UiWalletAccount>(
  uiWalletAccount: Ref<TWalletAccount | null> | TWalletAccount | null
): Ref<MessagePartialSigner<TWalletAccount['address']> | null> {
  // Normalize account to a ref
  const accountRef: Ref<TWalletAccount | null> =
    typeof uiWalletAccount === 'object' && uiWalletAccount !== null && 'value' in uiWalletAccount
      ? (uiWalletAccount as Ref<TWalletAccount | null>)
      : computed(() => uiWalletAccount as TWalletAccount | null);

  const signMessage = useSignMessage(accountRef);

  return computed(() => {
    const account = accountRef.value;
    if (!account || !signMessage.value) {
      return null;
    }

    return {
      address: address(account.address),
      async signMessages(messages, config) {
        config?.abortSignal?.throwIfAborted();

        if (messages.length > 1) {
          throw new SolanaError(SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED);
        }

        if (messages.length === 0) {
          return [] as readonly SignatureDictionary[];
        }

        const [message] = messages;
        const input = {
          message: message.content,
        };

        const { signature } = await getAbortablePromise(
          signMessage.value!(input),
          config?.abortSignal
        );

        const signerAddress = address(account.address);

        // Return a signature dictionary for this signer
        const signatureDictionary: SignatureDictionary = {
          [signerAddress]: signature,
        } as SignatureDictionary;

        return Object.freeze([signatureDictionary]);
      },
    };
  });
}

