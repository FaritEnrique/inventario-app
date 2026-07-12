import { describe, expect, it } from "vitest";
import {
  getBienInventarioDocumentPath,
  getBienInventarioEstadoMeta,
  getBienInventarioIdentificador,
  normalizeBienInventarioListResponse,
} from "./bienInventarioTrazabilidad";

describe("bienInventarioTrazabilidad", () => {
  it("muestra patrimonio y serie como identificador principal", () => {
    expect(
      getBienInventarioIdentificador({
        id: 1,
        numeroSerie: "SER-001",
        codigoPatrimonial: "PAT-001",
      }),
    ).toBe("PAT-001 / SER-001");
  });

  it("usa un identificador alternativo cuando no hay serie ni patrimonio", () => {
    expect(getBienInventarioIdentificador({ id: 7 })).toBe("Unidad #7");
  });

  it("normaliza respuestas paginadas vacías", () => {
    expect(normalizeBienInventarioListResponse(null)).toEqual({
      data: [],
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
      pageSize: 20,
    });
  });

  it("genera rutas para notas de ingreso y salida", () => {
    expect(
      getBienInventarioDocumentPath({ tipo: "NOTA_INGRESO", id: 10 }),
    ).toBe("/modulo-almacen/notas-ingreso/10");
    expect(
      getBienInventarioDocumentPath({ tipo: "NOTA_SALIDA", id: 20 }),
    ).toBe("/modulo-almacen/notas-salida/20");
  });

  it("devuelve etiquetas legibles para estados disponibles y prestados", () => {
    expect(getBienInventarioEstadoMeta("DISPONIBLE").label).toBe("Disponible");
    expect(getBienInventarioEstadoMeta("PRESTADO").label).toBe("Prestado");
  });
});
