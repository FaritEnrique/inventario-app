import { describe, expect, it } from "vitest";
import {
  filterAlertasByCategory,
  getAlertasByCategoryCount,
  getAlertasSeguimientoCount,
} from "./logisticaAlertasUi";

const buildAlertas = () => ({
  byTipo: {
    PLAZO_VENCIDO: { totalExpedientes: 1, expedientes: [{ id: 1 }] },
    BUENA_PRO_SIN_OC: { totalExpedientes: 2, expedientes: [{ id: 2 }] },
    OC_PENDIENTE_APROBACION: {
      totalExpedientes: 3,
      expedientes: [{ id: 3 }],
    },
  },
});

describe("logisticaAlertasUi", () => {
  it("cuenta alertas desde resumen H1 y byTipo", () => {
    expect(
      getAlertasSeguimientoCount({
        resumen: [
          { tipo: "FLUJO_CERRADO_SIN_BUENA_PRO", cantidad: 2 },
          { tipo: "OC_PENDIENTE_APROBACION", cantidad: 1 },
        ],
      }),
    ).toBe(3);

    expect(getAlertasSeguimientoCount(buildAlertas())).toBe(6);
  });

  it("filtra alertas globales por categoria", () => {
    const alertas = buildAlertas();

    expect(getAlertasByCategoryCount(alertas, "cotizaciones")).toBe(1);
    expect(getAlertasByCategoryCount(alertas, "buenaPro")).toBe(2);
    expect(getAlertasByCategoryCount(alertas, "ordenesCompra")).toBe(3);

    const filtered = filterAlertasByCategory(alertas, "buenaPro");

    expect(filtered.byTipo.BUENA_PRO_SIN_OC.totalExpedientes).toBe(2);
    expect(filtered.byTipo.PLAZO_VENCIDO.totalExpedientes).toBe(0);
    expect(filtered.byTipo.OC_PENDIENTE_APROBACION.totalExpedientes).toBe(0);
  });
});
