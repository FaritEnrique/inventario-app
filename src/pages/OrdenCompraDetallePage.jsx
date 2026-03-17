import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import OrdenCompraEstadoBadge from "../components/OrdenCompraEstadoBadge";
import { useAuth } from "../context/authContext";
import useOrdenesCompra from "../hooks/useOrdenesCompra";
import {
  canApproveOrdenCompra,
  canManageOrdenCompraLifecycle,
} from "../utils/ordenCompraPermissions";

const formatCurrency = (value) => `S/ ${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "-");
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "-";

const finalReceptionStates = new Set([
  "CANCELADA",
  "CERRADA",
  "COMPLETAMENTE_RECIBIDA",
]);

const buildRequerimientos = (ordenCompra) => {
  const map = new Map();

  (ordenCompra?.items || []).forEach((item) => {
    const requerimiento = item?.requerimiento;
    if (!requerimiento?.id) return;
    map.set(requerimiento.id, requerimiento);
  });

  return Array.from(map.values());
};

const requestOptionalText = (message, defaultValue = "") => {
  const value = window.prompt(message, defaultValue);
  if (value === null) return null;
  return value.trim();
};

const approvalActionLabels = {
  APROBADA: "aprobar",
  RECHAZADA: "rechazar",
};

const OrdenCompraDetallePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const {
    loading,
    error,
    obtenerOrdenCompraPorId,
    actualizarAprobacionOrdenCompra,
    cerrarOrdenCompra,
    cancelarOrdenCompra,
  } = useOrdenesCompra();
  const [ordenCompra, setOrdenCompra] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState({
    type: "",
    message: "",
  });

  const load = useCallback(async () => {
    const data = await obtenerOrdenCompraPorId(id);
    setOrdenCompra(data);
  }, [id, obtenerOrdenCompraPorId]);

  useEffect(() => {
    setActionFeedback({ type: "", message: "" });
    load().catch((loadError) => {
      toast.error(loadError.message || "No se pudo cargar la orden de compra.");
    });
  }, [load]);

  const requerimientos = useMemo(
    () => buildRequerimientos(ordenCompra),
    [ordenCompra]
  );

  const canApprove = canApproveOrdenCompra(user);
  const canManageLifecycle = canManageOrdenCompraLifecycle(user);
  const isReceptionFinal = finalReceptionStates.has(ordenCompra?.estadoRecepcion);
  const hasPendingBalance = Number(ordenCompra?.resumen?.totalPendiente || 0) > 0;
  const hasAcceptedReception = Number(ordenCompra?.resumen?.totalAceptado || 0) > 0;
  const allowApprovalAction =
    canApprove &&
    Boolean(ordenCompra?.requiereAprobacionGerenciaGeneral) &&
    !isReceptionFinal;
  const allowCloseAction =
    canManageLifecycle && !isReceptionFinal && hasPendingBalance;
  const allowCancelAction =
    canManageLifecycle &&
    !isReceptionFinal &&
    !hasAcceptedReception &&
    ordenCompra?.estadoRecepcion !== "COMPLETAMENTE_RECIBIDA";

  const runAction = async (operation, successMessage) => {
    setSubmittingAction(true);
    try {
      setActionFeedback({ type: "", message: "" });
      const data = await operation();
      setOrdenCompra(data);
      setActionFeedback({ type: "success", message: successMessage });
      toast.success(successMessage);
    } catch (actionError) {
      const message =
        actionError.message || "No se pudo completar la accion solicitada.";
      setActionFeedback({ type: "error", message });
      toast.error(message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleApproval = async (estadoAprobacion) => {
    const actionLabel = approvalActionLabels[estadoAprobacion] || "actualizar";

    if (
      !window.confirm(
        `Se ${actionLabel} la orden de compra ${ordenCompra.codigo} en Gerencia General. Deseas continuar?`
      )
    ) {
      return;
    }

    await runAction(
      () =>
        actualizarAprobacionOrdenCompra(ordenCompra.id, {
          estadoAprobacion,
        }),
      `Orden de compra ${estadoAprobacion.toLowerCase()} correctamente.`
    );
  };

  const handleClose = async (estadoRecepcionFinal) => {
    const decisionSaldoPendiente = requestOptionalText(
      "Describe brevemente la decision sobre el saldo pendiente (opcional).",
      estadoRecepcionFinal === "INCUMPLIDA"
        ? "Cierre por incumplimiento del proveedor."
        : "Saldo pendiente cerrado manualmente."
    );

    if (decisionSaldoPendiente === null) return;

    const motivoIncidencia = requestOptionalText(
      "Motivo o incidencia adicional (opcional).",
      ""
    );

    if (
      !window.confirm(
        `Se registrara el cierre documental ${estadoRecepcionFinal.toLowerCase()} para la orden ${ordenCompra.codigo}. Deseas continuar?`
      )
    ) {
      return;
    }

    await runAction(
      () =>
        cerrarOrdenCompra(ordenCompra.id, {
          estadoRecepcionFinal,
          decisionSaldoPendiente: decisionSaldoPendiente || undefined,
          motivoIncidencia: motivoIncidencia || undefined,
        }),
      "Cierre documental registrado correctamente."
    );
  };

  const handleCancel = async () => {
    const decisionSaldoPendiente = requestOptionalText(
      "Describe brevemente la razon de cancelacion (opcional).",
      "Orden de compra cancelada antes de la recepcion."
    );

    if (decisionSaldoPendiente === null) return;

    const motivoIncidencia = requestOptionalText(
      "Motivo o incidencia adicional (opcional).",
      ""
    );

    if (
      !window.confirm(
        `Se cancelara la orden de compra ${ordenCompra.codigo}. Deseas continuar?`
      )
    ) {
      return;
    }

    await runAction(
      () =>
        cancelarOrdenCompra(ordenCompra.id, {
          decisionSaldoPendiente: decisionSaldoPendiente || undefined,
          motivoIncidencia: motivoIncidencia || undefined,
        }),
      "Orden de compra cancelada correctamente."
    );
  };

  if (loading && !ordenCompra) return <Loader />;

  if (!ordenCompra) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          {error || "No se pudo cargar la orden de compra."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Detalle de orden de compra
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {ordenCompra.codigo} · {ordenCompra.proveedor?.razonSocial || "Sin proveedor"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/ordenes-compra"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Listado de OCs
          </Link>
          <Link
            to="/inventario-recepciones"
            className="rounded border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
          >
            Recepciones
          </Link>
          <Link
            to="/dashboard"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Estado de aprobacion
          </p>
          <div className="mt-3">
            <OrdenCompraEstadoBadge
              estado={ordenCompra.estadoAprobacion}
              tipo="aprobacion"
            />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Estado de recepcion
          </p>
          <div className="mt-3">
            <OrdenCompraEstadoBadge
              estado={ordenCompra.estadoRecepcion}
              tipo="recepcion"
            />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Monto total
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(ordenCompra.montoTotal)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Notas de ingreso
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {ordenCompra.resumen?.totalNotasIngreso || 0}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Cabecera documental</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Fecha de emision
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {formatDate(ordenCompra.fechaEmision)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Requiere GG
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {ordenCompra.requiereAprobacionGerenciaGeneral ? "Si" : "No"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Fecha aprobacion GG
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {formatDateTime(ordenCompra.fechaAprobacionGerenciaGeneral)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Aprobado por
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {ordenCompra.aprobadoPorGerenciaGeneral?.nombre || "-"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Proveedor
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {ordenCompra.proveedor?.razonSocial || "-"} · {" "}
                {ordenCompra.proveedor?.ruc || "Sin RUC"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Requerimientos origen
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {requerimientos.length > 0 ? (
                requerimientos.map((requerimiento) => (
                  <Link
                    key={requerimiento.id}
                    to={`/requerimientos/${requerimiento.id}`}
                    className="rounded border border-indigo-200 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50"
                  >
                    {requerimiento.codigo}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No hay requerimientos visibles vinculados en el detalle actual.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Acciones disponibles
            </h2>
            {submittingAction ? <Loader size="sm" /> : null}
          </div>

          {actionFeedback.message ? (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                actionFeedback.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {actionFeedback.message}
            </div>
          ) : null}

          <div className="mt-4 space-y-4">
            {allowApprovalAction ? (
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">
                  Aprobacion de Gerencia General
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Esta accion usa el mismo endpoint para aprobar o rechazar la
                  orden, segun la decision final de Gerencia General.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleApproval("APROBADA")}
                    disabled={submittingAction}
                    className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproval("RECHAZADA")}
                    disabled={submittingAction}
                    className="rounded border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ) : null}

            {allowCloseAction ? (
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">
                  Cierre documental
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Usa esta accion para cerrar un saldo pendiente sin recepcion
                  completa, o para registrar incumplimiento documental del
                  proveedor.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleClose("CERRADA")}
                    disabled={submittingAction}
                    className="rounded border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                  >
                    Cerrar manualmente
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClose("INCUMPLIDA")}
                    disabled={submittingAction}
                    className="rounded border border-orange-300 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-60"
                  >
                    Marcar incumplida
                  </button>
                </div>
              </div>
            ) : null}

            {allowCancelAction ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-medium text-rose-900">
                  Cancelacion
                </p>
                <p className="mt-1 text-sm text-rose-800">
                  Solo disponible si aun no existen recepciones aceptadas ni
                  cierre final del documento.
                </p>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submittingAction}
                  className="mt-3 rounded border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  Cancelar orden
                </button>
              </div>
            ) : null}

            {!allowApprovalAction && !allowCloseAction && !allowCancelAction ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                No hay acciones manuales habilitadas para tu perfil o para el estado
                actual de esta orden.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Cumplimiento documental
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Total ordenado
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {ordenCompra.resumen?.totalOrdenado || 0}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Total aceptado
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {ordenCompra.resumen?.totalAceptado || 0}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Total rechazado
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {ordenCompra.resumen?.totalRechazado || 0}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Total pendiente
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {ordenCompra.resumen?.totalPendiente || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Trazabilidad basica
            </h2>
            <Link
              to="/inventario-recepciones"
              className="text-sm font-medium text-sky-700 hover:text-sky-800"
            >
              Ir a recepciones
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {(ordenCompra.notasIngreso || []).length > 0 ? (
              ordenCompra.notasIngreso.map((notaIngreso) => (
                <div
                  key={notaIngreso.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/inventario-notas-ingreso/${notaIngreso.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {notaIngreso.codigo}
                      </Link>
                      <p className="text-sm text-gray-600">
                        {formatDate(notaIngreso.fechaRecepcion)} · {" "}
                        {notaIngreso.almacen?.nombre || "Sin almacen"}
                      </p>
                    </div>
                    <OrdenCompraEstadoBadge
                      estado={notaIngreso.estado}
                      tipo="recepcion"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-700">
                    Aceptado: {notaIngreso.resumen?.totalAceptado || 0} ·
                    Rechazado: {notaIngreso.resumen?.totalRechazado || 0} ·
                    Pendiente: {notaIngreso.resumen?.totalPendiente || 0}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                Aun no existen notas de ingreso vinculadas a esta orden.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Lineas principales</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Requerimiento
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Cantidades
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Precio
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Recepcion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {(ordenCompra.items || []).map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <p className="font-medium text-gray-900">
                      {item.producto?.nombre || "-"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.producto?.codigo || "Sin codigo"} · {" "}
                      {item.producto?.unidadMedida || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.requerimiento?.id ? (
                      <Link
                        to={`/requerimientos/${item.requerimiento.id}`}
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        {item.requerimiento.codigo}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <p>Ordenada: {item.cantidadOrdenada}</p>
                    <p>Aceptada: {item.cantidadAceptada}</p>
                    <p>Pendiente: {item.cantidadPendiente}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <p>{formatCurrency(item.precioUnidad)}</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="space-y-2">
                      <OrdenCompraEstadoBadge
                        estado={item.estadoRecepcion}
                        tipo="recepcion"
                      />
                      {item.recepciones?.length > 0 ? (
                        <p className="text-xs text-gray-500">
                          {item.recepciones.length} recepcion(es) documentadas
                        </p>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrdenCompraDetallePage;

