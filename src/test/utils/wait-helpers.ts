/**
 * Wait and timing utilities for tests
 */

/**
 * Wait for a condition to be true
 *
 * @example
 * await waitForCondition(
 *   () => someValue === expected,
 *   { timeout: 5000, interval: 100 }
 * );
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Wait for an async operation to complete
 * Useful for testing debounced functions or animations
 *
 * @example
 * await waitForAsync(300); // Wait 300ms
 */
export function waitForAsync(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for next tick
 * Useful for testing immediate async operations
 *
 * @example
 * await waitForNextTick();
 */
export function waitForNextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Flush all pending promises
 * Useful for ensuring all microtasks have completed
 */
export async function flushPromises(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
