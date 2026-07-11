import { describe, expect, it, vi } from "vitest";
import {
  BIEN_INVENTARIO_NOVEDAD_TIPOS,
  buildBienInventarioNovedadPayload,
  formatDateTimeLocal,
  getBienInventarioAccionesDisponibles,
} from "./bienInventarioNovedades";

describe("bienInventarioNovedades", () => {
  it("solo permite devolver bienes entregados y transferir bienes disponibles", () => {
    expect(
      getBienInventarioAccionesDisponibles({
        estado: "ENTREGADO",
        puedeOperar: true,
        puedeDarBaja: false,
      }),
    ).toEqual([BIEN_INVENTARIO_NOVEDAD_TIPOS.DEVOLUCION]);

    expect(
      getBienInventarioAccionesDisponibles({
        estado: "DISPONIBLE",
        puedeOperar: true,
        puedeDarBaja: true,
      }),
    ).toEqual([
      BIEN_INVENTARIO_NOVEDAD_TIPOS.TRANSFERENCIA,
      BIEN_INVENTARIO_NOVEDAD_TIPOS.BAJA,
    ]);
  });

  it("bloquea acciones incompatibles para un bien dado de baja", () => {
    expect(
      getBienInventarioAccionesDisponibles({
        estado: "BAJA",
        puedeOperar: true,
        puedeDarBaja: true,
      }),
    ).toEqual([]);
  });

  it("construye una devolución con almacén y sustento formal", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T15:00:00.000Z"));

    const payload = buildBienInventarioNovedadPayload("DEVOLUCION", {
      almacenDestinoId: "3",
      fechaEvento: "2026-07-10T09:30",
      motivo: "Retorno del área usuaria",
      referenciaTipo: "ACTA",
      referenciaCodigo: "ACTA-021-2026",
      observaciones: "Equipo completo",
    });

    expect(payload).toMatchObject({
      almacenDestinoId: 3,
      motivo: "Retorno del área usuaria",
      referenciaTipo: "ACTA",
      referenciaCodigo: "ACTA-021-2026",
      observaciones: "Equipo completo",
    });
    expect(payload.fechaEvento).toBe(new Date("2026-07-10T09:30").toISOString());

    vi.useRealTimers();
  });

  it("exige causal en la baja", () => {
    expect(() =>
      buildBienInventarioNovedadPayload("BAJA", {
        fechaEvento: formatDateTimeLocal(new Date()),
        motivo: "Deterioro definitivo",
        referenciaTipo: "INFORME",
        referenciaCodigo: "INF-010-2026",
      }),
    ).toThrow("La causal de baja es obligatorio.");
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
