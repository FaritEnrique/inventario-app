import { describe, expect, it } from "vitest";
import {
  buildTransferPayloadItems,
  getDisponibleProductoAlmacen,
  validateTransferDraft,
} from "./transferenciasInventario";

describe("transferenciasInventario", () => {
  const items = [
    {
      producto: { id: 10, nombre: "Martillo" },
      cantidadSolicitada: 4,
      stockDisponible: 5,
    },
  ];

  it("obtiene el disponible del producto en el almacén seleccionado", () => {
    expect(
      getDisponibleProductoAlmacen(
        [
          {
            producto: { id: 10 },
            almacenes: [{ id: 2, cantidadDisponible: 7 }],
          },
        ],
        10,
        2,
      ),
    ).toBe(7);
  });

  it("rechaza cantidades superiores al stock disponible", () => {
    expect(
      validateTransferDraft({
        almacenOrigenId: 1,
        almacenDestinoId: 2,
        motivo: "Reposición interna",
        items: [{ ...items[0], cantidadSolicitada: 6 }],
      }),
    ).toContain("supera el disponible");
  });

  it("no permite origen y destino iguales", () => {
    expect(
      validateTransferDraft({
        almacenOrigenId: 2,
        almacenDestinoId: 2,
        motivo: "Reposición interna",
        items,
      }),
    ).toContain("deben ser diferentes");
  });

  it("normaliza las líneas del payload", () => {
    expect(buildTransferPayloadItems(items)).toEqual([
      {
        productoId: 10,
        cantidadSolicitada: 4,
        observaciones: undefined,
      },
    ]);
  });
});
