import { describe, expect, it } from "vitest";
import {
  canAnularOrdenCompra,
  isCausalAnulacionOrdenCompraValida,
  validateMotivoAnulacionOrdenCompra,
} from "./ordenCompraAnulacionUi";

const orden = (overrides = {}) => ({
  activo: true,
  estadoAprobacion: "PENDIENTE_APROBACION",
  estadoRecepcion: "PENDIENTE_RECEPCION",
  resumen: {
    totalAceptado: 0,
    totalRechazado: 0,
  },
  items: [],
  ...overrides,
});

describe("ordenCompraAnulacionUi", () => {
  it("acepta causal valida", () => {
    expect(isCausalAnulacionOrdenCompraValida("ERROR_MATERIAL")).toBe(true);
  });

  it("rechaza causal invalida", () => {
    expect(isCausalAnulacionOrdenCompraValida("OBSERVADA")).toBe(false);
  });

  it("rechaza motivo vacio", () => {
    expect(validateMotivoAnulacionOrdenCompra("").valid).toBe(false);
  });

  it("rechaza motivo con solo espacios", () => {
    expect(validateMotivoAnulacionOrdenCompra("   ").valid).toBe(false);
  });

  it("bloquea estado APROBADA", () => {
    expect(canAnularOrdenCompra(orden({ estadoAprobacion: "APROBADA" }))).toBe(
      false,
    );
  });

  it("bloquea estado ANULADA", () => {
    expect(canAnularOrdenCompra(orden({ estadoAprobacion: "ANULADA" }))).toBe(
      false,
    );
  });

  it("permite estado PENDIENTE_APROBACION", () => {
    expect(canAnularOrdenCompra(orden())).toBe(true);
  });

  it("permite estado RECHAZADA", () => {
    expect(canAnularOrdenCompra(orden({ estadoAprobacion: "RECHAZADA" }))).toBe(
      true,
    );
  });

  it("permite estado BORRADOR", () => {
    expect(canAnularOrdenCompra(orden({ estadoAprobacion: "BORRADOR" }))).toBe(
      true,
    );
  });
});
