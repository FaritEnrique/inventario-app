import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { canAdjustInventoryEffective } from "../accessRules";
import configuracionEmpresaApi from "../api/configuracionEmpresaApi";
import { useAuth } from "../context/authContext";
import useInventario from "../hooks/useInventario";
import usePedidosInternos from "../hooks/usePedidosInternos";
import {
  buildLetterheadDocumentData,
  resolveInstitutionalAssetUrl,
} from "../utils/configuracionEmpresaLetterhead";
import { getBienInventarioLabel } from "../utils/bienesInventarioDespacho";
import { buildPrestamoReportePrintHtml } from "../utils/prestamoReportePrintDocument";
import { printHtmlInNewWindow } from "../utils/printWindow";
import {
  getEstadoPrestamoLabel,
  getModalidadSalidaLabel,
} from "../utils/prestamosInventario";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("es-PE") : "-";
const formatNumber = (value) => Number(value || 0).toLocaleString("es-PE");

const openBlobResponse = ({ blob }) => {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

const ReporteAtencionLogisticaPage = ({ alcance = "PEDIDO_INTERNO" }) => {
  const { id } = useParams();
  const { user } = useAuth();
  const canApproveActa = canAdjustInventoryEffective(user);
  const { obtenerReporteAtencionPedido } = usePedidosInternos();
  const {
    obtenerReporteAtencionNotaSalida,
    obtenerActaRegularizacionPdfBlob,
    obtenerSustentoActaRegularizacionBlob,
    decidirActaRegularizacionSalidaTemporal,
  } = useInventario();
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configuracionEmpresa, setConfiguracionEmpresa] = useState(null);
  const [decisionId, setDecisionId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    configuracionEmpresaApi
      .obtenerDocumento()
      .then((data) => {
        if (!cancelled) setConfiguracionEmpresa(data || null);
      })
      .catch(() => {
        if (!cancelled) setConfiguracionEmpresa(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const cargarReporte = useCallback(async () => {
    setLoading(true);
    try {
      const data =
        alcance === "NOTA_SALIDA"
          ? await obtenerReporteAtencionNotaSalida(id)
          : await obtenerReporteAtencionPedido(id);
      setReporte(data);
      return data;
    } catch (error) {
      setReporte(null);
      toast.error(error.message || "No se pudo generar el reporte.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [
    alcance,
    id,
    obtenerReporteAtencionNotaSalida,
    obtenerReporteAtencionPedido,
  ]);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  const decidirActa = async (acta, accion) => {
    let comentario;
    if (accion === "RECHAZAR") {
      comentario = window.prompt("Motivo del rechazo del Acta:");
      if (comentario === null) return;
      if (comentario.trim().length < 3) {
        toast.error("Debe indicar un motivo de rechazo.");
        return;
      }
    } else if (
      !window.confirm(
        `¿Aprobar ${acta.codigo}? La regularización quedará cerrada e inmutable.`,
      )
    ) {
      return;
    }

    try {
      setDecisionId(acta.id);
      await decidirActaRegularizacionSalidaTemporal(acta.id, {
        accion,
        comentario: comentario?.trim() || undefined,
      });
      toast.success(
        accion === "APROBAR"
          ? `${acta.codigo} fue aprobada.`
          : `${acta.codigo} fue rechazada.`,
      );
      await cargarReporte();
    } catch (error) {
      toast.error(error.message || "No se pudo registrar la decisión del Acta.");
    } finally {
      setDecisionId(null);
    }
  };

  const pedido = reporte?.pedidoInterno;
  const salidas = useMemo(
    () => (Array.isArray(reporte?.salidas) ? reporte.salidas : []),
    [reporte],
  );
  const salidaPrincipal = salidas[0] || null;
  const modalidadReporte =
    alcance === "NOTA_SALIDA"
      ? salidaPrincipal?.modalidadSalida || pedido?.modalidadSalida
      : pedido?.modalidadSalida;
  const fechaPrevistaReporte =
    alcance === "NOTA_SALIDA"
      ? salidaPrincipal?.fechaPrevistaDevolucion ||
        pedido?.fechaPrevistaDevolucion
      : pedido?.fechaPrevistaDevolucion;
  const finalidadReporte =
    alcance === "NOTA_SALIDA"
      ? salidaPrincipal?.finalidadPrestamo || pedido?.finalidadPrestamo
      : pedido?.finalidadPrestamo;
  const esTemporal = modalidadReporte === "TEMPORAL";
  const letterheadDocumentData = useMemo(
    () =>
      buildLetterheadDocumentData(
        configuracionEmpresa || {},
        configuracionEmpresa?.logoSrc ||
          resolveInstitutionalAssetUrl(configuracionEmpresa?.logoUrl || ""),
        { usePlaceholderIdentity: Boolean(configuracionEmpresa) },
      ),
    [configuracionEmpresa],
  );

  const handlePrint = async () => {
    try {
      await printHtmlInNewWindow(
        buildPrestamoReportePrintHtml({
          documentData: letterheadDocumentData,
          reporte,
          alcance,
        }),
      );
    } catch (error) {
      toast.error(
        error.message || "No se pudo abrir la impresión del reporte.",
      );
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="rounded-xl bg-white p-6 shadow-sm">Generando reporte…</div>
      </div>
    );
  }

  if (!reporte || !pedido) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          No se pudo obtener la trazabilidad solicitada.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 print:max-w-none print:p-0">
      <div className="flex flex-col gap-4 print:hidden md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Reporte de atención y devolución
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Consolidación documental sin modificar las Notas de Pedido, Salida o Ingreso.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/notas-pedido/${pedido.id}`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Ver Nota de Pedido
          </Link>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Imprimir reporte
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:border-0 print:shadow-none">
        <div className="border-b border-slate-200 pb-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Sistema logístico
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            REPORTE DE ATENCIÓN DE NOTA DE PEDIDO
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Emitido por {alcance === "NOTA_SALIDA" ? "Nota de Salida" : "Nota de Pedido"}
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">Nota de Pedido</p>
            <p className="mt-1 font-semibold text-slate-900">{pedido.codigo}</p>
            <p className="text-sm text-slate-600">{formatDateTime(pedido.fechaPedido)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">Área solicitante</p>
            <p className="mt-1 font-semibold text-slate-900">
              {pedido.areaSolicitante?.nombre || "-"}
            </p>
            <p className="text-sm text-slate-600">
              {pedido.solicitante?.nombre || "-"}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">Modalidad</p>
            <p className="mt-1 font-semibold text-slate-900">
              {getModalidadSalidaLabel(modalidadReporte)}
            </p>
            <p className="text-sm text-slate-600">
              {esTemporal
                ? `Devolución prevista: ${formatDate(fechaPrevistaReporte)}`
                : "No requiere devolución"}
            </p>
          </div>
        </div>

        {esTemporal && finalidadReporte ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Finalidad del préstamo:</strong> {finalidadReporte}
          </div>
        ) : null}

        <div className="mt-7">
          <h3 className="text-lg font-semibold text-slate-900">Atención de la solicitud</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Producto</th>
                  <th className="px-3 py-2 text-right">Solicitado</th>
                  <th className="px-3 py-2 text-right">Entregado</th>
                  <th className="px-3 py-2 text-right">Pendiente atención</th>
                  {esTemporal ? (
                    <>
                      <th className="px-3 py-2 text-right">Devuelto</th>
                      <th className="px-3 py-2 text-right">Regularizado</th>
                      <th className="px-3 py-2 text-right">Pendiente devolución</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {(reporte.lineas || []).map((linea) => (
                  <tr key={linea.pedidoInternoDetalleId} className="border-b border-slate-200">
                    <td className="px-3 py-3">
                      <strong>{linea.producto?.nombre}</strong>
                      <div className="text-xs text-slate-500">{linea.producto?.codigo}</div>
                    </td>
                    <td className="px-3 py-3 text-right">{formatNumber(linea.cantidadSolicitada)}</td>
                    <td className="px-3 py-3 text-right">{formatNumber(linea.cantidadEntregada)}</td>
                    <td className="px-3 py-3 text-right">{formatNumber(linea.cantidadPendienteAtencion)}</td>
                    {esTemporal ? (
                      <>
                        <td className="px-3 py-3 text-right">{formatNumber(linea.cantidadDevuelta)}</td>
                        <td className="px-3 py-3 text-right">{formatNumber(linea.cantidadRegularizada)}</td>
                        <td className="px-3 py-3 text-right">{formatNumber(linea.cantidadPendienteDevolucion)}</td>
                      </>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-7 space-y-5">
          <h3 className="text-lg font-semibold text-slate-900">Notas de Salida vinculadas</h3>
          {salidas.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              La Nota de Pedido todavía no tiene salidas registradas.
            </p>
          ) : (
            salidas.map((salida) => (
              <article key={salida.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/inventario-notas-salida/${salida.id}`}
                      className="font-semibold text-blue-700 print:text-slate-900"
                    >
                      {salida.codigo}
                    </Link>
                    <p className="text-sm text-slate-600">
                      {salida.almacen?.nombre || "-"} · {formatDateTime(salida.fechaSalida)}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-slate-900">
                      {getModalidadSalidaLabel(salida.modalidadSalida)}
                    </p>
                    {salida.modalidadSalida === "TEMPORAL" ? (
                      <p className="text-slate-600">{getEstadoPrestamoLabel(salida.estadoPrestamo)}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Producto</th>
                        <th className="px-3 py-2 text-right">Entregado</th>
                        {salida.modalidadSalida === "TEMPORAL" ? (
                          <>
                            <th className="px-3 py-2 text-right">Devuelto</th>
                            <th className="px-3 py-2 text-right">Regularizado</th>
                            <th className="px-3 py-2 text-right">Pendiente</th>
                          </>
                        ) : null}
                      </tr>
                    </thead>
                    <tbody>
                      {(salida.lineas || []).map((linea) => (
                        <tr key={linea.notaSalidaDetalleId} className="border-t border-slate-200">
                          <td className="px-3 py-2">{linea.producto?.nombre}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(linea.cantidadEntregada)}</td>
                          {salida.modalidadSalida === "TEMPORAL" ? (
                            <>
                              <td className="px-3 py-2 text-right">{formatNumber(linea.cantidadDevuelta)}</td>
                              <td className="px-3 py-2 text-right">{formatNumber(linea.cantidadRegularizada)}</td>
                              <td className="px-3 py-2 text-right">{formatNumber(linea.cantidadPendienteDevolucion)}</td>
                            </>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {salida.modalidadSalida === "TEMPORAL" &&
                (salida.notasIngresoDevolucion || []).length > 0 ? (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Notas de Ingreso por devolución
                    </p>
                    <div className="mt-2 space-y-2">
                      {salida.notasIngresoDevolucion.map((nota) => (
                        <div key={nota.id} className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
                          <Link
                            to={`/inventario-notas-ingreso/${nota.id}`}
                            className="font-semibold underline print:no-underline"
                          >
                            {nota.codigo}
                          </Link>{" "}
                          · {formatDateTime(nota.fechaRecepcion)} · {nota.almacen?.nombre || "-"}
                          {!nota.inventarioPosteadoAt ? " · Pendiente de posteo" : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {salida.modalidadSalida === "TEMPORAL" &&
                (salida.actasRegularizacion || []).length > 0 ? (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Actas de Regularización de Salida Temporal
                    </p>
                    <div className="mt-2 space-y-2">
                      {salida.actasRegularizacion.map((acta) => (
                        <div key={acta.id} className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong>{acta.codigo}</strong>
                            <span>· {formatDateTime(acta.fechaEmision)}</span>
                            <span>· {acta.motivoOtro || acta.motivo}</span>
                            <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold">
                              {acta.estado === "PENDIENTE_APROBACION"
                                ? "Pendiente de aprobación"
                                : acta.estado === "EMITIDO"
                                  ? "Emitida"
                                  : "Rechazada"}
                            </span>
                            <span>
                              Regularizado: {formatNumber(acta.totalRegularizado)}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-3 print:hidden">
                            {acta.estado === "EMITIDO" ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    openBlobResponse(
                                      await obtenerActaRegularizacionPdfBlob(acta.id),
                                    );
                                  } catch (error) {
                                    toast.error(error.message || "No se pudo abrir el PDF del Acta.");
                                  }
                                }}
                                className="font-semibold text-amber-800 underline"
                              >
                                Ver Acta PDF
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  openBlobResponse(
                                    await obtenerSustentoActaRegularizacionBlob(acta.id),
                                  );
                                } catch (error) {
                                  toast.error(error.message || "No se pudo abrir el sustento del Acta.");
                                }
                              }}
                              className="font-semibold text-emerald-800 underline"
                            >
                              Ver sustento
                            </button>
                            {canApproveActa &&
                            acta.estado === "PENDIENTE_APROBACION" ? (
                              <>
                                <button
                                  type="button"
                                  disabled={decisionId === acta.id}
                                  onClick={() => decidirActa(acta, "APROBAR")}
                                  className="font-semibold text-emerald-800 underline disabled:opacity-50"
                                >
                                  Aprobar
                                </button>
                                <button
                                  type="button"
                                  disabled={decisionId === acta.id}
                                  onClick={() => decidirActa(acta, "RECHAZAR")}
                                  className="font-semibold text-rose-800 underline disabled:opacity-50"
                                >
                                  Rechazar
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {(salida.lineas || []).some((linea) => (linea.bienesSalida || []).length > 0) ? (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-900">Unidades individualizadas</p>
                    <div className="mt-2 overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-2 py-2 text-left">Producto</th>
                            <th className="px-2 py-2 text-left">Unidad</th>
                            <th className="px-2 py-2 text-left">Situación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salida.lineas.flatMap((linea) =>
                            (linea.bienesSalida || []).map((bien) => {
                              const devuelto = (linea.bienesDevueltos || []).some(
                                (item) => Number(item.id) === Number(bien.id),
                              );
                              const regularizado = (linea.bienesRegularizados || []).some(
                                (item) => Number(item.id) === Number(bien.id),
                              );
                              return (
                                <tr key={`${linea.notaSalidaDetalleId}-${bien.id}`} className="border-t border-slate-200">
                                  <td className="px-2 py-2">{linea.producto?.nombre}</td>
                                  <td className="px-2 py-2">{getBienInventarioLabel(bien)}</td>
                                  <td className="px-2 py-2">{devuelto ? "Devuelto" : regularizado ? "Regularizado no devuelto" : "Pendiente"}</td>
                                </tr>
                              );
                            }),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default ReporteAtencionLogisticaPage;
