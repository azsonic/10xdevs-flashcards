/**
 * Test utilities and helpers for unit tests
 */

/**
 * Create a delay for testing async operations
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate random test data
 */
export const generateTestData = {
  email: () => `test${Date.now()}@example.com`,
  username: () => `user${Date.now()}`,
  password: () => `Pass${Date.now()}!`,
  id: () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
};

/**
 * Create a mock event object
 */
export const createMockEvent = <T extends Event>(type: string, properties?: Partial<T>): T => {
  const event = new Event(type) as T;
  if (properties) {
    Object.assign(event, properties);
  }
  return event;
};

/**
 * Wait for a condition to be true
 */
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await delay(interval);
  }

  throw new Error("Timeout waiting for condition");
};
