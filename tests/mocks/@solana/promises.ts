// Mock module for @solana/promises
export const getAbortablePromise = <T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> => {
  signal?.throwIfAborted();
  return promise;
};
