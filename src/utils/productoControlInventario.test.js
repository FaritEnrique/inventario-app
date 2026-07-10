import { describe, expect, it } from "vitest";
import {
  getControlInventarioLabel,
  getControlInventarioRequisitosLabel,
  normalizarControlInventarioProducto,
  TIPOS_CONTROL_INVENTARIO,
  validarControlInventarioProducto,
} from "./productoControlInventario";

describe("productoControlInventario", () => {
  it("usa control por cantidad como configuración predeterminada", () => {
    expect(normalizarControlInventarioProducto({})).toEqual({
      tipoControlInventario: TIPOS_CONTROL_INVENTARIO.CANTIDAD,
      requiereNumeroSerie: false,
      requiereCodigoPatrimonial: false,
    });
  });

  it("conserva los requisitos configurados para control individual", () => {
    expect(
      normalizarControlInventarioProducto({
        tipoControlInventario: "individual",
        requiereNumeroSerie: true,
        requiereCodigoPatrimonial: false,
      }),
    ).toEqual({
      tipoControlInventario: TIPOS_CONTROL_INVENTARIO.INDIVIDUAL,
      requiereNumeroSerie: true,
      requiereCodigoPatrimonial: false,
    });
  });

  it("limpia requisitos unitarios cuando el control es por cantidad", () => {
    expect(
      normalizarControlInventarioProducto({
        tipoControlInventario: "CANTIDAD",
        requiereNumeroSerie: true,
        requiereCodigoPatrimonial: true,
      }),
    ).toEqual({
      tipoControlInventario: TIPOS_CONTROL_INVENTARIO.CANTIDAD,
      requiereNumeroSerie: false,
      requiereCodigoPatrimonial: false,
    });
  });

  it("rechaza un control individual sin identificador requerido", () => {
    expect(
      validarControlInventarioProducto({
        tipoControlInventario: "INDIVIDUAL",
      }),
    ).toContain("número de serie");
  });

  it("genera etiquetas legibles para la tabla y el detalle", () => {
    const producto = {
      tipoControlInventario: "INDIVIDUAL",
      requiereNumeroSerie: true,
      requiereCodigoPatrimonial: true,
    };

    expect(getControlInventarioLabel(producto.tipoControlInventario)).toBe(
      "Individual",
    );
    expect(getControlInventarioRequisitosLabel(producto)).toBe(
      "Serie y código patrimonial",
    );
  });
});
