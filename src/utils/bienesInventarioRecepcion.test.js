import { describe, expect, it } from "vitest";
import {
  buildUnidadesInventarioPayload,
  getUnidadInventarioDuplicateFields,
  sincronizarUnidadesInventario,
  validateUnidadesInventario,
} from "./bienesInventarioRecepcion";

const productoIndividual = {
  id: 1,
  codigo: "EQ-001",
  tipoControlInventario: "INDIVIDUAL",
  requiereNumeroSerie: true,
  requiereCodigoPatrimonial: true,
};

describe("bienesInventarioRecepcion", () => {
  it("crea exactamente una fila por unidad aceptada", () => {
    const unidades = sincronizarUnidadesInventario([], 3);
    expect(unidades).toHaveLength(3);
    expect(unidades.every((unidad) => unidad.id)).toBe(true);
  });

  it("conserva datos al reducir o aumentar la cantidad", () => {
    const inicial = sincronizarUnidadesInventario([], 2).map((unidad, index) => ({
      ...unidad,
      numeroSerie: `SER-${index + 1}`,
    }));
    const reducida = sincronizarUnidadesInventario(inicial, 1);
    const ampliada = sincronizarUnidadesInventario(reducida, 2);

    expect(reducida[0].numeroSerie).toBe("SER-1");
    expect(ampliada[0].numeroSerie).toBe("SER-1");
    expect(ampliada).toHaveLength(2);
  });

  it("rechaza cantidad decimal para control individual", () => {
    expect(
      validateUnidadesInventario({
        producto: productoIndividual,
        cantidad: 1.5,
        unidades: [],
      }),
    ).toContain("número entero");
  });

  it("detecta series y códigos patrimoniales repetidos", () => {
    const duplicates = getUnidadInventarioDuplicateFields([
      { numeroSerie: "abc", codigoPatrimonial: "pat-1" },
      { numeroSerie: " ABC ", codigoPatrimonial: " PAT-1 " },
    ]);

    expect(duplicates).toEqual([
      { numeroSerie: true, codigoPatrimonial: true },
      { numeroSerie: true, codigoPatrimonial: true },
    ]);
  });

  it("genera payload sin ids de interfaz", () => {
    expect(
      buildUnidadesInventarioPayload([
        {
          id: "ui-1",
          numeroSerie: " SER-1 ",
          codigoPatrimonial: " PAT-1 ",
          observaciones: " Nueva ",
        },
      ]),
    ).toEqual([
      {
        numeroSerie: "SER-1",
        codigoPatrimonial: "PAT-1",
        observaciones: "Nueva",
      },
    ]);
  });
});
