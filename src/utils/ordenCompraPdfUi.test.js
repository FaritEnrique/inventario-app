import { describe, expect, it } from "vitest";
import { canViewOrdenCompraPdf } from "./ordenCompraPdfUi";

const orden = (overrides = {}) => ({
  activo: true,
  estadoAprobacion: "APROBADA",
  estadoRecepcion: "PENDIENTE_RECEPCION",
  fechaAnulacion: null,
  ...overrides,
});

describe("ordenCompraPdfUi", () => {
  it("permite PDF para O/C APROBADA activa", () => {
    expect(canViewOrdenCompraPdf(orden())).toBe(true);
  });

  it("bloquea PDF para O/C PENDIENTE_APROBACION", () => {
    expect(
      canViewOrdenCompraPdf(orden({ estadoAprobacion: "PENDIENTE_APROBACION" })),
    ).toBe(false);
  });

  it("bloquea PDF para O/C BORRADOR", () => {
    expect(canViewOrdenCompraPdf(orden({ estadoAprobacion: "BORRADOR" }))).toBe(
      false,
    );
  });

  it("bloquea PDF para O/C ANULADA", () => {
    expect(canViewOrdenCompraPdf(orden({ estadoAprobacion: "ANULADA" }))).toBe(
      false,
    );
  });

  it("bloquea PDF para O/C inactiva", () => {
    expect(canViewOrdenCompraPdf(orden({ activo: false }))).toBe(false);
  });

  it("bloquea PDF si existe fechaAnulacion", () => {
    expect(
      canViewOrdenCompraPdf(
        orden({ fechaAnulacion: "2026-06-01T10:00:00.000Z" }),
      ),
    ).toBe(false);
  });

  it("bloquea PDF si estadoRecepcion es CANCELADA", () => {
    expect(
      canViewOrdenCompraPdf(orden({ estadoRecepcion: "CANCELADA" })),
    ).toBe(false);
  });

  it("bloquea PDF para valores null o undefined", () => {
    expect(canViewOrdenCompraPdf(null)).toBe(false);
    expect(canViewOrdenCompraPdf(undefined)).toBe(false);
  });
});
