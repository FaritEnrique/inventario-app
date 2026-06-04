import React from "react";
import { ClipboardCheck } from "lucide-react";
import BandejaAprobacionNotasPedidoPage from "../BandejaAprobacionNotasPedidoPage";

const AprobacionesNotasPedidoGerenciaPage = () => {
  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Módulo Gerencia
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Aprobación de Notas de Pedido
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              Bandeja de aprobación de notas de pedido presentada dentro del
              módulo gerencial, sin redirigir fuera del layout de Gerencia.
            </p>
          </div>
          <ClipboardCheck className="h-6 w-6 text-indigo-600" />
        </div>
      </div>

      <BandejaAprobacionNotasPedidoPage />
    </section>
  );
};

export default AprobacionesNotasPedidoGerenciaPage;