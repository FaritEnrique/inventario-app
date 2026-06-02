import { describe, expect, it } from "vitest";
import {
  alertOrder,
  getSeguimientoAlertDetalle,
  getSeguimientoAlertMeta,
} from "./AlertasSeguimientoLogistico";

describe("AlertasSeguimientoLogistico", () => {
  it("registra los tipos nuevos de alertas logisticas", () => {
    expect(alertOrder).toEqual(
      expect.arrayContaining([
        "FLUJO_CERRADO_SIN_BUENA_PRO",
        "BUENA_PRO_SIN_OC",
        "OC_PENDIENTE_APROBACION",
        "OC_APROBADA_PENDIENTE_RECEPCION",
      ]),
    );

    expect(getSeguimientoAlertMeta("FLUJO_CERRADO_SIN_BUENA_PRO").label).toBe(
      "Flujo sin Buena Pro",
    );
    expect(getSeguimientoAlertMeta("BUENA_PRO_SIN_OC").label).toBe(
      "Buena Pro sin O/C",
    );
    expect(getSeguimientoAlertMeta("OC_PENDIENTE_APROBACION").label).toBe(
      "O/C por aprobar",
    );
    expect(
      getSeguimientoAlertMeta("OC_APROBADA_PENDIENTE_RECEPCION").label,
    ).toBe("O/C por recibir");
  });

  it("lee el arreglo de detalle correcto por tipo nuevo", () => {
    const expediente = {
      alertasSeguimiento: {
        detalle: {
          flujosCerradosSinBuenaPro: [{ id: "flujo" }],
          buenasProSinOrdenCompra: [{ id: "buena-pro" }],
          ordenesCompraPendientesAprobacion: [{ id: "oc-pendiente" }],
          ordenesCompraAprobadasPendientesRecepcion: [{ id: "oc-recepcion" }],
        },
      },
    };

    expect(
      getSeguimientoAlertDetalle(expediente, "FLUJO_CERRADO_SIN_BUENA_PRO"),
    ).toEqual([{ id: "flujo" }]);
    expect(getSeguimientoAlertDetalle(expediente, "BUENA_PRO_SIN_OC")).toEqual([
      { id: "buena-pro" },
    ]);
    expect(
      getSeguimientoAlertDetalle(expediente, "OC_PENDIENTE_APROBACION"),
    ).toEqual([{ id: "oc-pendiente" }]);
    expect(
      getSeguimientoAlertDetalle(
        expediente,
        "OC_APROBADA_PENDIENTE_RECEPCION",
      ),
    ).toEqual([{ id: "oc-recepcion" }]);
  });
});
