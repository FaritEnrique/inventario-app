import { describe, expect, it } from "vitest";
import {
  buildOrdenCompraGeneradaViewModel,
  getOrdenesCompraFromBuenaPro,
  hasOrdenesCompraGeneradas,
  normalizeOrdenesGeneradasResponse,
} from "./ordenCompraDesdeBuenaProViewModel";

describe("ordenCompraDesdeBuenaProViewModel", () => {
  it("normaliza response con data.ordenesCompra", () => {
    const result = normalizeOrdenesGeneradasResponse({
      data: {
        buenaProId: 4,
        ordenesCompra: [{ id: 1 }, { id: 2 }],
      },
    });

    expect(result.buenaProId).toBe(4);
    expect(result.ordenesCompra).toHaveLength(2);
  });

  it("normaliza response con ordenesCompra directo", () => {
    const result = normalizeOrdenesGeneradasResponse({
      ordenesCompra: [{ id: 3 }],
    });

    expect(result.ordenesCompra).toEqual([{ id: 3 }]);
  });

  it("normaliza response con una sola orden", () => {
    const result = normalizeOrdenesGeneradasResponse({
      ordenCompra: { id: 8 },
    });

    expect(result.ordenesCompra).toEqual([{ id: 8 }]);
  });

  it("devuelve array vacio si response es null", () => {
    expect(normalizeOrdenesGeneradasResponse(null).ordenesCompra).toEqual([]);
  });

  it("detecta ordenes generadas en Buena Pro", () => {
    const buenaPro = { ordenesCompra: [{ id: 1 }] };

    expect(getOrdenesCompraFromBuenaPro(buenaPro)).toHaveLength(1);
    expect(hasOrdenesCompraGeneradas(buenaPro)).toBe(true);
  });

  it("formatea campos visibles sin romper si faltan datos", () => {
    const result = buildOrdenCompraGeneradaViewModel({
      id: 7,
      codigo: "OC-0001",
      montoTotal: "150.50",
    });

    expect(result).toMatchObject({
      id: 7,
      codigo: "OC-0001",
      proveedor: "-",
      montoTotal: 150.5,
      moneda: "PEN",
      estadoAprobacion: "PENDIENTE_APROBACION",
    });
  });
});
