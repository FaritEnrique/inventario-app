// src/pages/InventarioNotaIngresoDetallePage.jsx
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  canActOnNoteDocument,
  canOperateInventoryEffective,
  canSubsanarNotaIngresoEffective,
} from "../accessRules";
import DocumentoAlmacenEstadoBadge from "../components/DocumentoAlmacenEstadoBadge";
import DocumentoFormalEstadoBadge from "../components/DocumentoFormalEstadoBadge";
import DocumentosNotaIngresoModal from "../components/inventario/DocumentosNotaIngresoModal";
import InventarioDocumentoDetalleSkeleton from "../components/ui/skeletons/InventarioDocumentoDetalleSkeleton";
import { useAuth } from "../context/authContext";
import useAppDialog from "../hooks/useAppDialog";
import useInventario from "../hooks/useInventario";
import useDocumentosNotaIngresoStore from "../stores/useDocumentosNotaIngresoStore";
import { esProductoIndividual } from "../utils/bienesInventarioRecepcion";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "-";

const formalLevelLabels = {
  APROBACION_ALMACEN: "Aprobacion de almacen",
  CONFORMIDAD_GERENCIA: "Conformidad de gerencia",
};

const documentacionEntregaLabels = {
  CON_DOCUMENTO: "Con documentación sustentatoria",
  SIN_DOCUMENTO_JUSTIFICADO: "Sin documentación justificada",
};

const bienInventarioEstadoLabels = {
  PENDIENTE_POSTEO: "Pendiente de posteo",
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
  ENTREGADO: "Entregado",
  PRESTADO: "Prestado",
  BAJA: "De baja",
};

const getDetalleBienes = (detalle = {}) => {
  if (Array.isArray(detalle.bienesInventario) && detalle.bienesInventario.length) {
    return detalle.bienesInventario;
  }

  return Array.isArray(detalle.bienesDevolucionSnapshot)
    ? detalle.bienesDevolucionSnapshot
    : [];
};

const BienesInventarioList = ({
  bienes = [],
  compact = false,
  estadoLabel = null,
}) => {
  if (!bienes.length) return null;

  return (
    <div className={compact ? "mt-2 space-y-1" : "space-y-2"}>
      {bienes.map((bien, index) => (
        <div
          key={bien.id || `${bien.numeroSerie}-${bien.codigoPatrimonial}-${index}`}
          className={`rounded border border-cyan-100 bg-cyan-50 text-cyan-950 ${
            compact ? "px-2 py-1 text-xs" : "p-2 text-sm"
          }`}
        >
          <div className="font-medium">Unidad {index + 1}</div>
          <div className="mt-0.5 text-cyan-800">
            Serie: {bien.numeroSerie || "-"}
          </div>
          <div className="text-cyan-800">
            Patrimonial: {bien.codigoPatrimonial || "-"}
          </div>
          {bien.observaciones ? (
            <div className="mt-1 text-xs text-cyan-800">
              Observación: {bien.observaciones}
            </div>
          ) : null}
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
            {estadoLabel ||
              bienInventarioEstadoLabels[bien.estado] ||
              bien.estado ||
              "Pendiente de posteo"}
          </div>
        </div>
      ))}
    </div>
  );
};

const InventarioNotaIngresoDetallePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { prompt, dialogNode } = useAppDialog();
  const openDocumentosNotaIngresoModal = useDocumentosNotaIngresoStore(
    (state) => state.openModal,
  );
  const {
    loading,
    error,
    obtenerNotaIngresoPorId,
    obtenerNotaIngresoPdfBlob,
    actualizarAprobacionDocumentalNotaIngreso,
    subsanarNotaIngresoDocumental,
  } = useInventario();
  const [nota, setNota] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const cargarNota = useCallback(async () => {
    try {
      const data = await obtenerNotaIngresoPorId(id);
      setNota(data);
      return data;
    } catch (loadError) {
      toast.error(loadError.message || "No se pudo cargar la nota de ingreso.");
      setNota(null);
      return null;
    }
  }, [id, obtenerNotaIngresoPorId]);

  useEffect(() => {
    cargarNota();
  }, [cargarNota]);

  const handleDecision = async (accion) => {
    const comentario = await prompt({
      title:
        accion === "APROBAR"
          ? "Aprobar nota de ingreso"
          : accion === "OBSERVAR"
            ? "Observar nota de ingreso"
            : "Rechazar nota de ingreso",
      message:
        accion === "OBSERVAR"
          ? "Indica la observación que debe subsanar el responsable de la recepción."
          : `Comentario para ${accion.toLowerCase()} la nota de ingreso (opcional).`,
      defaultValue: "",
      placeholder:
        accion === "OBSERVAR"
          ? "Describe qué debe corregirse o complementarse"
          : "Comentario opcional",
      variant: accion === "APROBAR" ? "default" : "warning",
    });

    if (comentario === null) return;

    if (accion === "OBSERVAR" && !comentario.trim()) {
      toast.error("Debes indicar el motivo de la observación.");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await actualizarAprobacionDocumentalNotaIngreso(id, {
        accion,
        comentario: comentario.trim() || null,
      });
      setNota(updated);
      toast.success(
        accion === "APROBAR"
          ? "Aprobacion documental registrada."
          : accion === "OBSERVAR"
            ? "Observación registrada. La nota vuelve a subsanación."
            : "Rechazo documental registrado.",
      );
    } catch (actionError) {
      toast.error(
        actionError.message ||
          "No se pudo actualizar la aprobacion documental.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubsanar = async () => {
    const comentario = await prompt({
      title: "Reenviar nota subsanada",
      message:
        "Indica qué se subsanó antes de devolver la nota a la bandeja de conformidad.",
      defaultValue: "",
      placeholder: "Ejemplo: se adjuntó guía complementaria y se corrigió la observación del ítem 2",
      variant: "default",
    });

    if (comentario === null) return;

    if (!comentario.trim()) {
      toast.error("Debes indicar qué se subsanó.");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await subsanarNotaIngresoDocumental(id, {
        comentario: comentario.trim(),
      });
      setNota(updated);
      toast.success("Nota de ingreso reenviada a conformidad.");
    } catch (actionError) {
      toast.error(
        actionError.message || "No se pudo registrar la subsanación.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!nota) return;

    setDownloadingPdf(true);
    try {
      const { blob } = await obtenerNotaIngresoPdfBlob(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `NotaIngreso-${nota.codigo || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      toast.error(
        downloadError.message ||
          "No se pudo generar el PDF formal de la nota de ingreso.",
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleOpenDocumentos = () => {
    if (!nota) return;

    openDocumentosNotaIngresoModal(nota).catch((modalError) => {
      toast.error(
        modalError.message ||
          "No se pudo abrir la documentación sustentatoria.",
      );
    });
  };

  const handleDocumentosChange = async (documentosActualizados = []) => {
    setNota((current) =>
      current
        ? {
            ...current,
            documentosEntrega: documentosActualizados,
          }
        : current,
    );

    await cargarNota();
  };

  if (loading && !nota) return <InventarioDocumentoDetalleSkeleton />;

  if (!nota) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "No se pudo cargar la nota de ingreso."}
        </div>
      </div>
    );
  }

  const documentoFormal = nota.documentoFormal || {};
  const canAct = canActOnNoteDocument(user, documentoFormal);
  const canSubsanar = canSubsanarNotaIngresoEffective(user, nota);
  const canManageInventory = canOperateInventoryEffective(user);
  const isGerenciaConformidadView = location.pathname.includes(
    "/notas-ingreso/conformidad-gerencia",
  );
  const documentosEntrega = Array.isArray(nota.documentosEntrega)
    ? nota.documentosEntrega
    : [];
  const cantidadDocumentosEntrega = documentosEntrega.length;
  const estadoDocumentacionEntrega =
    nota.estadoDocumentacionEntrega ||
    (cantidadDocumentosEntrega > 0 ? "CON_DOCUMENTO" : null);
  const estadoDocumentacionEntregaLabel =
    documentacionEntregaLabels[estadoDocumentacionEntrega] || "No registrado";
  const canDownloadPdf =
    documentoFormal.estadoDocumentalFormal === "APROBADA" &&
    Boolean(nota.inventarioPosteadoAt || nota.inventarioPosteado);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {dialogNode}
      <DocumentosNotaIngresoModal onDocumentosChange={handleDocumentosChange} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Detalle de nota de ingreso
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {nota.codigo} - {nota.almacen?.nombre || "Sin almacen"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isGerenciaConformidadView ? (
            <Link
              to="/notas-ingreso/conformidad-gerencia"
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Volver a bandeja
            </Link>
          ) : (
            <>
              <Link
                to="/inventario-notas-ingreso"
                className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Listado
              </Link>
              <Link
                to="/inventario-recepciones"
                className="rounded border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
              >
                Recepciones
              </Link>
            </>
          )}
          {canDownloadPdf ? (
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {downloadingPdf ? "Generando PDF..." : "Descargar PDF formal"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estado operativo
          </p>
          <div className="mt-3">
            <DocumentoAlmacenEstadoBadge estado={nota.estado} />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estado documental
          </p>
          <div className="mt-3">
            <DocumentoFormalEstadoBadge
              estado={documentoFormal.estadoDocumentalFormal}
            />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Fecha de recepcion
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatDateTime(nota.fechaRecepcion)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Nivel pendiente
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formalLevelLabels[documentoFormal.nivelPendienteActual] ||
              documentoFormal.nivelPendienteActual ||
              "Sin pendiente"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Documentación sustentatoria de entrega
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              {estadoDocumentacionEntregaLabel}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Documentos activos adjuntos:{" "}
              <span className="font-semibold text-slate-900">
                {cantidadDocumentosEntrega}
              </span>
            </p>

            {cantidadDocumentosEntrega === 0 ? (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Motivo sin documentación:{" "}
                {nota.motivoSinDocumentacionEntrega || "No registrado"}
              </p>
            ) : null}
          </div>

          {canManageInventory ? (
            <button
              type="button"
              onClick={handleOpenDocumentos}
              className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 sm:w-auto"
            >
              Gestionar documentos sustentatorios
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Cabecera documental
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Almacen
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {nota.almacen?.codigo || "-"} - {nota.almacen?.nombre || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Responsable
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {nota.responsable?.nombre || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tipo de ingreso
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {nota.tipoIngreso === "DEVOLUCION_PRESTAMO"
                  ? "Devolución de préstamo"
                  : "Recepción"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Documento de origen
              </p>
              {nota.notaSalidaOrigen ? (
                <Link
                  to={`/inventario-notas-salida/${nota.notaSalidaOrigen.id}`}
                  className="mt-1 block text-sm font-medium text-blue-700"
                >
                  {nota.notaSalidaOrigen.codigo}
                </Link>
              ) : (
                <p className="mt-1 text-sm text-slate-700">-</p>
              )}
            </div>
            {nota.tipoIngreso === "DEVOLUCION_PRESTAMO" ? (
              <div className="md:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                Esta Nota de Ingreso acredita el retorno físico asociado a la Nota de Salida temporal {nota.notaSalidaOrigen?.codigo || "-"}.
                {nota.personaEntrega ? ` Entrega: ${nota.personaEntrega}.` : ""}
              </div>
            ) : null}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Referencia tipo
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {nota.referenciaTipo || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Referencia codigo
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {nota.referenciaCodigo || "-"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Observaciones
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {nota.observaciones || "Sin observaciones registradas."}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Flujo documental
            </h2>
            <Link
              to={`/inventario-movimientos?notaIngresoId=${nota.id}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Ver movimientos
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {(documentoFormal.rutaAprobacionSnapshot || []).length > 0
              ? documentoFormal.rutaAprobacionSnapshot.map((step) => (
                  <div
                    key={`${step.orden}-${step.nivel}`}
                    className={`rounded-lg border p-4 text-sm ${
                      step.esPendienteActual
                        ? "border-indigo-300 bg-indigo-50"
                        : step.rechazado
                          ? "border-rose-300 bg-rose-50"
                          : step.observado
                            ? "border-amber-300 bg-amber-50"
                            : step.aprobado
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-slate-200 bg-white"
                    }`}
                  >
                    <p className="font-semibold text-slate-900">
                      {formalLevelLabels[step.nivel] || step.nivel}
                    </p>
                    <p className="mt-1 text-slate-700">
                      {step.aprobadorNombre || "-"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {step.estado || "PENDIENTE"}
                    </p>
                  </div>
                ))
              : null}

            {canAct ? (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-sm font-medium text-indigo-900">
                  Accion documental disponible
                </p>
                <p className="mt-1 text-sm text-indigo-800">
                  Tu usuario coincide con el aprobador snapshot del nivel
                  pendiente.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecision("APROBAR")}
                    disabled={submitting}
                    className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision("OBSERVAR")}
                    disabled={submitting}
                    className="rounded border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-60"
                  >
                    Observar
                  </button>
                </div>
              </div>
            ) : null}

            {canSubsanar ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-900">
                  Nota observada pendiente de subsanación
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Revisa la observación del historial, realiza la corrección o
                  adjunta documentación complementaria y reenvía la nota a la
                  bandeja de conformidad.
                </p>
                <button
                  type="button"
                  onClick={handleSubsanar}
                  disabled={submitting}
                  className="mt-3 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  Reenviar subsanada
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {(nota.detalles || []).length > 0 ? (
          nota.detalles.map((detalle) => (
            <div
              key={detalle.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="font-semibold text-slate-900">
                {detalle.producto?.nombre || "-"}
              </p>
              <p className="text-xs text-slate-500">
                {detalle.producto?.codigo || "-"} ·{" "}
                {detalle.producto?.unidadMedida || "-"}
              </p>
              <div className="mt-3 grid gap-1 text-sm text-slate-700">
                <p>Ordenada: {detalle.cantidadOrdenada}</p>
                <p>Aceptada: {detalle.cantidadAceptada}</p>
                <p>Rechazada: {detalle.cantidadRechazada}</p>
                <p>Pendiente: {detalle.cantidadPendiente}</p>
              </div>
              <BienesInventarioList
                bienes={getDetalleBienes(detalle)}
                estadoLabel={
                  nota.tipoIngreso === "DEVOLUCION_PRESTAMO"
                    ? "Devuelto mediante esta nota"
                    : null
                }
              />
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Esta nota no tiene lineas visibles.
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Lineas recibidas
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-left">Cantidades</th>
                <th className="px-4 py-3 text-left">Estado recepcion</th>
                <th className="px-4 py-3 text-left">Unidades</th>
                <th className="px-4 py-3 text-left">Trazabilidad</th>
              </tr>
            </thead>
            <tbody>
              {(nota.detalles || []).length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Esta nota no tiene lineas visibles.
                  </td>
                </tr>
              ) : (
                nota.detalles.map((detalle) => (
                  <tr
                    key={detalle.id}
                    className="border-t border-slate-200 align-top"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {detalle.producto?.nombre || "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {detalle.producto?.codigo || "-"} ·{" "}
                        {detalle.producto?.unidadMedida || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>Ordenada: {detalle.cantidadOrdenada}</div>
                      <div>Aceptada: {detalle.cantidadAceptada}</div>
                      <div>Rechazada: {detalle.cantidadRechazada}</div>
                      <div>Pendiente: {detalle.cantidadPendiente}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {detalle.estadoRecepcion || "-"}
                    </td>
                    <td className="min-w-56 px-4 py-3 align-top">
                      {getDetalleBienes(detalle).length > 0 ? (
                        <BienesInventarioList
                          bienes={getDetalleBienes(detalle)}
                          compact
                          estadoLabel={
                            nota.tipoIngreso === "DEVOLUCION_PRESTAMO"
                              ? "Devuelto mediante esta nota"
                              : null
                          }
                        />
                      ) : (
                        <span className="text-xs text-slate-500">
                          {esProductoIndividual(detalle.producto)
                            ? "Sin unidades individualizadas"
                            : "Control por cantidad"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {nota.ordenCompra ? (
                        <Link
                          to={`/ordenes-compra/${nota.ordenCompra.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          Ver OC
                        </Link>
                      ) : (
                        <span className="text-slate-500">Sin OC vinculada</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Historial documental
        </h2>
        <div className="mt-4 space-y-3">
          {(documentoFormal.historial || []).length > 0 ? (
            documentoFormal.historial.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-slate-200 p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {entry.tipoEvento}
                  </p>
                  <p className="text-slate-500">
                    {formatDateTime(entry.fechaAccion)}
                  </p>
                </div>
                <p className="mt-1 text-slate-700">
                  Actor: {entry.actor?.nombre || "-"}
                </p>
                {entry.comentario ? (
                  <p className="mt-1 text-slate-700">{entry.comentario}</p>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Aun no hay historial documental visible.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventarioNotaIngresoDetallePage;
