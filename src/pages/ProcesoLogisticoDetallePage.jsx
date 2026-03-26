import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  canAdjudicateCotizacionesLogisticaEffective,
  canAssignCotizacionesLogisticaEffective,
  canOperateCotizacionesLogisticaEffective,
} from "../accessRules";
import ComparativoEstadoBadge from "../components/ComparativoEstadoBadge";
import CotizacionEstadoBadge from "../components/CotizacionEstadoBadge";
import CotizacionForm from "../components/CotizacionForm";
import Loader from "../components/Loader";
import SolicitudCotizacionForm from "../components/SolicitudCotizacionForm";
import { useAuth } from "../context/authContext";
import useCotizaciones from "../hooks/useCotizaciones";
import useLogisticaCotizaciones from "../hooks/useLogisticaCotizaciones";
import useProveedores from "../hooks/useProveedores";
import useSolicitudesCotizacion from "../hooks/useSolicitudesCotizacion";

const formatCurrency = (value) => `S/ ${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "-");
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "-";

const createEmptyComparativoDraft = () => ({
  observaciones: "",
  cotizacionIdsConsideradas: [],
  cotizacionSeleccionadaId: "",
  criterioAdjudicacion: "",
});

const createEmptyFlujoDraft = () => ({
  modalidadFlujoLogistico: "",
  causalFlujoExcepcional: "",
  justificacionFlujoExcepcional: "",
});

const buildFlujoDraft = (detalle) => ({
  modalidadFlujoLogistico: detalle?.modalidadFlujoLogistico || "",
  causalFlujoExcepcional: detalle?.causalFlujoExcepcional || "",
  justificacionFlujoExcepcional: detalle?.justificacionFlujoExcepcional || "",
});

const createEmptyDecisionExcepcionalDraft = () => ({
  cotizacionId: "",
  comentario: "",
});

const buildComparativoDraft = (comparativo) => ({
  observaciones: comparativo?.observaciones || "",
  cotizacionIdsConsideradas: Array.isArray(
    comparativo?.cotizacionesConsideradasSnapshot?.cotizaciones
  )
    ? comparativo.cotizacionesConsideradasSnapshot.cotizaciones.map((item) =>
        String(item.cotizacionId)
      )
    : [],
  cotizacionSeleccionadaId:
    comparativo?.cotizacionSeleccionadaSnapshot?.cotizacionId !== undefined &&
    comparativo?.cotizacionSeleccionadaSnapshot?.cotizacionId !== null
      ? String(comparativo.cotizacionSeleccionadaSnapshot.cotizacionId)
      : "",
  criterioAdjudicacion:
    comparativo?.criterioAdjudicacionSnapshot?.resumen ||
    (typeof comparativo?.criterioAdjudicacionSnapshot === "string"
      ? comparativo.criterioAdjudicacionSnapshot
      : ""),
});

const comparativoCanEdit = (comparativo) =>
  !comparativo ||
  ["BORRADOR", "OBSERVADO"].includes(
    String(comparativo?.estadoDocumento || "").toUpperCase()
  );

const ADJUDICACION_DIRECTA_EXCEPCIONAL_VIA =
  "ADJUDICACION_DIRECTA_EXCEPCIONAL";

const getComparativoDecisionMeta = (comparativo) => {
  if (!comparativo || comparativo.estadoDocumento !== "APROBADO") {
    return null;
  }

  const criterio = comparativo.criterioAdjudicacionSnapshot || null;
  const via =
    criterio?.via === ADJUDICACION_DIRECTA_EXCEPCIONAL_VIA
      ? "EXCEPCIONAL"
      : "ORDINARIA";

  return {
    via,
    criterio,
    cotizacionId: Number(
      comparativo?.cotizacionSeleccionadaSnapshot?.cotizacionId || 0
    ),
  };
};

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
    definirFlujo,
    obtenerComparativo,
    obtenerOperadores,
    asignar,
    iniciar,
    formalizarDecisionExcepcional,
    marcarListoAdjudicacion,
    crearComparativo,
    actualizarComparativo,
    aprobarComparativo,
    observarComparativo,
    rechazarComparativo,
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
  } = useCotizaciones({ autoLoad: false });

  const [detalle, setDetalle] = useState(null);
  const [operadores, setOperadores] = useState([]);
  const [solicitudDraft, setSolicitudDraft] = useState(null);
  const [cotizacionDraft, setCotizacionDraft] = useState(null);
  const [flujoDraft, setFlujoDraft] = useState(createEmptyFlujoDraft);
  const [decisionExcepcionalDraft, setDecisionExcepcionalDraft] = useState(
    createEmptyDecisionExcepcionalDraft
  );
  const [comparativo, setComparativo] = useState(null);
  const [comparativoDraft, setComparativoDraft] = useState(createEmptyComparativoDraft);
  const [responsableId, setResponsableId] = useState("");
  const [submittingSolicitud, setSubmittingSolicitud] = useState(false);
  const [submittingCotizacion, setSubmittingCotizacion] = useState(false);
  const [submittingComparativo, setSubmittingComparativo] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  const canAssign = canAssignCotizacionesLogisticaEffective(user);
  const canAdjudicate = canAdjudicateCotizacionesLogisticaEffective(user);

  const load = async () => {
    const [data, comparativoData] = await Promise.all([
      obtenerDetalle(id),
      obtenerComparativo(id),
    ]);
    setDetalle(data);
    setFlujoDraft(buildFlujoDraft(data));
    setDecisionExcepcionalDraft({
      cotizacionId: data?.cotizacionSeleccionadaExcepcionalId
        ? String(data.cotizacionSeleccionadaExcepcionalId)
        : "",
      comentario: "",
    });
    setComparativo(comparativoData);
    setComparativoDraft(
      comparativoData
        ? buildComparativoDraft(comparativoData)
        : createEmptyComparativoDraft()
    );
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
  const comparativoDecisionMeta = useMemo(
    () => getComparativoDecisionMeta(comparativo),
    [comparativo]
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
    if (
      !window.confirm(
        "Se generara la orden de compra a partir de la decision formal vigente del expediente. Deseas continuar?"
      )
    ) {
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

  const handleGuardarFlujo = async () => {
    const modalidad = flujoDraft.modalidadFlujoLogistico;

    if (!modalidad) {
      toast.error("Debes seleccionar una modalidad de flujo logistico.");
      return;
    }

    if (
      modalidad === "EXCEPCIONAL" &&
      !flujoDraft.causalFlujoExcepcional
    ) {
      toast.error("Debes seleccionar una causal para el flujo excepcional.");
      return;
    }

    if (
      modalidad === "EXCEPCIONAL" &&
      ["URGENCIA", "EMERGENCIA"].includes(flujoDraft.causalFlujoExcepcional) &&
      !flujoDraft.justificacionFlujoExcepcional.trim()
    ) {
      toast.error(
        "La justificacion es obligatoria para URGENCIA o EMERGENCIA."
      );
      return;
    }

    setSubmittingAction(true);
    try {
      const result = await definirFlujo(detalle.id, {
        modalidadFlujoLogistico: modalidad,
        causalFlujoExcepcional:
          modalidad === "EXCEPCIONAL"
            ? flujoDraft.causalFlujoExcepcional || null
            : null,
        justificacionFlujoExcepcional:
          modalidad === "EXCEPCIONAL"
            ? flujoDraft.justificacionFlujoExcepcional.trim() || null
            : null,
      });
      setDetalle(result);
      await load();
      toast.success("Flujo logistico definido correctamente.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleFormalizarDecisionExcepcional = async () => {
    if (!decisionExcepcionalDraft.cotizacionId) {
      toast.error(
        "Debes seleccionar una cotizacion para formalizar la decision excepcional."
      );
      return;
    }

    if (
      !window.confirm(
        "Se formalizara la decision excepcional del expediente con la cotizacion seleccionada. Deseas continuar?"
      )
    ) {
      return;
    }

    setSubmittingAction(true);
    try {
      await formalizarDecisionExcepcional(detalle.id, {
        cotizacionId: Number(decisionExcepcionalDraft.cotizacionId),
        comentario: decisionExcepcionalDraft.comentario.trim() || null,
      });
      await load();
      toast.success("Decision excepcional formalizada correctamente.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const toggleCotizacionConsiderada = (cotizacionId) => {
    const normalizedId = String(cotizacionId);
    setComparativoDraft((prev) => ({
      ...prev,
      cotizacionIdsConsideradas: prev.cotizacionIdsConsideradas.includes(normalizedId)
        ? prev.cotizacionIdsConsideradas.filter((idValue) => idValue !== normalizedId)
        : [...prev.cotizacionIdsConsideradas, normalizedId],
      cotizacionSeleccionadaId:
        prev.cotizacionSeleccionadaId === normalizedId &&
        prev.cotizacionIdsConsideradas.includes(normalizedId)
          ? ""
          : prev.cotizacionSeleccionadaId,
    }));
  };

  const handleComparativoSubmit = async (event) => {
    event.preventDefault();

    if (!comparativoDraft.cotizacionIdsConsideradas.length) {
      toast.error("Debes considerar al menos una cotizacion en el comparativo.");
      return;
    }

    if (
      comparativoDraft.cotizacionSeleccionadaId &&
      !comparativoDraft.cotizacionIdsConsideradas.includes(
        comparativoDraft.cotizacionSeleccionadaId
      )
    ) {
      toast.error(
        "La cotizacion seleccionada debe formar parte del conjunto considerado."
      );
      return;
    }

    const payload = {
      observaciones: comparativoDraft.observaciones.trim() || null,
      cotizacionIdsConsideradas: comparativoDraft.cotizacionIdsConsideradas.map((value) =>
        Number(value)
      ),
      cotizacionSeleccionadaId: comparativoDraft.cotizacionSeleccionadaId
        ? Number(comparativoDraft.cotizacionSeleccionadaId)
        : null,
      criterioAdjudicacion: comparativoDraft.criterioAdjudicacion.trim() || null,
    };

    setSubmittingComparativo(true);
    try {
      const saved = comparativo?.id
        ? await actualizarComparativo(comparativo.id, payload)
        : await crearComparativo(id, payload);

      setComparativo(saved);
      setComparativoDraft(buildComparativoDraft(saved));
      toast.success(
        comparativo?.id
          ? "Comparativo formal actualizado."
          : "Comparativo formal creado."
      );
      await load();
    } finally {
      setSubmittingComparativo(false);
    }
  };

  const runComparativoDecision = async (actionLabel, executor) => {
    const comentario = window.prompt(
      `Comentario para ${actionLabel.toLowerCase()} el comparativo (opcional).`,
      ""
    );

    if (comentario === null) return;

    setSubmittingComparativo(true);
    try {
      const saved = await executor({
        comentario: comentario.trim() || null,
      });
      setComparativo(saved);
      setComparativoDraft(buildComparativoDraft(saved));
      toast.success(`Comparativo ${actionLabel.toLowerCase()} correctamente.`);
      await load();
    } finally {
      setSubmittingComparativo(false);
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

  const canOperate = canOperateCotizacionesLogisticaEffective(user, detalle);
  const expedienteBloqueado = ["ADJUDICADO", "OC_GENERADA"].includes(
    detalle.estadoLogistica
  );
  const flujoDefinido = Boolean(detalle.modalidadFlujoLogistico);
  const isFlujoRegular = detalle.modalidadFlujoLogistico === "REGULAR";
  const isFlujoExcepcional = detalle.modalidadFlujoLogistico === "EXCEPCIONAL";
  const canDefineFlow = canAdjudicate && !expedienteBloqueado;
  const canEditFlowDefinition =
    canDefineFlow &&
    !detalle.resumenComparativo?.totalSolicitudes &&
    !detalle.resumenComparativo?.totalCotizaciones &&
    !comparativo?.id &&
    !detalle.ordenCompra?.id &&
    !detalle.cotizacionSeleccionadaExcepcionalId;
  const canManageDrafts = canOperate && !expedienteBloqueado && flujoDefinido;
  const canManageComparativo =
    canManageDrafts && isFlujoRegular && comparativoCanEdit(comparativo);
  const canFormalizeExceptional =
    canAdjudicate && !expedienteBloqueado && isFlujoExcepcional;

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

            <div className="space-y-3 rounded-lg border border-gray-200 p-4">
              <div>
                <p className="font-medium text-gray-900">Definicion del flujo logistico</p>
                <p className="mt-1 text-xs text-gray-500">
                  La jefatura debe definir si el expediente sigue el camino regular o excepcional antes de continuar con el tramite.
                </p>
              </div>

              {flujoDefinido ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p>
                    Modalidad: <span className="font-semibold">{detalle.modalidadFlujoLogistico}</span>
                  </p>
                  {isFlujoExcepcional ? (
                    <>
                      <p className="mt-1">
                        Causal: <span className="font-semibold">{detalle.causalFlujoExcepcional || "-"}</span>
                      </p>
                      {detalle.justificacionFlujoExcepcional ? (
                        <p className="mt-1 text-xs text-slate-600">
                          {detalle.justificacionFlujoExcepcional}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-1 text-xs text-slate-600">
                      El expediente seguira el camino ordinario con comparativo formal.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  Todavia no se definio la modalidad del expediente. Hasta hacerlo, el sistema bloquea acciones operativas clave.
                </div>
              )}

              {canEditFlowDefinition ? (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      value={flujoDraft.modalidadFlujoLogistico}
                      onChange={(event) =>
                        setFlujoDraft((prev) => ({
                          ...prev,
                          modalidadFlujoLogistico: event.target.value,
                          causalFlujoExcepcional:
                            event.target.value === "EXCEPCIONAL"
                              ? prev.causalFlujoExcepcional
                              : "",
                          justificacionFlujoExcepcional:
                            event.target.value === "EXCEPCIONAL"
                              ? prev.justificacionFlujoExcepcional
                              : "",
                        }))
                      }
                      className="rounded border border-gray-300 px-3 py-2"
                    >
                      <option value="">Selecciona modalidad</option>
                      <option value="REGULAR">REGULAR</option>
                      <option value="EXCEPCIONAL">EXCEPCIONAL</option>
                    </select>

                    {flujoDraft.modalidadFlujoLogistico === "EXCEPCIONAL" ? (
                      <select
                        value={flujoDraft.causalFlujoExcepcional}
                        onChange={(event) =>
                          setFlujoDraft((prev) => ({
                            ...prev,
                            causalFlujoExcepcional: event.target.value,
                          }))
                        }
                        className="rounded border border-gray-300 px-3 py-2"
                      >
                        <option value="">Selecciona causal</option>
                        <option value="MENOR_CUANTIA">MENOR_CUANTIA</option>
                        <option value="URGENCIA">URGENCIA</option>
                        <option value="EMERGENCIA">EMERGENCIA</option>
                      </select>
                    ) : null}
                  </div>

                  {flujoDraft.modalidadFlujoLogistico === "EXCEPCIONAL" ? (
                    <textarea
                      value={flujoDraft.justificacionFlujoExcepcional}
                      onChange={(event) =>
                        setFlujoDraft((prev) => ({
                          ...prev,
                          justificacionFlujoExcepcional: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Justificacion obligatoria para urgencia o emergencia."
                      className="w-full rounded border border-gray-300 px-3 py-2"
                    />
                  ) : null}

                  <button
                    type="button"
                    onClick={handleGuardarFlujo}
                    disabled={submittingAction}
                    className="rounded bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {flujoDefinido
                      ? "Actualizar flujo logistico"
                      : "Guardar flujo logistico"}
                  </button>
                </div>
              ) : null}
            </div>

            {canOperate && !expedienteBloqueado && isFlujoRegular && (
              <button
                type="button"
                onClick={handleMarcarListo}
                disabled={submittingAction || !detalle.resumenComparativo?.totalCotizaciones}
                className="rounded border border-fuchsia-300 px-4 py-2 font-medium text-fuchsia-700 hover:bg-fuchsia-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Dejar listo para adjudicacion
              </button>
            )}

            {canFormalizeExceptional ? (
              <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div>
                  <p className="font-medium text-emerald-900">Decision excepcional</p>
                  <p className="mt-1 text-xs text-emerald-800">
                    Selecciona la cotizacion que sustenta la decision excepcional del expediente.
                  </p>
                </div>
                <select
                  value={decisionExcepcionalDraft.cotizacionId}
                  onChange={(event) =>
                    setDecisionExcepcionalDraft((prev) => ({
                      ...prev,
                      cotizacionId: event.target.value,
                    }))
                  }
                  className="w-full rounded border border-emerald-300 px-3 py-2"
                >
                  <option value="">Selecciona cotizacion</option>
                  {resumenCotizaciones.map((cotizacion) => (
                    <option key={cotizacion.id} value={cotizacion.id}>
                      {cotizacion.codigo} · {cotizacion.proveedor?.razonSocial || "-"} · {formatCurrency(cotizacion.totalOferta)}
                    </option>
                  ))}
                </select>
                <textarea
                  value={decisionExcepcionalDraft.comentario}
                  onChange={(event) =>
                    setDecisionExcepcionalDraft((prev) => ({
                      ...prev,
                      comentario: event.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="Comentario opcional de formalizacion."
                  className="w-full rounded border border-emerald-300 px-3 py-2"
                />
                <button
                  type="button"
                  onClick={handleFormalizarDecisionExcepcional}
                  disabled={
                    submittingAction ||
                    !decisionExcepcionalDraft.cotizacionId ||
                    Boolean(detalle.cotizacionSeleccionadaExcepcionalId)
                  }
                  className="rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {detalle.cotizacionSeleccionadaExcepcionalId
                    ? "Decision excepcional formalizada"
                    : "Formalizar decision excepcional"}
                </button>
              </div>
            ) : null}

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
          {!flujoDefinido
            ? "La jefatura de logistica debe definir primero si el expediente seguira el flujo REGULAR o EXCEPCIONAL."
            : expedienteBloqueado
            ? "El expediente ya fue adjudicado o paso a orden de compra, por lo que ya no admite cambios operativos."
            : "Este expediente se encuentra en modo de consulta para tu perfil. Solo el responsable asignado o la jefatura pueden modificar solicitudes y cotizaciones."}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {isFlujoExcepcional
                ? "Decision documental excepcional"
                : "Comparativo formal"}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900">
              {isFlujoExcepcional
                ? "Registro documental de la decision excepcional"
                : "Documento persistido de comparacion y decision"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isFlujoExcepcional
                ? "Este bloque muestra el soporte documental vigente de la decision excepcional formalizada."
                : "Este bloque concentra el comparativo documental vigente del expediente."}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Camino ordinario: comparativo aprobado. Camino excepcional: decision inicial excepcional y formalizacion posterior sobre una cotizacion de sustento.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {comparativo ? (
              <ComparativoEstadoBadge estado={comparativo.estadoDocumento} />
            ) : (
              <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Sin documento formal
              </span>
            )}
            {comparativo?.codigo ? (
              <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                {comparativo.codigo} v{comparativo.versionActual || 1}
              </span>
            ) : null}
          </div>
        </div>

        {comparativo ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Elaborado por
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {comparativo.elaborador?.nombre || comparativo.responsableLogisticaNombreSnapshot || "-"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Aprobador jefatura
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {comparativo.aprobadorJefatura?.nombre ||
                  comparativo.aprobadorJefaturaNombreSnapshot ||
                  "-"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Fecha aprobacion
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {formatDateTime(comparativo.fechaAprobacionJefatura)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Cotizaciones consideradas
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {comparativo.cotizacionesConsideradasSnapshot?.totalCotizaciones || 0}
              </p>
            </div>
          </div>
        ) : null}

        {canManageComparativo ? (
          <form onSubmit={handleComparativoSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Cotizaciones consideradas</p>
                  <p className="text-xs text-gray-500">
                    Selecciona las ofertas que entran formalmente al comparativo.
                  </p>
                </div>
                <div className="space-y-2">
                  {resumenCotizaciones.length > 0 ? (
                    resumenCotizaciones.map((cotizacion) => {
                      const checked = comparativoDraft.cotizacionIdsConsideradas.includes(
                        String(cotizacion.id)
                      );
                      const canSelectWinner = checked;

                      return (
                        <label
                          key={`formal-comparativo-${cotizacion.id}`}
                          className={`block rounded-lg border p-4 ${
                            checked
                              ? "border-indigo-300 bg-indigo-50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCotizacionConsiderada(cotizacion.id)}
                                className="mt-1"
                              />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {cotizacion.codigo} · {cotizacion.proveedor?.razonSocial || "-"}
                                </p>
                                <p className="mt-1 text-sm text-gray-600">
                                  {formatCurrency(cotizacion.totalOferta)} · {cotizacion.formaPago || "Sin forma de pago"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Entrega: {cotizacion.tiempoEntregaDias ?? "-"} dias · Garantia: {cotizacion.garantia || "Sin definir"}
                                </p>
                              </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="radio"
                                name="comparativo-seleccion"
                                disabled={!canSelectWinner}
                                checked={
                                  comparativoDraft.cotizacionSeleccionadaId ===
                                  String(cotizacion.id)
                                }
                                onChange={() =>
                                  setComparativoDraft((prev) => ({
                                    ...prev,
                                    cotizacionSeleccionadaId: String(cotizacion.id),
                                  }))
                                }
                              />
                              Seleccionada
                            </label>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                      Aun no hay cotizaciones disponibles para formalizar el comparativo.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block space-y-1 text-sm text-gray-700">
                  <span className="font-medium">Criterio de adjudicacion</span>
                  <textarea
                    rows="6"
                    value={comparativoDraft.criterioAdjudicacion}
                    onChange={(event) =>
                      setComparativoDraft((prev) => ({
                        ...prev,
                        criterioAdjudicacion: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    placeholder="Resume por que esta propuesta debe ser seleccionada."
                  />
                </label>

                <label className="block space-y-1 text-sm text-gray-700">
                  <span className="font-medium">Observaciones</span>
                  <textarea
                    rows="5"
                    value={comparativoDraft.observaciones}
                    onChange={(event) =>
                      setComparativoDraft((prev) => ({
                        ...prev,
                        observaciones: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    placeholder="Notas internas del comparativo formal."
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={submittingComparativo || !resumenCotizaciones.length}
                    className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingComparativo
                      ? "Guardando..."
                      : comparativo?.id
                        ? "Actualizar comparativo"
                        : "Crear comparativo"}
                  </button>
                  {comparativo?.id ? (
                    <button
                      type="button"
                      onClick={() => setComparativoDraft(buildComparativoDraft(comparativo))}
                      className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Restablecer
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </form>
        ) : comparativo ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr,0.9fr]">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Resumen formal
              </h3>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-900">
                  Cotizacion seleccionada
                </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {comparativo.cotizacionSeleccionadaSnapshot
                      ? `${comparativo.cotizacionSeleccionadaSnapshot.codigo} · ${comparativo.cotizacionSeleccionadaSnapshot.proveedor?.razonSocial || "-"}`
                      : "Aun no definida"}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    {comparativoDecisionMeta?.via === "EXCEPCIONAL"
                      ? "Via excepcional: adjudicacion directa formal."
                      : "Via ordinaria: comparativo aprobado."}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {comparativo.criterioAdjudicacionSnapshot?.resumen ||
                      "Sin criterio de adjudicacion visible."}
                </p>
              </div>
              <div className="grid gap-3">
                {(comparativo.cotizacionesConsideradasSnapshot?.cotizaciones || []).map(
                  (cotizacion) => (
                    <div
                      key={`comparativo-snapshot-${cotizacion.cotizacionId}`}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-gray-900">
                          {cotizacion.codigo} · {cotizacion.proveedor?.razonSocial || "-"}
                        </p>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(cotizacion.totalOferta)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Estado snapshot: {cotizacion.estado || "-"}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Historial formal
              </h3>
              {(comparativo.historial || []).length > 0 ? (
                <div className="space-y-3">
                  {comparativo.historial.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-gray-200 p-4 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900">{entry.tipoEvento}</p>
                        <p className="text-gray-500">{formatDateTime(entry.fechaAccion)}</p>
                      </div>
                      <p className="mt-1 text-gray-700">
                        Actor: {entry.actor?.nombre || "-"}
                      </p>
                      {entry.comentario ? (
                        <p className="mt-1 text-gray-700">{entry.comentario}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                  Aun no hay historial formal registrado.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
            {isFlujoExcepcional
              ? "Aun no existe una decision excepcional formalizada para este expediente."
              : "Aun no existe comparativo formal persistido para este expediente."}
          </div>
        )}

        {canAdjudicate && isFlujoRegular && comparativo?.id ? (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() =>
                runComparativoDecision("Aprobar", (payload) =>
                  aprobarComparativo(comparativo.id, payload)
                )
              }
              disabled={submittingComparativo}
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Aprobar comparativo
            </button>
            <button
              type="button"
              onClick={() =>
                runComparativoDecision("Observar", (payload) =>
                  observarComparativo(comparativo.id, payload)
                )
              }
              disabled={submittingComparativo}
              className="rounded border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-60"
            >
              Observar
            </button>
            <button
              type="button"
              onClick={() =>
                runComparativoDecision("Rechazar", (payload) =>
                  rechazarComparativo(comparativo.id, payload)
                )
              }
              disabled={submittingComparativo}
              className="rounded border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
            >
              Rechazar
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Solicitudes emitidas</h2>
          </div>
          <div className="space-y-3 p-4 md:hidden">
            {(detalle.solicitudes || []).length > 0 ? (
              detalle.solicitudes.map((solicitud) => (
                <div key={solicitud.id} className="rounded-lg border border-gray-200 p-4">
                  <p className="font-medium text-gray-900">{solicitud.codigo}</p>
                  <p className="mt-1 text-sm text-gray-700">
                    {solicitud.proveedor?.razonSocial || "-"}
                  </p>
                  <div className="mt-2">
                    <CotizacionEstadoBadge estado={solicitud.estado} tipo="solicitud" />
                  </div>
                  {canManageDrafts ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSolicitudDraft(buildSolicitudDraft(solicitud, user?.id || null))
                        }
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
                  ) : null}
                </div>
              ))
            ) : (
              <div className="px-2 py-6 text-center text-sm text-gray-500">
                Aun no se emitieron solicitudes de cotizacion para este requerimiento.
              </div>
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
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
              <p className="mt-1 text-sm text-gray-500">
                En flujo EXCEPCIONAL, una de estas cotizaciones puede sustentar la decision formal del expediente por MENOR_CUANTIA, URGENCIA o EMERGENCIA.
              </p>
            </div>
          <div className="space-y-3 p-4 md:hidden">
            {resumenCotizaciones.length > 0 ? (
              resumenCotizaciones.map((cotizacion) => (
                <div key={cotizacion.id} className="rounded-lg border border-gray-200 p-4">
                  <p className="font-medium text-gray-900">
                    {cotizacion.codigo} · {cotizacion.proveedor?.razonSocial || "-"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatCurrency(cotizacion.totalOferta)}
                  </p>
                  {comparativoDecisionMeta?.cotizacionId === Number(cotizacion.id) ? (
                    <p className="mt-2 text-xs font-medium text-emerald-700">
                      {comparativoDecisionMeta.via === "EXCEPCIONAL"
                        ? "Seleccion formal por adjudicacion directa excepcional."
                        : "Seleccion formal del comparativo aprobado."}
                    </p>
                  ) : null}
                  <div className="mt-2">
                    <CotizacionEstadoBadge estado={cotizacion.estado} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {canManageDrafts ? (
                      <button
                        type="button"
                        onClick={() => setCotizacionDraft(buildCotizacionDraft(cotizacion))}
                        className="rounded border border-indigo-300 px-3 py-1 text-indigo-700 hover:bg-indigo-50"
                      >
                        Editar
                      </button>
                    ) : null}
                    {canManageDrafts ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteCotizacion(cotizacion.id)}
                        className="rounded border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-2 py-6 text-center text-sm text-gray-500">
                Aun no se registraron cotizaciones para este expediente.
              </div>
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
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
                        {comparativoDecisionMeta?.cotizacionId === Number(cotizacion.id) ? (
                          <p className="mt-1 text-xs font-medium text-emerald-700">
                            {comparativoDecisionMeta.via === "EXCEPCIONAL"
                              ? "Adjudicacion directa excepcional formal."
                              : "Seleccion formal del comparativo aprobado."}
                          </p>
                        ) : null}
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

    </div>
  );
};

export default ProcesoLogisticoDetallePage;
