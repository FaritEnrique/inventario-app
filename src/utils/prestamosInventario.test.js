import { describe, expect, it } from "vitest";
import {
  buildDevolucionDraft,
  buildLimaNoonIso,
  getLimaDateInput,
  getModalidadSalidaLabel,
  normalizeDevolucionItems,
  validateDevolucionDraft,
} from "./prestamosInventario";

describe("prestamosInventario", () => {
  it("normaliza fechas según el calendario de Lima", () => {
    expect(getLimaDateInput(new Date("2026-07-12T03:00:00.000Z"))).toBe(
      "2026-07-11",
    );
    expect(buildLimaNoonIso("2026-07-12")).toBe(
      "2026-07-12T17:00:00.000Z",
    );
  });

  it("identifica la modalidad temporal", () => {
    expect(getModalidadSalidaLabel("TEMPORAL")).toBe("Préstamo temporal");
  });

  it("construye un borrador solo con líneas pendientes", () => {
    const draft = buildDevolucionDraft({
      lineas: [
        {
          notaSalidaDetalleId: 1,
          cantidadPendienteDevolucion: 3,
          producto: { nombre: "Silla" },
          bienesPendientes: [],
        },
        {
          notaSalidaDetalleId: 2,
          cantidadPendienteDevolucion: 0,
          producto: { nombre: "Mesa" },
        },
      ],
    });

    expect(draft).toHaveLength(1);
    expect(draft[0]).toEqual(
      expect.objectContaining({ notaSalidaDetalleId: 1, cantidadPendiente: 3 }),
    );
  });

  it("calcula la cantidad individual desde las series seleccionadas", () => {
    const items = normalizeDevolucionItems([
      {
        notaSalidaDetalleId: 1,
        cantidadPendiente: 2,
        bienesPendientes: [{ id: 11 }, { id: 12 }],
        bienInventarioIds: [11, 12],
      },
    ]);

    expect(items[0]).toEqual(
      expect.objectContaining({
        cantidadDevuelta: 2,
        bienInventarioIds: [11, 12],
      }),
    );
  });

  it("mantiene como individual una línea sin series pendientes cargadas", () => {
    const items = normalizeDevolucionItems([
      {
        notaSalidaDetalleId: 3,
        producto: { tipoControlInventario: "INDIVIDUAL" },
        cantidadPendiente: 1,
        bienesPendientes: [],
        bienInventarioIds: [],
        cantidadDevuelta: 1,
      },
    ]);

    expect(items).toEqual([]);
  });

  it("rechaza una cantidad mayor al saldo de devolución", () => {
    expect(
      validateDevolucionDraft([
        {
          notaSalidaDetalleId: 1,
          producto: { nombre: "Silla" },
          cantidadPendiente: 3,
          cantidadDevuelta: 4,
          bienesPendientes: [],
        },
      ]),
    ).toContain("supera el saldo");
  });
});

it("normaliza una regularización parcial sin confundirla con devolución", async () => {
  const {
    buildRegularizacionDraft,
    normalizeRegularizacionItems,
    validateRegularizacionDraft,
  } = await import("./prestamosInventario");
  const draft = buildRegularizacionDraft({
    lineas: [
      {
        notaSalidaDetalleId: 31,
        producto: { id: 10, nombre: "Martillo", tipoControlInventario: "CANTIDAD" },
        cantidadEntregada: 10,
        cantidadDevuelta: 5,
        cantidadRegularizada: 0,
        cantidadPendienteDevolucion: 5,
      },
    ],
  });
  draft[0].cantidadRegularizada = "5";

  expect(validateRegularizacionDraft(draft)).toBeNull();
  expect(normalizeRegularizacionItems(draft)).toEqual([
    {
      notaSalidaDetalleId: 31,
      cantidadRegularizada: 5,
      bienInventarioIds: [],
      observaciones: undefined,
    },
  ]);
});
