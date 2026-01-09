import { computed, type Ref } from 'vue';
import type { Address, SignatureBytes } from '@solana/kit';
import { address } from '@solana/kit';
import { SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED, SolanaError } from '@solana/kit';
import { getAbortablePromise } from '@solana/promises';
import type { MessageModifyingSigner, SignableMessage } from '@solana/kit';
import type { UiWalletAccount } from '@wallet-standard/ui-core';

import { useSignMessage } from './useSignMessage';

/**
 * Use this to get a {@link MessageModifyingSigner} capable of signing messages with the private key of a
 * {@link UiWalletAccount}
 *
 * @param uiWalletAccount The UI wallet account to sign with
 * @returns A {@link MessageModifyingSigner}. This is a conservative assumption based on the fact
 * that your application can not control whether or not the wallet will modify the message before
 * signing it. Otherwise this method could more specifically return a {@link MessageSigner} or a
 * {@link MessagePartialSigner}.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useWalletAccountMessageModifyingSigner } from '@nosana/solana-vue';
 * import { useWallet } from '@nosana/solana-vue';
 * import { createSignableMessage } from '@solana/kit';
 *
 * const { account } = useWallet();
 * const messageSigner = useWalletAccountMessageModifyingSigner(account);
 *
 * const handleSign = async () => {
 *   if (!account.value || !messageSigner.value) return;
 *   try {
 *     const signableMessage = createSignableMessage(text);
 *     const [signedMessage] = await messageSigner.value.modifyAndSignMessages([signableMessage]);
 *     const messageWasModified = signableMessage.content !== signedMessage.content;
 *     const signatureBytes = signedMessage.signatures[messageSigner.value.address];
 *     console.log('Signature bytes:', signatureBytes);
 *   } catch (e) {
 *     console.error('Failed to sign message', e);
 *   }
 * };
 * </script>
 * ```
 */
export function useWalletAccountMessageModifyingSigner<TWalletAccount extends UiWalletAccount>(
  uiWalletAccount: Ref<TWalletAccount | null> | TWalletAccount | null
): Ref<MessageModifyingSigner<TWalletAccount['address']> | null> {
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
      async modifyAndSignMessages(messages, config) {
        config?.abortSignal?.throwIfAborted();

        if (messages.length > 1) {
          throw new SolanaError(SOLANA_ERROR__SIGNER__WALLET_MULTISIGN_UNIMPLEMENTED);
        }

        if (messages.length === 0) {
          return messages;
        }

        const { content: originalMessage, signatures: originalSignatureMap } = messages[0];
        const input = {
          message: originalMessage,
        };

        const { signedMessage, signature } = await getAbortablePromise(
          signMessage.value!(input),
          config?.abortSignal
        );

        const messageWasModified =
          originalMessage.length !== signedMessage.length ||
          originalMessage.some((originalByte, ii) => originalByte !== signedMessage[ii]);

        const originalSignature = originalSignatureMap[account.address as Address<string>] as
          | SignatureBytes
          | undefined;

        const signatureIsNew = !originalSignature?.every(
          (originalByte, ii) => originalByte === signature[ii]
        );

        if (!signatureIsNew && !messageWasModified) {
          // We already had this exact signature, and the message wasn't modified.
          // Don't replace the existing message object.
          return messages;
        }

        const nextSignatureMap = messageWasModified
          ? { [account.address]: signature }
          : { ...originalSignatureMap, [account.address]: signature };

        const outputMessages = Object.freeze([
          Object.freeze({
            content: signedMessage,
            signatures: Object.freeze(nextSignatureMap),
          }) as SignableMessage,
        ]);

        return outputMessages;
      },
    };
  });
}

