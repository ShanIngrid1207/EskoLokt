import { describe, it, expect } from "vitest";
import { xlmToStroops, classifyError } from "./soroban";

describe("xlmToStroops", () => {
  it("converts whole XLM", () => expect(xlmToStroops("1")).toBe(10_000_000n));
  it("converts fractional XLM", () => expect(xlmToStroops("1.5")).toBe(15_000_000n));
  it("handles the smallest unit", () => expect(xlmToStroops("0.0000001")).toBe(1n));
  it("ignores surrounding spaces", () => expect(xlmToStroops(" 2 ")).toBe(20_000_000n));
});

describe("classifyError (the 3 required error types)", () => {
  it("detects user rejection", () =>
    expect(classifyError(new Error("User declined the request"))).toBe("rejected"));
  it("detects insufficient balance", () =>
    expect(classifyError(new Error("tx_insufficient_balance"))).toBe("insufficient"));
  it("detects no wallet", () =>
    expect(classifyError(new Error("Freighter is not installed"))).toBe("no-wallet"));
  it("falls back to unknown", () =>
    expect(classifyError(new Error("some rpc 500"))).toBe("unknown"));
  it("prefers insufficient over rejected when a message contains both", () =>
    expect(classifyError(new Error("transaction rejected: tx_insufficient_balance"))).toBe("insufficient"));
});
