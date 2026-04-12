import {
  PASSWORD_POLICY,
  isPasswordPolicyValid,
} from "./passwordPolicy";
import { describe, expect, it } from "vitest";

describe("isPasswordPolicyValid", () => {
  it("acepta una contraseña válida dentro del rango permitido", () => {
    expect(isPasswordPolicyValid("Clave123")).toBe(true);
  });

  it("rechaza contraseñas más cortas que el mínimo", () => {
    expect(isPasswordPolicyValid("Abc123")).toBe(false);
  });

  it("rechaza contraseñas sin letras o sin números", () => {
    expect(isPasswordPolicyValid("12345678")).toBe(false);
    expect(isPasswordPolicyValid("SoloLetras")).toBe(false);
  });

  it("rechaza contraseñas más largas que el máximo", () => {
    const password = `A1${"x".repeat(PASSWORD_POLICY.maxLength - 1)}`;

    expect(isPasswordPolicyValid(password)).toBe(false);
  });
});
