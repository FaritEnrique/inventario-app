import React from "react";
import {
  getFlujosActivos,
  isFlujoCerrado,
  TIPO_COMPRA_LABELS,
} from "../utils/flujoCotizacionUi";
import { formatInteger } from "../utils/numberFormatters";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("es-PE") : "No registrado";

const getEstadoClassName = (flujo) =>
  isFlujoCerrado(flujo)
    ? "bg-slate-100 text-slate-700"
    : "bg-emerald-100 text-emerald-700";

const getConteo = (flujo, key) => Number(flujo?.conteos?.[key] || 0);

const FlujoCotizacionCard = ({
  flujo,
  canManage,
  compact,
  loading,
  onCerrarFlujo,
  onReabrirFlujo,
}) => {
  const closed = isFlujoCerrado(flujo);
  const tipoCompraLabel =
    TIPO_COMPRA_LABELS[flujo?.tipoCompra] || flujo?.tipoCompra || "-";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Flujo de cotización
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">
            {tipoCompraLabel}
          </h3>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getEstadoClassName(
            flujo,
          )}`}
        >
          {closed ? "CERRADO" : "ABIERTO"}
        </span>
      </div>

      <dl
        className={`mt-4 grid gap-3 text-sm ${
          compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"
        }`}
      >
        <div>
          <dt className="text-xs font-medium text-slate-500">Solicitudes</dt>
          <dd className="mt-1 font-semibold tabular-nums text-slate-900">
            {formatInteger(getConteo(flujo, "solicitudesActivas"))}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Cotizaciones</dt>
          <dd className="mt-1 font-semibold tabular-nums text-slate-900">
            {formatInteger(getConteo(flujo, "cotizacionesActivas"))}
          </dd>
        </div>
        {!compact ? (
          <>
            <div>
              <dt className="text-xs font-medium text-slate-500">
                Ítems solicitados
              </dt>
              <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                {formatInteger(getConteo(flujo, "itemsSolicitados"))}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">
                Ítems cotizados
              </dt>
              <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                {formatInteger(getConteo(flujo, "itemsCotizadosValidos"))}
              </dd>
            </div>
          </>
        ) : null}
      </dl>

      {!compact ? (
        <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
          <p>
            <span className="font-medium text-slate-600">Cierre:</span>{" "}
            {formatDateTime(flujo?.fechaCierreCotizaciones)}
          </p>
          <p>
            <span className="font-medium text-slate-600">Reapertura:</span>{" "}
            {formatDateTime(flujo?.fechaReaperturaCotizaciones)}
          </p>
        </div>
      ) : null}

      {canManage ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {closed ? (
            <button
              type="button"
              onClick={() => onReabrirFlujo?.(flujo)}
              disabled={loading}
              className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reabrir
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onCerrarFlujo?.(flujo)}
              disabled={loading}
              className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cerrar cotizaciones
            </button>
          )}
        </div>
      ) : null}
    </article>
  );
};

const FlujosCotizacionPanel = ({
  flujosCotizacion,
  onCerrarFlujo,
  onReabrirFlujo,
  canManage = false,
  loading = false,
  compact = false,
}) => {
  const flujos = getFlujosActivos(flujosCotizacion);

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">
          Flujos de cotización
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          LOCAL e IMPORTACIÓN se gestionan como flujos independientes del mismo
          requerimiento.
        </p>
      </div>

      {flujos.length ? (
        <div
          className={`grid gap-3 ${
            compact ? "md:grid-cols-2" : "lg:grid-cols-2"
          }`}
        >
          {flujos.map((flujo) => (
            <FlujoCotizacionCard
              key={flujo.id}
              flujo={flujo}
              canManage={canManage}
              compact={compact}
              loading={loading}
              onCerrarFlujo={onCerrarFlujo}
              onReabrirFlujo={onReabrirFlujo}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-600">
          Aún no existen flujos de cotización. Se crearán automáticamente al
          emitir la primera solicitud LOCAL o de IMPORTACIÓN.
        </div>
      )}
    </section>
  );
};

export default FlujosCotizacionPanel;
