import React from "react";
import { useOutletContext } from "react-router-dom";
import { AlertasSeguimientoExpediente } from "../components/AlertasSeguimientoLogistico";
import {
  getAlertasSeguimientoSource,
  hasAlertasSeguimiento,
} from "../utils/logisticaAlertasUi";

const AlertasProcesoLogisticoPage = () => {
  const { id, detalleGlobal } = useOutletContext();
  const alertas = getAlertasSeguimientoSource(detalleGlobal);
  const hasAlertas = hasAlertasSeguimiento(alertas);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Expediente {detalleGlobal?.codigo || `#${id}`}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Alertas del Expediente Logístico
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Revisa los pendientes derivados del flujo de cotización, Buena Pro y
          Órdenes de Compra.
        </p>
      </div>

      {hasAlertas ? (
        <AlertasSeguimientoExpediente
          alertas={alertas}
          expediente={detalleGlobal}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          No hay alertas pendientes para este expediente.
        </p>
      )}
    </section>
  );
};

export default AlertasProcesoLogisticoPage;
