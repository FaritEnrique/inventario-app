import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  canApproveOrdenCompraStageEffective,
  canManageOrdenCompraLifecycleEffective,
} from "../accessRules";
import AnularOrdenCompraModal from "../components/AnularOrdenCompraModal";
import Loader from "../components/Loader";
import OrdenCompraEstadoBadge from "../components/OrdenCompraEstadoBadge";
import OrdenCompraDetalleSkeleton from "../components/ui/skeletons/OrdenCompraDetalleSkeleton";
import { useAuth } from "../context/authContext";
import useAppDialog from "../hooks/useAppDialog";
import useOrdenesCompra from "../hooks/useOrdenesCompra";
import {
  canAnularOrdenCompra,
  getCausalAnulacionOrdenCompraLabel,
} from "../utils/ordenCompraAnulacionUi";
import { canViewOrdenCompraPdf } from "../utils/ordenCompraPdfUi";

const formatCurrency = (value, currency = "PEN") => {
  const normalizedCurrency = String(currency || "PEN").toUpperCase();
  const prefix =
    normalizedCurrency === "USD"
      ? "US$"
      : normalizedCurrency === "PEN"
        ? "S/"
        : normalizedCurrency;

  return `${prefix} ${Number(value || 0).toFixed(2)}`;
};
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "-";
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "-";
const finalReceptionStates = new Set([
  "CANCELADA",
  "CERRADA",
  "COMPLETAMENTE_RECIBIDA",
]);

const approvalLabels = {
  GERENCIA_ADMINISTRACION: "Gerencia de administracion",
  GERENCIA_GENERAL: "Gerencia general",
  JEFATURA_LOGISTICA: "Jefatura de logistica",
};

const buildRequerimientos = (ordenCompra) => {
  const map = new Map();

  (ordenCompra?.items || []).forEach((item) => {
    const requerimiento = item?.requerimiento;
    if (!requerimiento?.id) return;
    map.set(requerimiento.id, requerimiento);
  });

  return Array.from(map.values());
};

const buildOrigenDocumental = (ordenCompra) => {
  const origen = ordenCompra?.origenDocumental || {};
  const buenaPro = ordenCompra?.buenaPro || origen.buenaPro || null;
  const comparativo =
    ordenCompra?.comparativoBase || origen.comparativo || null;

  if (ordenCompra?.buenaProId || buenaPro || origen.tipo === "BUENA_PRO") {
    return {
      label: "Buena Pro",
      detailLabel: "Codigo Buena Pro",
      detailValue: buenaPro?.codigo || "-",
    };
  }

  if (
    ordenCompra?.comparativoId ||
    comparativo?.codigo ||
    origen.tipo === "COMPARATIVO"
  ) {
    return {
      label: "Origen no vigente",
      detailLabel: "Comparativo referencial",
      detailValue: comparativo?.codigo || "-",
    };
  }

  return {
    label: "No determinado",
    detailLabel: "",
    detailValue: "",
  };
};

const OrdenCompraDetallePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { confirm, prompt, dialogNode } = useAppDialog();
  const {
    loading,
    error,
    obtenerOrdenCompraPorId,
    obtenerOrdenCompraPdfBlob,
    actualizarAprobacionOrdenCompra,
    cerrarOrdenCompra,
    cancelarOrdenCompra,
    anularOrdenCompra,
  } = useOrdenesCompra();
  const [ordenCompra, setOrdenCompra] = useState(null);
  const [annulModalOpen, setAnnulModalOpen] = useState(false);
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
    [ordenCompra],
  );
  const origenDocumental = useMemo(
    () => buildOrigenDocumental(ordenCompra),
    [ordenCompra],
  );

  const canApprove = canApproveOrdenCompraStageEffective(user, ordenCompra);
  const canManageLifecycle = canManageOrdenCompraLifecycleEffective(user);
  const isOrdenCompraActiva = ordenCompra?.activo !== false;
  const isOrdenCompraAnulada = ordenCompra?.estadoAprobacion === "ANULADA";
  const isOrdenCompraDesdeBuenaPro = Boolean(
    ordenCompra?.buenaProId ||
      ordenCompra?.buenaPro ||
      ordenCompra?.origenDocumental?.tipo === "BUENA_PRO",
  );
  const isReceptionFinal = finalReceptionStates.has(
    ordenCompra?.estadoRecepcion,
  );
  const hasPendingBalance =
    Number(ordenCompra?.resumen?.totalPendiente || 0) > 0;
  const hasAcceptedReception =
    Number(ordenCompra?.resumen?.totalAceptado || 0) > 0;
  const allowApprovalAction =
    isOrdenCompraActiva &&
    !isOrdenCompraAnulada &&
    canApprove &&
    ordenCompra?.estadoAprobacion === "PENDIENTE_APROBACION" &&
    !isReceptionFinal;
  const allowCloseAction =
    isOrdenCompraActiva &&
    !isOrdenCompraAnulada &&
    canManageLifecycle &&
    !isReceptionFinal &&
    hasPendingBalance;
  const allowCancelAction =
    isOrdenCompraActiva &&
    !isOrdenCompraAnulada &&
    canManageLifecycle &&
    !isReceptionFinal &&
    !hasAcceptedReception &&
    ordenCompra?.estadoRecepcion !== "COMPLETAMENTE_RECIBIDA";
  const allowAnnulAction =
    canManageLifecycle && canAnularOrdenCompra(ordenCompra);
  const allowPdfAction = canViewOrdenCompraPdf(ordenCompra);
  const hasAnulacionInfo =
    isOrdenCompraAnulada ||
    Boolean(
      ordenCompra?.fechaAnulacion ||
        ordenCompra?.motivoAnulacion ||
        ordenCompra?.causalAnulacion ||
        ordenCompra?.anuladoPor,
    );

  const runAction = async (operation, successMessage) => {
    setSubmittingAction(true);
    try {
      setActionFeedback({ type: "", message: "" });
      const data = await operation();
      if (data?.id) {
        setOrdenCompra(data);
      } else {
        await load();
      }
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

  const handleAnnul = async (payload) => {
    setSubmittingAction(true);
    try {
      setActionFeedback({ type: "", message: "" });
      const data = await anularOrdenCompra(ordenCompra.id, payload);

      if (data?.id) {
        setOrdenCompra(data);
      } else {
        await load();
      }

      setAnnulModalOpen(false);
      setActionFeedback({
        type: "success",
        message: "Orden de Compra anulada correctamente.",
      });
      toast.success("Orden de Compra anulada correctamente.");
    } catch (actionError) {
      const message =
        actionError.message || "No se pudo anular la Orden de Compra.";
      setActionFeedback({ type: "error", message });
      toast.error(message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenPdf = async () => {
    if (!canViewOrdenCompraPdf(ordenCompra)) {
      toast.error(
        "No se pudo obtener el PDF formal. Verifique que la Orden de Compra esté aprobada.",
      );
      return;
    }

    setSubmittingAction(true);

    try {
      const pdfBlob = await obtenerOrdenCompraPdfBlob(ordenCompra.id);
      const safeBlob =
        pdfBlob?.type === "application/pdf"
          ? pdfBlob
          : new Blob([pdfBlob], { type: "application/pdf" });

      const blobUrl = URL.createObjectURL(safeBlob);
      const pdfWindow = window.open(blobUrl, "_blank", "noopener,noreferrer");

      if (!pdfWindow) {
        URL.revokeObjectURL(blobUrl);
        toast.error("No se pudo abrir el PDF formal de la Orden de Compra.");
        return;
      }

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (pdfError) {
      toast.error(
        pdfError?.message ||
          "No se pudo obtener el PDF formal de la Orden de Compra.",
      );
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleApproval = async () => {
    const currentLevelLabel =
      approvalLabels[ordenCompra?.nivelPendienteActual] ||
      ordenCompra?.nivelPendienteActual ||
      "el nivel pendiente";

    const confirmed = await confirm({
      title: "Aprobar orden de compra",
      message: `Se aprobara la orden de compra ${ordenCompra.codigo} en ${currentLevelLabel}. Deseas continuar?`,
      confirmText: "Aprobar",
      variant: "default",
    });

    if (!confirmed) {
      return;
    }

    await runAction(
      () =>
        actualizarAprobacionOrdenCompra(ordenCompra.id, {
          estadoAprobacion: "APROBADA",
        }),
      "Orden de compra aprobada correctamente.",
    );
  };

  const handleClose = async (estadoRecepcionFinal) => {
    const decisionSaldoPendiente = await prompt({
      title: "Decision sobre saldo pendiente",
      message: "Describe brevemente la decision sobre el saldo pendiente (opcional).",
      defaultValue:
        estadoRecepcionFinal === "INCUMPLIDA"
          ? "Cierre por incumplimiento del proveedor."
          : "Saldo pendiente cerrado manualmente.",
      placeholder: "Decision sobre el saldo pendiente",
      variant: "warning",
    });

    if (decisionSaldoPendiente === null) return;

    const motivoIncidencia = await prompt({
      title: "Incidencia adicional",
      message: "Motivo o incidencia adicional (opcional).",
      defaultValue: "",
      placeholder: "Motivo o incidencia opcional",
      variant: "warning",
    });

    const confirmed = await confirm({
      title: "Registrar cierre documental",
      message: `Se registrara el cierre documental ${estadoRecepcionFinal.toLowerCase()} para la orden ${ordenCompra.codigo}. Deseas continuar?`,
      confirmText: "Registrar cierre",
      variant: "warning",
    });

    if (!confirmed) {
      return;
    }

    await runAction(
      () =>
        cerrarOrdenCompra(ordenCompra.id, {
          estadoRecepcionFinal,
          decisionSaldoPendiente: decisionSaldoPendiente.trim() || undefined,
          motivoIncidencia: motivoIncidencia.trim() || undefined,
        }),
      "Cierre documental registrado correctamente.",
    );
  };

  const handleCancel = async () => {
    const decisionSaldoPendiente = await prompt({
      title: "Cancelar orden de compra",
      message: "Describe brevemente la razon de cancelacion (opcional).",
      defaultValue: "Orden de compra cancelada antes de la recepcion.",
      placeholder: "Razon de cancelacion",
      variant: "danger",
    });

    if (decisionSaldoPendiente === null) return;

    const motivoIncidencia = await prompt({
      title: "Incidencia adicional",
      message: "Motivo o incidencia adicional (opcional).",
      defaultValue: "",
      placeholder: "Motivo o incidencia opcional",
      variant: "danger",
    });

    const confirmed = await confirm({
      title: "Confirmar cancelacion",
      message: `Se cancelara la orden de compra ${ordenCompra.codigo}. Deseas continuar?`,
      confirmText: "Cancelar orden",
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    await runAction(
      () =>
        cancelarOrdenCompra(ordenCompra.id, {
          decisionSaldoPendiente: decisionSaldoPendiente.trim() || undefined,
          motivoIncidencia: motivoIncidencia.trim() || undefined,
        }),
      "Orden de compra cancelada correctamente.",
    );
  };

  if (loading && !ordenCompra) return <OrdenCompraDetalleSkeleton />;

  if (!ordenCompra) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          {error || "No se pudo cargar la orden de compra."}
        </div>
      </div>
    );
  }

  const snapshotFormal = ordenCompra.snapshotFormal || {};
  const snapshotRoute = snapshotFormal.rutaAprobacionSnapshot || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {dialogNode}
      <AnularOrdenCompraModal
        open={annulModalOpen}
        ordenCompra={ordenCompra}
        submitting={submittingAction}
        onCancel={() => {
          if (!submittingAction) setAnnulModalOpen(false);
        }}
        onConfirm={handleAnnul}
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Detalle de orden de compra
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {ordenCompra.codigo} ·{" "}
            {ordenCompra.proveedor?.razonSocial || "Sin proveedor"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {allowPdfAction ? (
            <button
              type="button"
              onClick={handleOpenPdf}
              disabled={submittingAction}
              title="Disponible solo para Órdenes de Compra aprobadas."
              className="rounded border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
            >
              Ver PDF formal
            </button>
          ) : null}
          <Link
            to="/ordenes-compra"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Listado de OCs
          </Link>
          <Link
            to="/ordenes-compra?view=aprobacion"
            className="rounded border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Bandeja de aprobacion
          </Link>
          <Link
            to="/inventario-recepciones"
            className="rounded border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
          >
            Recepciones
          </Link>
        </div>
      </div>

      {hasAnulacionInfo ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Anulación lógica
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Causal
              </p>
              <p className="mt-1 text-sm text-slate-800">
                {getCausalAnulacionOrdenCompraLabel(
                  ordenCompra.causalAnulacion,
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fecha
              </p>
              <p className="mt-1 text-sm text-slate-800">
                {formatDateTime(ordenCompra.fechaAnulacion)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Usuario
              </p>
              <p className="mt-1 text-sm text-slate-800">
                {ordenCompra.anuladoPor?.nombre ||
                  ordenCompra.anuladoPorNombre ||
                  ordenCompra.anuladoPorId ||
                  "-"}
              </p>
            </div>
            <div className="md:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Motivo
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                {ordenCompra.motivoAnulacion || "-"}
              </p>
            </div>
          </div>
        </div>
      ) : null}

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
          {ordenCompra.nivelPendienteActual ? (
            <p className="mt-2 text-sm text-gray-700">
              Pendiente:{" "}
              {approvalLabels[ordenCompra.nivelPendienteActual] ||
                ordenCompra.nivelPendienteActual}
            </p>
          ) : null}
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
            {formatCurrency(ordenCompra.montoTotal, ordenCompra.moneda)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Origen documental
          </p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {origenDocumental.label}
          </p>
          {origenDocumental.detailLabel ? (
            <p className="mt-1 text-sm text-gray-600">
              {origenDocumental.detailLabel}: {origenDocumental.detailValue}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Cabecera documental
          </h2>
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
                Proveedor
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {ordenCompra.proveedor?.razonSocial || "-"} ·{" "}
                {ordenCompra.proveedor?.ruc || "Sin RUC"}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Snapshot formal
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="text-sm text-gray-700">
                <p className="font-medium text-gray-900">Logistica</p>
                <p>{snapshotFormal.aprobadorLogisticaNombreSnapshot || "-"}</p>
              </div>
              <div className="text-sm text-gray-700">
                <p className="font-medium text-gray-900">Administración</p>
                <p>
                  {snapshotFormal.aprobadorAdministracionNombreSnapshot || "-"}
                </p>
              </div>
              <div className="text-sm text-gray-700">
                <p className="font-medium text-gray-900">Gerencia general</p>
                <p>
                  {snapshotFormal.aprobadorGerenciaGeneralNombreSnapshot || "-"}
                </p>
              </div>
              <div className="text-sm text-gray-700">
                <p className="font-medium text-gray-900">Umbral GG</p>
                <p>
                  {snapshotFormal.requiereGerenciaGeneralSnapshot
                    ? `Si · ${formatCurrency(
                        snapshotFormal.umbralGerenciaGeneralSnapshot || 0,
                        ordenCompra.moneda,
                      )}`
                    : "No aplica"}
                </p>
              </div>
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
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-sm font-medium text-indigo-900">
                  Aprobacion pendiente real
                </p>
                <p className="mt-1 text-sm text-indigo-800">
                  Esta orden esta pendiente en{" "}
                  {approvalLabels[ordenCompra.nivelPendienteActual] ||
                    ordenCompra.nivelPendienteActual}
                  .
                </p>
                {isOrdenCompraDesdeBuenaPro ? (
                  <p className="mt-2 text-sm text-indigo-800">
                    Si la orden no debe continuar, use anulacion logica con
                    motivo y causal.
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleApproval}
                    disabled={submittingAction}
                    className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            ) : null}

            {allowCloseAction ? (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-sm font-medium text-indigo-900">
                  Cierre documental
                </p>
                <p className="mt-1 text-sm text-indigo-800">
                  Registra el cierre si ya no se recibira el saldo pendiente.
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
                <p className="text-sm font-medium text-rose-900">Cancelacion</p>
                <p className="mt-1 text-sm text-rose-800">
                  Solo disponible si aun no existen recepciones aceptadas ni
                  cierre final.
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

            {allowAnnulAction ? (
              <div className="rounded-lg border border-slate-300 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">
                  Anulación lógica
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  Disponible solo antes de aprobación final y antes de iniciar
                  la recepción.
                </p>
                <button
                  type="button"
                  onClick={() => setAnnulModalOpen(true)}
                  disabled={submittingAction}
                  className="mt-3 rounded border border-slate-400 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-60"
                >
                  Anular Orden de Compra
                </button>
              </div>
            ) : null}

            {!allowApprovalAction &&
            !allowCloseAction &&
            !allowCancelAction &&
            !allowAnnulAction ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                No hay acciones manuales habilitadas para tu perfil o para el
                estado actual.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Ruta de aprobacion
          </h2>
          <span className="text-sm text-gray-500"></span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {snapshotRoute.map((step) => (
            <div
              key={`${step.orden}-${step.nivel}`}
              className={`rounded-lg border p-4 text-sm ${
                step.esPendienteActual
                  ? "border-indigo-300 bg-indigo-50"
                  : step.satisfecho
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-gray-200 bg-white"
              }`}
            >
              <p className="font-semibold text-gray-900">
                {approvalLabels[step.nivel] || step.nivel}
              </p>
              <p className="mt-1 text-gray-700">
                {step.aprobadorNombre || "-"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {step.estado || "PENDIENTE"}
              </p>
            </div>
          ))}
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
          <h2 className="text-lg font-semibold text-gray-900">
            Historial de orden de compra
          </h2>
          <div className="mt-4 space-y-3">
            {(ordenCompra.historialAprobacion || []).length > 0 ? (
              ordenCompra.historialAprobacion.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-gray-200 p-4 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">
                      {approvalLabels[entry.nivel] || entry.nivel} ·{" "}
                      {entry.tipoEvento}
                    </p>
                    <p className="text-gray-500">
                      {formatDateTime(entry.fechaAccion)}
                    </p>
                  </div>
                  <p className="mt-1 text-gray-700">
                    Actor: {entry.actor?.nombre || "-"}
                  </p>
                  {entry.comentario ? (
                    <p className="mt-1 text-gray-700">{entry.comentario}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                Aun no hay historial visible para esta orden.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Requerimientos origen
        </h2>
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
              No hay requerimientos visibles vinculados.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        {(ordenCompra.items || []).map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="font-semibold text-gray-900">
              {item.producto?.nombre || "-"}
            </p>
            <p className="text-xs text-gray-500">
              {item.producto?.codigo || "Sin codigo"} ·{" "}
              {item.producto?.unidadMedida || "-"}
            </p>
            <div className="mt-3 grid gap-2 text-sm text-gray-700">
              <p>Ordenada: {item.cantidadOrdenada}</p>
              <p>Aceptada: {item.cantidadAceptada}</p>
              <p>Pendiente: {item.cantidadPendiente}</p>
              <p>
                Precio:{" "}
                {formatCurrency(item.precioUnidad, ordenCompra.moneda)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Lineas principales
          </h2>
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
                      {item.producto?.codigo || "Sin codigo"} ·{" "}
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
                    <p>{formatCurrency(item.precioUnidad, ordenCompra.moneda)}</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(item.subtotal, ordenCompra.moneda)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <OrdenCompraEstadoBadge
                      estado={item.estadoRecepcion}
                      tipo="recepcion"
                    />
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
