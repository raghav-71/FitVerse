/**
 * FitVerse AI - Mock Client
 * Simulates network latency for asynchronous data fetching.
 */

export const simulateDelay = (ms: number = 300): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export async function mockFetch<T>(data: T, delayMs: number = 300): Promise<T> {
  await simulateDelay(delayMs);
  return JSON.parse(JSON.stringify(data));
}
