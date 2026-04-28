import { describe, expect, it } from "vitest";
import {
  buildLogisticaResponsableOptions,
  canSubmitLogisticaAssignment,
  createDirectResponsableOption,
  findLogisticaJefaturaResponsable,
  getDefaultLogisticaResponsableSelection,
} from "./logisticaAssignment";

describe("logisticaAssignment utilities", () => {
  it("usa al jefe activo como responsable por defecto cuando el expediente aun no tiene asignacion", () => {
    expect(
      getDefaultLogisticaResponsableSelection({
        responsableActualId: null,
        directResponsableId: 9,
      }),
    ).toBe("9");
  });

  it("mantiene el responsable actual cuando ya existe una asignacion", () => {
    expect(
      getDefaultLogisticaResponsableSelection({
        responsableActualId: 4,
        directResponsableId: 9,
      }),
    ).toBe("4");
  });

  it("solo habilita la reasignacion cuando el valor cambia respecto al responsable actual", () => {
    expect(
      canSubmitLogisticaAssignment({
        selectedResponsableId: 4,
        responsableActualId: 4,
      }),
    ).toBe(false);

    expect(
      canSubmitLogisticaAssignment({
        selectedResponsableId: 9,
        responsableActualId: 4,
      }),
    ).toBe(true);
  });

  it("agrega al jefe directo y al responsable actual aunque no vengan en la lista de operadores", () => {
    const options = buildLogisticaResponsableOptions({
      operadores: [{ id: 2, nombre: "Operador Uno" }],
      directResponsable: { id: 9, nombre: "Jefe de Logistica" },
      extraResponsables: [{ id: 7, nombre: "Jefe de Area Logistica" }],
      responsableActual: { id: 7, nombre: "Encargado Actual" },
    });

    expect(options).toEqual([
      { id: 2, nombre: "Operador Uno" },
      { id: 9, nombre: "Jefe de Logistica" },
      { id: 7, nombre: "Jefe de Area Logistica" },
    ]);
  });

  it("solo crea la opcion directa cuando el contexto permite procesar como jefatura", () => {
    expect(
      createDirectResponsableOption({ id: 9, nombre: "Jefe de Logistica" }, true),
    ).toEqual({
      id: 9,
      nombre: "Jefe de Logistica",
    });

    expect(
      createDirectResponsableOption({ id: 9, nombre: "Jefe de Logistica" }, false),
    ).toBeNull();
  });

  it("encuentra al jefe de logistica priorizando el area activa", () => {
    expect(
      findLogisticaJefaturaResponsable(
        [
          {
            id: 5,
            nombre: "Jefe Otras Compras",
            asignacionesOperativas: [
              {
                rol: "JEFE_AREA",
                areaId: 90,
                area: { id: 90, esAreaLogistica: true },
              },
            ],
          },
          {
            id: 8,
            nombre: "Jefe Logistica Principal",
            asignacionesOperativas: [
              {
                rol: "JEFE_AREA",
                areaId: 12,
                area: { id: 12, esAreaLogistica: true },
              },
            ],
          },
        ],
        12,
      ),
    ).toEqual({
      id: 8,
      nombre: "Jefe Logistica Principal",
    });
  });
});
