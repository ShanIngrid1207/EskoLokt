import { describe, it, expect } from "vitest";
import { xlmToStroops } from "./escrow";

describe("xlmToStroops", () => {
  it("converts whole XLM to stroops (7 decimals)", () => {
    expect(xlmToStroops("1")).toBe(10_000_000n);
    expect(xlmToStroops("25")).toBe(250_000_000n);
  });

  it("converts fractional XLM", () => {
    expect(xlmToStroops("0.50")).toBe(5_000_000n);
    expect(xlmToStroops("1.5")).toBe(15_000_000n);
  });

  it("handles full 7-decimal precision and truncates beyond it", () => {
    expect(xlmToStroops("0.1234567")).toBe(1_234_567n);
    expect(xlmToStroops("0.12345678")).toBe(1_234_567n); // 8th dp dropped
  });

  it("handles zero and whitespace", () => {
    expect(xlmToStroops("0")).toBe(0n);
    expect(xlmToStroops("  2.5  ")).toBe(25_000_000n);
  });
});
