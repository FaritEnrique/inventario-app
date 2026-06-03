import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useOutletContext } from "react-router-dom";
import { FaClipboardCheck, FaEye, FaPrint, FaTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  canAssignCotizacionesLogisticaEffective,
  canOperateCotizacionesLogisticaEffective,
  hasAdminOverrideEffective,
} from "../accessRules";
import CotizacionEstadoBadge from "../components/CotizacionEstadoBadge";
import FlujosCotizacionPanel from "../components/FlujosCotizacionPanel";
import SolicitudCotizacionForm from "../components/SolicitudCotizacionForm";
import SolicitudesProcesoLogisticoSkeleton from "../components/ui/skeletons/SolicitudesProcesoLogisticoSkeleton";
import { useAuth } from "../context/authContext";
import useAppDialog from "../hooks/useAppDialog";
import useFlujoCotizacionActions from "../hooks/useFlujoCotizacionActions";
import useProveedores from "../hooks/useProveedores";
import useSolicitudesCotizacion from "../hooks/useSolicitudesCotizacion";
import ConfirmDeactivateSolicitudToast from "../components/confirmDesactivateSolicitudToast";
import { buildFlujoTipoCompraWarning } from "../utils/flujoCotizacionUi";
import { formatInteger, formatQuantity } from "../utils/numberFormatters";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";

const getActiveCotizacionForSolicitud = (solicitud) =>
  Array.isArray(solicitud?.cotizaciones)
    ? solicitud.cotizaciones.find((cotizacion) => cotizacion.activo !== false)
    : null;

const buildSolicitudCoverage = (solicitud) => {
  const requestedItems = Array.isArray(solicitud?.items) ? solicitud.items : [];
  const activeCotizacion = getActiveCotizacionForSolicitud(solicitud);
  const quotedItems = Array.isArray(activeCotizacion?.items)
    ? activeCotizacion.items.filter(
        (item) =>
          String(item.estadoRespuesta || "").toUpperCase() === "COTIZADO",
      )
    : [];
  const quotedItemIds = new Set(
    quotedItems.map((item) => Number(item.itemRequerimientoId || 0)),
  );

  return {
    activeCotizacion,
    totalSolicitados: requestedItems.length,
    totalCotizados: quotedItemIds.size,
    items: requestedItems.map((item) => {
      const itemId = Number(item.itemRequerimientoId || 0);
      return {
        id: itemId,
        descripcion:
          item.itemRequerimiento?.descripcionVisible ||
          item.itemRequerimiento?.producto?.nombre ||
          item.itemRequerimiento?.productoTemporal?.nombre ||
          `Item ${itemId}`,
        unidadMedida: item.itemRequerimiento?.unidadMedida || "",
        cantidadRequerida: item.itemRequerimiento?.cantidadRequerida ?? "-",
        cotizado: quotedItemIds.has(itemId),
      };
    }),
  };
};

const SolicitudesProcesoLogisticoPage = () => {
  const location = useLocation();
  const { user } = useAuth();
  const {
    id,
    detalleGlobal,
    recargarDetalle,
    loading,
    error: detalleError,
  } = useOutletContext();
  const {
    solicitudes,
    cargando,
    error,
    solicitudesAnuladas,
    cargandoAnuladas,
    anuladasCargadas,
    cargarSolicitudesAnuladasPorRequerimiento,
    cargarSolicitudesPorRequerimiento,
    obtenerSolicitudPdfUrl,
    crearSolicitud,
    actualizarSolicitud,
    desactivarSolicitud,
  } = useSolicitudesCotizacion({ autoLoad: false });
  const { proveedores } = useProveedores();
  const {
    confirm,
    alert: showAlert,
    dialogNode: solicitudDialogNode,
  } = useAppDialog();

  const [mostrarAnuladas, setMostrarAnuladas] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [solicitudDraft, setSolicitudDraft] = useState(null);
  const [submittingSolicitud, setSubmittingSolicitud] = useState(false);
  const [solicitudSeguimiento, setSolicitudSeguimiento] = useState(null);

  useEffect(() => {
    cargarSolicitudesPorRequerimiento(id).catch(() => {});
  }, [cargarSolicitudesPorRequerimiento, id]);

  const refreshSolicitudesContext = useCallback(async () => {
    await cargarSolicitudesPorRequerimiento(id);
    await recargarDetalle?.();
  }, [cargarSolicitudesPorRequerimiento, id, recargarDetalle]);

  const {
    dialogNode: flujosDialogNode,
    submittingFlujo,
    handleCerrarFlujo,
    handleReabrirFlujo,
  } = useFlujoCotizacionActions({ onAfterChange: refreshSolicitudesContext });

  const canAssign = canAssignCotizacionesLogisticaEffective(user);
  const canOperate = canOperateCotizacionesLogisticaEffective(user);
  const isAdminUser = hasAdminOverrideEffective(user);

  const responsableActualId =
    detalleGlobal?.responsableLogisticaId ||
    detalleGlobal?.responsableLogistica?.id ||
    null;

  const assignedToCurrentUser =
    Number(responsableActualId || 0) === Number(user?.id || 0);

  const isLogisticaAuthority = canAssign || isAdminUser;

  const expedienteBloqueado = ["ADJUDICADO", "OC_GENERADA"].includes(
    detalleGlobal?.estadoLogistica,
  );

  const flujoDefinido = Boolean(detalleGlobal?.modalidadFlujoLogistico);

  const canManageSolicitudes =
    canOperate &&
    !expedienteBloqueado &&
    flujoDefinido &&
    (isLogisticaAuthority || assignedToCurrentUser);

  const activeSolicitudesCount = useMemo(
    () =>
      Array.isArray(solicitudes)
        ? solicitudes.filter((solicitud) => solicitud.activo !== false).length
        : 0,
    [solicitudes],
  );

  const requerimientoOption = useMemo(
    () =>
      detalleGlobal
        ? [
            {
              id: detalleGlobal.id,
              codigo: detalleGlobal.codigo,
              areaNombreSnapshot:
                detalleGlobal.area?.nombre || detalleGlobal.areaNombreSnapshot,
            },
          ]
        : [],
    [detalleGlobal],
  );

  const proveedoresActivos = useMemo(
    () => proveedores.filter((proveedor) => proveedor.activo !== false),
    [proveedores],
  );

  const handlePrintSolicitud = (solicitudId) => {
    window.open(
      obtenerSolicitudPdfUrl(solicitudId),
      "_blank",
      "noopener,noreferrer",
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

            await cargarSolicitudesPorRequerimiento(id);

            if (anuladasCargadas) {
              await cargarSolicitudesAnuladasPorRequerimiento(id);
            }
          }}
        />
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        className: "!w-auto !max-w-[460px]",
      },
    );
  };

  const handleOpenNewSolicitudForm = () => {
    setSolicitudDraft({ requerimientoId: Number(id) });
    setMostrarFormulario(true);

    window.setTimeout(() => {
      document.getElementById("solicitud-cotizacion-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const handleCloseSolicitudForm = () => {
    setSolicitudDraft(null);
    setMostrarFormulario(false);
  };

  const handleSolicitudSubmit = async (payload) => {
    const flujoWarning = buildFlujoTipoCompraWarning({
      flujosCotizacion: detalleGlobal?.flujosCotizacion,
      nextTipoCompra: payload?.tipoCompra,
    });

    if (flujoWarning.blocked) {
      await showAlert({
        title: flujoWarning.title,
        message: flujoWarning.message,
        variant: "warning",
      });
      return;
    }

    if (flujoWarning.shouldConfirm) {
      const confirmed = await confirm({
        title: flujoWarning.title,
        message: flujoWarning.message,
        confirmText: "Continuar",
        cancelText: "Cancelar",
        variant: "warning",
      });

      if (!confirmed) return;
    }

    setSubmittingSolicitud(true);
    try {
      if (solicitudDraft?.id) {
        await actualizarSolicitud(solicitudDraft.id, payload);
      } else {
        await crearSolicitud(payload);
      }

      await cargarSolicitudesPorRequerimiento(id);
      await recargarDetalle?.();
      handleCloseSolicitudForm();
    } finally {
      setSubmittingSolicitud(false);
    }
  };

  if (loading && !detalleGlobal) return <SolicitudesProcesoLogisticoSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {solicitudDialogNode}
      {flujosDialogNode}
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold leading-snug text-gray-900 sm:text-2xl">
            Solicitudes de cotizacion del proceso logistico
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm">
            Revisa las solicitudes emitidas, abre su detalle, imprime el
            documento o desactivalas cuando el expediente aun permite gestion.
          </p>
        </div>
        {canManageSolicitudes ? (
          <button
            type="button"
            onClick={
              mostrarFormulario
                ? handleCloseSolicitudForm
                : handleOpenNewSolicitudForm
            }
            className="inline-flex w-full items-center justify-center rounded border border-indigo-500 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 sm:w-fit"
          >
            {mostrarFormulario
              ? "Ocultar formulario"
              : "Emitir nueva solicitud"}
          </button>
        ) : null}
      </div>

      {detalleError || error ? (
        <div className="p-3 text-xs text-red-700 border border-red-200 rounded-xl bg-red-50 sm:p-4 sm:text-sm">
          {detalleError || error}
        </div>
      ) : null}

      <FlujosCotizacionPanel
        flujosCotizacion={detalleGlobal?.flujosCotizacion}
        canManage={canManageSolicitudes}
        loading={submittingFlujo}
        onCerrarFlujo={handleCerrarFlujo}
        onReabrirFlujo={handleReabrirFlujo}
      />

      <div className="grid gap-3 sm:gap-4 md:grid-cols-4">
        <div className="p-3 bg-white border shadow-sm rounded-xl border-slate-200 sm:p-4 md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
            Requerimiento
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">
            {detalleGlobal?.codigo || "-"}
          </p>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            {detalleGlobal?.area?.nombre ||
              detalleGlobal?.areaNombreSnapshot ||
              "-"}
          </p>
        </div>

        <div className="p-3 bg-white border shadow-sm rounded-xl border-slate-200 sm:p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
            Solicitudes activas
          </p>
          <p className="mt-1 text-right text-2xl font-bold text-slate-900 tabular-nums sm:mt-2 sm:text-3xl">
            {formatInteger(activeSolicitudesCount)}
          </p>
        </div>

        <div className="p-3 bg-white border shadow-sm rounded-xl border-slate-200 sm:p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
            Responsable
          </p>
          <p className="mt-1 text-xs font-medium text-slate-900 sm:mt-2 sm:text-sm">
            {detalleGlobal?.responsableLogistica?.nombre || "Sin asignar"}
          </p>
          {detalleGlobal?.requiereReasignacionResponsable ? (
            <p className="mt-1 text-[11px] text-amber-700 sm:mt-2 sm:text-xs">
              Responsable no operativo. La jefatura debe reasignar el caso.
            </p>
          ) : null}
        </div>
      </div>

      {mostrarFormulario ? (
        <section
          id="solicitud-cotizacion-form"
          className="scroll-mt-4"
        >
          <SolicitudCotizacionForm
            initialData={solicitudDraft || { requerimientoId: Number(id) }}
            proveedores={proveedoresActivos}
            requerimientos={requerimientoOption}
            requerimientoDetalle={detalleGlobal}
            onRequerimientoChange={() => {}}
            onSubmit={handleSolicitudSubmit}
            onCancel={handleCloseSolicitudForm}
            submitting={submittingSolicitud}
          />
        </section>
      ) : null}

      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
        <div className="flex flex-col gap-3 px-4 py-3 border-b border-indigo-500 sm:px-5 sm:py-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
              Solicitudes emitidas
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">
              Cada solicitud conserva su documento y su trazabilidad. La
              desactivacion es logica y solo aparece cuando tu perfil puede
              operar el expediente.
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              const next = !mostrarAnuladas;
              setMostrarAnuladas(next);
              if (next && !anuladasCargadas) {
                await cargarSolicitudesAnuladasPorRequerimiento(id);
              }
            }}
            className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            {mostrarAnuladas
              ? "Ocultar desactivadas"
              : "Ver solicitudes desactivadas"}
          </button>
        </div>

        <div className="space-y-2.5 p-3 sm:space-y-3 sm:p-4 md:hidden">
          {cargando ? (
            <div className="px-2 py-5 text-xs text-center text-gray-500 sm:py-6 sm:text-sm">
              Cargando solicitudes de cotizacion...
            </div>
          ) : Array.isArray(solicitudes) && solicitudes.length > 0 ? (
            solicitudes.map((solicitud) => (
              <div
                key={solicitud.id}
                className="p-3 border border-gray-200 rounded-lg sm:p-4"
              >
                <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 break-words sm:text-base">
                      {solicitud.codigo}
                    </p>
                    <p className="mt-0.5 break-words text-xs text-gray-700 sm:mt-1 sm:text-sm">
                      {solicitud.proveedor?.razonSocial || "-"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500 sm:mt-1 sm:text-xs">
                      {formatDate(solicitud.fechaEmision)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <CotizacionEstadoBadge
                      estado={solicitud.estado}
                      tipo="solicitud"
                    />
                    {solicitud.activo === false ? (
                      <p className="mt-1 text-[11px] font-medium text-rose-700 sm:text-xs">
                        Desactivada
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
                  <Link
                    to={`/solicitudes-cotizacion/${solicitud.id}`}
                    state={{ from: location }}
                    className="inline-flex items-center gap-1.5 rounded border border-indigo-300 px-2.5 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs"
                    title="Ver solicitud"
                  >
                    <FaEye className="text-xs" />
                    Ver
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSolicitudSeguimiento(solicitud)}
                    className="inline-flex items-center gap-1.5 rounded border border-emerald-300 px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs"
                    title="Ver cobertura de respuesta"
                  >
                    <FaClipboardCheck className="text-xs" />
                    Estado
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrintSolicitud(solicitud.id)}
                    className="inline-flex items-center gap-1.5 rounded border border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs"
                    title="Imprimir solicitud"
                  >
                    <FaPrint className="text-xs" />
                    Imprimir
                  </button>
                  {canManageSolicitudes && solicitud.activo !== false ? (
                    <button
                      type="button"
                      onClick={() => handleDeactivateSolicitud(solicitud.id)}
                      className="inline-flex items-center gap-1.5 rounded border border-rose-300 px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs"
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
            <div className="px-2 py-5 text-xs text-center text-gray-500 sm:py-6 sm:text-sm">
              Aun no se emitieron solicitudes de cotizacion para este
              requerimiento.
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-center text-gray-600 uppercase">
                  Codigo
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-center text-gray-600 uppercase">
                  Proveedor
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-center text-gray-600 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-center text-gray-600 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-center text-gray-600 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cargando ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-10 text-sm text-center text-gray-500"
                  >
                    Cargando solicitudes de cotizacion...
                  </td>
                </tr>
              ) : Array.isArray(solicitudes) && solicitudes.length > 0 ? (
                solicitudes.map((solicitud) => (
                  <tr key={solicitud.id}>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <p className="font-medium text-gray-900">
                        {solicitud.codigo}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {solicitud.proveedor?.razonSocial || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(solicitud.fechaEmision)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <CotizacionEstadoBadge
                        estado={solicitud.estado}
                        tipo="solicitud"
                      />
                      {solicitud.activo === false ? (
                        <p className="mt-1 text-xs font-medium text-rose-700">
                          Desactivada
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
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
                          onClick={() => setSolicitudSeguimiento(solicitud)}
                          className="inline-flex items-center gap-2 rounded border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                          title="Ver cobertura de respuesta"
                        >
                          <FaClipboardCheck className="text-xs" />
                        </button>
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
                            onClick={() =>
                              handleDeactivateSolicitud(solicitud.id)
                            }
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
                  <td
                    colSpan="5"
                    className="px-4 py-10 text-sm text-center text-gray-500"
                  >
                    Aun no se emitieron solicitudes de cotizacion para este
                    requerimiento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {mostrarAnuladas ? (
          <section className="p-3 border-t border-rose-200 bg-rose-50 sm:p-4">
            <h3 className="text-sm font-semibold text-rose-800">
              Solicitudes desactivadas
            </h3>
            {cargandoAnuladas ? (
              <p className="mt-2 text-sm text-rose-700">
                Cargando solicitudes desactivadas ...
              </p>
            ) : solicitudesAnuladas.length > 0 ? (
              <div className="mt-2 space-y-2">
                {solicitudesAnuladas.map((solicitud) => (
                  <article
                    key={solicitud.id}
                    className="p-3 text-xs bg-white border rounded-lg border-rose-200 sm:text-sm"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {solicitud.codigo}
                        </p>
                        <p className="text-gray-700">
                          {solicitud.proveedor?.razonSocial || "-"}
                        </p>
                      </div>
                      <p className="text-[11px] text-gray-500 sm:text-xs">
                        Desactivada el:{" "}
                        {formatDate(solicitud.fechaInactivacion)}
                      </p>
                    </div>
                    <p>
                      Motivo: {solicitud.motivoInactivacion || "No registrado"}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-rose-700">
                No hay solicitudes desactivadas para este requerimiento.
              </p>
            )}
          </section>
        ) : null}
      </div>

      {solicitudSeguimiento ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 p-3 sm:items-center">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
            {(() => {
              const coverage = buildSolicitudCoverage(solicitudSeguimiento);
              const estadoRespuesta =
                coverage.totalCotizados === 0
                  ? "Sin respuesta"
                  : coverage.totalCotizados >= coverage.totalSolicitados
                    ? "Respondida completa"
                    : "Respuesta parcial";

              return (
                <>
                  <div className="border-b border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {solicitudSeguimiento.codigo}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {solicitudSeguimiento.proveedor?.razonSocial || "-"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSolicitudSeguimiento(null)}
                        className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Cerrar
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="font-semibold text-slate-500">
                          Estado
                        </p>
                        <p className="mt-1 text-slate-900">
                          {estadoRespuesta}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="font-semibold text-slate-500">
                          Items solicitados
                        </p>
                        <p className="mt-1 text-right text-slate-900 tabular-nums">
                          {formatInteger(coverage.totalSolicitados)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="font-semibold text-slate-500">
                          Items cotizados
                        </p>
                        <p className="mt-1 text-right text-slate-900 tabular-nums">
                          {formatInteger(coverage.totalCotizados)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-[55vh] overflow-y-auto p-4">
                    <div className="space-y-2">
                      {coverage.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-1 rounded-lg border border-slate-200 p-3 text-xs sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-medium text-slate-900">
                              {item.descripcion}
                            </p>
                            <p className="text-slate-500">
                              Cantidad:{" "}
                              {item.cantidadRequerida === "-"
                                ? "-"
                                : formatQuantity(item.cantidadRequerida)}{" "}
                              {item.unidadMedida}
                            </p>
                          </div>
                          <span
                            className={`w-fit rounded-full px-2 py-1 font-semibold ${
                              item.cotizado
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {item.cotizado ? "Cotizado" : "Pendiente"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SolicitudesProcesoLogisticoPage;
