import { ref, computed, type Ref } from 'vue';
import type { SolanaSignTransactionFeature } from '@solana/wallet-standard-features';
import { SolanaSignTransaction } from '@solana/wallet-standard-features';
import { getWalletAccountFeature } from '@wallet-standard/ui-features';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED } from '@wallet-standard/ui-registry';
import { useWallet } from '@laurensv/wallet-standard-vue';

/**
 * Base64-encoded wire transaction format
 */
export type Base64EncodedWireTransaction = string;

export interface SignTransactionOptions {
  /**
   * The chain identifier (e.g., 'solana:mainnet', 'solana:devnet', 'solana:testnet')
   * @default 'solana:devnet'
   */
  chain?: string;
}

export interface UseSolanaTransactionReturn {
  /**
   * Whether a transaction is currently being signed
   */
  signing: Ref<boolean>;
  /**
   * Sign a transaction using the connected wallet.
   * @param transaction - Base64-encoded wire transaction
   * @param options - Optional signing options
   * @returns Base64-encoded signed transaction
   */
  signTransaction: (
    transaction: Base64EncodedWireTransaction,
    options?: SignTransactionOptions
  ) => Promise<Base64EncodedWireTransaction>;
}

/**
 * Composable for signing Solana transactions using the connected wallet.
 * Must be used within a WalletProvider.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useSolanaTransaction } from '@laurensv/solana-vue';
 * import { compileTransaction, getBase64EncodedWireTransaction } from '@solana/kit';
 *
 * const { signing, signTransaction } = useSolanaTransaction();
 *
 * const handleSign = async () => {
 *   const compiledTx = compileTransaction(transactionMessage);
 *   const wireTx = getBase64EncodedWireTransaction(compiledTx);
 *   const signedTx = await signTransaction(wireTx, { chain: 'solana:mainnet' });
 *   // Send signedTx to RPC...
 * };
 * </script>
 * ```
 */
export function useSolanaTransaction(): UseSolanaTransactionReturn {
  const { account } = useWallet();
  const signing = ref<boolean>(false);

  const signTransaction = async (
    transaction: Base64EncodedWireTransaction,
    options?: SignTransactionOptions
  ): Promise<Base64EncodedWireTransaction> => {
    if (!account.value) {
      throw new Error('No wallet account connected');
    }

    try {
      signing.value = true;

      // Get the Solana signing feature from the UI wallet account
      const signFeature = getWalletAccountFeature(
        account.value,
        SolanaSignTransaction
      ) as SolanaSignTransactionFeature[typeof SolanaSignTransaction];

      // Get the standard account for the signTransaction call
      const standardAccount = getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(
        account.value
      );

      // Convert base64 transaction to Uint8Array
      const wireBytes = Uint8Array.from(atob(transaction), (c) => c.charCodeAt(0));

      // Sign the transaction
      const chain = (options?.chain || 'solana:devnet') as `${string}:${string}`;
      const signedTransactions = await signFeature.signTransaction({
        account: standardAccount,
        transaction: wireBytes,
        chain,
      });

      const signedBytes = signedTransactions[0]?.signedTransaction;
      if (!signedBytes) {
        throw new Error('No signed transaction returned');
      }

      // Convert signed transaction back to base64
      const base64String = btoa(String.fromCharCode(...signedBytes));
      return base64String as Base64EncodedWireTransaction;
    } finally {
      signing.value = false;
    }
  };

  return {
    signing: computed(() => signing.value) as UseSolanaTransactionReturn['signing'],
    signTransaction,
  };
}
