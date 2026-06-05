// src/pages/gerencia/AlertasExpedientesGerenciaPage.jsx
import React from "react";
import AlertasLogisticasPage from "../AlertasLogisticasPage";

const AlertasExpedientesGerenciaPage = () => {
  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Módulo Gerencia
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Alertas Logísticas
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Consulta gerencial de alertas asociadas a expedientes logísticos. Esta
          vista es informativa y no permite operar el flujo logístico.
        </p>
      </div>
      <AlertasLogisticasPage />
    </section>
  );
};

export default AlertasExpedientesGerenciaPage;