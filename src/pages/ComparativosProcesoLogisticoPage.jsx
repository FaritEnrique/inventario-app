import React from "react";
import { Link, useOutletContext } from "react-router-dom";

const ComparativosProcesoLogisticoPage = () => {
  const { id, detalleGlobal, loading, error } = useOutletContext();
  const etapaCerrada = detalleGlobal?.cotizacionesCerradas === true;
  const resumen = detalleGlobal?.resumenComparativo || {};
  const coberturaItems = Array.isArray(resumen.coberturaItems)
    ? resumen.coberturaItems
    : [];
  const coberturaCompleta =
    coberturaItems.length > 0 &&
    coberturaItems.every((item) => item.cumpleCoberturaValida);
  const cierreJustificado =
    etapaCerrada &&
    detalleGlobal?.modalidadFlujoLogistico === "REGULAR" &&
    !coberturaCompleta;

  if (loading && !detalleGlobal) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold leading-snug text-gray-900 sm:text-2xl">
          Comparativo del proceso logistico
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm">
          El cuadro comparativo se habilita cuando la etapa de cotizacion fue
          cerrada desde la vista de cotizaciones.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!etapaCerrada ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Para generar el comparativo primero debes cerrar la etapa de
          cotizacion.
          <div className="mt-3">
            <Link
              to={`/cotizaciones/proceso/${id}/cotizaciones`}
              className="inline-flex rounded border border-amber-400 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >
              Revisar cotizaciones
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            Etapa de cotizacion cerrada
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {cierreJustificado
              ? "El expediente fue cerrado con justificacion por cobertura incompleta. El comparativo debe mantener esa trazabilidad."
              : "El expediente cuenta con cierre conforme para continuar con el comparativo."}
          </p>
          {cierreJustificado ? (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              Motivo:{" "}
              {detalleGlobal?.motivoCierreCotizaciones ||
                "No registrado"}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
};

export default ComparativosProcesoLogisticoPage;
