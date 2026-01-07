import { describe, it, expect } from "vitest";

/**
 * Example unit test
 * This file demonstrates the basic structure for Vitest unit tests
 */
describe("Example Test Suite", () => {
  it("should pass a basic assertion", () => {
    expect(true).toBe(true);
  });

  it("should perform arithmetic correctly", () => {
    const sum = 1 + 1;
    expect(sum).toBe(2);
  });
});
