import React, { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import Modal from "../components/Modal";
import { formatInteger } from "../utils/numberFormatters";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";

const ComparativosProcesoLogisticoPage = () => {
  const { id, detalleGlobal, loading, error } = useOutletContext();
  const [showTrazabilidad, setShowTrazabilidad] = useState(false);
  const etapaCerrada = detalleGlobal?.cotizacionesCerradas === true;
  const resumen = detalleGlobal?.resumenComparativo || {};
  const coberturaItems = Array.isArray(resumen.coberturaItems)
    ? resumen.coberturaItems
    : [];
  const coberturaCompleta =
    coberturaItems.length > 0 &&
    coberturaItems.every((item) => item.cumpleCoberturaValida);
  const itemsIncompletos = coberturaItems.filter(
    (item) => !item.cumpleCoberturaValida,
  );
  const flujoRegular = detalleGlobal?.modalidadFlujoLogistico === "REGULAR";
  const cierreJustificado =
    etapaCerrada &&
    flujoRegular &&
    !coberturaCompleta &&
    Boolean(detalleGlobal?.motivoCierreCotizaciones);
  const gate = useMemo(() => {
    const reasons = [];
    const totalSolicitudes = Number(resumen.totalSolicitudes || 0);
    const totalCotizaciones = Number(
      resumen.totalCotizaciones || resumen.totalCotizacionesRegistradas || 0,
    );
    const proveedoresConRespuesta = Number(
      resumen.proveedoresConRespuesta || 0,
    );

    if (!detalleGlobal?.modalidadFlujoLogistico) {
      reasons.push({
        key: "modalidad",
        text: "Primero define la modalidad del proceso logistico.",
        actionLabel: "Revisar detalle",
        actionTo: `/cotizaciones/proceso/${id}`,
      });
    } else if (totalSolicitudes <= 0) {
      reasons.push({
        key: "solicitudes",
        text: "Aun no existen solicitudes de cotizacion emitidas.",
        actionLabel: "Ir a solicitudes",
        actionTo: `/cotizaciones/proceso/${id}/solicitudes`,
      });
    } else if (totalCotizaciones <= 0 || proveedoresConRespuesta <= 0) {
      reasons.push({
        key: "respuestas",
        text: "Aun no hay respuestas de proveedores registradas.",
        actionLabel: "Ir a cotizaciones",
        actionTo: `/cotizaciones/proceso/${id}/cotizaciones`,
      });
    } else if (!etapaCerrada) {
      reasons.push({
        key: "cierre",
        text: "La etapa de cotizacion todavia esta abierta. Debes cerrarla para habilitar el comparativo.",
        actionLabel: "Cerrar desde cotizaciones",
        actionTo: `/cotizaciones/proceso/${id}/cotizaciones`,
      });
    } else if (flujoRegular && !coberturaCompleta && !cierreJustificado) {
      reasons.push({
        key: "cobertura",
        text: "Aun no se cumple la cobertura minima de cotizaciones por item. Revisa los items pendientes o cierra con sustento si ya agotaste la gestion.",
        actionLabel: "Revisar cobertura",
        actionTo: `/cotizaciones/proceso/${id}/cotizaciones`,
      });
    }

    return {
      blocked: reasons.length > 0,
      reasons,
      primaryAction: reasons[0] || null,
    };
  }, [
    cierreJustificado,
    coberturaCompleta,
    detalleGlobal?.modalidadFlujoLogistico,
    etapaCerrada,
    flujoRegular,
    id,
    resumen.proveedoresConRespuesta,
    resumen.totalCotizaciones,
    resumen.totalCotizacionesRegistradas,
    resumen.totalSolicitudes,
  ]);

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

      {gate.blocked ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Aun no puedes generar el comparativo
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-800">
                Antes de continuar, completa los pasos pendientes de la etapa de
                cotizacion.
              </p>
            </div>
            {gate.primaryAction ? (
              <Link
                to={gate.primaryAction.actionTo}
                className="inline-flex w-full items-center justify-center rounded border border-amber-400 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 sm:w-fit"
              >
                {gate.primaryAction.actionLabel}
              </Link>
            ) : null}
          </div>

          <ul className="mt-4 space-y-2 text-sm text-amber-900">
            {gate.reasons.map((reason) => (
              <li key={reason.key} className="flex gap-2">
                <span aria-hidden="true">-</span>
                <span>{reason.text}</span>
              </li>
            ))}
          </ul>

          {gate.reasons.some((reason) => reason.key === "cobertura") &&
          itemsIncompletos.length > 0 ? (
            <details className="mt-4 rounded-lg border border-amber-200 bg-white/70 p-3 text-sm text-amber-900">
              <summary className="cursor-pointer font-semibold">
                Ver items con cobertura pendiente
              </summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {itemsIncompletos.map((item) => (
                  <div
                    key={item.itemRequerimientoId}
                    className="rounded border border-amber-100 bg-white p-3"
                  >
                    <p className="font-medium text-slate-900">
                      {item.descripcionVisible || "Item"}
                    </p>
                    <p className="mt-1 text-right text-xs text-slate-600 tabular-nums">
                      {formatInteger(item.coberturaValida)} /{" "}
                      {formatInteger(item.coverageMinimum)} cotizaciones validas
                    </p>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
        </section>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Comparativo habilitado
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {cierreJustificado
                  ? "La etapa de cotizacion fue cerrada con sustento porque no se alcanzo la cobertura minima. Puedes continuar con el comparativo y revisar el motivo cuando lo necesites."
                  : "La etapa de cotizacion fue cerrada y el expediente puede continuar con el comparativo."}
              </p>
            </div>
            {cierreJustificado ? (
              <button
                type="button"
                onClick={() => setShowTrazabilidad(true)}
                className="inline-flex w-full items-center justify-center rounded border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 sm:w-fit"
              >
                Ver sustento
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Solicitudes emitidas
              </p>
              <p className="mt-2 text-right text-xl font-bold text-slate-900 tabular-nums">
                {formatInteger(resumen.totalSolicitudes)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Respuestas registradas
              </p>
              <p className="mt-2 text-right text-xl font-bold text-slate-900 tabular-nums">
                {formatInteger(resumen.proveedoresConRespuesta)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Cobertura minima
              </p>
              <p className="mt-2 text-right text-xl font-bold text-slate-900 tabular-nums">
                {formatInteger(resumen.coberturaMinimaPorItem)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-800">
            La gestion del cuadro comparativo debe continuar aqui con la
            seleccion de cotizaciones, criterio de adjudicacion y aprobacion
            correspondiente.
          </div>
        </section>
      )}

      <Modal
        isOpen={showTrazabilidad}
        onClose={() => setShowTrazabilidad(false)}
        title="Sustento de cierre"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-sm text-slate-700">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <p className="font-semibold">Cierre con cobertura incompleta</p>
            <p className="mt-1">
              Fecha de cierre:{" "}
              {formatDate(detalleGlobal?.fechaCierreCotizaciones)}
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Motivo registrado</p>
            <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 leading-relaxed">
              {detalleGlobal?.motivoCierreCotizaciones || "No registrado"}
            </p>
          </div>

          {itemsIncompletos.length > 0 ? (
            <div>
              <p className="font-semibold text-slate-900">
                Items con cobertura pendiente
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {itemsIncompletos.map((item) => (
                  <div
                    key={item.itemRequerimientoId}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <p className="font-medium text-slate-900">
                      {item.descripcionVisible || "Item"}
                    </p>
                    <p className="mt-1 text-right text-xs text-slate-600 tabular-nums">
                      {formatInteger(item.coberturaValida)} /{" "}
                      {formatInteger(item.coverageMinimum)} cotizaciones validas
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowTrazabilidad(false)}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default ComparativosProcesoLogisticoPage;
