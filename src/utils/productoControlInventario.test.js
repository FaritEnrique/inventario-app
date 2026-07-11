import { describe, expect, it } from "vitest";
import {
  esProductoControlIndividual,
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

  it("fuerza el número de serie como identificador del control individual", () => {
    const producto = {
      tipoControlInventario: "INDIVIDUAL",
      requiereNumeroSerie: false,
      requiereCodigoPatrimonial: false,
    };

    expect(normalizarControlInventarioProducto(producto)).toEqual({
      tipoControlInventario: TIPOS_CONTROL_INVENTARIO.INDIVIDUAL,
      requiereNumeroSerie: true,
      requiereCodigoPatrimonial: false,
    });
    expect(validarControlInventarioProducto(producto)).toContain(
      "debe requerir número de serie",
    );
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
      "Serie obligatoria; gestiona patrimonio opcional",
    );
  });

  it("identifica productos que requieren unidades físicas", () => {
    expect(
      esProductoControlIndividual({ tipoControlInventario: "individual" }),
    ).toBe(true);
    expect(
      esProductoControlIndividual({ tipoControlInventario: "CANTIDAD" }),
    ).toBe(false);
  });
});
