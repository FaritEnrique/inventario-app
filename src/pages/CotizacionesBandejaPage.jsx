import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import FlujosCotizacionPanel from "../components/FlujosCotizacionPanel";
import Modal from "../components/Modal";
import SolicitudCotizacionForm from "../components/SolicitudCotizacionForm";
import {
  AlertasSeguimientoCards,
  AlertasSeguimientoModal,
} from "../components/AlertasSeguimientoLogistico";
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
import useAppDialog from "../hooks/useAppDialog";
import useFlujoCotizacionActions from "../hooks/useFlujoCotizacionActions";
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
import { buildFlujoTipoCompraWarning } from "../utils/flujoCotizacionUi";
import {
  formatCurrency,
  formatInteger,
  formatQuantity,
} from "../utils/numberFormatters";

const titles = {
  jefatura: "Bandeja Operativa de Logística",
  operador: "Bandeja de Operador de Logística",
};

const subtitles = {
  jefatura:
    "Supervisa requerimientos habilitados para atención logística, asigna responsables, define el flujo logístico y activa la atención operativa.",
  operador:
    "Trabaja solo los expedientes logísticos que tienes asignados y déjalos listos para decisión de jefatura.",
};

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
    label: "Cotizaciones incompletas",
    summaryLabel: "Cotizaciones incompletas",
    chipClass: "border-amber-300 bg-amber-50 text-amber-800",
  },
  REGISTRO_COTIZACION_COMPLETA: {
    label: "Cotizaciones completas",
    summaryLabel: "Cotizaciones completas",
    chipClass: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
  COMPARATIVO_GENERADO: {
    label: "En comparativo",
    summaryLabel: "En comparativo",
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
    Array.isArray(collection),
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
  "Ítem sin descripción";

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
    return "Aprobación final";
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
  fechaLimiteRecepcion: "",
  medioRecepcion: "CORREO",
  items: [],
});

const REASSIGNMENT_TYPE_OPTIONS = [
  { value: "DEFINITIVA", label: "Definitiva" },
  { value: "TEMPORAL", label: "Temporal" },
];

const createReassignmentDraft = () => ({
  tipoReasignacion: "DEFINITIVA",
  motivo: "",
  comentario: "",
  vigenteHasta: "",
});

const getInitialEstadoBandeja = (tipo) =>
  tipo === "jefatura" ? "PENDIENTE" : "";

const SERVER_PAGE_SIZE = 6;

const buildEmptyTrayCounts = () =>
  trayStatusOrder.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});

const buildLogisticaAssignmentPayload = ({ nextResponsableId }) => ({
  responsableId: Number(nextResponsableId),
});
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
  const { confirm, alert: showAlert, dialogNode } = useAppDialog();

  const [items, setItems] = useState([]);
  const [summaryItems, setSummaryItems] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [contextError, setContextError] = useState(null);
  const [search, setSearch] = useState("");
  const [estadoBandeja, setEstadoBandeja] = useState(() =>
    getInitialEstadoBandeja(tipo),
  );
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [serverCounters, setServerCounters] = useState(null);
  const [seguimientoAlertas, setSeguimientoAlertas] = useState(null);
  const [seguimientoAlertModalTipo, setSeguimientoAlertModalTipo] =
    useState(null);
  const [seleccionOperadores, setSeleccionOperadores] = useState({});
  const [flowDrafts, setFlowDrafts] = useState({});
  const [expandedFlowId, setExpandedFlowId] = useState(null);
  const [expandedSolicitudId, setExpandedSolicitudId] = useState(null);
  const [submittingFlowId, setSubmittingFlowId] = useState(null);
  const [submittingSolicitudId, setSubmittingSolicitudId] = useState(null);
  const [highlightedRequerimientoId, setHighlightedRequerimientoId] =
    useState(null);
  const [reassignmentModal, setReassignmentModal] = useState(null);
  const [reassignmentDraft, setReassignmentDraft] = useState(() =>
    createReassignmentDraft(),
  );
  const [submittingReassignment, setSubmittingReassignment] = useState(false);
  const [jefaturaResponsableOption, setJefaturaResponsableOption] =
    useState(null);

  const canAssign =
    canAssignCotizacionesLogisticaEffective(user) && tipo === "jefatura";

  useEffect(() => {
    setEstadoBandeja(getInitialEstadoBandeja(tipo));
    setPage(1);
    setPagination(null);
    setServerCounters(null);
    setSeguimientoAlertas(null);
    setSeguimientoAlertModalTipo(null);
  }, [tipo]);
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
    activeContext || {},
  );
  const canProcessDirectly =
    canAssign && (activeContextIsLogisticaJefatura || isAdminUser);
  const directResponsableOption = createDirectResponsableOption(
    user,
    canProcessDirectly,
  );
  const directResponsableId = directResponsableOption?.id || null;

  const handleChangeContext = () => {
    navigate("/seleccionar-contexto", {
      replace: true,
      state: {
        from: location,
        reason: "CONTEXT_INCOMPATIBLE",
        expectedContext:
          tipo === "jefatura" ? "logistica-jefatura" : "logistica-operador",
      },
    });
  };

  const load = async () => {
    try {
      const params =
        tipo === "jefatura"
          ? {
              search,
              estadoBandeja,
              page,
              limit: SERVER_PAGE_SIZE,
            }
          : {
              search,
            };
      const response = await obtenerBandeja(tipo, params);
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
        }),
      );
      const filteredData =
        tipo === "jefatura"
          ? enrichedData
          : estadoBandeja
            ? enrichedData.filter(
                (item) =>
                  String(item?.estadoBandeja || "").toUpperCase() ===
                  String(estadoBandeja).toUpperCase(),
              )
            : enrichedData;

      setSummaryItems(tipo === "jefatura" ? [] : enrichedData);
      setPagination(tipo === "jefatura" ? response?.pagination || null : null);
      setServerCounters(
        tipo === "jefatura" ? response?.counters || null : null,
      );
      setSeguimientoAlertas(response?.alertas || null);
      setItems(filteredData);
      setContextError(null);
      setSeleccionOperadores(() => {
        const next = {};
        filteredData.forEach((item) => {
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
        filteredData.forEach((item) => {
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

  const {
    dialogNode: flujosDialogNode,
    submittingFlujo,
    handleCerrarFlujo,
    handleReabrirFlujo,
  } = useFlujoCotizacionActions({ onAfterChange: load });

  useEffect(() => {
    load().catch(() => {});
  }, [
    tipo,
    search,
    estadoBandeja,
    page,
    directResponsableId,
    obtenerBandeja,
    obtenerDetalle,
  ]);

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
            activeContext?.areaId || activeContext?.area?.id || null,
          ),
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
    if (
      !items.some(
        (item) => Number(item.id) === Number(highlightedRequerimientoId),
      )
    ) {
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

  const resumen = useMemo(() => {
    if (tipo === "jefatura" && serverCounters) {
      return {
        total: Number(serverCounters.total || 0),
        counts: {
          ...buildEmptyTrayCounts(),
          ...(serverCounters.byEstadoBandeja || {}),
        },
      };
    }

    const counts = buildEmptyTrayCounts();

    summaryItems.forEach((item) => {
      const status = String(item?.estadoBandeja || "").toUpperCase();
      if (Object.prototype.hasOwnProperty.call(counts, status)) {
        counts[status] += 1;
      }
    });

    return {
      total: summaryItems.length,
      counts,
    };
  }, [serverCounters, summaryItems, tipo]);
  const hasLoadedSummary =
    tipo === "jefatura" ? Boolean(serverCounters || pagination) : summaryItems.length > 0;
  const isInitialLoading = cargando && !hasLoadedSummary && !contextError;

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleEstadoBandejaChange = (event) => {
    setEstadoBandeja(event.target.value);
    setPage(1);
  };

  const handlePreviousPage = () => {
    if (!pagination?.hasPreviousPage) return;
    setPage((currentPage) => Math.max(1, currentPage - 1));
  };

  const handleNextPage = () => {
    if (!pagination?.hasNextPage) return;
    setPage((currentPage) => currentPage + 1);
  };

  const handleAssign = async (requerimientoId) => {
    const item = items.find(
      (currentItem) => currentItem.id === requerimientoId,
    );
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

    if (!responsableActualId) {
      await asignar(
        requerimientoId,
        buildLogisticaAssignmentPayload({
          nextResponsableId: selectedResponsableId,
        }),
      );
      await load();
      return;
    }

    setReassignmentDraft(createReassignmentDraft());
    setReassignmentModal({
      requerimientoId,
      responsableId: Number(selectedResponsableId),
    });
  };

  const handleDirect = async (requerimientoId) => {
    if (!directResponsableId) {
      toast.error(
        "Procesar directamente solo está disponible con la jefatura logística activa.",
      );
      return;
    }

    const item = items.find(
      (currentItem) => currentItem.id === requerimientoId,
    );
    const responsableActualId =
      item?.responsableLogisticaId || item?.responsableLogistica?.id || null;

    if (!responsableActualId) {
      await asignar(
        requerimientoId,
        buildLogisticaAssignmentPayload({
          nextResponsableId: directResponsableId,
        }),
      );
      await load();
      return;
    }

    setReassignmentDraft(createReassignmentDraft());
    setReassignmentModal({
      requerimientoId,
      responsableId: Number(directResponsableId),
    });
  };

  const closeReassignmentModal = () => {
    if (submittingReassignment) return;
    setReassignmentModal(null);
    setReassignmentDraft(createReassignmentDraft());
  };

  const handleConfirmReassignment = async (event) => {
    event.preventDefault();

    if (!reassignmentModal) return;

    const tipoReasignacion = reassignmentDraft.tipoReasignacion;
    const motivo = reassignmentDraft.motivo.trim();

    if (!["TEMPORAL", "DEFINITIVA"].includes(tipoReasignacion)) {
      toast.error("La reasignacion debe ser TEMPORAL o DEFINITIVA.");
      return;
    }

    if (!motivo) {
      toast.error("Debes registrar un motivo para la reasignacion.");
      return;
    }

    setSubmittingReassignment(true);
    try {
      await asignar(reassignmentModal.requerimientoId, {
        responsableId: reassignmentModal.responsableId,
        tipoReasignacion,
        motivo,
        comentario: reassignmentDraft.comentario.trim() || null,
        vigenteHasta:
          tipoReasignacion === "TEMPORAL" && reassignmentDraft.vigenteHasta
            ? reassignmentDraft.vigenteHasta
            : null,
      });
      setReassignmentModal(null);
      setReassignmentDraft(createReassignmentDraft());
      await load();
    } finally {
      setSubmittingReassignment(false);
    }
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
      toast.error("Debes seleccionar una modalidad de flujo logístico.");
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
        "La justificación es obligatoria para URGENCIA o EMERGENCIA.",
      );
      return;
    }

    setSubmittingFlowId(item.id);
    try {
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
      toast.success("Flujo logístico actualizado.");
    } finally {
      setSubmittingFlowId(null);
    }
  };

  const getFlujosCotizacionForSolicitud = async (item) => {
    if (Array.isArray(item?.flujosCotizacion)) {
      return item.flujosCotizacion;
    }

    try {
      const detalle = await obtenerDetalle(item.id);
      return Array.isArray(detalle?.flujosCotizacion)
        ? detalle.flujosCotizacion
        : [];
    } catch {
      return [];
    }
  };

  const handleCreateSolicitud = async (item, payload) => {
    const flujosCotizacion = await getFlujosCotizacionForSolicitud(item);
    const flujoWarning = buildFlujoTipoCompraWarning({
      flujosCotizacion,
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
    <>
    {dialogNode}
    {flujosDialogNode}
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
            <p className="mt-2 text-right text-3xl font-bold text-gray-900 tabular-nums">
              {formatInteger(resumen.total)}
            </p>
          </div>
          {trayStatusOrder.map((status) => {
            const meta = getTrayStatusMeta(status);
            return (
              <div key={status} className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {meta.summaryLabel}
                </p>
                <p className="mt-2 text-right text-3xl font-bold text-gray-900 tabular-nums">
                  {formatInteger(resumen.counts[status])}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <AlertasSeguimientoCards
        alertas={seguimientoAlertas}
        onSelectTipo={setSeguimientoAlertModalTipo}
      />

      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-3">
        <input
          value={search}
          name="cotizaciones-bandeja-page-input-134"
          onChange={handleSearchChange}
          placeholder="Buscar por código, solicitante o finalidad"
          className="rounded border border-gray-300 px-3 py-2 md:col-span-2"
        />
        <select
          value={estadoBandeja}
          name="cotizaciones-bandeja-page-select-140"
          onChange={handleEstadoBandejaChange}
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
                No tienes un contexto operativo autorizado para el modulo
                logistico.
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
              item.estadoLogistica,
            );
            const canQuickDefineFlow =
              canAssign && !blocked && item.puedeCambiarFlujoLogistico === true;
            const totalSolicitudes = Number(
              item.resumenComparativo?.totalSolicitudes || 0,
            );
            const canQuickCreateSolicitud =
              canAssign &&
              !blocked &&
              ["REGULAR", "EXCEPCIONAL"].includes(
                item.modalidadFlujoLogistico,
              ) &&
              !assignedToOtherResponsable;
            const canOperatorContinueExpediente =
              tipo === "operador" && assignedToCurrentUser && !blocked;
            const canOperatorManageSolicitud =
              canOperatorContinueExpediente &&
              ["REGULAR", "EXCEPCIONAL"].includes(item.modalidadFlujoLogistico);
            const hasFlujosCotizacion =
              Array.isArray(item.flujosCotizacion) &&
              item.flujosCotizacion.length > 0;
            const canManageItemFlujos =
              !blocked &&
              (canQuickDefineFlow ||
                canQuickCreateSolicitud ||
                canOperatorManageSolicitud ||
                isAdminUser);
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
                          item,
                        )}`}
                      >
                        {getAprobacionChipLabel(item)}
                      </span>
                    </div>
                    <p className="mt-2 text-right text-sm font-medium text-gray-700 tabular-nums">
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
                    <p className="text-right text-sm text-gray-700 tabular-nums">
                      {formatInteger(item.resumenComparativo?.totalSolicitudes)} /{" "}
                      {formatInteger(item.resumenComparativo?.totalCotizaciones)}
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
                        ? `${formatInteger(
                            requerimientoItems.length,
                          )} item(s) visibles en el expediente`
                        : "No se encontraron items visibles en la data devuelta para este expediente."}
                    </p>
                  </div>
                  {requerimientoItems.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Item
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Cantidad
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
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
                              <td className="px-4 py-3 text-right text-sm text-slate-700 tabular-nums">
                                {formatQuantity(requerimientoItem.cantidadRequerida)}{" "}
                                {requerimientoItem.unidadMedida || ""}
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-slate-700 tabular-nums">
                                {formatCurrency(
                                  requerimientoItem.subtotalReferencial,
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
                      {formatInteger(item.resumenComparativo?.totalSolicitudes)}{" "}
                      solicitud(es)
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {item.modalidadFlujoLogistico === "REGULAR"
                        ? assignedToOtherResponsable
                          ? "La etapa de cotizacion queda deshabilitada mientras el expediente esté asignado a otro responsable logístico."
                          : "Puedes emitir solicitudes de cotización desde esta bandeja."
                        : item.modalidadFlujoLogistico === "EXCEPCIONAL"
                          ? assignedToOtherResponsable
                            ? "La etapa de cotizacion queda deshabilitada mientras el expediente esté asignado a otro responsable logístico."
                            : "Puedes emitir solicitudes de cotización desde esta bandeja incluso en flujo excepcional."
                          : "Primero debes definir el flujo logístico."}
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
                    El expediente ya puede trabajarse en logistica, pero la
                    aprobacion documental final aun depende de Gerencia General.
                    La decision final y la orden de compra permanecen
                    bloqueadas.
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
                    {tipo === "operador" &&
                    item.estadoLogistica === "ASIGNADO" ? (
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
                            prev === item.id ? null : item.id,
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
                            prev === item.id ? null : item.id,
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

                {hasFlujosCotizacion ? (
                  <div className="mt-4">
                    <FlujosCotizacionPanel
                      flujosCotizacion={item.flujosCotizacion}
                      canManage={canManageItemFlujos}
                      compact
                      loading={submittingFlujo}
                      onCerrarFlujo={handleCerrarFlujo}
                      onReabrirFlujo={handleReabrirFlujo}
                    />
                  </div>
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
                        placeholder="Justificación obligatoria para urgencia o emergencia."
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
                        (proveedor) => proveedor.activo !== false,
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

      {tipo === "jefatura" && pagination ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 text-sm text-slate-700 shadow-sm">
          <p>
            {pagination.total > 0
              ? `${formatInteger(pagination.from)}-${formatInteger(
                  pagination.to,
                )} de ${formatInteger(pagination.total)}`
              : "0 de 0"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={!pagination.hasPreviousPage}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={!pagination.hasNextPage}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </div>

    <Modal
      isOpen={Boolean(reassignmentModal)}
      onClose={closeReassignmentModal}
      title="Reasignar expediente logistico"
      maxWidth="max-w-lg"
      closeOnBackdrop={!submittingReassignment}
    >
      <form onSubmit={handleConfirmReassignment} className="space-y-4">
        <p className="text-sm text-gray-600">
          Selecciona el tipo de reasignacion y registra el motivo para
          continuar con el cambio de responsable.
        </p>

        <div>
          <label
            htmlFor="tipoReasignacionLogistica"
            className="mb-1 block text-sm font-semibold text-gray-700"
          >
            Tipo de reasignacion
          </label>
          <select
            id="tipoReasignacionLogistica"
            name="tipoReasignacion"
            value={reassignmentDraft.tipoReasignacion}
            onChange={(event) =>
              setReassignmentDraft((prev) => ({
                ...prev,
                tipoReasignacion: event.target.value,
                vigenteHasta:
                  event.target.value === "TEMPORAL" ? prev.vigenteHasta : "",
              }))
            }
            disabled={submittingReassignment}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
          >
            {REASSIGNMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="motivoReasignacionLogistica"
            className="mb-1 block text-sm font-semibold text-gray-700"
          >
            Motivo
          </label>
          <textarea
            id="motivoReasignacionLogistica"
            name="motivo"
            rows="3"
            value={reassignmentDraft.motivo}
            onChange={(event) =>
              setReassignmentDraft((prev) => ({
                ...prev,
                motivo: event.target.value,
              }))
            }
            disabled={submittingReassignment}
            required
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
            placeholder="Explica por que se reasigna el expediente."
          />
        </div>

        <div>
          <label
            htmlFor="comentarioReasignacionLogistica"
            className="mb-1 block text-sm font-semibold text-gray-700"
          >
            Comentario adicional
          </label>
          <textarea
            id="comentarioReasignacionLogistica"
            name="comentario"
            rows="2"
            value={reassignmentDraft.comentario}
            onChange={(event) =>
              setReassignmentDraft((prev) => ({
                ...prev,
                comentario: event.target.value,
              }))
            }
            disabled={submittingReassignment}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
            placeholder="Opcional"
          />
        </div>

        {reassignmentDraft.tipoReasignacion === "TEMPORAL" ? (
          <div>
            <label
              htmlFor="vigenteHastaReasignacionLogistica"
              className="mb-1 block text-sm font-semibold text-gray-700"
            >
              Vigente hasta
            </label>
            <input
              id="vigenteHastaReasignacionLogistica"
              name="vigenteHasta"
              type="date"
              value={reassignmentDraft.vigenteHasta}
              onChange={(event) =>
                setReassignmentDraft((prev) => ({
                  ...prev,
                  vigenteHasta: event.target.value,
                }))
              }
              disabled={submittingReassignment}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
            />
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={closeReassignmentModal}
            disabled={submittingReassignment}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submittingReassignment || !reassignmentDraft.motivo.trim()}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submittingReassignment ? "Reasignando..." : "Confirmar"}
          </button>
        </div>
      </form>
    </Modal>

    <AlertasSeguimientoModal
      alertas={seguimientoAlertas}
      tipo={seguimientoAlertModalTipo}
      onClose={() => setSeguimientoAlertModalTipo(null)}
      buildExpedientePath={(expediente, tipoAlerta) =>
        tipoAlerta === "COBERTURA_INCOMPLETA"
          ? `/cotizaciones/proceso/${expediente.id}/cotizaciones`
          : `/cotizaciones/proceso/${expediente.id}`
      }
    />
    </>
  );
};

export default CotizacionesBandejaPage;
