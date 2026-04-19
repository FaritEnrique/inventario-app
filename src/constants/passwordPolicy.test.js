import { describe, expect, it } from "vitest";
import {
  PASSWORD_POLICY,
  isPasswordPolicyValid,
} from "./passwordPolicy";

describe("isPasswordPolicyValid", () => {
  it("accepts a valid password within the allowed range", () => {
    expect(isPasswordPolicyValid("Clave123")).toBe(true);
  });

  it("rejects passwords shorter than the minimum", () => {
    expect(isPasswordPolicyValid("Abc123")).toBe(false);
  });

  it("rejects passwords without number, uppercase, or lowercase", () => {
    expect(isPasswordPolicyValid("12345678")).toBe(false);
    expect(isPasswordPolicyValid("SoloLetras")).toBe(false);
    expect(isPasswordPolicyValid("sololetras1")).toBe(false);
    expect(isPasswordPolicyValid("SOLOLETRAS1")).toBe(false);
  });

  it("rejects passwords longer than the maximum", () => {
    const password = `Aa1${"x".repeat(PASSWORD_POLICY.maxLength - 2)}`;

    expect(isPasswordPolicyValid(password)).toBe(false);
  });
});
