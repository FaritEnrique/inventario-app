import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { FaArrowLeft, FaEye, FaPrint, FaTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  canAssignCotizacionesLogisticaEffective,
  canOperateCotizacionesLogisticaEffective,
} from "../accessRules";
import ConfirmDeactivateSolicitudToast from "../components/confirmDesactivateSolicitudToast";
import CotizacionEstadoBadge from "../components/CotizacionEstadoBadge";
import SolicitudesRequerimientoSkeleton from "../components/ui/skeletons/SolicitudesRequerimientoSkeleton";
import { useAuth } from "../context/authContext";
import useLogisticaCotizaciones from "../hooks/useLogisticaCotizaciones";
import useSolicitudesCotizacion from "../hooks/useSolicitudesCotizacion";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";

const buildBackTarget = (from) =>
  from
    ? `${from.pathname || ""}${from.search || ""}${from.hash || ""}`
    : "/cotizaciones/bandeja/jefatura";

const SolicitudesRequerimientoPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { obtenerDetalle } = useLogisticaCotizaciones();
  const {
    solicitudes,
    cargando,
    error,
    cargarSolicitudesPorRequerimiento,
    obtenerSolicitudPdfUrl,
    desactivarSolicitud,
  } = useSolicitudesCotizacion({ autoLoad: false });

  const [detalle, setDetalle] = useState(null);

  const load = async () => {
    const [detalleResult] = await Promise.all([
      obtenerDetalle(id),
      cargarSolicitudesPorRequerimiento(id),
    ]);
    setDetalle(detalleResult);
  };

  useEffect(() => {
    load().catch(() => {});
  }, [id]);

  const backTarget = buildBackTarget(location.state?.from);
  const canAssign = canAssignCotizacionesLogisticaEffective(user);
  const canOperate = canOperateCotizacionesLogisticaEffective(user);
  const responsableActualId =
    detalle?.responsableLogisticaId || detalle?.responsableLogistica?.id || null;
  const assignedToCurrentUser =
    Number(responsableActualId || 0) === Number(user?.id || 0);
  const assignedToOtherResponsable =
    Number(responsableActualId || 0) > 0 && !assignedToCurrentUser;
  const expedienteBloqueado = ["ADJUDICADO", "OC_GENERADA"].includes(
    detalle?.estadoLogistica
  );
  const flujoDefinido = Boolean(detalle?.modalidadFlujoLogistico);
  const canManageSolicitudes =
    canOperate &&
    !expedienteBloqueado &&
    flujoDefinido &&
    (!assignedToOtherResponsable || !canAssign || assignedToCurrentUser);

  const activeSolicitudesCount = useMemo(
    () =>
      Array.isArray(solicitudes)
        ? solicitudes.filter((solicitud) => solicitud.activo !== false).length
        : 0,
    [solicitudes]
  );

  const handlePrintSolicitud = (solicitudId) => {
    window.open(
      obtenerSolicitudPdfUrl(solicitudId),
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleDeactivateSolicitud = async (solicitudId) => {
    toast(
      ({ closeToast }) => (
        <ConfirmDeactivateSolicitudToast
          closeToast={closeToast}
          onConfirm={async (motivo) => {
            await desactivarSolicitud(solicitudId, {
              motivoInactivacion: motivo,
            });
            await load();
          }}
        />
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        className: "!w-auto !max-w-[460px]",
      }
    );
  };

  if (cargando && !detalle) return <SolicitudesRequerimientoSkeleton />;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Solicitudes de cotización del requerimiento
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Vista dedicada para revisar las solicitudes emitidas, abrir su
            detalle, imprimirlas o desactivarlas sin salir a la vista general del
            expediente.
          </p>
        </div>

        <Link
          to={backTarget}
          className="inline-flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <FaArrowLeft className="text-xs" />
          Volver
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Requerimiento
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {detalle?.codigo || "-"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {detalle?.area?.nombre || detalle?.areaNombreSnapshot || "-"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Solicitudes activas
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {activeSolicitudesCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Responsable
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {detalle?.responsableLogistica?.nombre || "Sin asignar"}
          </p>
          {detalle?.requiereReasignacionResponsable ? (
            <p className="mt-2 text-xs text-amber-700">
              Responsable no operativo. La jefatura debe reasignar el caso.
            </p>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Solicitudes emitidas
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Cada solicitud reutiliza su detalle y su documento reales. La
            desactivación es lógica y solo está disponible cuando el expediente
            permite gestión operativa.
          </p>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {Array.isArray(solicitudes) && solicitudes.length > 0 ? (
            solicitudes.map((solicitud) => (
              <div key={solicitud.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{solicitud.codigo}</p>
                    <p className="mt-1 text-sm text-gray-700">
                      {solicitud.proveedor?.razonSocial || "-"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(solicitud.fechaEmision)}
                    </p>
                  </div>
                  <div className="text-right">
                    <CotizacionEstadoBadge estado={solicitud.estado} tipo="solicitud" />
                    {solicitud.activo === false ? (
                      <p className="mt-1 text-xs font-medium text-rose-700">
                        Desactivada
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/solicitudes-cotizacion/${solicitud.id}`}
                    state={{ from: location }}
                    className="inline-flex items-center gap-2 rounded border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                    title="Ver solicitud"
                  >
                    <FaEye className="text-xs" />
                    Ver
                  </Link>
                  <button
                    type="button"
                    onClick={() => handlePrintSolicitud(solicitud.id)}
                    className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    title="Imprimir solicitud"
                  >
                    <FaPrint className="text-xs" />
                    Imprimir
                  </button>
                  {canManageSolicitudes && solicitud.activo !== false ? (
                    <button
                      type="button"
                      onClick={() => handleDeactivateSolicitud(solicitud.id)}
                      className="inline-flex items-center gap-2 rounded border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                      title="Desactivar solicitud"
                    >
                      <FaTrashAlt className="text-xs" />
                      Desactivar
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="px-2 py-6 text-center text-sm text-gray-500">
              Aún no se emitieron solicitudes de cotización para este requerimiento.
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Proveedor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {Array.isArray(solicitudes) && solicitudes.length > 0 ? (
                solicitudes.map((solicitud) => (
                  <tr key={solicitud.id}>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <p className="font-medium text-gray-900">{solicitud.codigo}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {solicitud.proveedor?.razonSocial || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(solicitud.fechaEmision)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <CotizacionEstadoBadge estado={solicitud.estado} tipo="solicitud" />
                      {solicitud.activo === false ? (
                        <p className="mt-1 text-xs font-medium text-rose-700">
                          Desactivada
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          to={`/solicitudes-cotizacion/${solicitud.id}`}
                          state={{ from: location }}
                          className="inline-flex items-center gap-2 rounded border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                          title="Ver solicitud"
                        >
                          <FaEye className="text-xs" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handlePrintSolicitud(solicitud.id)}
                          className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          title="Imprimir solicitud"
                        >
                          <FaPrint className="text-xs" />
                        </button>
                        {canManageSolicitudes && solicitud.activo !== false ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivateSolicitud(solicitud.id)}
                            className="inline-flex items-center gap-2 rounded border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                            title="Desactivar solicitud"
                          >
                            <FaTrashAlt className="text-xs" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-sm text-gray-500">
                    Aún no se emitieron solicitudes de cotización para este requerimiento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SolicitudesRequerimientoPage;
