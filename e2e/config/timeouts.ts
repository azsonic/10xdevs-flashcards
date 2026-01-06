/**
 * Centralized timeout configuration for E2E tests
 * Use these constants instead of hardcoding timeout values
 */

export const TIMEOUTS = {
  /** Quick UI interactions (2 seconds) */
  SHORT: 2000,

  /** Form submissions, element appearance (5 seconds) */
  MEDIUM: 5000,

  /** Page navigation, data loading (10 seconds) */
  LONG: 10000,

  /** Authentication flows, slow operations (15 seconds) */
  EXTRA_LONG: 15000,
} as const;

/**
 * Retry configuration
 */
export const RETRY = {
  /** Number of retries for flaky operations */
  DEFAULT: 3,

  /** Delay between retries in milliseconds */
  DELAY: 1000,
} as const;
