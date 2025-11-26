// Mock module for @solana/promises
// eslint-disable-next-line no-undef
export const getAbortablePromise = <T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> => {
  signal?.throwIfAborted();
  return promise;
};
