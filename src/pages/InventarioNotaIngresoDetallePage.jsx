import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { canActOnNoteDocument } from "../accessRules";
import DocumentoAlmacenEstadoBadge from "../components/DocumentoAlmacenEstadoBadge";
import DocumentoFormalEstadoBadge from "../components/DocumentoFormalEstadoBadge";
import Loader from "../components/Loader";
import { useAuth } from "../context/authContext";
import useInventario from "../hooks/useInventario";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "-";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "-";

const formalLevelLabels = {
  APROBACION_ALMACEN: "Aprobacion de almacen",
  CONFORMIDAD_GERENCIA: "Conformidad de gerencia",
};

const InventarioNotaIngresoDetallePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const {
    loading,
    error,
    obtenerNotaIngresoPorId,
    actualizarAprobacionDocumentalNotaIngreso,
  } = useInventario();
  const [nota, setNota] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerNotaIngresoPorId(id);
        setNota(data);
      } catch (loadError) {
        toast.error(loadError.message || "No se pudo cargar la nota de ingreso.");
        setNota(null);
      }
    };

    cargar();
  }, [id, obtenerNotaIngresoPorId]);

  const documentoFormal = nota.documentoFormal || {};
  const canAct = canActOnNoteDocument(user, documentoFormal);

  const handleDecision = async (accion) => {
    const comentario = window.prompt(
      `Comentario para ${accion.toLowerCase()} la nota de ingreso (opcional).`,
      ""
    );

    if (comentario === null) return;

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
          : "Rechazo documental registrado."
      );
    } catch (actionError) {
      toast.error(
        actionError.message || "No se pudo actualizar la aprobacion documental."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !nota) return <Loader />;

  if (!nota) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "No se pudo cargar la nota de ingreso."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Detalle de nota de ingreso
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {nota.codigo} - {nota.almacen?.nombre || "Sin almacen"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
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
            {(documentoFormal.rutaAprobacionSnapshot || []).length > 0 ? (
              documentoFormal.rutaAprobacionSnapshot.map((step) => (
                <div
                  key={`${step.orden}-${step.nivel}`}
                  className={`rounded-lg border p-4 text-sm ${
                    step.esPendienteActual
                      ? "border-indigo-300 bg-indigo-50"
                      : step.rechazado
                        ? "border-rose-300 bg-rose-50"
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
            ) : null}

            {canAct ? (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-sm font-medium text-indigo-900">
                  Accion documental disponible
                </p>
                <p className="mt-1 text-sm text-indigo-800">
                  Tu usuario coincide con el aprobador snapshot del nivel pendiente.
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
                    onClick={() => handleDecision("RECHAZAR")}
                    disabled={submitting}
                    className="rounded border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {(nota.detalles || []).length > 0 ? (
          nota.detalles.map((detalle) => (
            <div key={detalle.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-semibold text-slate-900">
                {detalle.producto?.nombre || "-"}
              </p>
              <p className="text-xs text-slate-500">
                {detalle.producto?.codigo || "-"} · {detalle.producto?.unidadMedida || "-"}
              </p>
              <div className="mt-3 grid gap-1 text-sm text-slate-700">
                <p>Ordenada: {detalle.cantidadOrdenada}</p>
                <p>Aceptada: {detalle.cantidadAceptada}</p>
                <p>Rechazada: {detalle.cantidadRechazada}</p>
                <p>Pendiente: {detalle.cantidadPendiente}</p>
              </div>
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
          <h2 className="text-lg font-semibold text-slate-900">Lineas recibidas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-left">Cantidades</th>
                <th className="px-4 py-3 text-left">Estado recepcion</th>
                <th className="px-4 py-3 text-left">Trazabilidad</th>
              </tr>
            </thead>
            <tbody>
              {(nota.detalles || []).length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                    Esta nota no tiene lineas visibles.
                  </td>
                </tr>
              ) : (
                nota.detalles.map((detalle) => (
                  <tr key={detalle.id} className="border-t border-slate-200 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {detalle.producto?.nombre || "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {detalle.producto?.codigo || "-"} · {detalle.producto?.unidadMedida || "-"}
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
              <div key={entry.id} className="rounded-lg border border-slate-200 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {entry.tipoEvento}
                  </p>
                  <p className="text-slate-500">{formatDateTime(entry.fechaAccion)}</p>
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
