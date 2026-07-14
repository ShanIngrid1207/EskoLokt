import { describe, it, expect } from "vitest";
import { usdcToUnits } from "./escrow";

describe("usdcToUnits", () => {
  it("converts whole USDC to base units (7 decimals)", () => {
    expect(usdcToUnits("1")).toBe(10_000_000n);
    expect(usdcToUnits("25")).toBe(250_000_000n);
  });

  it("converts fractional USDC", () => {
    expect(usdcToUnits("0.50")).toBe(5_000_000n);
    expect(usdcToUnits("1.5")).toBe(15_000_000n);
  });

  it("handles full 7-decimal precision and truncates beyond it", () => {
    expect(usdcToUnits("0.1234567")).toBe(1_234_567n);
    expect(usdcToUnits("0.12345678")).toBe(1_234_567n); // 8th dp dropped
  });

  it("handles zero and whitespace", () => {
    expect(usdcToUnits("0")).toBe(0n);
    expect(usdcToUnits("  2.5  ")).toBe(25_000_000n);
  });
});
