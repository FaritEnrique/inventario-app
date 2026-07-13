import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Modal from "./Modal";
import { formatInteger } from "../utils/numberFormatters";
import {
  alertOrder,
  getSeguimientoAlertDetalle,
  getSeguimientoAlertMeta,
} from "../utils/alertasSeguimientoLogistico";

const getAlertCount = (alertas, tipo) => {
  if (!alertas) return 0;
  if (alertas.byTipo) {
    return Number(alertas.byTipo[tipo]?.totalExpedientes || 0);
  }
  if (tipo === "PLAZO_VENCIDO") return Number(alertas.solicitudesVencidas || 0);
  if (tipo === "PLAZO_POR_VENCER") {
    return Number(alertas.solicitudesPorVencer || 0);
  }
  if (tipo === "COBERTURA_INCOMPLETA") {
    return Number(alertas.itemsCoberturaIncompleta || 0);
  }
  if (tipo === "FLUJO_CERRADO_SIN_BUENA_PRO") {
    return Number(alertas.flujosCerradosSinBuenaPro || 0);
  }
  if (tipo === "BUENA_PRO_SIN_OC") {
    return Number(alertas.buenasProSinOrdenCompra || 0);
  }
  if (tipo === "OC_PENDIENTE_APROBACION") {
    return Number(alertas.ordenesCompraPendientesAprobacion || 0);
  }
  if (tipo === "OC_APROBADA_PENDIENTE_RECEPCION") {
    return Number(alertas.ordenesCompraAprobadasPendientesRecepcion || 0);
  }
  return 0;
};

const hasSeguimientoAlerts = (alertas) => {
  if (!alertas) return false;
  if (alertas.byTipo) {
    return alertOrder.some((tipo) => getAlertCount(alertas, tipo) > 0);
  }
  return alertas.tieneAlertas === true;
};

export const AlertasSeguimientoCards = ({
  alertas,
  onSelectTipo,
  title = "Alertas de seguimiento",
  description = "Prioriza expedientes con plazos vencidos, por vencer o cobertura incompleta.",
  compact = false,
  showEmptyState = false,
}) => {
  if (!hasSeguimientoAlerts(alertas)) {
    return showEmptyState ? (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        No hay alertas pendientes.
      </p>
    ) : null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 sm:text-sm">{description}</p>
        </div>
        {alertas.totalExpedientesConAlertas != null ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {formatInteger(alertas.totalExpedientesConAlertas)} expediente(s)
          </span>
        ) : null}
      </div>

      <div
        className={`mt-3 grid gap-3 ${
          compact ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4"
        }`}
      >
        {alertOrder.map((tipo) => {
          const count = getAlertCount(alertas, tipo);
          if (count <= 0) return null;

          const meta = getSeguimientoAlertMeta(tipo);
          const Icon = meta.icon;

          return (
            <button
              key={tipo}
              type="button"
              onClick={() => onSelectTipo?.(tipo)}
              disabled={!onSelectTipo}
              className={`rounded-lg border p-3 text-left transition disabled:cursor-default ${meta.cardClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase">{meta.label}</p>
                  <p className="mt-2 text-right text-2xl font-bold tabular-nums">
                    {formatInteger(count)}
                  </p>
                </div>
                <Icon size={22} className="shrink-0" />
              </div>
              <p className="mt-2 text-xs leading-relaxed">{meta.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
};

const getExpedienteNombre = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.nombre || value.codigo || null;
};

const buildSingleExpedienteAlertas = (alertas, expediente) => ({
  byTipo: Object.fromEntries(
    alertOrder.map((tipo) => {
      const count = getAlertCount(alertas, tipo);

      return [
        tipo,
        {
          totalExpedientes: count > 0 ? 1 : 0,
          expedientes:
            count > 0
              ? [
                  {
                    id: expediente?.id,
                    codigo: expediente?.codigo || expediente?.detalleGlobal?.codigo,
                    area:
                      getExpedienteNombre(expediente?.area) ||
                      expediente?.areaNombreSnapshot ||
                      null,
                    solicitante: getExpedienteNombre(expediente?.solicitante),
                    responsableLogistica: getExpedienteNombre(
                      expediente?.responsableLogistica,
                    ),
                    alertasSeguimiento: alertas,
                  },
                ]
              : [],
        },
      ];
    }),
  ),
});

export const AlertasSeguimientoExpediente = ({ alertas, expediente }) => {
  const [selectedTipo, setSelectedTipo] = useState(null);
  const modalAlertas = useMemo(() => {
    if (!selectedTipo) return null;
    if (alertas?.byTipo) return alertas;
    return buildSingleExpedienteAlertas(alertas, expediente);
  }, [alertas, expediente, selectedTipo]);

  if (!hasSeguimientoAlerts(alertas)) return null;

  return (
    <>
      <AlertasSeguimientoCards
        alertas={alertas}
        compact
        onSelectTipo={setSelectedTipo}
        title="Seguimiento del expediente"
        description="Este expediente tiene puntos de atencion antes de cerrar o continuar el flujo logistico."
      />
      <AlertasSeguimientoModal
        alertas={modalAlertas}
        tipo={selectedTipo}
        onClose={() => setSelectedTipo(null)}
        buildExpedientePath={(item, tipo) =>
          tipo === "COBERTURA_INCOMPLETA"
            ? `/cotizaciones/proceso/${item.id}/cotizaciones`
            : `/cotizaciones/proceso/${item.id}`
        }
      />
    </>
  );
};

const formatDetalleAlerta = (detalle, tipo) => {
  if (tipo === "COBERTURA_INCOMPLETA") {
    return `${detalle.descripcionVisible} (${formatInteger(
      detalle.coberturaValida,
    )}/${formatInteger(detalle.coberturaMinima)})`;
  }

  if (tipo === "PLAZO_VENCIDO" || tipo === "PLAZO_POR_VENCER") {
    return `${detalle.codigo} - ${
      detalle.proveedor?.razonSocial || "Proveedor"
    } - limite ${
      detalle.fechaLimiteRecepcion
        ? new Date(detalle.fechaLimiteRecepcion).toLocaleDateString("es-PE")
        : "-"
    }`;
  }

  if (detalle.titulo || detalle.mensaje) {
    const suffix = detalle.detalle ? ` - ${detalle.detalle}` : "";
    return `${detalle.titulo || detalle.mensaje}${suffix}`;
  }

  return detalle.codigo || detalle.id || "-";
};

export const AlertasSeguimientoModal = ({
  alertas,
  tipo,
  onClose,
  buildExpedientePath,
}) => {
  const isOpen = Boolean(tipo);
  const meta = tipo ? getSeguimientoAlertMeta(tipo) : null;
  const expedientes = tipo ? alertas?.byTipo?.[tipo]?.expedientes || [] : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={meta ? meta.label : "Alertas de seguimiento"}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          {meta?.description || "Revisa los expedientes con alerta."}
        </p>

        {expedientes.length > 0 ? (
          <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
            {expedientes.map((expediente) => {
              const detalles = getSeguimientoAlertDetalle(expediente, tipo);
              const hrefDetalle = detalles.find((detalle) => detalle?.href)?.href;
              const expedienteHref =
                hrefDetalle ||
                buildExpedientePath?.(expediente, tipo) ||
                `/cotizaciones/proceso/${expediente.id}`;

              return (
                <article
                  key={expediente.id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {expediente.codigo}
                      </p>
                      <p className="text-sm text-slate-600">
                        {expediente.area || "-"} - {expediente.solicitante || "-"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Responsable: {expediente.responsableLogistica || "Sin asignar"}
                      </p>
                    </div>
                    <Link
                      to={expedienteHref}
                      onClick={onClose}
                      className={`inline-flex justify-center rounded border px-3 py-2 text-xs font-semibold ${meta?.buttonClass || "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                    >
                      Abrir expediente
                    </Link>
                  </div>

                  {detalles.length > 0 ? (
                    <div className="mt-3 rounded border border-slate-100 bg-slate-50 p-2">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Detalle
                      </p>
                      <ul className="mt-1 space-y-1 text-xs text-slate-600">
                        {detalles.slice(0, 5).map((detalle) => (
                          <li
                            key={
                              detalle.id ||
                              detalle.itemRequerimientoId ||
                              detalle.ordenCompraId ||
                              detalle.buenaProId ||
                              detalle.flujoCotizacionId
                            }
                          >
                            {formatDetalleAlerta(detalle, tipo)}
                          </li>
                        ))}
                        {detalles.length > 5 ? (
                          <li>+ {formatInteger(detalles.length - 5)} registro(s) mas</li>
                        ) : null}
                      </ul>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
            No hay expedientes para esta alerta.
          </p>
        )}
      </div>
    </Modal>
  );
};
