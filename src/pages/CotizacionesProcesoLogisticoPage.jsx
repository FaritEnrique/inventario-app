import React, { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { FaEdit, FaEye, FaFileSignature, FaPrint } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  canAssignCotizacionesLogisticaEffective,
  canOperateCotizacionesLogisticaEffective,
  hasAdminOverrideEffective,
} from "../accessRules";
import CotizacionForm from "../components/CotizacionForm";
import Modal from "../components/Modal";
import { useAuth } from "../context/authContext";
import useCotizaciones from "../hooks/useCotizaciones";
import useLogisticaCotizaciones from "../hooks/useLogisticaCotizaciones";
import {
  formatCurrency,
  formatInteger,
  formatQuantity,
} from "../utils/numberFormatters";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";

const getActiveCotizacionForSolicitud = (solicitud) =>
  Array.isArray(solicitud?.cotizaciones)
    ? solicitud.cotizaciones.find((cotizacion) => cotizacion.activo !== false)
    : null;

const normalizeItemResponse = (value) =>
  String(value || "").toUpperCase() === "COTIZADO" ? "COTIZADO" : "NO_COTIZA";

const getSolicitudItemId = (item) =>
  Number(item?.itemRequerimientoId || item?.itemRequerimiento?.id || item?.id || 0);

const getItemDescription = (item) =>
  item?.itemRequerimiento?.descripcionVisible ||
  item?.descripcionVisible ||
  item?.itemRequerimiento?.producto?.nombre ||
  item?.producto?.nombre ||
  item?.itemRequerimiento?.productoTemporal?.nombre ||
  item?.productoTemporal?.nombre ||
  "Item sin descripcion";

const getItemQuantity = (item) =>
  item?.itemRequerimiento?.cantidadRequerida ?? item?.cantidadRequerida ?? null;

const getItemUnit = (item) =>
  item?.itemRequerimiento?.unidadMedida || item?.unidadMedida || "";

const buildCotizacionResponseSummary = (cotizacion, solicitudes = []) => {
  const solicitud =
    solicitudes.find(
      (item) => Number(item.id) === Number(cotizacion?.solicitudId || 0),
    ) || null;
  const solicitudItems = Array.isArray(solicitud?.items) ? solicitud.items : [];
  const cotizacionItems = Array.isArray(cotizacion?.items) ? cotizacion.items : [];
  const cotizacionItemsById = new Map(
    cotizacionItems.map((item) => [Number(item.itemRequerimientoId || 0), item]),
  );
  const baseItems = solicitudItems.length ? solicitudItems : cotizacionItems;

  const items = baseItems.map((solicitudItem) => {
    const itemId = getSolicitudItemId(solicitudItem);
    const cotizacionItem = cotizacionItemsById.get(itemId) || null;
    const response = normalizeItemResponse(cotizacionItem?.estadoRespuesta);

    return {
      itemRequerimientoId: itemId,
      descripcionVisible: getItemDescription(cotizacionItem || solicitudItem),
      cantidadRequerida: getItemQuantity(solicitudItem),
      unidadMedida: getItemUnit(cotizacionItem || solicitudItem),
      cotiza: response === "COTIZADO",
      cantidadOfrecida: cotizacionItem?.cantidadOfrecida ?? null,
      precioUnidad: cotizacionItem?.precioUnidad ?? null,
      precioTotal: cotizacionItem?.precioTotal ?? null,
      descripcionTecnicaOfertada:
        cotizacionItem?.descripcionTecnicaOfertada || "",
    };
  });

  cotizacionItems.forEach((cotizacionItem) => {
    const itemId = Number(cotizacionItem.itemRequerimientoId || 0);
    if (!itemId || items.some((item) => Number(item.itemRequerimientoId) === itemId)) {
      return;
    }

    const response = normalizeItemResponse(cotizacionItem.estadoRespuesta);
    items.push({
      itemRequerimientoId: itemId,
      descripcionVisible: getItemDescription(cotizacionItem),
      cantidadRequerida: getItemQuantity(cotizacionItem),
      unidadMedida: getItemUnit(cotizacionItem),
      cotiza: response === "COTIZADO",
      cantidadOfrecida: cotizacionItem.cantidadOfrecida ?? null,
      precioUnidad: cotizacionItem.precioUnidad ?? null,
      precioTotal: cotizacionItem.precioTotal ?? null,
      descripcionTecnicaOfertada:
        cotizacionItem.descripcionTecnicaOfertada || "",
    });
  });

  const totalItems = items.length;
  const totalCotizados = items.filter((item) => item.cotiza).length;
  const scope =
    totalItems > 0 && totalCotizados === totalItems
      ? "TOTAL"
      : totalCotizados > 0
        ? "PARCIAL"
        : "SIN_COTIZACION";
  const scopeLabel =
    scope === "TOTAL"
      ? "Total"
      : scope === "PARCIAL"
        ? "Parcial"
        : "Sin cotizacion";
  const scopeClassName =
    scope === "TOTAL"
      ? "bg-emerald-100 text-emerald-700"
      : scope === "PARCIAL"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-700";

  return {
    responseLabel: "Respondida",
    scope,
    scopeLabel,
    scopeClassName,
    totalItems,
    totalCotizados,
    items,
  };
};

const buildCotizacionDraft = (cotizacion) => ({
  id: cotizacion.id,
  codigo: cotizacion.codigo,
  solicitudId: cotizacion.solicitudId,
  fechaEmision: cotizacion.fechaEmision,
  estado: cotizacion.estado,
  garantia: cotizacion.garantia || "",
  tiempoEntregaDias: cotizacion.tiempoEntregaDias,
  vigenciaOfertaDias: cotizacion.vigenciaOfertaDias,
  lugarEntrega: cotizacion.lugarEntrega || "",
  formaPagoLocalPropuesta: cotizacion.formaPagoLocalPropuesta || "",
  diasCreditoLocalPropuesto: cotizacion.diasCreditoLocalPropuesto || "",
  porcentajeAnticipoLocalPropuesto:
    cotizacion.porcentajeAnticipoLocalPropuesto || "",
  porcentajeSaldoLocalPropuesto: cotizacion.porcentajeSaldoLocalPropuesto || "",
  observacionPagoLocalPropuesta: cotizacion.observacionPagoLocalPropuesta || "",
  estructuraPagoImportacionPropuesta:
    cotizacion.estructuraPagoImportacionPropuesta || "",
  instrumentoPagoImportacionPropuesta:
    cotizacion.instrumentoPagoImportacionPropuesta || "",
  gatilloPagoImportacionPropuesta: cotizacion.gatilloPagoImportacionPropuesta || "",
  porcentajeAnticipoImportacionPropuesto:
    cotizacion.porcentajeAnticipoImportacionPropuesto || "",
  porcentajeSaldoImportacionPropuesto:
    cotizacion.porcentajeSaldoImportacionPropuesto || "",
  diasCreditoImportacionPropuesto:
    cotizacion.diasCreditoImportacionPropuesto || "",
  referenciaPlazoImportacionPropuesta:
    cotizacion.referenciaPlazoImportacionPropuesta || "",
  gastosBancariosPorPropuesto: cotizacion.gastosBancariosPorPropuesto || "",
  documentosPagoImportacionPropuestos:
    cotizacion.documentosPagoImportacionPropuestos || "",
  observacionPagoImportacionPropuesta:
    cotizacion.observacionPagoImportacionPropuesta || "",
  observaciones: cotizacion.observaciones || "",
  items: Array.isArray(cotizacion.items)
    ? cotizacion.items.map((item) => ({
        itemRequerimientoId: item.itemRequerimientoId,
        estadoRespuesta: item.estadoRespuesta || "COTIZADO",
        cantidadOfrecida: item.cantidadOfrecida,
        precioUnidad: item.precioUnidad,
        precioTotal: item.precioTotal,
        descripcionTecnicaOfertada: item.descripcionTecnicaOfertada || "",
      }))
    : [],
});

const createCotizacionDraftFromSolicitud = (solicitud) => ({
  solicitudId: solicitud?.id ? String(solicitud.id) : "",
  fechaEmision: new Date().toISOString().slice(0, 10),
  estado: "Pendiente",
  garantia: "",
  tiempoEntregaDias: "",
  vigenciaOfertaDias: "",
  lugarEntrega: "",
  formaPagoLocalPropuesta: "",
  diasCreditoLocalPropuesto: "",
  porcentajeAnticipoLocalPropuesto: "",
  porcentajeSaldoLocalPropuesto: "",
  observacionPagoLocalPropuesta: "",
  estructuraPagoImportacionPropuesta: "",
  instrumentoPagoImportacionPropuesta: "",
  gatilloPagoImportacionPropuesta: "",
  porcentajeAnticipoImportacionPropuesto: "",
  porcentajeSaldoImportacionPropuesto: "",
  diasCreditoImportacionPropuesto: "",
  referenciaPlazoImportacionPropuesta: "",
  gastosBancariosPorPropuesto: "",
  documentosPagoImportacionPropuestos: "",
  observacionPagoImportacionPropuesta: "",
  observaciones: "",
  items: Array.isArray(solicitud?.items)
    ? solicitud.items.map((item) => ({
        itemRequerimientoId: Number(item.itemRequerimientoId),
        estadoRespuesta: "COTIZADO",
        cantidadOfrecida: String(
          Number(item.itemRequerimiento?.cantidadRequerida || 0),
        ),
        precioUnidad: "",
        precioTotal: 0,
        descripcionTecnicaOfertada: "",
      }))
    : [],
});

const CotizacionesProcesoLogisticoPage = () => {
  const { user } = useAuth();
  const {
    id,
    detalleGlobal,
    setDetalleGlobal,
    recargarDetalle,
    loading,
    error,
  } = useOutletContext();
  const { cerrarCotizaciones, reabrirCotizaciones } = useLogisticaCotizaciones();
  const {
    crearCotizacion,
    actualizarCotizacion,
    obtenerCotizacionPdfUrl,
  } = useCotizaciones({ autoLoad: false });

  const [cotizacionDraft, setCotizacionDraft] = useState(null);
  const [detalleCotizacion, setDetalleCotizacion] = useState(null);
  const [submittingCotizacion, setSubmittingCotizacion] = useState(false);
  const [submittingCierre, setSubmittingCierre] = useState(false);
  const [cierreDialog, setCierreDialog] = useState(null);

  const resumen = detalleGlobal?.resumenComparativo || {};
  const coberturaItems = Array.isArray(resumen.coberturaItems)
    ? resumen.coberturaItems
    : [];
  const solicitudes = useMemo(
    () =>
      Array.isArray(detalleGlobal?.solicitudes)
        ? detalleGlobal.solicitudes.filter((solicitud) => solicitud.activo !== false)
        : [],
    [detalleGlobal?.solicitudes],
  );
  const cotizaciones = useMemo(
    () =>
      Array.isArray(detalleGlobal?.cotizaciones)
        ? detalleGlobal.cotizaciones.filter((cotizacion) => cotizacion.activo !== false)
        : [],
    [detalleGlobal?.cotizaciones],
  );
  const cotizacionesConResumen = useMemo(
    () =>
      cotizaciones.map((cotizacion) => ({
        cotizacion,
        resumenRespuesta: buildCotizacionResponseSummary(cotizacion, solicitudes),
      })),
    [cotizaciones, solicitudes],
  );
  const solicitudesPendientes = useMemo(
    () =>
      solicitudes.filter((solicitud) => !getActiveCotizacionForSolicitud(solicitud)),
    [solicitudes],
  );

  const coverageMinimum = Number(resumen.coberturaMinimaPorItem || 0);
  const flujoRegular = detalleGlobal?.modalidadFlujoLogistico === "REGULAR";
  const etapaCerrada = detalleGlobal?.cotizacionesCerradas === true;
  const coberturaCompleta =
    coberturaItems.length > 0 &&
    coberturaItems.every((item) => item.cumpleCoberturaValida);
  const itemsIncompletos = coberturaItems.filter(
    (item) => !item.cumpleCoberturaValida,
  );
  const cierreJustificado =
    etapaCerrada && flujoRegular && !coberturaCompleta;

  const canAssign = canAssignCotizacionesLogisticaEffective(user);
  const canOperate = canOperateCotizacionesLogisticaEffective(user);
  const isAdminUser = hasAdminOverrideEffective(user);
  const responsableActualId =
    detalleGlobal?.responsableLogisticaId ||
    detalleGlobal?.responsableLogistica?.id ||
    null;
  const assignedToCurrentUser =
    Number(responsableActualId || 0) === Number(user?.id || 0);
  const assignedToOtherResponsable =
    Number(responsableActualId || 0) > 0 && !assignedToCurrentUser;
  const expedienteBloqueado = ["ADJUDICADO", "OC_GENERADA"].includes(
    detalleGlobal?.estadoLogistica,
  );
  const canManage =
    canOperate &&
    !expedienteBloqueado &&
    Boolean(detalleGlobal?.modalidadFlujoLogistico) &&
    (!assignedToOtherResponsable ||
      !canAssign ||
      assignedToCurrentUser ||
      isAdminUser);

  const refreshDetalle = async () => {
    if (recargarDetalle) {
      return recargarDetalle();
    }
    return null;
  };

  const handleRegisterCotizacion = (solicitud) => {
    setCotizacionDraft(createCotizacionDraftFromSolicitud(solicitud));
    window.setTimeout(() => {
      document.getElementById("cotizacion-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const handleEditCotizacion = (cotizacion) => {
    setCotizacionDraft(buildCotizacionDraft(cotizacion));
    window.setTimeout(() => {
      document.getElementById("cotizacion-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const handleSubmitCotizacion = async (payload) => {
    setSubmittingCotizacion(true);
    try {
      if (cotizacionDraft?.id) {
        await actualizarCotizacion(cotizacionDraft.id, payload);
      } else {
        await crearCotizacion(payload);
      }
      setCotizacionDraft(null);
      await refreshDetalle();
    } finally {
      setSubmittingCotizacion(false);
    }
  };

  const handleCerrarEtapa = () => {
    if (flujoRegular && !coberturaCompleta) {
      setCierreDialog({ type: "cerrar-incompleto", motivo: "" });
      return;
    }

    setCierreDialog({ type: "cerrar", motivo: "" });
  };

  const handleReabrirEtapa = () => {
    setCierreDialog({ type: "reabrir", motivo: "" });
  };

  const handleCloseCierreDialog = () => {
    if (submittingCierre) return;
    setCierreDialog(null);
  };

  const handleConfirmCierreDialog = async () => {
    if (!cierreDialog) return;

    const motivo = cierreDialog.motivo.trim();
    const isCierreIncompleto = cierreDialog.type === "cerrar-incompleto";
    const isReapertura = cierreDialog.type === "reabrir";

    if (isCierreIncompleto && !motivo) {
      toast.error("Debe registrar una justificacion para cerrar incompleto.");
      return;
    }

    setSubmittingCierre(true);
    try {
      const result = isReapertura
        ? await reabrirCotizaciones(id, {
            motivo: motivo || null,
          })
        : await cerrarCotizaciones(id, {
            motivo: isCierreIncompleto ? motivo : null,
            confirmarCierreIncompleto: isCierreIncompleto,
          });

      setDetalleGlobal?.(result);
      setCierreDialog(null);
      toast.success(
        isReapertura
          ? "Etapa de cotizacion reabierta correctamente."
          : "Etapa de cotizacion cerrada correctamente.",
      );
    } finally {
      setSubmittingCierre(false);
    }
  };

  if (loading && !detalleGlobal) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  const cierreDialogTitle =
    cierreDialog?.type === "reabrir"
      ? "Reabrir etapa de cotizacion"
      : cierreDialog?.type === "cerrar-incompleto"
        ? "Cerrar con cobertura incompleta"
        : "Cerrar etapa de cotizacion";
  const cierreDialogMessage =
    cierreDialog?.type === "reabrir"
      ? "La etapa volvera a quedar disponible para registrar o editar cotizaciones."
      : cierreDialog?.type === "cerrar-incompleto"
        ? `Este expediente no cumple la regla minima de ${coverageMinimum} cotizaciones validas por item. Para cerrar y pasar a comparativo con las cotizaciones existentes, registra una justificacion.`
        : "Se cerrara la etapa de cotizacion y se habilitara el comparativo.";
  const cierreRequiresMotivo = cierreDialog?.type === "cerrar-incompleto";
  const cierreShowsMotivo =
    cierreDialog?.type === "cerrar-incompleto" || cierreDialog?.type === "reabrir";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold leading-snug text-gray-900 sm:text-2xl">
            Cotizaciones recibidas del proceso logistico
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm">
            Controla la cobertura por item, registra respuestas de proveedores
            y cierra la etapa antes de pasar al comparativo.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {etapaCerrada ? (
            <Link
              to={`/cotizaciones/proceso/${id}/comparativos`}
              className="inline-flex items-center justify-center rounded border border-indigo-500 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Ir a comparativo
            </Link>
          ) : null}
          {canManage ? (
            etapaCerrada ? (
              <button
                type="button"
                onClick={handleReabrirEtapa}
                disabled={submittingCierre}
                className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Reabrir etapa
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCerrarEtapa}
                disabled={submittingCierre}
                className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Cerrar etapa de cotizacion
              </button>
            )
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {cierreJustificado ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Esta etapa fue cerrada con cobertura incompleta. Motivo:{" "}
          {detalleGlobal?.motivoCierreCotizaciones || "No registrado"}.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Solicitudes emitidas
          </p>
          <p className="mt-2 text-right text-2xl font-bold text-slate-900 tabular-nums">
            {formatInteger(resumen.totalSolicitudes)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Proveedores con respuesta
          </p>
          <p className="mt-2 text-right text-2xl font-bold text-slate-900 tabular-nums">
            {formatInteger(resumen.proveedoresConRespuesta)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Cobertura minima
          </p>
          <p className="mt-2 text-right text-2xl font-bold text-slate-900 tabular-nums">
            {coverageMinimum ? formatInteger(coverageMinimum) : "-"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Estado
          </p>
          <p
            className={`mt-2 text-sm font-semibold ${
              etapaCerrada
                ? "text-indigo-700"
                : coberturaCompleta
                  ? "text-emerald-700"
                  : "text-amber-700"
            }`}
          >
            {etapaCerrada
              ? "Etapa cerrada"
              : coberturaCompleta
                ? "Lista para cerrar"
                : "Cobertura pendiente"}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-indigo-500 p-4">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Cobertura por item
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            En flujo regular, cada item debe tener al menos{" "}
            {formatInteger(coverageMinimum || 3)}{" "}
            cotizaciones validas para cierre conforme.
          </p>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                  Item
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                  Solicitudes
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                  Cotizaciones validas
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {coberturaItems.map((item) => (
                <tr key={item.itemRequerimientoId}>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {item.descripcionVisible}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-700 tabular-nums">
                    {formatInteger(item.coberturaInvitada)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-700 tabular-nums">
                    {formatInteger(item.coberturaValida)}/
                    {item.coverageMinimum ? formatInteger(item.coverageMinimum) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        item.cumpleCoberturaValida
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.cumpleCoberturaValida ? "Completo" : "Pendiente"}
                    </span>
                  </td>
                </tr>
              ))}
              {!coberturaItems.length ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-sm text-slate-500">
                    No hay items para evaluar cobertura.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 p-3 md:hidden">
          {coberturaItems.map((item) => (
            <article
              key={item.itemRequerimientoId}
              className="rounded-lg border border-slate-200 p-3 text-xs"
            >
              <p className="font-semibold text-slate-900">
                {item.descripcionVisible}
              </p>
              <p className="mt-1 text-slate-600">
                Solicitudes: {formatInteger(item.coberturaInvitada)}
              </p>
              <p className="text-slate-600">
                Cotizaciones validas: {formatInteger(item.coberturaValida)}/
                {item.coverageMinimum ? formatInteger(item.coverageMinimum) : "-"}
              </p>
              <span
                className={`mt-2 inline-flex rounded-full px-2 py-1 font-semibold ${
                  item.cumpleCoberturaValida
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {item.cumpleCoberturaValida ? "Completo" : "Pendiente"}
              </span>
            </article>
          ))}
        </div>
      </section>

      {cotizacionDraft ? (
        <section id="cotizacion-form" className="scroll-mt-4">
          <CotizacionForm
            initialData={cotizacionDraft}
            solicitudes={solicitudes}
            lockedSolicitudId={cotizacionDraft.solicitudId}
            onSubmit={handleSubmitCotizacion}
            onCancel={() => setCotizacionDraft(null)}
            submitting={submittingCotizacion}
          />
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-indigo-500 p-4">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Cotizaciones registradas
          </h2>
        </div>
        <div className="divide-y divide-slate-200">
          {cotizacionesConResumen.length > 0 ? (
            cotizacionesConResumen.map(({ cotizacion, resumenRespuesta }) => (
              <article
                key={cotizacion.id}
                className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {cotizacion.codigo}
                  </p>
                  <p className="text-sm text-slate-600">
                    {cotizacion.proveedor?.razonSocial || "-"} ·{" "}
                    {formatDate(cotizacion.fechaEmision)}
                  </p>
                  <p className="text-left text-sm font-medium text-slate-800 tabular-nums md:text-right">
                    {formatCurrency(cotizacion.totalOferta)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                    {resumenRespuesta.responseLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDetalleCotizacion({ cotizacion, resumenRespuesta })}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${resumenRespuesta.scopeClassName}`}
                    title="Ver detalle de items cotizados"
                  >
                    <FaEye />
                    {resumenRespuesta.scopeLabel} -{" "}
                    {formatInteger(resumenRespuesta.totalCotizados)}/
                    {formatInteger(resumenRespuesta.totalItems)}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        obtenerCotizacionPdfUrl(cotizacion.id),
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                    className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <FaPrint />
                    Imprimir
                  </button>
                  {canManage && !etapaCerrada ? (
                    <button
                      type="button"
                      onClick={() => handleEditCotizacion(cotizacion)}
                      className="inline-flex items-center gap-2 rounded border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                    >
                      <FaEdit />
                      Editar
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <p className="p-6 text-center text-sm text-slate-500">
              Aun no se registraron cotizaciones para este expediente.
            </p>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-indigo-500 p-4">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Solicitudes pendientes de respuesta
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Registra aqui las respuestas que ingresan antes de cerrar la etapa.
          </p>
        </div>
        <div className="divide-y divide-slate-200">
          {solicitudesPendientes.length > 0 ? (
            solicitudesPendientes.map((solicitud) => (
              <article
                key={solicitud.id}
                className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {solicitud.codigo}
                  </p>
                  <p className="text-sm text-slate-600">
                    {solicitud.proveedor?.razonSocial || "-"} · emitida el{" "}
                    {formatDate(solicitud.fechaEmision)}
                  </p>
                </div>
                {canManage && !etapaCerrada ? (
                  <button
                    type="button"
                    onClick={() => handleRegisterCotizacion(solicitud)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded border border-indigo-500 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 sm:w-fit"
                  >
                    <FaFileSignature />
                    Registrar cotizacion
                  </button>
                ) : null}
              </article>
            ))
          ) : (
            <p className="p-6 text-center text-sm text-slate-500">
              No hay solicitudes pendientes de respuesta activa.
            </p>
          )}
        </div>
      </section>

      {itemsIncompletos.length > 0 && !etapaCerrada ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Para cierre conforme faltan cotizaciones validas en{" "}
          {formatInteger(itemsIncompletos.length)} item(s). Si agotaste la gestion con
          proveedores, puedes cerrar con justificacion desde esta pantalla.
        </div>
      ) : null}

      {detalleCotizacion ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:max-w-5xl sm:rounded-2xl">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Detalle de respuesta
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  {detalleCotizacion.cotizacion.codigo}
                </h3>
                <p className="text-sm text-slate-600">
                  {detalleCotizacion.cotizacion.proveedor?.razonSocial || "-"} -{" "}
                  {formatDate(detalleCotizacion.cotizacion.fechaEmision)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      obtenerCotizacionPdfUrl(detalleCotizacion.cotizacion.id),
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <FaPrint />
                  Imprimir cotizacion
                </button>
                <button
                  type="button"
                  onClick={() => setDetalleCotizacion(null)}
                  className="rounded border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="max-h-[calc(92vh-98px)] overflow-y-auto p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Estado
                  </p>
                  <p className="mt-1 font-semibold text-sky-700">
                    {detalleCotizacion.resumenRespuesta.responseLabel}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Alcance
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {detalleCotizacion.resumenRespuesta.scopeLabel}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Items que cotizan
                  </p>
                  <p className="mt-1 text-right font-semibold text-slate-900 tabular-nums">
                    {formatInteger(detalleCotizacion.resumenRespuesta.totalCotizados)}/
                    {formatInteger(detalleCotizacion.resumenRespuesta.totalItems)}
                  </p>
                </div>
              </div>

              <div className="mt-4 hidden overflow-x-auto rounded-lg border border-slate-200 md:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                        Item
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                        Estado
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                        Cant. req.
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                        Cant. ofert.
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                        P. unit.
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {detalleCotizacion.resumenRespuesta.items.map((item) => (
                      <tr key={item.itemRequerimientoId}>
                        <td className="px-3 py-3 text-sm text-slate-700">
                          <p>{item.descripcionVisible}</p>
                          {item.descripcionTecnicaOfertada ? (
                            <p className="mt-1 text-xs text-slate-500">
                              {item.descripcionTecnicaOfertada}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 text-center text-sm">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              item.cotiza
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {item.cotiza ? "Cotiza" : "No cotiza"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-slate-700 tabular-nums">
                          {item.cantidadRequerida === null
                            ? "-"
                            : formatQuantity(item.cantidadRequerida)}
                          {item.unidadMedida ? ` ${item.unidadMedida}` : ""}
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-slate-700 tabular-nums">
                          {item.cotiza ? formatQuantity(item.cantidadOfrecida) : "-"}
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-slate-700 tabular-nums">
                          {item.cotiza ? formatCurrency(item.precioUnidad) : "-"}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-medium text-slate-800 tabular-nums">
                          {item.cotiza ? formatCurrency(item.precioTotal) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-2 md:hidden">
                {detalleCotizacion.resumenRespuesta.items.map((item) => (
                  <article
                    key={item.itemRequerimientoId}
                    className="rounded-lg border border-slate-200 p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-slate-900">
                        {item.descripcionVisible}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                          item.cotiza
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.cotiza ? "Cotiza" : "No cotiza"}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <span>Cant. req.</span>
                      <span className="text-right tabular-nums">
                        {item.cantidadRequerida === null
                          ? "-"
                          : formatQuantity(item.cantidadRequerida)}
                        {item.unidadMedida ? ` ${item.unidadMedida}` : ""}
                      </span>
                      <span>Cant. ofert.</span>
                      <span className="text-right tabular-nums">
                        {item.cotiza ? formatQuantity(item.cantidadOfrecida) : "-"}
                      </span>
                      <span>P. unit.</span>
                      <span className="text-right tabular-nums">
                        {item.cotiza ? formatCurrency(item.precioUnidad) : "-"}
                      </span>
                      <span>Total</span>
                      <span className="text-right font-semibold tabular-nums text-slate-900">
                        {item.cotiza ? formatCurrency(item.precioTotal) : "-"}
                      </span>
                    </div>
                    {item.descripcionTecnicaOfertada ? (
                      <p className="mt-2 text-xs text-slate-500">
                        {item.descripcionTecnicaOfertada}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        isOpen={Boolean(cierreDialog)}
        onClose={handleCloseCierreDialog}
        title={cierreDialogTitle}
        maxWidth="max-w-lg"
        closeOnBackdrop={!submittingCierre}
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">
            {cierreDialogMessage}
          </p>

          {cierreDialog?.type === "cerrar" ? (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-800">
              Confirma solo cuando las cotizaciones ya esten listas para
              continuar con el comparativo.
            </div>
          ) : null}

          {cierreShowsMotivo ? (
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                {cierreRequiresMotivo
                  ? "Justificacion obligatoria"
                  : "Motivo de reapertura"}
              </span>
              <textarea
                value={cierreDialog?.motivo || ""}
                onChange={(event) =>
                  setCierreDialog((current) =>
                    current
                      ? { ...current, motivo: event.target.value }
                      : current,
                  )
                }
                disabled={submittingCierre}
                rows={4}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                placeholder={
                  cierreRequiresMotivo
                    ? "Explica por que se cerrara sin cumplir la cobertura minima."
                    : "Opcional: registra el motivo de reapertura."
                }
              />
            </label>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCloseCierreDialog}
              disabled={submittingCierre}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmCierreDialog}
              disabled={submittingCierre}
              className={`rounded px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                cierreDialog?.type === "reabrir"
                  ? "bg-slate-700 hover:bg-slate-800"
                  : cierreDialog?.type === "cerrar-incompleto"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {submittingCierre
                ? "Procesando..."
                : cierreDialog?.type === "reabrir"
                  ? "Reabrir etapa"
                  : "Cerrar etapa"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CotizacionesProcesoLogisticoPage;
