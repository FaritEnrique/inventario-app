import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import CotizacionEstadoBadge from "../components/CotizacionEstadoBadge";
import CotizacionForm from "../components/CotizacionForm";
import Loader from "../components/Loader";
import SolicitudCotizacionForm from "../components/SolicitudCotizacionForm";
import { useAuth } from "../context/authContext";
import useCotizaciones from "../hooks/useCotizaciones";
import useLogisticaCotizaciones from "../hooks/useLogisticaCotizaciones";
import useProveedores from "../hooks/useProveedores";
import useSolicitudesCotizacion from "../hooks/useSolicitudesCotizacion";
import {
  canAdjudicateCotizacionesLogistica,
  canAssignCotizacionesLogistica,
  canOperateCotizacionesLogistica,
} from "../utils/cotizacionPermissions";

const formatCurrency = (value) => `S/ ${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "-");

const buildSolicitudDraft = (solicitud, elaboradorIdFallback) => ({
  id: solicitud.id,
  proveedorId: solicitud.proveedorId || solicitud.proveedor?.id,
  requerimientoId: solicitud.requerimientoId,
  elaboradorId: solicitud.elaboradorId || solicitud.elaborador?.id || elaboradorIdFallback,
  cuerpoSolicitud: solicitud.cuerpoSolicitud || "",
  estado: solicitud.estado,
  items: Array.isArray(solicitud.items)
    ? solicitud.items.map((item) => ({ itemRequerimientoId: item.itemRequerimientoId }))
    : [],
});

const buildCotizacionDraft = (cotizacion) => ({
  id: cotizacion.id,
  codigo: cotizacion.codigo,
  solicitudId: cotizacion.solicitudId,
  fechaEmision: cotizacion.fechaEmision,
  estado: cotizacion.estado,
  garantia: cotizacion.garantia || "",
  tiempoEntregaDias: cotizacion.tiempoEntregaDias,
  lugarEntrega: cotizacion.lugarEntrega || "",
  formaPago: cotizacion.formaPago || "",
  items: Array.isArray(cotizacion.items)
    ? cotizacion.items.map((item) => ({
        itemRequerimientoId: item.itemRequerimientoId,
        cantidadOfrecida: item.cantidadOfrecida,
        precioUnidad: item.precioUnidad,
        precioTotal: item.precioTotal,
      }))
    : [],
});

const ProcesoLogisticoDetallePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { proveedores } = useProveedores();
  const {
    cargando,
    error,
    obtenerDetalle,
    obtenerOperadores,
    asignar,
    iniciar,
    marcarListoAdjudicacion,
    generarOrdenCompra,
  } = useLogisticaCotizaciones();
  const {
    crearSolicitud,
    actualizarSolicitud,
    eliminarSolicitud,
  } = useSolicitudesCotizacion({ autoLoad: false });
  const {
    crearCotizacion,
    actualizarCotizacion,
    eliminarCotizacion,
    adjudicarCotizacion,
  } = useCotizaciones({ autoLoad: false });

  const [detalle, setDetalle] = useState(null);
  const [operadores, setOperadores] = useState([]);
  const [solicitudDraft, setSolicitudDraft] = useState(null);
  const [cotizacionDraft, setCotizacionDraft] = useState(null);
  const [responsableId, setResponsableId] = useState("");
  const [submittingSolicitud, setSubmittingSolicitud] = useState(false);
  const [submittingCotizacion, setSubmittingCotizacion] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  const canAssign = canAssignCotizacionesLogistica(user);
  const canAdjudicate = canAdjudicateCotizacionesLogistica(user);

  const load = async () => {
    const data = await obtenerDetalle(id);
    setDetalle(data);
    setResponsableId(String(data?.responsableLogisticaId || ""));
    setSolicitudDraft((prev) => prev || {
      requerimientoId: data.id,
      elaboradorId: user?.id || null,
    });
  };

  useEffect(() => {
    load().catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!canAssign) return;
    obtenerOperadores()
      .then((data) => setOperadores(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [canAssign, obtenerOperadores]);

  const resumenCotizaciones = useMemo(
    () => Array.isArray(detalle?.cotizaciones) ? detalle.cotizaciones : [],
    [detalle?.cotizaciones]
  );

  const handleAsignar = async () => {
    if (!responsableId) return;
    setSubmittingAction(true);
    try {
      const result = await asignar(detalle.id, { responsableId: Number(responsableId) });
      setDetalle(result);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleTomarDirecto = async () => {
    setSubmittingAction(true);
    try {
      const result = await asignar(detalle.id, { responsableId: Number(user.id) });
      setDetalle(result);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleIniciar = async () => {
    setSubmittingAction(true);
    try {
      const result = await iniciar(detalle.id);
      setDetalle(result);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleMarcarListo = async () => {
    setSubmittingAction(true);
    try {
      const result = await marcarListoAdjudicacion(detalle.id);
      setDetalle(result);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleGenerarOrdenCompra = async () => {
    if (!window.confirm("Se generara la orden de compra a partir de la cotizacion adjudicada. Deseas continuar?")) {
      return;
    }

    setSubmittingAction(true);
    try {
      const result = await generarOrdenCompra(detalle.id);
      setDetalle(result.requerimiento);
      toast.success(`Orden de compra ${result.ordenCompra?.codigo || "generada"} correctamente.`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSolicitudSubmit = async (payload) => {
    setSubmittingSolicitud(true);
    try {
      if (solicitudDraft?.id) {
        await actualizarSolicitud(solicitudDraft.id, payload);
      } else {
        await crearSolicitud(payload);
      }
      await load();
      setSolicitudDraft({ requerimientoId: Number(id), elaboradorId: user?.id || null });
    } finally {
      setSubmittingSolicitud(false);
    }
  };

  const handleCotizacionSubmit = async (payload) => {
    setSubmittingCotizacion(true);
    try {
      if (cotizacionDraft?.id) {
        await actualizarCotizacion(cotizacionDraft.id, payload);
      } else {
        await crearCotizacion(payload);
      }
      await load();
      setCotizacionDraft(null);
    } finally {
      setSubmittingCotizacion(false);
    }
  };

  const handleDeleteSolicitud = async (solicitudId) => {
    if (!window.confirm("Se eliminara la solicitud de cotizacion. Deseas continuar?")) {
      return;
    }
    await eliminarSolicitud(solicitudId);
    await load();
  };

  const handleDeleteCotizacion = async (cotizacionId) => {
    if (!window.confirm("Se eliminara la cotizacion. Deseas continuar?")) {
      return;
    }
    await eliminarCotizacion(cotizacionId);
    await load();
  };

  const handleAdjudicar = async (cotizacionId) => {
    if (!window.confirm("Se adjudicara esta propuesta y se descartaran las demas. Deseas continuar?")) {
      return;
    }
    setSubmittingAction(true);
    try {
      const result = await adjudicarCotizacion(cotizacionId);
      if (!result) {
        await load();
      } else {
        await load();
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  if (cargando && !detalle) return <Loader />;

  if (!detalle) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          {error || "No se pudo cargar el expediente logistico."}
        </div>
      </div>
    );
  }

  const requerimientoOption = [
    {
      id: detalle.id,
      codigo: detalle.codigo,
      areaNombreSnapshot: detalle.area?.nombre,
    },
  ];

  const canOperate = canOperateCotizacionesLogistica(user, detalle);
  const expedienteBloqueado = ["ADJUDICADO", "OC_GENERADA"].includes(
    detalle.estadoLogistica
  );
  const canManageDrafts = canOperate && !expedienteBloqueado;
  const menorOfertaId = detalle.resumenComparativo?.menorOferta?.id || null;
  const cotizacionAdjudicadaId =
    detalle.resumenComparativo?.cotizacionAdjudicada?.id || null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expediente logistico</h1>
          <p className="mt-1 text-sm text-gray-600">
            {detalle.codigo} · {detalle.area?.nombre || "Sin area"} · {detalle.solicitante?.nombre || "Sin solicitante"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/requerimientos"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Requerimientos
          </Link>
          <Link
            to="/cotizaciones"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Bandejas logisticas
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Estado logistico</p>
          <div className="mt-3">
            <CotizacionEstadoBadge estado={detalle.estadoLogistica} tipo="logistica" />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Responsable actual</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">{detalle.responsableLogistica?.nombre || "Sin asignar"}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Solicitudes / cotizaciones</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {detalle.resumenComparativo?.totalSolicitudes || 0} / {detalle.resumenComparativo?.totalCotizaciones || 0}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Orden de compra</p>
          {detalle.ordenCompra?.id ? (
            <Link
              to={`/ordenes-compra/${detalle.ordenCompra.id}`}
              className="mt-2 inline-block text-lg font-semibold text-indigo-700 hover:text-indigo-800"
            >
              {detalle.ordenCompra.codigo}
            </Link>
          ) : (
            <p className="mt-2 text-lg font-semibold text-gray-900">No generada</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Datos del requerimiento</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Uso / finalidad</p>
              <p className="mt-1 text-sm text-gray-700">{detalle.usoFinalidad}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ubicacion</p>
              <p className="mt-1 text-sm text-gray-700">{detalle.ubicacionUso}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total referencial</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(detalle.totalReferencial)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Asignado por</p>
              <p className="mt-1 text-sm text-gray-700">{detalle.asignadoPorLogistica?.nombre || "-"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Control logistico</h2>
            {cargando && <Loader size="sm" />}
          </div>

          <div className="mt-4 space-y-4 text-sm">
            {canAssign && (
              <div className="space-y-2 rounded-lg border border-gray-200 p-4">
                <p className="font-medium text-gray-900">Asignacion / reasignacion</p>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={responsableId}
                    name="proceso-logistico-detalle-page-select-359" onChange={(event) => setResponsableId(event.target.value)}
                    className="min-w-[220px] rounded border border-gray-300 px-3 py-2"
                  >
                    <option value="">Selecciona operador</option>
                    {operadores.map((operador) => (
                      <option key={operador.id} value={operador.id}>
                        {operador.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAsignar}
                    disabled={submittingAction || !responsableId}
                    className="rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {detalle.responsableLogisticaId ? "Reasignar" : "Asignar"}
                  </button>
                  <button
                    type="button"
                    onClick={handleTomarDirecto}
                    disabled={submittingAction}
                    className="rounded border border-emerald-300 px-4 py-2 font-medium text-emerald-700 hover:bg-emerald-50"
                  >
                    Procesar directamente
                  </button>
                </div>
              </div>
            )}

            {detalle.estadoLogistica === "ASIGNADO" && (
              <button
                type="button"
                onClick={handleIniciar}
                disabled={submittingAction}
                className="rounded border border-sky-300 px-4 py-2 font-medium text-sky-700 hover:bg-sky-50"
              >
                Iniciar proceso logistico
              </button>
            )}

            {canOperate && !expedienteBloqueado && (
              <button
                type="button"
                onClick={handleMarcarListo}
                disabled={submittingAction || !detalle.resumenComparativo?.totalCotizaciones}
                className="rounded border border-fuchsia-300 px-4 py-2 font-medium text-fuchsia-700 hover:bg-fuchsia-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Dejar listo para adjudicacion
              </button>
            )}

            {canAdjudicate && detalle.puedeGenerarOrdenCompra && (
              <button
                type="button"
                onClick={handleGenerarOrdenCompra}
                disabled={submittingAction}
                className="rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Generar orden de compra
              </button>
            )}

            {detalle.ordenCompra && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                <p className="font-semibold">Orden de compra generada</p>
                <p className="mt-1">{detalle.ordenCompra.codigo} · {formatCurrency(detalle.ordenCompra.montoTotal)}</p>
                {detalle.ordenCompra.id ? (
                  <Link
                    to={`/ordenes-compra/${detalle.ordenCompra.id}`}
                    className="mt-2 inline-block text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
                  >
                    Abrir detalle de la orden de compra
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {canManageDrafts ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <SolicitudCotizacionForm
            initialData={solicitudDraft || { requerimientoId: Number(id), elaboradorId: user?.id || null }}
            proveedores={proveedores.filter((proveedor) => proveedor.activo !== false)}
            requerimientos={requerimientoOption}
            requerimientoDetalle={detalle}
            onRequerimientoChange={() => {}}
            onSubmit={handleSolicitudSubmit}
            onCancel={() => setSolicitudDraft({ requerimientoId: Number(id), elaboradorId: user?.id || null })}
            submitting={submittingSolicitud}
          />

          <CotizacionForm
            initialData={cotizacionDraft}
            solicitudes={detalle.solicitudes || []}
            onSubmit={handleCotizacionSubmit}
            onCancel={() => setCotizacionDraft(null)}
            submitting={submittingCotizacion}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
          {expedienteBloqueado
            ? "El expediente ya fue adjudicado o paso a orden de compra, por lo que ya no admite cambios operativos."
            : "Este expediente se encuentra en modo de consulta para tu perfil. Solo el responsable asignado o la jefatura pueden modificar solicitudes y cotizaciones."}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Solicitudes emitidas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Codigo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Proveedor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {(detalle.solicitudes || []).length > 0 ? (
                  detalle.solicitudes.map((solicitud) => (
                    <tr key={solicitud.id}>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <p className="font-medium text-gray-900">{solicitud.codigo}</p>
                        <p className="text-xs text-gray-500">{formatDate(solicitud.fechaEmision)}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{solicitud.proveedor?.razonSocial || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <CotizacionEstadoBadge estado={solicitud.estado} tipo="solicitud" />
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {canManageDrafts && (
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSolicitudDraft(buildSolicitudDraft(solicitud, user?.id || null))}
                              className="rounded border border-indigo-300 px-3 py-1 text-indigo-700 hover:bg-indigo-50"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSolicitud(solicitud.id)}
                              className="rounded border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-10 text-center text-sm text-gray-500">
                      Aun no se emitieron solicitudes de cotizacion para este requerimiento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Cotizaciones registradas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Codigo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Proveedor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {resumenCotizaciones.length > 0 ? (
                  resumenCotizaciones.map((cotizacion) => (
                    <tr key={cotizacion.id}>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <p className="font-medium text-gray-900">{cotizacion.codigo}</p>
                        <p className="text-xs text-gray-500">{cotizacion.solicitudCodigo || "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{cotizacion.proveedor?.razonSocial || "-"}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(cotizacion.totalOferta)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <CotizacionEstadoBadge estado={cotizacion.estado} />
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <div className="flex flex-wrap justify-end gap-2">
                          {canManageDrafts && (
                            <button
                              type="button"
                              onClick={() => setCotizacionDraft(buildCotizacionDraft(cotizacion))}
                              className="rounded border border-indigo-300 px-3 py-1 text-indigo-700 hover:bg-indigo-50"
                            >
                              Editar
                            </button>
                          )}
                          {canAdjudicate && !expedienteBloqueado && (
                            <button
                              type="button"
                              onClick={() => handleAdjudicar(cotizacion.id)}
                              disabled={submittingAction || cotizacion.estado === "Rechazada" || cotizacion.estado === "Adjudicada"}
                              className="rounded border border-emerald-300 px-3 py-1 text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {cotizacion.estado === "Adjudicada" ? "Adjudicada" : "Adjudicar"}
                            </button>
                          )}
                          {canManageDrafts && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCotizacion(cotizacion.id)}
                              className="rounded border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-sm text-gray-500">
                      Aun no se registraron cotizaciones para este expediente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cuadro comparativo</h2>
            <p className="text-sm text-gray-500">
              Consolidado minimo para decision de jefatura sobre el requerimiento origen.
            </p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Proveedor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Solicitud</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Cotizacion</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Condiciones</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
              {resumenCotizaciones.length > 0 ? (
                resumenCotizaciones.map((cotizacion) => (
                  <tr
                    key={`comparativo-${cotizacion.id}`}
                    className={cotizacion.id === cotizacionAdjudicadaId ? "bg-emerald-50" : ""}
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <p>{cotizacion.proveedor?.razonSocial || "-"}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {cotizacion.id === menorOfertaId && (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            Menor oferta
                          </span>
                        )}
                        {cotizacion.id === cotizacionAdjudicadaId && (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                            Seleccionada
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{cotizacion.solicitudCodigo || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{cotizacion.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <p>Pago: {cotizacion.formaPago || "Sin definir"}</p>
                      <p>Entrega: {cotizacion.tiempoEntregaDias ?? "-"} dias</p>
                      <p>Garantia: {cotizacion.garantia || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(cotizacion.totalOferta)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <CotizacionEstadoBadge estado={cotizacion.estado} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {canAdjudicate && !expedienteBloqueado ? (
                        <button
                          type="button"
                          onClick={() => handleAdjudicar(cotizacion.id)}
                          disabled={submittingAction || cotizacion.estado === "Rechazada" || cotizacion.estado === "Adjudicada"}
                          className="rounded border border-emerald-300 px-3 py-1 text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {cotizacion.estado === "Adjudicada" ? "Adjudicada" : "Adjudicar"}
                        </button>
                      ) : cotizacion.id === cotizacionAdjudicadaId ? (
                        <span className="font-medium text-emerald-700">Ganadora</span>
                      ) : (
                        <span className="text-gray-500">En evaluacion</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-sm text-gray-500">
                    Aun no hay informacion suficiente para un cuadro comparativo.
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

export default ProcesoLogisticoDetallePage;

