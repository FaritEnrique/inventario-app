import { describe, expect, it, vi } from "vitest";
import {
  BIEN_INVENTARIO_NOVEDAD_TIPOS,
  buildBienInventarioNovedadPayload,
  getBienInventarioAccionesDisponibles,
} from "./bienInventarioNovedades";

describe("bienInventarioNovedades", () => {
  it("solo permite transferencia directa para unidades disponibles", () => {
    expect(
      getBienInventarioAccionesDisponibles({
        estado: "DISPONIBLE",
        puedeOperar: true,
      }),
    ).toEqual([BIEN_INVENTARIO_NOVEDAD_TIPOS.TRANSFERENCIA]);

    expect(
      getBienInventarioAccionesDisponibles({
        estado: "ENTREGADO",
        puedeOperar: true,
      }),
    ).toEqual([]);
    expect(
      getBienInventarioAccionesDisponibles({
        estado: "PRESTADO",
        puedeOperar: true,
      }),
    ).toEqual([]);
  });

  it("construye una transferencia con almacén y sustento formal", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T15:00:00.000Z"));

    const payload = buildBienInventarioNovedadPayload("TRANSFERENCIA", {
      almacenDestinoId: "3",
      fechaEvento: "2026-07-10T09:30",
      motivo: "Traslado autorizado",
      referenciaTipo: "ACTA",
      referenciaCodigo: "ACTA-021-2026",
      observaciones: "Equipo completo",
    });

    expect(payload).toMatchObject({
      almacenDestinoId: 3,
      motivo: "Traslado autorizado",
      referenciaTipo: "ACTA",
      referenciaCodigo: "ACTA-021-2026",
      observaciones: "Equipo completo",
    });
    vi.useRealTimers();
  });

  it("rechaza devoluciones o bajas directas desde la ficha del bien", () => {
    expect(() =>
      buildBienInventarioNovedadPayload("DEVOLUCION", {}),
    ).toThrow("única operación directa");
    expect(() => buildBienInventarioNovedadPayload("BAJA", {})).toThrow(
      "única operación directa",
    );
  });

  it("rechaza fechas futuras", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T10:00:00.000Z"));

    expect(() =>
      buildBienInventarioNovedadPayload("TRANSFERENCIA", {
        almacenDestinoId: 2,
        fechaEvento: "2026-07-10T12:00",
        motivo: "Traslado autorizado",
        referenciaTipo: "MEMORANDO",
        referenciaCodigo: "MEM-001-2026",
      }),
    ).toThrow("no puede estar en el futuro");

    vi.useRealTimers();
  });
});
