import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SolicitudCotizacionForm from "../components/SolicitudCotizacionForm";
import SkeletonCard from "../components/ui/skeletons/SkeletonCard";
import SkeletonTable from "../components/ui/skeletons/SkeletonTable";
import {
  canAssignCotizacionesLogisticaEffective,
  hasLogisticaJefaturaContext,
  hasLogisticaOperadorContext,
  isLogisticaContext,
  isLogisticaJefaturaContext,
} from "../accessRules";
import { useAuth } from "../context/authContext";
import usersApi from "../api/usersApi";
import useLogisticaCotizaciones from "../hooks/useLogisticaCotizaciones";
import useProveedores from "../hooks/useProveedores";
import useSolicitudesCotizacion from "../hooks/useSolicitudesCotizacion";
import {
  buildLogisticaResponsableOptions,
  canSubmitLogisticaAssignment,
  createDirectResponsableOption,
  findLogisticaJefaturaResponsable,
  getDefaultLogisticaResponsableSelection,
} from "../utils/logisticaAssignment";

const titles = {
  jefatura: "Bandeja Operativa de Logistica",
  operador: "Bandeja de Operador de Logistica",
};

const subtitles = {
  jefatura:
    "Supervisa requerimientos habilitados para atencion logistica, asigna responsables, define el flujo logistico y activa la atencion operativa.",
  operador:
    "Trabaja solo los expedientes logisticos que tienes asignados y dejalos listos para decision de jefatura.",
};

const formatCurrency = (value) => `S/ ${Number(value || 0).toFixed(2)}`;
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "-";
const trayStatusOrder = [
  "PENDIENTE",
  "SIN_SOLICITUDES",
  "CON_SOLICITUDES",
  "REGISTRO_COTIZACION_INCOMPLETA",
  "REGISTRO_COTIZACION_COMPLETA",
  "COMPARATIVO_GENERADO",
  "BUENA_PRO_OTORGADA",
  "CON_ORDEN_COMPRA",
];
const trayStatusMeta = {
  PENDIENTE: {
    label: "Pendiente",
    summaryLabel: "Pendientes",
    chipClass: "border-slate-300 bg-slate-50 text-slate-700",
  },
  SIN_SOLICITUDES: {
    label: "Sin solicitudes",
    summaryLabel: "Sin solicitudes",
    chipClass: "border-amber-300 bg-amber-50 text-amber-800",
  },
  CON_SOLICITUDES: {
    label: "Con solicitudes",
    summaryLabel: "Con solicitudes",
    chipClass: "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700",
  },
  REGISTRO_COTIZACION_INCOMPLETA: {
    label: "Registro incompleto",
    summaryLabel: "Registro incompleto",
    chipClass: "border-amber-300 bg-amber-50 text-amber-800",
  },
  REGISTRO_COTIZACION_COMPLETA: {
    label: "Registro completo",
    summaryLabel: "Registro completo",
    chipClass: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
  COMPARATIVO_GENERADO: {
    label: "Comparativo generado",
    summaryLabel: "Comparativos",
    chipClass: "border-sky-300 bg-sky-50 text-sky-700",
  },
  BUENA_PRO_OTORGADA: {
    label: "Buena pro otorgada",
    summaryLabel: "Buena pro",
    chipClass: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
  CON_ORDEN_COMPRA: {
    label: "Con orden de compra",
    summaryLabel: "Con O/C",
    chipClass: "border-violet-300 bg-violet-50 text-violet-700",
  },
};

const getVisibleRequerimientoItems = (requerimiento = {}) => {
  const candidateCollections = [
    requerimiento?.items,
    requerimiento?.requerimiento?.items,
    requerimiento?.detalle?.items,
  ];

  const source = candidateCollections.find((collection) =>
    Array.isArray(collection)
  );

  return Array.isArray(source)
    ? source.filter((item) => item?.activo !== false)
    : [];
};

const getItemDescription = (item = {}) =>
  item.descripcionVisible ||
  item.descripcion ||
  item.producto?.nombre ||
  item.nombre ||
  "Item sin descripcion";

const getAprobacionChipClass = (item) => {
  if (item?.pendienteGerenciaGeneral) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (item?.aprobacionDocumentalFinal) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
};

const getAprobacionChipLabel = (item) => {
  if (item?.pendienteGerenciaGeneral) {
    return "Pendiente GG";
  }
  if (item?.aprobacionDocumentalFinal) {
    return "Aprobacion final";
  }
  return "Habilitado para logistica";
};

const getTrayStatusMeta = (status) =>
  trayStatusMeta[status] || {
    label: status || "Sin estado",
    summaryLabel: status || "Sin estado",
    chipClass: "border-slate-300 bg-slate-50 text-slate-700",
  };

const createFlowDraft = (item) => ({
  modalidadFlujoLogistico: item?.modalidadFlujoLogistico || "",
  causalFlujoExcepcional: item?.causalFlujoExcepcional || "",
  justificacionFlujoExcepcional: item?.justificacionFlujoExcepcional || "",
});

const createSolicitudDraft = (requerimientoId) => ({
  requerimientoId,
  proveedorId: "",
  cuerpoSolicitud: "",
  estado: "Creada",
  moneda: "PEN",
  incluyeIgv: true,
  fechaLimiteRecepcion: "",
  medioRecepcion: "CORREO",
  items: [],
});

const promptLogisticaReassignmentPayload = ({
  currentResponsableId,
  nextResponsableId,
}) => {
  if (
    !currentResponsableId ||
    Number(currentResponsableId) === Number(nextResponsableId)
  ) {
    return { responsableId: Number(nextResponsableId) };
  }

  const tipoInput = window.prompt(
    "Tipo de reasignacion: TEMPORAL o DEFINITIVA.",
    "DEFINITIVA"
  );
  if (tipoInput === null) return null;

  const tipoReasignacion = String(tipoInput || "")
    .trim()
    .toUpperCase();

  if (!["TEMPORAL", "DEFINITIVA"].includes(tipoReasignacion)) {
    toast.error("La reasignacion debe ser TEMPORAL o DEFINITIVA.");
    return null;
  }

  const motivoInput = window.prompt(
    "Motivo obligatorio de la reasignacion.",
    ""
  );
  if (motivoInput === null) return null;

  const motivo = String(motivoInput || "").trim();
  if (!motivo) {
    toast.error("Debes registrar un motivo para la reasignacion.");
    return null;
  }

  const comentarioInput = window.prompt(
    "Comentario adicional de la reasignacion (opcional).",
    ""
  );
  if (comentarioInput === null) return null;

  let vigenteHasta = null;
  if (tipoReasignacion === "TEMPORAL") {
    const vigenteHastaInput = window.prompt(
      "Vigente hasta (AAAA-MM-DD) opcional para la reasignacion temporal.",
      ""
    );
    if (vigenteHastaInput === null) return null;
    vigenteHasta = String(vigenteHastaInput || "").trim() || null;
  }

  return {
    responsableId: Number(nextResponsableId),
    tipoReasignacion,
    motivo,
    comentario: String(comentarioInput || "").trim() || null,
    vigenteHasta,
  };
};

const CotizacionesBandejaPage = ({ tipo }) => {
  const { user, activeContext, availableContexts } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    cargando,
    error,
    obtenerBandeja,
    obtenerDetalle,
    definirFlujo,
    obtenerOperadores,
    asignar,
    iniciar,
  } = useLogisticaCotizaciones();
  const { proveedores } = useProveedores();
  const { crearSolicitud } = useSolicitudesCotizacion({ autoLoad: false });

  const [items, setItems] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [contextError, setContextError] = useState(null);
  const [search, setSearch] = useState("");
  const [estadoBandeja, setEstadoBandeja] = useState("");
  const [seleccionOperadores, setSeleccionOperadores] = useState({});
  const [flowDrafts, setFlowDrafts] = useState({});
  const [expandedFlowId, setExpandedFlowId] = useState(null);
  const [expandedSolicitudId, setExpandedSolicitudId] = useState(null);
  const [submittingFlowId, setSubmittingFlowId] = useState(null);
  const [submittingSolicitudId, setSubmittingSolicitudId] = useState(null);
  const [highlightedRequerimientoId, setHighlightedRequerimientoId] =
    useState(null);
  const [jefaturaResponsableOption, setJefaturaResponsableOption] =
    useState(null);

  const canAssign =
    canAssignCotizacionesLogisticaEffective(user) && tipo === "jefatura";
  const hasJefaturaContext = hasLogisticaJefaturaContext(availableContexts);
  const hasOperadorContext = hasLogisticaOperadorContext(availableContexts);
  const hasCompatibleLogisticaContext =
    tipo === "jefatura" ? hasJefaturaContext : hasOperadorContext;
  const activeContextLabel = activeContext?.displayName || "-";
  const activeContextIsLogistica = isLogisticaContext(activeContext || {});
  const isAdminUser = Array.isArray(user?.identityRoles)
    ? user.identityRoles.includes("ADMINISTRADOR_SISTEMA")
    : false;
  const activeContextIsLogisticaJefatura = isLogisticaJefaturaContext(
    activeContext || {}
  );
  const canProcessDirectly =
    canAssign && (activeContextIsLogisticaJefatura || isAdminUser);
  const directResponsableOption = createDirectResponsableOption(
    user,
    canProcessDirectly
  );
  const directResponsableId = directResponsableOption?.id || null;

  const handleChangeContext = () => {
    navigate("/seleccionar-contexto", {
      replace: true,
      state: {
        from: location,
        reason: "CONTEXT_INCOMPATIBLE",
        expectedContext: tipo === "jefatura" ? "logistica-jefatura" : "logistica-operador",
      },
    });
  };

  const load = async () => {
    try {
      const response = await obtenerBandeja(tipo, {
        search,
        estadoBandeja,
      });
      const data = Array.isArray(response?.data) ? response.data : [];
      const enrichedData = await Promise.all(
        data.map(async (item) => {
          if (getVisibleRequerimientoItems(item).length > 0) {
            return item;
          }

          try {
            const detalle = await obtenerDetalle(item.id);
            return Array.isArray(detalle?.items)
              ? { ...item, items: detalle.items }
              : item;
          } catch {
            return item;
          }
        })
      );

      setItems(enrichedData);
      setContextError(null);
      setSeleccionOperadores(() => {
        const next = {};
        enrichedData.forEach((item) => {
          next[item.id] = getDefaultLogisticaResponsableSelection({
            responsableActualId:
              item.responsableLogisticaId || item.responsableLogistica?.id,
            directResponsableId,
          });
        });
        return next;
      });
      setFlowDrafts((prev) => {
        const next = { ...prev };
        enrichedData.forEach((item) => {
          next[item.id] = next[item.id] || createFlowDraft(item);
        });
        return next;
      });
    } catch (err) {
      const status = err?.response?.status || null;
      if (status === 403) {
        setContextError({
          status,
          message:
            err?.message ||
            "No tienes acceso a esta bandeja con el contexto activo actual.",
        });
      } else {
        setContextError(null);
      }
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, [tipo, search, estadoBandeja, directResponsableId, obtenerBandeja, obtenerDetalle]);

  useEffect(() => {
    if (!canAssign) return;

    obtenerOperadores()
      .then((data) => setOperadores(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [canAssign, obtenerOperadores]);

  useEffect(() => {
    if (!canAssign || !isAdminUser) {
      setJefaturaResponsableOption(null);
      return;
    }

    let cancelled = false;

    usersApi
      .obtenerTodosPaginados()
      .then((usuarios) => {
        if (cancelled) return;

        setJefaturaResponsableOption(
          findLogisticaJefaturaResponsable(
            usuarios,
            activeContext?.areaId || activeContext?.area?.id || null
          )
        );
      })
      .catch(() => {
        if (!cancelled) {
          setJefaturaResponsableOption(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeContext?.area?.id, activeContext?.areaId, canAssign, isAdminUser]);

  useEffect(() => {
    if (!highlightedRequerimientoId) return undefined;

    const timer = window.setTimeout(() => {
      setHighlightedRequerimientoId(null);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [highlightedRequerimientoId]);

  useEffect(() => {
    if (!highlightedRequerimientoId) return;
    if (!items.some((item) => Number(item.id) === Number(highlightedRequerimientoId))) {
      return;
    }

    const timer = window.setTimeout(() => {
      document
        .getElementById(`logistica-expediente-${highlightedRequerimientoId}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [highlightedRequerimientoId, items]);

  const resumen = useMemo(
    () => {
      const counts = trayStatusOrder.reduce((acc, status) => {
        acc[status] = 0;
        return acc;
      }, {});

      items.forEach((item) => {
        const status = String(item?.estadoBandeja || "").toUpperCase();
        if (Object.prototype.hasOwnProperty.call(counts, status)) {
          counts[status] += 1;
        }
      });

      return {
        total: items.length,
        counts,
      };
    },
    [items]
  );
  const isInitialLoading = cargando && items.length === 0 && !contextError;

  const handleAssign = async (requerimientoId) => {
    const item = items.find((currentItem) => currentItem.id === requerimientoId);
    const responsableActualId =
      item?.responsableLogisticaId || item?.responsableLogistica?.id || null;
    const selectedResponsableId = seleccionOperadores[requerimientoId] || "";

    if (
      !canSubmitLogisticaAssignment({
        selectedResponsableId,
        responsableActualId,
      })
    ) {
      return;
    }

    const payload = promptLogisticaReassignmentPayload({
      currentResponsableId: responsableActualId,
      nextResponsableId: selectedResponsableId,
    });
    if (!payload) return;

    await asignar(requerimientoId, payload);
    await load();
  };

  const handleDirect = async (requerimientoId) => {
    if (!directResponsableId) {
      toast.error(
        "Procesar directamente solo esta disponible con la jefatura logistica activa."
      );
      return;
    }

    const item = items.find((currentItem) => currentItem.id === requerimientoId);
    const payload = promptLogisticaReassignmentPayload({
      currentResponsableId:
        item?.responsableLogisticaId || item?.responsableLogistica?.id || null,
      nextResponsableId: directResponsableId,
    });
    if (!payload) return;

    await asignar(requerimientoId, payload);
    await load();
  };

  const handleStart = async (requerimientoId) => {
    await iniciar(requerimientoId);
    await load();
  };

  const updateFlowDraft = (itemId, nextPartial) => {
    setFlowDrafts((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        ...nextPartial,
      },
    }));
  };

  const handleGuardarFlujo = async (item) => {
    const draft = flowDrafts[item.id] || createFlowDraft(item);
    const modalidad = draft.modalidadFlujoLogistico;

    if (!modalidad) {
      toast.error("Debes seleccionar una modalidad de flujo logistico.");
      return;
    }

    if (modalidad === "EXCEPCIONAL" && !draft.causalFlujoExcepcional) {
      toast.error("Debes seleccionar una causal para el flujo excepcional.");
      return;
    }

    if (
      modalidad === "EXCEPCIONAL" &&
      ["URGENCIA", "EMERGENCIA"].includes(draft.causalFlujoExcepcional) &&
      !String(draft.justificacionFlujoExcepcional || "").trim()
    ) {
      toast.error(
        "La justificacion es obligatoria para URGENCIA o EMERGENCIA."
      );
      return;
    }

    setSubmittingFlowId(item.id);
    try {
      const wasEmisionClosed = item.emisionSolicitudesCerrada === true;
      await definirFlujo(item.id, {
        modalidadFlujoLogistico: modalidad,
        causalFlujoExcepcional:
          modalidad === "EXCEPCIONAL" ? draft.causalFlujoExcepcional : null,
        justificacionFlujoExcepcional:
          modalidad === "EXCEPCIONAL"
            ? String(draft.justificacionFlujoExcepcional || "").trim() || null
            : null,
      });
      await load();
      setExpandedFlowId(null);
      toast.success(
        wasEmisionClosed
          ? "Flujo logistico actualizado. Si la cobertura invitada quedo insuficiente, la emision se reabrio automaticamente."
          : "Flujo logistico actualizado."
      );
    } finally {
      setSubmittingFlowId(null);
    }
  };

  const handleCreateSolicitud = async (item, payload) => {
    setSubmittingSolicitudId(item.id);
    try {
      await crearSolicitud(payload);
      setHighlightedRequerimientoId(item.id);
      await load();
      setExpandedSolicitudId(null);
    } finally {
      setSubmittingSolicitudId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{titles[tipo]}</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            {subtitles[tipo]}
          </p>
        </div>
        <Link
          to="/dashboard"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Volver al dashboard
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contexto activo
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {activeContextLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={handleChangeContext}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cambiar contexto
          </button>
        </div>
      </div>

      {!activeContextIsLogistica && hasCompatibleLogisticaContext ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
          <p className="font-semibold">
            El contexto activo actual no corresponde a Logistica.
          </p>
          <p className="mt-1 text-amber-800">
            Para continuar en esta bandeja, cambia al contexto de Logistica.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleChangeContext}
              className="rounded bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
            >
              Cambiar a contexto de Logistica
            </button>
            <Link
              to="/dashboard"
              className="rounded border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
            >
              Volver al dashboard
            </Link>
          </div>
        </div>
      ) : null}

      {isInitialLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} lines={1} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Total expedientes
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {resumen.total}
          </p>
        </div>
        {trayStatusOrder.map((status) => {
          const meta = getTrayStatusMeta(status);
          return (
            <div key={status} className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {meta.summaryLabel}
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {resumen.counts[status] || 0}
              </p>
            </div>
          );
        })}
      </div>
      )}

      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-3">
        <input
          value={search}
          name="cotizaciones-bandeja-page-input-134"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por codigo, solicitante o finalidad"
          className="rounded border border-gray-300 px-3 py-2 md:col-span-2"
        />
        <select
          value={estadoBandeja}
          name="cotizaciones-bandeja-page-select-140"
          onChange={(event) => setEstadoBandeja(event.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
        >
          <option value="">Todos los estados de bandeja</option>
          {trayStatusOrder.map((status) => (
            <option key={status} value={status}>
              {getTrayStatusMeta(status).label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        {isInitialLoading ? (
          <SkeletonTable columns={5} rows={5} />
        ) : contextError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
            <p className="font-semibold">
              No tienes acceso a esta bandeja con el contexto activo actual.
            </p>
            <p className="mt-1 text-amber-800">
              Contexto activo: {activeContextLabel}
            </p>
            {hasCompatibleLogisticaContext ? (
              <p className="mt-2 text-amber-800">
                Tienes un contexto compatible disponible para Logistica.
              </p>
            ) : (
              <p className="mt-2 text-amber-800">
                No tienes un contexto operativo autorizado para el modulo logistico.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {hasCompatibleLogisticaContext ? (
                <button
                  type="button"
                  onClick={handleChangeContext}
                  className="rounded bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
                >
                  Ir a seleccionar contexto
                </button>
              ) : null}
              <Link
                to="/dashboard"
                className="rounded border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Volver al dashboard
              </Link>
            </div>
          </div>
        ) : items.length > 0 ? (
          items.map((item) => {
            const flowDraft = flowDrafts[item.id] || createFlowDraft(item);
            const requerimientoItems = getVisibleRequerimientoItems(item);
            const responsableActualId =
              item.responsableLogisticaId ||
              item.responsableLogistica?.id ||
              null;
            const assignedToCurrentUser =
              Number(responsableActualId || 0) === Number(user?.id || 0);
            const assignedToOtherResponsable =
              Number(responsableActualId || 0) > 0 && !assignedToCurrentUser;
            const blocked = ["ADJUDICADO", "OC_GENERADA"].includes(
              item.estadoLogistica
            );
            const canQuickDefineFlow =
              canAssign && !blocked && item.puedeCambiarFlujoLogistico === true;
            const totalSolicitudes = Number(
              item.resumenComparativo?.totalSolicitudes || 0
            );
            const canQuickCreateSolicitud =
              canAssign &&
              !blocked &&
              ["REGULAR", "EXCEPCIONAL"].includes(
                item.modalidadFlujoLogistico
              ) &&
              !assignedToOtherResponsable;
            const canOperatorContinueExpediente =
              tipo === "operador" && assignedToCurrentUser && !blocked;
            const canOperatorManageSolicitud =
              canOperatorContinueExpediente &&
              ["REGULAR", "EXCEPCIONAL"].includes(
                item.modalidadFlujoLogistico
              );
            const expedientePrimaryPath = canOperatorManageSolicitud
              ? `/cotizaciones/proceso/${item.id}#solicitudes`
              : `/cotizaciones/proceso/${item.id}`;
            const expedientePrimaryLabel = canOperatorManageSolicitud
              ? "Gestionar solicitud"
              : canOperatorContinueExpediente
                ? "Continuar expediente"
                : "Abrir expediente";
            const canOpenComparativo =
              item.modalidadFlujoLogistico === "REGULAR" &&
              Number(item.resumenComparativo?.totalCotizaciones || 0) > 0;
            const trayStatus = getTrayStatusMeta(item.estadoBandeja);
            const isRecentlyUpdated =
              Number(highlightedRequerimientoId || 0) === Number(item.id);

            return (
              <div
                key={item.id}
                id={`logistica-expediente-${item.id}`}
                className={`rounded-xl bg-white p-5 shadow-sm transition-all duration-500 ${
                  isRecentlyUpdated
                    ? "ring-2 ring-fuchsia-200 ring-offset-2 ring-offset-slate-100"
                    : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {item.codigo}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.area?.nombre || item.areaNombreSnapshot} ·{" "}
                      {item.solicitante?.nombre || "-"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {item.usoFinalidad}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${trayStatus.chipClass}`}
                    >
                      {trayStatus.label}
                    </span>
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      {item.habilitadoLogistica ? (
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                          Habilitado para logistica
                        </span>
                      ) : null}
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getAprobacionChipClass(
                          item
                        )}`}
                      >
                        {getAprobacionChipLabel(item)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-700">
                      {formatCurrency(item.totalReferencial)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Responsable
                    </p>
                    <p className="text-sm text-gray-700">
                      {item.responsableLogistica?.nombre || "Sin asignar"}
                    </p>
                    {item.requiereReasignacionResponsable ? (
                      <p className="mt-1 text-xs text-amber-700">
                        Responsable no operativo. Reasigna el expediente para
                        asegurar continuidad.
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Asignado por
                    </p>
                    <p className="text-sm text-gray-700">
                      {item.asignadoPorLogistica?.nombre || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Solicitudes / cotizaciones
                    </p>
                    <p className="text-sm text-gray-700">
                      {item.resumenComparativo?.totalSolicitudes || 0} /{" "}
                      {item.resumenComparativo?.totalCotizaciones || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Ultima asignacion
                    </p>
                    <p className="text-sm text-gray-700">
                      {formatDate(item.fechaAsignacionLogistica)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Detalle del requerimiento
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {requerimientoItems.length > 0
                        ? `${requerimientoItems.length} item(s) visibles en el expediente`
                        : "No se encontraron items visibles en la data devuelta para este expediente."}
                    </p>
                  </div>
                  {requerimientoItems.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Item
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Cantidad
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {requerimientoItems.map((requerimientoItem) => (
                            <tr key={requerimientoItem.id}>
                              <td className="px-4 py-3 text-sm text-slate-700">
                                {getItemDescription(requerimientoItem)}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-700">
                                {requerimientoItem.cantidadRequerida || 0}{" "}
                                {requerimientoItem.unidadMedida || ""}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-700">
                                {formatCurrency(
                                  requerimientoItem.subtotalReferencial
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Flujo logistico
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {item.modalidadFlujoLogistico || "Aun no definido"}
                    </p>
                    {item.modalidadFlujoLogistico === "EXCEPCIONAL" ? (
                      <p className="mt-1 text-xs text-slate-600">
                        {item.causalFlujoExcepcional || "-"}
                        {item.justificacionFlujoExcepcional
                          ? ` · ${item.justificacionFlujoExcepcional}`
                          : ""}
                      </p>
                    ) : item.modalidadFlujoLogistico === "REGULAR" ? (
                      <p className="mt-1 text-xs text-slate-600">
                        Camino ordinario con solicitudes, cotizaciones y
                        comparativo.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-amber-700">
                        Define si el expediente ira por flujo ordinario o
                        excepcional.
                      </p>
                    )}
                    {!canQuickDefineFlow && item.motivoBloqueoCambioFlujo ? (
                      <p className="mt-2 text-xs text-slate-500">
                        {item.motivoBloqueoCambioFlujo}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Emision de solicitudes
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {item.resumenComparativo?.totalSolicitudes || 0}{" "}
                      solicitud(es)
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {item.modalidadFlujoLogistico === "REGULAR"
                        ? assignedToOtherResponsable
                          ? "La emision de solicitudes queda deshabilitada mientras el expediente este asignado a otro responsable logistico."
                          : "Puedes emitir solicitudes de cotizacion desde esta bandeja."
                        : item.modalidadFlujoLogistico === "EXCEPCIONAL"
                          ? assignedToOtherResponsable
                            ? "La emision de solicitudes queda deshabilitada mientras el expediente este asignado a otro responsable logistico."
                            : "Puedes emitir solicitudes de cotizacion desde esta bandeja incluso en flujo excepcional."
                          : "Primero debes definir el flujo logistico."}
                    </p>
                    {totalSolicitudes > 0 ? (
                      <Link
                        to={`/cotizaciones/requerimientos/${item.id}/solicitudes`}
                        state={{ from: location }}
                        className="mt-3 inline-flex rounded border border-fuchsia-300 px-3 py-1.5 text-xs font-medium text-fuchsia-700 hover:bg-fuchsia-50"
                      >
                        Ver solicitudes
                      </Link>
                    ) : null}
                  </div>
                </div>

                {item.pendienteGerenciaGeneral ? (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    El expediente ya puede trabajarse en logistica, pero la aprobacion documental final aun depende de Gerencia General. La decision final y la orden de compra permanecen bloqueadas.
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={expedientePrimaryPath}
                      className="rounded border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                    >
                      {expedientePrimaryLabel}
                    </Link>
                    {canOpenComparativo ? (
                      <Link
                        to={`/cotizaciones/proceso/${item.id}#comparativo`}
                        className="rounded border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
                      >
                        Ir a comparativo
                      </Link>
                    ) : null}
                    {tipo === "operador" && item.estadoLogistica === "ASIGNADO" ? (
                      <button
                        type="button"
                        onClick={() => handleStart(item.id)}
                        className="rounded border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
                      >
                        Tomar expediente
                      </button>
                    ) : null}
                    {canProcessDirectly ? (
                      <button
                        type="button"
                        onClick={() => handleDirect(item.id)}
                        className="rounded border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        Procesar directamente
                      </button>
                    ) : null}
                    {canQuickDefineFlow ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedFlowId((prev) =>
                            prev === item.id ? null : item.id
                          )
                        }
                        className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {expandedFlowId === item.id
                          ? "Ocultar flujo"
                          : item.modalidadFlujoLogistico
                            ? "Editar flujo"
                            : "Definir flujo"}
                      </button>
                    ) : null}
                    {canQuickCreateSolicitud ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSolicitudId((prev) =>
                            prev === item.id ? null : item.id
                          )
                        }
                        className="rounded border border-fuchsia-300 px-4 py-2 text-sm font-medium text-fuchsia-700 hover:bg-fuchsia-50"
                      >
                        {expandedSolicitudId === item.id
                          ? "Ocultar solicitud"
                          : "Emitir solicitud"}
                      </button>
                    ) : null}
                  </div>

                  {canAssign ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {(() => {
                        const opcionesResponsables =
                          buildLogisticaResponsableOptions({
                            operadores,
                            responsableActual: item.responsableLogistica,
                            directResponsable: directResponsableOption,
                            extraResponsables: [jefaturaResponsableOption],
                          });
                        const canSubmitAssignment =
                          canSubmitLogisticaAssignment({
                            selectedResponsableId:
                              seleccionOperadores[item.id] || "",
                            responsableActualId,
                          });

                        return (
                          <>
                            <select
                              value={seleccionOperadores[item.id] || ""}
                              name="cotizaciones-bandeja-page-select-operator"
                              onChange={(event) =>
                                setSeleccionOperadores((prev) => ({
                                  ...prev,
                                  [item.id]: event.target.value,
                                }))
                              }
                              className="rounded border border-gray-300 px-3 py-2 text-sm"
                            >
                              <option value="">Selecciona operador</option>
                              {opcionesResponsables.map((operador) => (
                                <option key={operador.id} value={operador.id}>
                                  {operador.nombre}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleAssign(item.id)}
                              disabled={!canSubmitAssignment}
                              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {responsableActualId ? "Reasignar" : "Asignar"}
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  ) : null}
                </div>

                {canAssign && !canProcessDirectly ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Procesar directamente esta disponible para la jefatura de
                    logistica y para administradores del sistema.
                  </p>
                ) : null}

                {expandedFlowId === item.id ? (
                  <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Definicion rapida del flujo
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Elige si el expediente seguira el flujo regular o el
                        flujo excepcional.
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <select
                        value={flowDraft.modalidadFlujoLogistico}
                        onChange={(event) =>
                          updateFlowDraft(item.id, {
                            modalidadFlujoLogistico: event.target.value,
                            causalFlujoExcepcional:
                              event.target.value === "EXCEPCIONAL"
                                ? flowDraft.causalFlujoExcepcional
                                : "",
                            justificacionFlujoExcepcional:
                              event.target.value === "EXCEPCIONAL"
                                ? flowDraft.justificacionFlujoExcepcional
                                : "",
                          })
                        }
                        className="rounded border border-gray-300 px-3 py-2"
                      >
                        <option value="">Selecciona modalidad</option>
                        <option value="REGULAR">REGULAR</option>
                        <option value="EXCEPCIONAL">EXCEPCIONAL</option>
                      </select>

                      {flowDraft.modalidadFlujoLogistico === "EXCEPCIONAL" ? (
                        <select
                          value={flowDraft.causalFlujoExcepcional}
                          onChange={(event) =>
                            updateFlowDraft(item.id, {
                              causalFlujoExcepcional: event.target.value,
                            })
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

                    {flowDraft.modalidadFlujoLogistico === "EXCEPCIONAL" ? (
                      <textarea
                        rows="3"
                        value={flowDraft.justificacionFlujoExcepcional}
                        onChange={(event) =>
                          updateFlowDraft(item.id, {
                            justificacionFlujoExcepcional: event.target.value,
                          })
                        }
                        placeholder="Justificacion obligatoria para urgencia o emergencia."
                        className="w-full rounded border border-gray-300 px-3 py-2"
                      />
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleGuardarFlujo(item)}
                        disabled={submittingFlowId === item.id}
                        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submittingFlowId === item.id
                          ? "Guardando..."
                          : "Guardar flujo"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedFlowId(null)}
                        className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}

                {expandedSolicitudId === item.id && canQuickCreateSolicitud ? (
                  <div className="mt-4">
                    <SolicitudCotizacionForm
                      initialData={createSolicitudDraft(item.id)}
                      proveedores={proveedores.filter(
                        (proveedor) => proveedor.activo !== false
                      )}
                      requerimientos={[
                        {
                          id: item.id,
                          codigo: item.codigo,
                          areaNombreSnapshot:
                            item.area?.nombre || item.areaNombreSnapshot,
                        },
                      ]}
                      requerimientoDetalle={item}
                      onRequerimientoChange={() => {}}
                      onSubmit={(payload) =>
                        handleCreateSolicitud(item, payload)
                      }
                      onCancel={() => setExpandedSolicitudId(null)}
                      submitting={submittingSolicitudId === item.id}
                    />
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
            No hay expedientes logisticos visibles en esta bandeja.
          </div>
        )}
      </div>
    </div>
  );
};

export default CotizacionesBandejaPage;
