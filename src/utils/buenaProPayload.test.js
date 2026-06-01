import { describe, expect, it } from "vitest";
import {
  buildBuenaProPayload,
  canSelectOferta,
  validateBuenaProDraft,
} from "./buenaProPayload";

const cotizadoCompleto = {
  estadoRespuesta: "COTIZADO",
  itemRequerimientoId: 10,
  proveedorId: 5,
  cotizacionId: 7,
  itemCotizacionId: 11,
  cantidadOfrecida: 2,
  precioUnidad: 100,
  precioTotal: 200,
  descripcionTecnicaOfertada: "Laptop ofertada",
};

describe("buenaProPayload", () => {
  it("canSelectOferta true para COTIZADO con IDs completos", () => {
    expect(canSelectOferta(cotizadoCompleto)).toBe(true);
  });

  it("canSelectOferta false para NO_COTIZA", () => {
    expect(canSelectOferta({ ...cotizadoCompleto, estadoRespuesta: "NO_COTIZA" })).toBe(false);
  });

  it("canSelectOferta false si falta itemCotizacionId", () => {
    expect(canSelectOferta({ ...cotizadoCompleto, itemCotizacionId: null })).toBe(false);
  });

  it("build payload genera detalles correctos sin campos visuales", () => {
    const payload = buildBuenaProPayload({
      sustento: "Mejor condicion economica y tecnica.",
      selectedByItem: { 10: cotizadoCompleto },
      justificaciones: { 10: "Cumple tecnicamente." },
    });

    expect(payload).toEqual({
      sustento: "Mejor condicion economica y tecnica.",
      detalles: [
        {
          itemRequerimientoId: 10,
          proveedorId: 5,
          cotizacionId: 7,
          itemCotizacionId: 11,
          cantidadAdjudicada: 2,
          precioUnidad: 100,
          precioTotal: 200,
          justificacion: "Cumple tecnicamente.",
        },
      ],
    });
    expect(payload.detalles[0]).not.toHaveProperty("descripcionTecnicaOfertada");
  });

  it("validate falla sin sustento", () => {
    const result = validateBuenaProDraft({
      selectedByItem: { 10: cotizadoCompleto },
      sustento: "",
      justificaciones: { 10: "Cumple." },
    });

    expect(result.valid).toBe(false);
  });

  it("validate falla sin detalles", () => {
    const result = validateBuenaProDraft({
      selectedByItem: {},
      sustento: "Sustento valido.",
    });

    expect(result.valid).toBe(false);
  });

  it("validate falla con item duplicado", () => {
    const result = validateBuenaProDraft({
      selectedByItem: {
        10: cotizadoCompleto,
        11: { ...cotizadoCompleto },
      },
      sustento: "Sustento valido.",
      justificaciones: { 10: "Uno", 11: "Dos" },
    });

    expect(result.valid).toBe(false);
  });

  it("validate falla con cantidad adjudicada cero", () => {
    const result = validateBuenaProDraft({
      selectedByItem: {
        10: { ...cotizadoCompleto, cantidadOfrecida: 0 },
      },
      sustento: "Sustento valido.",
      justificaciones: { 10: "Cumple." },
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("cantidad adjudicada");
  });

  it("validate falla con precio unitario negativo", () => {
    const result = validateBuenaProDraft({
      selectedByItem: {
        10: { ...cotizadoCompleto, precioUnidad: -1 },
      },
      sustento: "Sustento valido.",
      justificaciones: { 10: "Cumple." },
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("precio unitario");
  });

  it("validate falla con precio total negativo", () => {
    const result = validateBuenaProDraft({
      selectedByItem: {
        10: { ...cotizadoCompleto, precioTotal: -1 },
      },
      sustento: "Sustento valido.",
      justificaciones: { 10: "Cumple." },
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("precio total");
  });

  it("conserva justificacion por detalle", () => {
    const payload = buildBuenaProPayload({
      sustento: "Sustento valido.",
      selectedByItem: { 10: cotizadoCompleto },
      justificaciones: { 10: "Justificacion especifica." },
    });

    expect(payload.detalles[0].justificacion).toBe("Justificacion especifica.");
  });
});
