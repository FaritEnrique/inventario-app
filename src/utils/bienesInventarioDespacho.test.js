import { describe, expect, it } from "vitest";
import {
  buildAtencionItem,
  buildSeleccionInicialBienesDespacho,
  getMaximoSeleccionBienesDespacho,
  normalizarLineasBienesDespacho,
  toggleBienDespacho,
} from "./bienesInventarioDespacho";

describe("bienesInventarioDespacho", () => {
  it("normaliza las unidades disponibles por detalle", () => {
    const result = normalizarLineasBienesDespacho({
      lineas: [
        {
          pedidoInternoDetalleId: 10,
          cantidadPendiente: 2,
          stockDisponibleActual: 1,
          cantidadReservadaVigente: 1,
          capacidadAtencionActual: 2,
          totalBienesDisponibles: 3,
          bienesDisponibles: [{ id: 1 }, { id: 2 }, { id: 3 }],
        },
      ],
    });

    expect(result[10]).toEqual(
      expect.objectContaining({
        stockDisponibleActual: 1,
        cantidadReservadaVigente: 1,
        capacidadAtencionActual: 2,
        totalBienesDisponibles: 3,
      }),
    );
    expect(result[10].bienesDisponibles).toHaveLength(3);
  });

  it("limita la selección a la capacidad actual, no solo al saldo pedido", () => {
    expect(
      getMaximoSeleccionBienesDespacho({
        linea: {
          capacidadAtencionActual: 2,
          bienesDisponibles: [{ id: 1 }, { id: 2 }, { id: 3 }],
        },
        cantidadPendiente: 5,
      }),
    ).toBe(2);
  });

  it("no preselecciona series aunque exista reserva vigente", () => {
    expect(
      buildSeleccionInicialBienesDespacho({
        10: {
          cantidadPendiente: 2,
          cantidadReservadaVigente: 2,
          bienesDisponibles: [{ id: 1 }, { id: 2 }],
        },
      }),
    ).toEqual({ 10: [] });
  });

  it("no permite exceder el saldo pendiente", () => {
    expect(
      toggleBienDespacho({ seleccion: [1], bienId: 2, maximo: 1 }),
    ).toEqual([1]);
  });

  it("calcula la cantidad individual desde las unidades elegidas por almacen", () => {
    expect(
      buildAtencionItem({
        detalle: {
          id: 10,
          cantidadPendiente: 3,
          producto: {
            nombre: "Televisor",
            tipoControlInventario: "INDIVIDUAL",
          },
        },
        cantidad: 99,
        bienInventarioIds: [4, 5],
      }),
    ).toEqual({
      pedidoInternoDetalleId: 10,
      cantidadEntregada: 2,
      bienInventarioIds: [4, 5],
    });
  });

  it("mantiene el ingreso numérico para productos por cantidad", () => {
    expect(
      buildAtencionItem({
        detalle: {
          id: 20,
          cantidadPendiente: 5,
          producto: { nombre: "Papel", tipoControlInventario: "CANTIDAD" },
        },
        cantidad: 2.5,
        bienInventarioIds: [],
      }),
    ).toEqual({
      pedidoInternoDetalleId: 20,
      cantidadEntregada: 2.5,
    });
  });
});
