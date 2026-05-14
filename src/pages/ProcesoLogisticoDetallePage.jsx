import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  canAdjudicateCotizacionesLogisticaEffective,
  canAssignCotizacionesLogisticaEffective,
  canOperateCotizacionesLogisticaEffective,
  isLogisticaJefaturaContext,
} from "../accessRules";
import ComparativoEstadoBadge from "../components/ComparativoEstadoBadge";
import ConfirmToast from "../components/ConfirmToast";
import CotizacionEstadoBadge from "../components/CotizacionEstadoBadge";
import CotizacionForm from "../components/CotizacionForm";
import Loader from "../components/Loader";
import SolicitudCotizacionForm from "../components/SolicitudCotizacionForm";
import ProcesoLogisticoDetalleSkeleton from "../components/ui/skeletons/ProcesoLogisticoDetalleSkeleton";
import usersApi from "../api/usersApi";
import { useAuth } from "../context/authContext";
import useCotizaciones from "../hooks/useCotizaciones";
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

const formatCurrency = (value) => `S/ ${Number(value || 0).toFixed(2)}`;
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "-";
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "-";

const createEmptyComparativoDraft = () => ({
  observaciones: "",
  cotizacionIdsConsideradas: [],
  cotizacionSeleccionadaId: "",
  adjudicacionesItems: [],
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

const buildComparativoDraft = (comparativo) => {
  const adjudicacionesItems = Array.isArray(
    comparativo?.adjudicacionesPorItemSnapshot,
  )
    ? comparativo.adjudicacionesPorItemSnapshot.map((item) => ({
        itemRequerimientoId: String(item.itemRequerimientoId),
        cotizacionId: String(item.cotizacionId),
      }))
    : Array.isArray(comparativo?.cotizacionSeleccionadaSnapshot?.items)
      ? comparativo.cotizacionSeleccionadaSnapshot.items.map((item) => ({
          itemRequerimientoId: String(item.itemRequerimientoId),
          cotizacionId: String(
            comparativo.cotizacionSeleccionadaSnapshot.cotizacionId,
          ),
        }))
      : [];

  return {
    observaciones: comparativo?.observaciones || "",
    cotizacionIdsConsideradas: Array.isArray(
      comparativo?.cotizacionesConsideradasSnapshot?.cotizaciones,
    )
      ? comparativo.cotizacionesConsideradasSnapshot.cotizaciones.map((item) =>
          String(item.cotizacionId),
        )
      : [],
    cotizacionSeleccionadaId:
      comparativo?.cotizacionSeleccionadaSnapshot?.cotizacionId !== undefined &&
      comparativo?.cotizacionSeleccionadaSnapshot?.cotizacionId !== null
        ? String(comparativo.cotizacionSeleccionadaSnapshot.cotizacionId)
        : "",
    adjudicacionesItems,
    criterioAdjudicacion:
      comparativo?.criterioAdjudicacionSnapshot?.resumen ||
      (typeof comparativo?.criterioAdjudicacionSnapshot === "string"
        ? comparativo.criterioAdjudicacionSnapshot
        : ""),
  };
};

const comparativoCanEdit = (comparativo) =>
  !comparativo ||
  ["BORRADOR", "OBSERVADO"].includes(
    String(comparativo?.estadoDocumento || "").toUpperCase(),
  );

const ADJUDICACION_DIRECTA_EXCEPCIONAL_VIA = "ADJUDICACION_DIRECTA_EXCEPCIONAL";

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
      comparativo?.cotizacionSeleccionadaSnapshot?.cotizacionId || 0,
    ),
    adjudicacionesPorItem: Array.isArray(
      comparativo?.adjudicacionesPorItemSnapshot,
    )
      ? comparativo.adjudicacionesPorItemSnapshot
      : [],
    proveedoresAdjudicados: Array.isArray(
      comparativo?.proveedoresAdjudicadosSnapshot,
    )
      ? comparativo.proveedoresAdjudicadosSnapshot
      : [],
  };
};

const buildSolicitudDraft = (solicitud) => ({
  id: solicitud.id,
  proveedorId: solicitud.proveedorId || solicitud.proveedor?.id,
  requerimientoId: solicitud.requerimientoId,
  cuerpoSolicitud: solicitud.cuerpoSolicitud || "",
  estado: solicitud.estado,
  moneda: solicitud.moneda || "PEN",
  incluyeIgv:
    typeof solicitud.incluyeIgv === "boolean" ? solicitud.incluyeIgv : true,
  fechaLimiteRecepcion: solicitud.fechaLimiteRecepcion || "",
  medioRecepcion: solicitud.medioRecepcion || "CORREO",
  vigenciaOfertaDias: solicitud.vigenciaOfertaDias,
  tiempoEntregaDias: solicitud.tiempoEntregaDias,
  lugarEntrega: solicitud.lugarEntrega || "",
  formaPago: solicitud.formaPago || "",
  garantia: solicitud.garantia || "",
  items: Array.isArray(solicitud.items)
    ? solicitud.items.map((item) => ({
        itemRequerimientoId: item.itemRequerimientoId,
      }))
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
  vigenciaOfertaDias: cotizacion.vigenciaOfertaDias,
  lugarEntrega: cotizacion.lugarEntrega || "",
  formaPago: cotizacion.formaPago || "",
  observaciones: cotizacion.observaciones || "",
  items: Array.isArray(cotizacion.items)
    ? cotizacion.items.map((item) => ({
        itemRequerimientoId: item.itemRequerimientoId,
        estadoRespuesta: item.estadoRespuesta || "COTIZADO",
        cantidadOfrecida: item.cantidadOfrecida,
        precioUnidad: item.precioUnidad,
        precioTotal: item.precioTotal,
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
  formaPago: "",
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
      }))
    : [],
});

const getCotizacionItemsMap = (cotizaciones = []) =>
  cotizaciones.reduce((acc, cotizacion) => {
    acc[String(cotizacion.id)] = new Set(
      Array.isArray(cotizacion.items)
        ? cotizacion.items
            .filter(
              (item) =>
                String(item.estadoRespuesta || "COTIZADO").toUpperCase() ===
                "COTIZADO",
            )
            .map((item) => String(item.itemRequerimientoId))
        : [],
    );
    return acc;
  }, {});

const getAdjudicacionCotizacionId = (draft, itemRequerimientoId) =>
  draft.adjudicacionesItems.find(
    (entry) =>
      String(entry.itemRequerimientoId) === String(itemRequerimientoId),
  )?.cotizacionId || "";

const getRegularWorkflowStep = ({ detalle, comparativo, canAdjudicate }) => {
  if (detalle?.modalidadFlujoLogistico !== "REGULAR") {
    return null;
  }

  const totalSolicitudes = Number(
    detalle?.resumenComparativo?.totalSolicitudes || 0,
  );
  const totalCotizaciones = Number(
    detalle?.resumenComparativo?.totalCotizaciones || 0,
  );

  if (!totalSolicitudes) {
    return {
      title: "Paso 1: emitir solicitudes de cotizacion",
      description:
        "Primero emite una o varias solicitudes para invitar proveedores al expediente.",
      sectionId: "solicitudes",
      cta: "Ir a solicitudes",
    };
  }

  if (!totalCotizaciones) {
    return {
      title: "Paso 2: registrar cotizaciones",
      description:
        "Con la solicitud ya emitida, registra aqui las respuestas economicas de los proveedores.",
      sectionId: "cotizaciones",
      cta: "Ir a cotizaciones",
    };
  }

  if (!comparativo?.id) {
    return {
      title: "Paso 3: formalizar comparativo",
      description:
        "Selecciona las ofertas consideradas, define la propuesta ganadora y guarda el comparativo formal.",
      sectionId: "comparativo",
      cta: "Ir a comparativo",
    };
  }

  if (detalle?.pendienteGerenciaGeneral) {
    return {
      title: "Paso 4: esperar aprobacion final",
      description:
        "Logistica ya puede preparar el expediente, pero la aprobacion final del comparativo y la orden de compra siguen bloqueadas mientras Gerencia General este pendiente.",
      sectionId: "control-logistico",
      cta: "Ir a control logistico",
    };
  }

  if (comparativo.estadoDocumento !== "APROBADO" && canAdjudicate) {
    return {
      title: "Paso 4: aprobar comparativo",
      description:
        "La jefatura aun debe revisar y aprobar el comparativo para poder emitir la orden de compra.",
      sectionId: "comparativo",
      cta: "Revisar comparativo",
    };
  }

  if (detalle?.puedeGenerarOrdenCompra) {
    return {
      title: "Paso 5: emitir orden de compra",
      description:
        "El expediente ya tiene sustento formal; ahora puedes generar la orden de compra.",
      sectionId: "control-logistico",
      cta: "Ir a orden de compra",
    };
  }

  return null;
};

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
    "DEFINITIVA",
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
    "",
  );
  if (motivoInput === null) return null;

  const motivo = String(motivoInput || "").trim();
  if (!motivo) {
    toast.error("Debes registrar un motivo para la reasignacion.");
    return null;
  }

  const comentarioInput = window.prompt(
    "Comentario adicional de la reasignacion (opcional).",
    "",
  );
  if (comentarioInput === null) return null;

  let vigenteHasta = null;
  if (tipoReasignacion === "TEMPORAL") {
    const vigenteHastaInput = window.prompt(
      "Vigente hasta (AAAA-MM-DD) opcional para la reasignacion temporal.",
      "",
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

const ProcesoLogisticoDetallePage = ({ fase = "resumen" }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, activeContext } = useAuth();
  const { proveedores } = useProveedores();
  const {
    cargando,
    error,
    obtenerDetalle,
    definirFlujo,
    obtenerComparativo,
    obtenerComparativoPdfUrl,
    obtenerOperadores,
    asignar,
    iniciar,
    cerrarEmision,
    reabrirEmision,
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
    desactivarSolicitud,
    obtenerSolicitudPdfUrl,
    enviarSolicitudCorreo,
  } = useSolicitudesCotizacion({ autoLoad: false });
  const {
    crearCotizacion,
    actualizarCotizacion,
    inactivarCotizacion,
    reactivarCotizacion,
    obtenerCotizacionPdfUrl,
  } = useCotizaciones({ autoLoad: false });

  const [detalle, setDetalle] = useState(null);
  const [operadores, setOperadores] = useState([]);
  const [solicitudDraft, setSolicitudDraft] = useState(null);
  const [cotizacionDraft, setCotizacionDraft] = useState(null);
  const [flujoDraft, setFlujoDraft] = useState(createEmptyFlujoDraft);
  const [decisionExcepcionalDraft, setDecisionExcepcionalDraft] = useState(
    createEmptyDecisionExcepcionalDraft,
  );
  const [comparativo, setComparativo] = useState(null);
  const [comparativoDraft, setComparativoDraft] = useState(
    createEmptyComparativoDraft,
  );
  const [responsableId, setResponsableId] = useState("");
  const [submittingSolicitud, setSubmittingSolicitud] = useState(false);
  const [submittingCotizacion, setSubmittingCotizacion] = useState(false);
  const [submittingComparativo, setSubmittingComparativo] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [sendingSolicitudId, setSendingSolicitudId] = useState(null);
  const [jefaturaResponsableOption, setJefaturaResponsableOption] =
    useState(null);

  const canAssign = canAssignCotizacionesLogisticaEffective(user);
  const canAdjudicate = canAdjudicateCotizacionesLogisticaEffective(user);
  const isAdminUser = Array.isArray(user?.identityRoles)
    ? user.identityRoles.includes("ADMINISTRADOR_SISTEMA")
    : false;
  const canProcessDirectly =
    canAssign &&
    (isLogisticaJefaturaContext(activeContext || {}) || isAdminUser);
  const directResponsableOption = createDirectResponsableOption(
    user,
    canProcessDirectly,
  );
  const directResponsableId = directResponsableOption?.id || null;
  const isEmisionPhase = fase === "emision";
  const expedientePath = `/cotizaciones/proceso/${id}`;
  const emisionPath = `/cotizaciones/proceso/${id}/emision`;

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
        : createEmptyComparativoDraft(),
    );
    setResponsableId(
      getDefaultLogisticaResponsableSelection({
        responsableActualId:
          data?.responsableLogisticaId || data?.responsableLogistica?.id,
        directResponsableId,
      }),
    );
    setSolicitudDraft(
      (prev) =>
        prev || {
          requerimientoId: data.id,
        },
    );
  };

  useEffect(() => {
    load().catch(() => {});
  }, [id, directResponsableId]);

  useEffect(() => {
    if (!isEmisionPhase && location.hash === "#solicitudes") {
      navigate(emisionPath, {
        replace: true,
        state: location.state,
      });
    }
  }, [emisionPath, isEmisionPhase, location.hash, location.state, navigate]);

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
    if (!location.hash || !detalle?.id) return;

    const targetId = location.hash.replace(/^#/, "");
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [location.hash, detalle?.id]);

  const resumenCotizaciones = useMemo(
    () => (Array.isArray(detalle?.cotizaciones) ? detalle.cotizaciones : []),
    [detalle?.cotizaciones],
  );
  const resumenCotizacionesActivas = useMemo(
    () =>
      resumenCotizaciones.filter((cotizacion) => cotizacion.activo !== false),
    [resumenCotizaciones],
  );
  const ordenesCompraRelacionadas = useMemo(
    () => (Array.isArray(detalle?.ordenesCompra) ? detalle.ordenesCompra : []),
    [detalle?.ordenesCompra],
  );
  const cotizacionItemsMap = useMemo(
    () => getCotizacionItemsMap(resumenCotizaciones),
    [resumenCotizaciones],
  );
  const comparativoDecisionMeta = useMemo(
    () => getComparativoDecisionMeta(comparativo),
    [comparativo],
  );
  const coberturaItems = useMemo(
    () =>
      Array.isArray(detalle?.resumenComparativo?.coberturaItems)
        ? detalle.resumenComparativo.coberturaItems
        : [],
    [detalle?.resumenComparativo?.coberturaItems],
  );

  const handleAsignar = async () => {
    const responsableActualId =
      detalle?.responsableLogisticaId || detalle?.responsableLogistica?.id;

    if (
      !canSubmitLogisticaAssignment({
        selectedResponsableId: responsableId,
        responsableActualId,
      })
    ) {
      return;
    }

    const payload = promptLogisticaReassignmentPayload({
      currentResponsableId: responsableActualId,
      nextResponsableId: responsableId,
    });
    if (!payload) return;

    setSubmittingAction(true);
    try {
      const result = await asignar(detalle.id, payload);
      setDetalle(result);
      setResponsableId(
        getDefaultLogisticaResponsableSelection({
          responsableActualId:
            result?.responsableLogisticaId || result?.responsableLogistica?.id,
          directResponsableId,
        }),
      );
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleTomarDirecto = async () => {
    if (!directResponsableId) {
      toast.error(
        "Procesar directamente solo esta disponible con la jefatura logistica activa.",
      );
      return;
    }

    const payload = promptLogisticaReassignmentPayload({
      currentResponsableId:
        detalle?.responsableLogisticaId || detalle?.responsableLogistica?.id,
      nextResponsableId: directResponsableId,
    });
    if (!payload) return;

    setSubmittingAction(true);
    try {
      const result = await asignar(detalle.id, payload);
      setDetalle(result);
      setResponsableId(
        getDefaultLogisticaResponsableSelection({
          responsableActualId:
            result?.responsableLogisticaId || result?.responsableLogistica?.id,
          directResponsableId,
        }),
      );
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
        "Se generaran las ordenes de compra a partir de la buena pro vigente del expediente. Deseas continuar?",
      )
    ) {
      return;
    }

    setSubmittingAction(true);
    try {
      const result = await generarOrdenCompra(detalle.id);
      setDetalle(result.requerimiento);
      const totalGeneradas = Array.isArray(result.ordenesCompra)
        ? result.ordenesCompra.length
        : result.ordenCompra
          ? 1
          : 0;
      toast.success(
        totalGeneradas > 1
          ? `${totalGeneradas} ordenes de compra generadas correctamente.`
          : `Orden de compra ${result.ordenCompra?.codigo || "generada"} correctamente.`,
      );
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSolicitudSubmit = async (payload) => {
    setSubmittingSolicitud(true);
    try {
      const saved = solicitudDraft?.id
        ? await actualizarSolicitud(solicitudDraft.id, payload)
        : await crearSolicitud(payload);
      setCotizacionDraft(createCotizacionDraftFromSolicitud(saved));
      document.getElementById("cotizaciones")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      await load();
      setSolicitudDraft({ requerimientoId: Number(id) });
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

  const handleDeactivateSolicitud = async (solicitudId) => {
    toast(
      ({ closeToast }) => (
        <ConfirmToast
          closeToast={closeToast}
          title="Desactivar solicitud"
          message="La solicitud de cotizacion se desactivara logicamente. Esta accion no elimina el registro ni su trazabilidad."
          confirmButtonText="Desactivar"
          cancelButtonText="Cancelar"
          variant="warning"
          onConfirm={async () => {
            await desactivarSolicitud(solicitudId);
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
      },
    );
  };

  const handleInactivateCotizacion = async (cotizacionId) => {
    const motivo = window.prompt(
      "Motivo para inactivar la cotizacion (opcional):",
      "",
    );

    if (motivo === null) {
      return;
    }

    await inactivarCotizacion(cotizacionId, {
      motivoInactivacion: motivo.trim() || null,
    });
    await load();
  };

  const handleReactivateCotizacion = async (cotizacionId) => {
    const motivo = window.prompt(
      "Motivo para reactivar la cotizacion (opcional):",
      "",
    );

    if (motivo === null) {
      return;
    }

    await reactivarCotizacion(cotizacionId, {
      motivoReactivacion: motivo.trim() || null,
    });
    await load();
  };

  const handleCerrarEmision = async () => {
    const motivo = window.prompt(
      "Motivo para cerrar la emision de solicitudes (opcional):",
      "",
    );

    if (motivo === null) {
      return;
    }

    setSubmittingAction(true);
    try {
      const result = await cerrarEmision(detalle.id, {
        motivo: motivo.trim() || null,
      });
      setDetalle(result);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReabrirEmision = async () => {
    const motivo = window.prompt(
      "Motivo para reabrir la emision de solicitudes (opcional):",
      "",
    );

    if (motivo === null) {
      return;
    }

    setSubmittingAction(true);
    try {
      const result = await reabrirEmision(detalle.id, {
        motivo: motivo.trim() || null,
      });
      setDetalle(result);
    } finally {
      setSubmittingAction(false);
    }
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handlePrintSolicitud = (solicitudId) => {
    window.open(
      obtenerSolicitudPdfUrl(solicitudId),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handlePrintCotizacion = (cotizacionId) => {
    window.open(
      obtenerCotizacionPdfUrl(cotizacionId),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handlePrintComparativo = (comparativoId) => {
    window.open(
      obtenerComparativoPdfUrl(comparativoId),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleSendSolicitudByEmail = async (solicitud) => {
    const defaultRecipient = solicitud?.proveedor?.correoElectronico || "";
    const recipient = window.prompt(
      "Correo destino para la solicitud de cotizacion:",
      defaultRecipient,
    );

    if (recipient === null) {
      return;
    }

    setSendingSolicitudId(solicitud.id);
    try {
      await enviarSolicitudCorreo(solicitud.id, {
        to: recipient.trim() || undefined,
      });
      await load();
    } finally {
      setSendingSolicitudId(null);
    }
  };

  const handleGuardarFlujo = async () => {
    const modalidad = flujoDraft.modalidadFlujoLogistico;

    if (!modalidad) {
      toast.error("Debes seleccionar una modalidad de flujo logistico.");
      return;
    }

    if (modalidad === "EXCEPCIONAL" && !flujoDraft.causalFlujoExcepcional) {
      toast.error("Debes seleccionar una causal para el flujo excepcional.");
      return;
    }

    if (
      modalidad === "EXCEPCIONAL" &&
      ["URGENCIA", "EMERGENCIA"].includes(flujoDraft.causalFlujoExcepcional) &&
      !flujoDraft.justificacionFlujoExcepcional.trim()
    ) {
      toast.error(
        "La justificacion es obligatoria para URGENCIA o EMERGENCIA.",
      );
      return;
    }

    setSubmittingAction(true);
    try {
      const wasEmisionClosed = detalle.emisionSolicitudesCerrada === true;
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
      toast.success(
        wasEmisionClosed && result?.emisionSolicitudesCerrada === false
          ? "Flujo logistico actualizado y emision reabierta automaticamente por cobertura insuficiente."
          : "Flujo logistico definido correctamente.",
      );
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleFormalizarDecisionExcepcional = async () => {
    if (!decisionExcepcionalDraft.cotizacionId) {
      toast.error(
        "Debes seleccionar una cotizacion para formalizar la decision excepcional.",
      );
      return;
    }

    if (
      !window.confirm(
        "Se formalizara la decision excepcional del expediente con la cotizacion seleccionada. Deseas continuar?",
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
    setComparativoDraft((prev) => {
      const nextCotizaciones = prev.cotizacionIdsConsideradas.includes(
        normalizedId,
      )
        ? prev.cotizacionIdsConsideradas.filter(
            (idValue) => idValue !== normalizedId,
          )
        : [...prev.cotizacionIdsConsideradas, normalizedId];

      const nextAdjudicaciones = prev.adjudicacionesItems.filter(
        (entry) =>
          entry.cotizacionId !== normalizedId ||
          nextCotizaciones.includes(normalizedId),
      );
      const singleWinnerIds = [
        ...new Set(nextAdjudicaciones.map((entry) => entry.cotizacionId)),
      ];

      return {
        ...prev,
        cotizacionIdsConsideradas: nextCotizaciones,
        adjudicacionesItems: nextAdjudicaciones,
        cotizacionSeleccionadaId:
          singleWinnerIds.length === 1 ? singleWinnerIds[0] : "",
      };
    });
  };

  const handleAdjudicacionItemChange = (itemRequerimientoId, cotizacionId) => {
    setComparativoDraft((prev) => {
      const nextEntries = prev.adjudicacionesItems.filter(
        (entry) =>
          String(entry.itemRequerimientoId) !== String(itemRequerimientoId),
      );

      if (cotizacionId) {
        nextEntries.push({
          itemRequerimientoId: String(itemRequerimientoId),
          cotizacionId: String(cotizacionId),
        });
      }

      const singleWinnerIds = [
        ...new Set(nextEntries.map((entry) => entry.cotizacionId)),
      ];

      return {
        ...prev,
        adjudicacionesItems: nextEntries,
        cotizacionSeleccionadaId:
          singleWinnerIds.length === 1 ? singleWinnerIds[0] : "",
      };
    });
  };

  const handleComparativoSubmit = async (event) => {
    event.preventDefault();

    const activeCotizacionIds = new Set(
      resumenCotizacionesActivas.map((cotizacion) => String(cotizacion.id)),
    );
    const cotizacionIdsConsideradas =
      comparativoDraft.cotizacionIdsConsideradas.filter((value) =>
        activeCotizacionIds.has(String(value)),
      );

    if (!cotizacionIdsConsideradas.length) {
      toast.error(
        "Debes considerar al menos una cotizacion en el comparativo.",
      );
      return;
    }

    const adjudicacionesValidas = comparativoDraft.adjudicacionesItems.filter(
      (entry) =>
        entry?.cotizacionId &&
        entry?.itemRequerimientoId &&
        cotizacionIdsConsideradas.includes(String(entry.cotizacionId)),
    );

    const payload = {
      observaciones: comparativoDraft.observaciones.trim() || null,
      cotizacionIdsConsideradas: cotizacionIdsConsideradas.map((value) =>
        Number(value),
      ),
      cotizacionSeleccionadaId: comparativoDraft.cotizacionSeleccionadaId
        ? Number(comparativoDraft.cotizacionSeleccionadaId)
        : null,
      adjudicacionesItems: adjudicacionesValidas.map((entry) => ({
        itemRequerimientoId: Number(entry.itemRequerimientoId),
        cotizacionId: Number(entry.cotizacionId),
      })),
      criterioAdjudicacion:
        comparativoDraft.criterioAdjudicacion.trim() || null,
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
          : "Comparativo formal creado.",
      );
      await load();
    } finally {
      setSubmittingComparativo(false);
    }
  };

  const runComparativoDecision = async (actionLabel, executor) => {
    const comentario = window.prompt(
      `Comentario para ${actionLabel.toLowerCase()} el comparativo (opcional).`,
      "",
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

  if (cargando && !detalle) return <ProcesoLogisticoDetalleSkeleton />;

  if (!detalle) {
    return (
      <div className="max-w-5xl p-6 mx-auto">
        <div className="px-4 py-6 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
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
  const responsableActualId =
    detalle.responsableLogisticaId || detalle.responsableLogistica?.id || null;
  const assignedToCurrentUser =
    Number(responsableActualId || 0) === Number(user?.id || 0);
  const assignedToOtherResponsable =
    Number(responsableActualId || 0) > 0 && !assignedToCurrentUser;
  const expedienteBloqueado = ["ADJUDICADO", "OC_GENERADA"].includes(
    detalle.estadoLogistica,
  );
  const bloqueadoPorAprobacionFinal = Boolean(detalle.pendienteGerenciaGeneral);
  const flujoDefinido = Boolean(detalle.modalidadFlujoLogistico);
  const isFlujoRegular = detalle.modalidadFlujoLogistico === "REGULAR";
  const isFlujoExcepcional = detalle.modalidadFlujoLogistico === "EXCEPCIONAL";
  const emisionCerrada = detalle.emisionSolicitudesCerrada === true;
  const responsableNoOperativo =
    detalle.requiereReasignacionResponsable === true;
  const canDefineFlow = canAdjudicate && !expedienteBloqueado;
  const canEditFlowDefinition =
    canDefineFlow && detalle.puedeCambiarFlujoLogistico === true;
  const canManageDrafts = canOperate && !expedienteBloqueado && flujoDefinido;
  const canManageSolicitudes =
    canManageDrafts &&
    !emisionCerrada &&
    (!assignedToOtherResponsable || !canAssign || assignedToCurrentUser);
  const canManageComparativo =
    canManageDrafts && isFlujoRegular && comparativoCanEdit(comparativo);
  const canPrepareExceptionalDecision =
    canAdjudicate && !expedienteBloqueado && isFlujoExcepcional;
  const canApproveComparativo =
    canAdjudicate &&
    isFlujoRegular &&
    Boolean(comparativo?.id) &&
    !bloqueadoPorAprobacionFinal;
  const regularWorkflowStep = getRegularWorkflowStep({
    detalle,
    comparativo,
    canAdjudicate,
  });

  return (
    <div className="p-6 mx-auto space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Expediente logistico
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {detalle.codigo} · {detalle.area?.nombre || "Sin area"} ·{" "}
            {detalle.solicitante?.nombre || "Sin solicitante"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/requerimientos"
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
          >
            Requerimientos
          </Link>
          <Link
            to="/cotizaciones"
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
          >
            Bandejas logisticas
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2 p-2 bg-white border shadow-sm rounded-xl border-slate-200">
        <Link
          to={expedientePath}
          className={`rounded px-4 py-2 text-sm font-medium transition ${
            !isEmisionPhase
              ? "bg-slate-900 text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          Resumen y control
        </Link>
        <Link
          to={emisionPath}
          className={`rounded px-4 py-2 text-sm font-medium transition ${
            isEmisionPhase
              ? "bg-slate-900 text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          Emision de solicitudes
        </Link>
        <span className="px-4 py-2 text-sm font-medium rounded text-slate-400">
          Cotizaciones
        </span>
        <span className="px-4 py-2 text-sm font-medium rounded text-slate-400">
          Comparativo
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {detalle.habilitadoLogistica ? (
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium border rounded-full border-slate-200 bg-slate-50 text-slate-700">
            Habilitado para logistica
          </span>
        ) : null}
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
            detalle.aprobacionDocumentalFinal
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {detalle.aprobacionDocumentalFinal
            ? "Aprobacion documental final"
            : "Aprobacion documental final pendiente"}
        </span>
        {detalle.pendienteGerenciaGeneral ? (
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium border rounded-full border-amber-200 bg-amber-50 text-amber-800">
            Gerencia General pendiente
          </span>
        ) : null}
      </div>

      {detalle.pendienteGerenciaGeneral ? (
        <div className="p-4 text-sm border rounded-xl border-amber-200 bg-amber-50 text-amber-900">
          Logistica ya puede trabajar este expediente, pero los actos finales
          del sistema siguen bloqueados hasta completar la aprobacion documental
          final de Gerencia General.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="p-5 bg-white shadow-sm rounded-xl">
          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Estado logistico
          </p>
          <div className="mt-3">
            <CotizacionEstadoBadge
              estado={detalle.estadoLogistica}
              tipo="logistica"
            />
          </div>
        </div>
        <div
          id="control-logistico"
          className="p-5 bg-white shadow-sm rounded-xl"
        >
          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Responsable actual
          </p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {detalle.responsableLogistica?.nombre || "Sin asignar"}
          </p>
        </div>
        <div className="p-5 bg-white shadow-sm rounded-xl">
          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Solicitudes / cotizaciones
          </p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {detalle.resumenComparativo?.totalSolicitudes || 0} /{" "}
            {detalle.resumenComparativo?.totalCotizaciones || 0}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Emisión {emisionCerrada ? "cerrada" : "abierta"} · cobertura mínima
            por ítem {detalle.resumenComparativo?.coberturaMinimaPorItem || 0}
          </p>
        </div>
        <div className="p-5 bg-white shadow-sm rounded-xl">
          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Ordenes de compra
          </p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {ordenesCompraRelacionadas.length || 0}
          </p>
          {ordenesCompraRelacionadas[0]?.id ? (
            <Link
              to={`/ordenes-compra/${ordenesCompraRelacionadas[0].id}`}
              className="inline-block mt-2 text-sm font-medium text-indigo-700 hover:text-indigo-800"
            >
              Abrir la primera orden generada
            </Link>
          ) : null}
        </div>
      </div>

      {!isEmisionPhase && regularWorkflowStep ? (
        <div className="p-5 border border-indigo-200 rounded-xl bg-indigo-50">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide text-indigo-700 uppercase">
                Ruta operativa
              </p>
              <h2 className="mt-1 text-lg font-semibold text-indigo-950">
                {regularWorkflowStep.title}
              </h2>
              <p className="mt-1 text-sm text-indigo-900">
                {regularWorkflowStep.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                regularWorkflowStep.sectionId === "solicitudes"
                  ? navigate(emisionPath)
                  : scrollToSection(regularWorkflowStep.sectionId)
              }
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
            >
              {regularWorkflowStep.cta}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link
              to={emisionPath}
              className="rounded border border-indigo-300 px-3 py-1.5 text-sm text-indigo-700 hover:bg-white"
            >
              Solicitudes
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection("cotizaciones")}
              className="rounded border border-indigo-300 px-3 py-1.5 text-sm text-indigo-700 hover:bg-white"
            >
              Cotizaciones
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("comparativo")}
              className="rounded border border-indigo-300 px-3 py-1.5 text-sm text-indigo-700 hover:bg-white"
            >
              Comparativo
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("control-logistico")}
              className="rounded border border-indigo-300 px-3 py-1.5 text-sm text-indigo-700 hover:bg-white"
            >
              Orden de compra
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="p-5 bg-white shadow-sm rounded-xl">
          <h2 className="text-lg font-semibold text-gray-900">
            Datos del requerimiento
          </h2>
          <div className="grid gap-4 mt-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Uso / finalidad
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {detalle.usoFinalidad}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Ubicacion
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {detalle.ubicacionUso}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Total referencial
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formatCurrency(detalle.totalReferencial)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Asignado por
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {detalle.asignadoPorLogistica?.nombre || "-"}
              </p>
            </div>
          </div>

          <div className="p-4 mt-5 space-y-3 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">
                Definicion del flujo logistico
              </p>
              <p className="mt-1 text-xs text-gray-500">
                La jefatura debe definir si el expediente sigue el camino
                regular o excepcional antes de continuar con el tramite.
              </p>
            </div>

            {flujoDefinido ? (
              <div className="p-3 text-sm border rounded-lg border-slate-200 bg-slate-50 text-slate-700">
                <p>
                  Modalidad:{" "}
                  <span className="font-semibold">
                    {detalle.modalidadFlujoLogistico}
                  </span>
                </p>
                {isFlujoExcepcional ? (
                  <>
                    <p className="mt-1">
                      Causal:{" "}
                      <span className="font-semibold">
                        {detalle.causalFlujoExcepcional || "-"}
                      </span>
                    </p>
                    {detalle.justificacionFlujoExcepcional ? (
                      <p className="mt-1 text-xs text-slate-600">
                        {detalle.justificacionFlujoExcepcional}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-1 text-xs text-slate-600">
                    El expediente seguira el camino ordinario con comparativo
                    formal.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 text-xs border rounded-lg border-amber-200 bg-amber-50 text-amber-800">
                Todavia no se definio la modalidad del expediente. Hasta
                hacerlo, el sistema bloquea acciones operativas clave.
              </div>
            )}

            {canDefineFlow &&
            !canEditFlowDefinition &&
            detalle.motivoBloqueoCambioFlujo ? (
              <div className="p-3 text-xs border rounded-lg border-slate-200 bg-slate-50 text-slate-700">
                {detalle.motivoBloqueoCambioFlujo}
              </div>
            ) : null}

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
                    className="px-3 py-2 border border-gray-300 rounded"
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
                      className="px-3 py-2 border border-gray-300 rounded"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                ) : null}

                <button
                  type="button"
                  onClick={handleGuardarFlujo}
                  disabled={submittingAction}
                  className="px-4 py-2 font-medium text-white rounded bg-slate-900 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {flujoDefinido
                    ? "Actualizar flujo logistico"
                    : "Guardar flujo logistico"}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="p-5 bg-white shadow-sm rounded-xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Control logistico
            </h2>
            {cargando && <Loader size="sm" />}
          </div>

          <div className="mt-4 space-y-4 text-sm">
            {responsableNoOperativo ? (
              <div className="p-3 text-xs border rounded-lg border-amber-200 bg-amber-50 text-amber-800">
                El responsable logistico actual ya no se encuentra operativo
                para continuar este expediente. La jefatura debe reasignarlo
                para asegurar continuidad.
              </div>
            ) : null}

            {canAssign && (
              <div className="p-4 space-y-2 border border-gray-200 rounded-lg">
                <p className="font-medium text-gray-900">
                  Asignacion / reasignacion
                </p>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const responsableActualId =
                      detalle.responsableLogisticaId ||
                      detalle.responsableLogistica?.id ||
                      null;
                    const opcionesResponsables =
                      buildLogisticaResponsableOptions({
                        operadores,
                        responsableActual: detalle.responsableLogistica,
                        directResponsable: directResponsableOption,
                        extraResponsables: [jefaturaResponsableOption],
                      });
                    const canSubmitAssignment = canSubmitLogisticaAssignment({
                      selectedResponsableId: responsableId,
                      responsableActualId,
                    });

                    return (
                      <>
                        <select
                          value={responsableId}
                          name="proceso-logistico-detalle-page-select-359"
                          onChange={(event) =>
                            setResponsableId(event.target.value)
                          }
                          className="min-w-[220px] rounded border border-gray-300 px-3 py-2"
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
                          onClick={handleAsignar}
                          disabled={submittingAction || !canSubmitAssignment}
                          className="px-4 py-2 font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {responsableActualId ? "Reasignar" : "Asignar"}
                        </button>
                      </>
                    );
                  })()}
                  {canProcessDirectly ? (
                    <button
                      type="button"
                      onClick={handleTomarDirecto}
                      disabled={submittingAction}
                      className="px-4 py-2 font-medium border rounded border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      Procesar directamente
                    </button>
                  ) : null}
                </div>
                {!canProcessDirectly ? (
                  <p className="text-xs text-gray-500">
                    Procesar directamente esta disponible para la jefatura de
                    logistica y para administradores del sistema.
                  </p>
                ) : null}
              </div>
            )}

            {Array.isArray(detalle.historialAsignacionesLogistica) &&
            detalle.historialAsignacionesLogistica.length > 0 ? (
              <div className="p-4 space-y-2 border border-gray-200 rounded-lg">
                <p className="font-medium text-gray-900">
                  Historial de asignacion
                </p>
                <div className="space-y-2 text-xs text-gray-600">
                  {detalle.historialAsignacionesLogistica.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 border rounded border-slate-200 bg-slate-50"
                    >
                      <p className="font-medium text-slate-900">
                        {entry.responsableAnterior?.nombre
                          ? `${entry.responsableAnterior.nombre} -> ${entry.responsableNuevo?.nombre || "-"}`
                          : `Asignado a ${entry.responsableNuevo?.nombre || "-"}`}
                      </p>
                      <p className="mt-1">
                        {formatDateTime(entry.fechaAccion)} ·{" "}
                        {entry.tipoReasignacion || "ASIGNACION_INICIAL"} ·{" "}
                        {entry.reasignadoPor?.nombre || "-"}
                      </p>
                      {entry.motivo ? (
                        <p className="mt-1 text-slate-700">
                          Motivo: {entry.motivo}
                        </p>
                      ) : null}
                      {entry.comentario ? (
                        <p className="mt-1 text-slate-700">
                          Comentario: {entry.comentario}
                        </p>
                      ) : null}
                      {entry.vigenteHasta ? (
                        <p className="mt-1 text-slate-700">
                          Vigente hasta: {formatDate(entry.vigenteHasta)}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {detalle.estadoLogistica === "ASIGNADO" && (
              <button
                type="button"
                onClick={handleIniciar}
                disabled={submittingAction}
                className="px-4 py-2 font-medium border rounded border-sky-300 text-sky-700 hover:bg-sky-50"
              >
                Iniciar proceso logistico
              </button>
            )}

            {canOperate && !expedienteBloqueado && isFlujoRegular && (
              <button
                type="button"
                onClick={handleMarcarListo}
                disabled={
                  submittingAction ||
                  !detalle.resumenComparativo?.totalCotizaciones
                }
                className="px-4 py-2 font-medium border rounded border-fuchsia-300 text-fuchsia-700 hover:bg-fuchsia-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Dejar listo para adjudicacion
              </button>
            )}

            {canPrepareExceptionalDecision ? (
              <div className="p-4 space-y-3 border rounded-lg border-emerald-200 bg-emerald-50">
                <div>
                  <p className="font-medium text-emerald-900">
                    Decision excepcional
                  </p>
                  <p className="mt-1 text-xs text-emerald-800">
                    Selecciona la cotizacion que sustenta la decision
                    excepcional del expediente.
                  </p>
                  {bloqueadoPorAprobacionFinal ? (
                    <p className="mt-2 text-xs text-amber-800">
                      La formalizacion final de la decision excepcional queda
                      bloqueada hasta completar la aprobacion documental final.
                    </p>
                  ) : null}
                </div>
                <select
                  value={decisionExcepcionalDraft.cotizacionId}
                  onChange={(event) =>
                    setDecisionExcepcionalDraft((prev) => ({
                      ...prev,
                      cotizacionId: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded border-emerald-300"
                >
                  <option value="">Selecciona cotizacion</option>
                  {resumenCotizacionesActivas.map((cotizacion) => (
                    <option key={cotizacion.id} value={cotizacion.id}>
                      {cotizacion.codigo} ·{" "}
                      {cotizacion.proveedor?.razonSocial || "-"} ·{" "}
                      {formatCurrency(cotizacion.totalOferta)}
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
                  className="w-full px-3 py-2 border rounded border-emerald-300"
                />
                <button
                  type="button"
                  onClick={handleFormalizarDecisionExcepcional}
                  disabled={
                    submittingAction ||
                    bloqueadoPorAprobacionFinal ||
                    !decisionExcepcionalDraft.cotizacionId ||
                    Boolean(detalle.cotizacionSeleccionadaExcepcionalId)
                  }
                  className="px-4 py-2 font-medium text-white rounded bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {detalle.cotizacionSeleccionadaExcepcionalId
                    ? "Decision excepcional formalizada"
                    : "Formalizar decision excepcional"}
                </button>
              </div>
            ) : null}

            {canAdjudicate && detalle.puedeGenerarOrdenCompra ? (
              <button
                type="button"
                onClick={handleGenerarOrdenCompra}
                disabled={submittingAction}
                className="px-4 py-2 font-medium text-white rounded bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Generar ordenes de compra
              </button>
            ) : null}

            {ordenesCompraRelacionadas.length > 0 && (
              <div className="p-4 border rounded-lg border-emerald-200 bg-emerald-50 text-emerald-800">
                <p className="font-semibold">
                  {ordenesCompraRelacionadas.length > 1
                    ? "Ordenes de compra generadas"
                    : "Orden de compra generada"}
                </p>
                <div className="mt-2 space-y-2">
                  {ordenesCompraRelacionadas.map((ordenCompra) => (
                    <div
                      key={ordenCompra.id}
                      className="p-3 border rounded border-emerald-300 bg-white/70"
                    >
                      <p className="font-medium">
                        {ordenCompra.codigo} ·{" "}
                        {formatCurrency(ordenCompra.montoTotal)}
                      </p>
                      <p className="text-sm">
                        {ordenCompra.proveedor?.razonSocial || "Sin proveedor"}
                      </p>
                      {ordenCompra.id ? (
                        <Link
                          to={`/ordenes-compra/${ordenCompra.id}`}
                          className="inline-block mt-1 text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
                        >
                          Abrir detalle
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {flujoDefinido && isEmisionPhase ? (
          <div className="p-5 space-y-3 bg-white shadow-sm rounded-xl xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Emision de solicitudes
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Controla el pase entre la etapa de emisión y el registro de
                  respuestas del proveedor.
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                  emisionCerrada
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {emisionCerrada ? "Emisión cerrada" : "Emisión abierta"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {emisionCerrada ? (
                <button
                  type="button"
                  onClick={handleReabrirEmision}
                  disabled={submittingAction || !canManageDrafts}
                  className="px-4 py-2 font-medium border rounded border-amber-300 text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reabrir emisión
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCerrarEmision}
                  disabled={
                    submittingAction ||
                    !canManageDrafts ||
                    !detalle.resumenComparativo?.totalSolicitudes
                  }
                  className="px-4 py-2 font-medium border rounded border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cerrar emisión
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {coberturaItems.map((item) => (
                <div
                  key={`coverage-item-${item.itemRequerimientoId}`}
                  className="p-3 border rounded border-slate-200 bg-slate-50"
                >
                  <p className="font-medium text-slate-900">
                    {item.descripcionVisible}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Invitaciones emitidas {item.coberturaInvitada} /{" "}
                    {item.coverageMinimum}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Respuestas válidas {item.coberturaValida} /{" "}
                    {item.coverageMinimum}
                  </p>
                  <p
                    className={`mt-2 text-xs font-medium ${
                      item.cumpleCoberturaInvitada
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
                  >
                    {item.cumpleCoberturaInvitada
                      ? "Cobertura mínima invitada alcanzada"
                      : "Cobertura mínima invitada pendiente"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : flujoDefinido ? (
          <div className="p-5 space-y-3 bg-white shadow-sm rounded-xl xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Emision de solicitudes
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  La gestion operativa de solicitudes se atiende en su fase
                  dedicada.
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                  emisionCerrada
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {emisionCerrada ? "Emisión cerrada" : "Emisión abierta"}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {coberturaItems.map((item) => (
                <div
                  key={`coverage-summary-item-${item.itemRequerimientoId}`}
                  className="p-3 border rounded border-slate-200 bg-slate-50"
                >
                  <p className="font-medium text-slate-900">
                    {item.descripcionVisible}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Invitaciones emitidas {item.coberturaInvitada} /{" "}
                    {item.coverageMinimum}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Respuestas válidas {item.coberturaValida} /{" "}
                    {item.coverageMinimum}
                  </p>
                </div>
              ))}
            </div>
            <Link
              to={emisionPath}
              className="inline-flex px-4 py-2 font-medium text-indigo-700 border border-indigo-300 rounded w-fit hover:bg-indigo-50"
            >
              Ir a emision
            </Link>
          </div>
        ) : null}
      </div>

      {isEmisionPhase ? (
        canManageSolicitudes || canManageDrafts ? (
          <div className="space-y-6">
            {canManageSolicitudes ? (
              <div id="solicitudes">
                <SolicitudCotizacionForm
                  initialData={
                    solicitudDraft || { requerimientoId: Number(id) }
                  }
                  proveedores={proveedores.filter(
                    (proveedor) => proveedor.activo !== false,
                  )}
                  requerimientos={requerimientoOption}
                  requerimientoDetalle={detalle}
                  onRequerimientoChange={() => {}}
                  onSubmit={handleSolicitudSubmit}
                  onCancel={() =>
                    setSolicitudDraft({ requerimientoId: Number(id) })
                  }
                  submitting={submittingSolicitud}
                />
              </div>
            ) : (
              <div
                id="solicitudes"
                className="p-5 text-sm border shadow-sm rounded-xl border-amber-200 bg-amber-50 text-amber-900"
              >
                {emisionCerrada
                  ? "La emision de solicitudes se encuentra cerrada. Reabre la etapa para emitir nuevas invitaciones."
                  : "La emision y edicion de solicitudes de cotizacion queda deshabilitada mientras el expediente este asignado a otro responsable logistico."}
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 text-sm text-gray-600 bg-white border border-gray-200 shadow-sm rounded-xl">
            {!flujoDefinido
              ? "La jefatura de logistica debe definir primero si el expediente seguira el flujo REGULAR o EXCEPCIONAL."
              : expedienteBloqueado
                ? "El expediente ya fue adjudicado o paso a orden de compra, por lo que ya no admite cambios operativos."
                : "Este expediente se encuentra en modo de consulta para tu perfil. Solo el responsable asignado o la jefatura pueden modificar solicitudes."}
          </div>
        )
      ) : canManageDrafts ? (
        <div id="cotizaciones">
          <CotizacionForm
            initialData={cotizacionDraft}
            solicitudes={detalle.solicitudes || []}
            onSubmit={handleCotizacionSubmit}
            onCancel={() => setCotizacionDraft(null)}
            submitting={submittingCotizacion}
          />
        </div>
      ) : (
        <div className="p-5 text-sm text-gray-600 bg-white border border-gray-200 shadow-sm rounded-xl">
          {!flujoDefinido
            ? "La jefatura de logistica debe definir primero si el expediente seguira el flujo REGULAR o EXCEPCIONAL."
            : expedienteBloqueado
              ? "El expediente ya fue adjudicado o paso a orden de compra, por lo que ya no admite cambios operativos."
              : "Este expediente se encuentra en modo de consulta para tu perfil. Solo el responsable asignado o la jefatura pueden modificar cotizaciones."}
        </div>
      )}

      {!isEmisionPhase ? (
        <div
          id="comparativo"
          className="p-5 bg-white border border-gray-200 shadow-sm rounded-xl"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
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
                Camino ordinario: comparativo aprobado. Camino excepcional:
                decision inicial excepcional y formalizacion posterior sobre una
                cotizacion de sustento.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {comparativo ? (
                <ComparativoEstadoBadge estado={comparativo.estadoDocumento} />
              ) : (
                <span className="inline-flex items-center px-3 py-1 text-xs font-semibold border rounded-full border-slate-300 bg-slate-100 text-slate-700">
                  Sin documento formal
                </span>
              )}
              {comparativo?.codigo ? (
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded-full bg-gray-50">
                  {comparativo.codigo} v{comparativo.versionActual || 1}
                </span>
              ) : null}
              {comparativo?.id ? (
                <button
                  type="button"
                  onClick={() => handlePrintComparativo(comparativo.id)}
                  className="px-3 py-1 text-xs font-medium border rounded border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Imprimir
                </button>
              ) : null}
            </div>
          </div>

          {comparativo ? (
            <div className="grid gap-4 mt-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Elaborado por
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {comparativo.elaborador?.nombre ||
                    comparativo.responsableLogisticaNombreSnapshot ||
                    "-"}
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Aprobador jefatura
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {comparativo.aprobadorJefatura?.nombre ||
                    comparativo.aprobadorJefaturaNombreSnapshot ||
                    "-"}
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Fecha aprobacion
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {formatDateTime(comparativo.fechaAprobacionJefatura)}
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Cotizaciones consideradas
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {comparativo.cotizacionesConsideradasSnapshot
                    ?.totalCotizaciones || 0}
                </p>
              </div>
            </div>
          ) : null}

          {canManageComparativo ? (
            <form onSubmit={handleComparativoSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Cotizaciones consideradas
                    </p>
                    <p className="text-xs text-gray-500">
                      Selecciona las ofertas que entran formalmente al
                      comparativo y quedaran disponibles para la buena pro por
                      item.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {resumenCotizacionesActivas.length > 0 ? (
                      resumenCotizacionesActivas.map((cotizacion) => {
                        const checked =
                          comparativoDraft.cotizacionIdsConsideradas.includes(
                            String(cotizacion.id),
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
                                  onChange={() =>
                                    toggleCotizacionConsiderada(cotizacion.id)
                                  }
                                  className="mt-1"
                                />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {cotizacion.codigo} ·{" "}
                                    {cotizacion.proveedor?.razonSocial || "-"}
                                  </p>
                                  <p className="mt-1 text-sm text-gray-600">
                                    {formatCurrency(cotizacion.totalOferta)} ·{" "}
                                    {cotizacion.formaPago ||
                                      "Sin forma de pago"}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Entrega:{" "}
                                    {cotizacion.tiempoEntregaDias === 0
                                      ? "Inmediata"
                                      : cotizacion.tiempoEntregaDias != null
                                        ? `${cotizacion.tiempoEntregaDias} días`
                                        : "-"}{" "}
                                    · Garantia:{" "}
                                    {cotizacion.garantia || "Sin definir"} ·
                                    Vigencia:{" "}
                                    {cotizacion.vigenciaOfertaDias ?? "-"} dias
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-medium text-slate-600">
                                {canSelectWinner
                                  ? "Disponible para adjudicar items"
                                  : "No considerada"}
                              </span>
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <div className="px-4 py-6 text-sm text-gray-500 border border-gray-300 border-dashed rounded-lg">
                        Aun no hay cotizaciones disponibles para formalizar el
                        comparativo.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">
                      Buena pro por item
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Define a que cotizacion se adjudica cada item. Si una
                      cotizacion omitio plazo, garantia o forma de pago, igual
                      podras adjudicar el item mientras tenga precio y cantidad.
                    </p>
                    <div className="mt-3 space-y-3">
                      {(detalle.items || []).map((item) => {
                        const availableCotizaciones =
                          resumenCotizacionesActivas.filter(
                            (cotizacion) =>
                              comparativoDraft.cotizacionIdsConsideradas.includes(
                                String(cotizacion.id),
                              ) &&
                              cotizacionItemsMap[String(cotizacion.id)]?.has(
                                String(item.id),
                              ),
                          );
                        const selectedCotizacionId =
                          getAdjudicacionCotizacionId(
                            comparativoDraft,
                            item.id,
                          );

                        return (
                          <div
                            key={`adjudicacion-item-${item.id}`}
                            className="p-3 bg-white border border-gray-200 rounded-lg"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {item.descripcionVisible ||
                                item.producto?.nombre ||
                                "Item sin descripcion"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Requerido: {item.cantidadRequerida}{" "}
                              {item.unidadMedida || ""}
                            </p>
                            <select
                              value={selectedCotizacionId}
                              onChange={(event) =>
                                handleAdjudicacionItemChange(
                                  item.id,
                                  event.target.value,
                                )
                              }
                              className="w-full px-3 py-2 mt-3 text-sm border border-gray-300 rounded"
                            >
                              <option value="">
                                {availableCotizaciones.length
                                  ? "Selecciona la cotizacion ganadora"
                                  : "No hay cotizaciones consideradas para este item"}
                              </option>
                              {availableCotizaciones.map((cotizacion) => {
                                const itemCotizado = Array.isArray(
                                  cotizacion.items,
                                )
                                  ? cotizacion.items.find(
                                      (cotizacionItem) =>
                                        Number(
                                          cotizacionItem.itemRequerimientoId,
                                        ) === Number(item.id),
                                    )
                                  : null;

                                return (
                                  <option
                                    key={cotizacion.id}
                                    value={cotizacion.id}
                                  >
                                    {cotizacion.codigo} ·{" "}
                                    {cotizacion.proveedor?.razonSocial || "-"} ·{" "}
                                    {formatCurrency(
                                      itemCotizado?.precioTotal || 0,
                                    )}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <label className="block space-y-1 text-sm text-gray-700">
                    <span className="font-medium">
                      Criterio de adjudicacion
                    </span>
                    <textarea
                      rows="6"
                      value={comparativoDraft.criterioAdjudicacion}
                      onChange={(event) =>
                        setComparativoDraft((prev) => ({
                          ...prev,
                          criterioAdjudicacion: event.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      placeholder="Notas internas del comparativo formal."
                    />
                  </label>

                  <div className="px-4 py-3 text-xs text-gray-600 border border-gray-300 border-dashed rounded-lg">
                    Items adjudicados:{" "}
                    {comparativoDraft.adjudicacionesItems.length} /{" "}
                    {(detalle.items || []).length}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={
                        submittingComparativo ||
                        !resumenCotizacionesActivas.length
                      }
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                        onClick={() =>
                          setComparativoDraft(
                            buildComparativoDraft(comparativo),
                          )
                        }
                        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
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
                <h3 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                  Resumen formal
                </h3>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    Resultado formal de buena pro
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {(comparativo.proveedoresAdjudicadosSnapshot || []).length >
                    1
                      ? `${comparativo.proveedoresAdjudicadosSnapshot.length} proveedores adjudicados`
                      : comparativo.cotizacionSeleccionadaSnapshot
                        ? `${comparativo.cotizacionSeleccionadaSnapshot.codigo} · ${comparativo.cotizacionSeleccionadaSnapshot.proveedor?.razonSocial || "-"}`
                        : "Aun no definida"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Items adjudicados:{" "}
                    {(comparativo.adjudicacionesPorItemSnapshot || []).length}
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
                  {(comparativo.proveedoresAdjudicadosSnapshot || []).length > 0
                    ? comparativo.proveedoresAdjudicadosSnapshot.map(
                        (proveedor) => (
                          <div
                            key={`comparativo-proveedor-${proveedor.proveedorId}`}
                            className="p-4 border rounded-lg border-emerald-200 bg-emerald-50"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-medium text-emerald-950">
                                {proveedor.proveedor?.razonSocial || "-"}
                              </p>
                              <span className="text-sm font-semibold text-emerald-900">
                                {formatCurrency(proveedor.totalAdjudicado)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-emerald-800">
                              Items adjudicados: {proveedor.totalItems}
                            </p>
                          </div>
                        ),
                      )
                    : null}
                  {(
                    comparativo.cotizacionesConsideradasSnapshot
                      ?.cotizaciones || []
                  ).map((cotizacion) => (
                    <div
                      key={`comparativo-snapshot-${cotizacion.cotizacionId}`}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-gray-900">
                          {cotizacion.codigo} ·{" "}
                          {cotizacion.proveedor?.razonSocial || "-"}
                        </p>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(cotizacion.totalOferta)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Estado snapshot: {cotizacion.estado || "-"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Entrega:{" "}
                        {cotizacion.tiempoEntregaDias === 0
                          ? "Inmediata"
                          : cotizacion.tiempoEntregaDias != null
                            ? `${cotizacion.tiempoEntregaDias} días`
                            : "-"}{" "}
                        · Vigencia: {cotizacion.vigenciaOfertaDias ?? "-"} dias
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                  Historial formal
                </h3>
                {(comparativo.historial || []).length > 0 ? (
                  <div className="space-y-3">
                    {comparativo.historial.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-4 text-sm border border-gray-200 rounded-lg"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-gray-900">
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
                          <p className="mt-1 text-gray-700">
                            {entry.comentario}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-sm text-gray-500 border border-gray-300 border-dashed rounded-lg">
                    Aun no hay historial formal registrado.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="px-4 py-6 mt-5 text-sm text-gray-500 border border-gray-300 border-dashed rounded-lg">
              {isFlujoExcepcional
                ? "Aun no existe una decision excepcional formalizada para este expediente."
                : "Aun no existe comparativo formal persistido para este expediente."}
            </div>
          )}

          {canAdjudicate && isFlujoRegular && comparativo?.id ? (
            <div className="pt-4 mt-5 border-t border-gray-200">
              {bloqueadoPorAprobacionFinal ? (
                <div className="p-3 mb-3 text-xs border rounded-lg border-amber-200 bg-amber-50 text-amber-800">
                  El comparativo puede revisarse y seguir ajustandose, pero su
                  aprobacion final queda bloqueada hasta completar la aprobacion
                  documental final del requerimiento.
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    runComparativoDecision("Aprobar", (payload) =>
                      aprobarComparativo(comparativo.id, payload),
                    )
                  }
                  disabled={submittingComparativo || !canApproveComparativo}
                  className="px-4 py-2 text-sm font-medium text-white rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                >
                  Aprobar comparativo
                </button>
                <button
                  type="button"
                  onClick={() =>
                    runComparativoDecision("Observar", (payload) =>
                      observarComparativo(comparativo.id, payload),
                    )
                  }
                  disabled={submittingComparativo}
                  className="px-4 py-2 text-sm font-medium border rounded border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                >
                  Observar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    runComparativoDecision("Rechazar", (payload) =>
                      rechazarComparativo(comparativo.id, payload),
                    )
                  }
                  disabled={submittingComparativo}
                  className="px-4 py-2 text-sm font-medium border rounded border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6">
        {isEmisionPhase ? (
          <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Solicitudes emitidas
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Puedes imprimir cada solicitud o enviarla por correo al
                proveedor.
              </p>
            </div>
            <div className="p-4 space-y-3 md:hidden">
              {(detalle.solicitudes || []).length > 0 ? (
                detalle.solicitudes.map((solicitud) => (
                  <div
                    key={solicitud.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <Link
                      to={`/solicitudes-cotizacion/${solicitud.id}`}
                      state={{ from: location }}
                      className="font-medium text-indigo-700 hover:text-indigo-800 hover:underline"
                    >
                      {solicitud.codigo}
                    </Link>
                    <p className="mt-1 text-sm text-gray-700">
                      {solicitud.proveedor?.razonSocial || "-"}
                    </p>
                    <div className="mt-2">
                      <CotizacionEstadoBadge
                        estado={solicitud.estado}
                        tipo="solicitud"
                      />
                      {solicitud.activo === false ? (
                        <p className="mt-2 text-xs font-medium text-rose-700">
                          Desactivada
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Link
                        to={`/solicitudes-cotizacion/${solicitud.id}`}
                        state={{ from: location }}
                        className="px-3 py-1 text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-50"
                      >
                        Ver detalle
                      </Link>
                      <button
                        type="button"
                        onClick={() => handlePrintSolicitud(solicitud.id)}
                        className="px-3 py-1 border rounded border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        Imprimir
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendSolicitudByEmail(solicitud)}
                        disabled={sendingSolicitudId === solicitud.id}
                        className="px-3 py-1 border rounded border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {sendingSolicitudId === solicitud.id
                          ? "Enviando..."
                          : "Enviar correo"}
                      </button>
                    </div>
                    {canManageDrafts && solicitud.activo !== false ? (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() =>
                            setSolicitudDraft(buildSolicitudDraft(solicitud))
                          }
                          className="px-3 py-1 text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeactivateSolicitud(solicitud.id)
                          }
                          className="px-3 py-1 text-red-700 border border-red-300 rounded hover:bg-red-50"
                        >
                          Desactivar
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="px-2 py-6 text-sm text-center text-gray-500">
                  Aun no se emitieron solicitudes de cotizacion para este
                  requerimiento.
                </div>
              )}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left text-gray-600 uppercase">
                      Codigo
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left text-gray-600 uppercase">
                      Proveedor
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left text-gray-600 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-right text-gray-600 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(detalle.solicitudes || []).length > 0 ? (
                    detalle.solicitudes.map((solicitud) => (
                      <tr key={solicitud.id}>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <Link
                            to={`/solicitudes-cotizacion/${solicitud.id}`}
                            state={{ from: location }}
                            className="font-medium text-indigo-700 hover:text-indigo-800 hover:underline"
                          >
                            {solicitud.codigo}
                          </Link>
                          <p className="text-xs text-gray-500">
                            {formatDate(solicitud.fechaEmision)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {solicitud.proveedor?.razonSocial || "-"}
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
                              className="px-3 py-1 text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-50"
                            >
                              Ver detalle
                            </Link>
                            <button
                              type="button"
                              onClick={() => handlePrintSolicitud(solicitud.id)}
                              className="px-3 py-1 border rounded border-slate-300 text-slate-700 hover:bg-slate-50"
                            >
                              Imprimir
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSendSolicitudByEmail(solicitud)
                              }
                              disabled={sendingSolicitudId === solicitud.id}
                              className="px-3 py-1 border rounded border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {sendingSolicitudId === solicitud.id
                                ? "Enviando..."
                                : "Enviar correo"}
                            </button>
                            {canManageDrafts && solicitud.activo !== false && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSolicitudDraft(
                                      buildSolicitudDraft(solicitud),
                                    )
                                  }
                                  className="px-3 py-1 text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-50"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeactivateSolicitud(solicitud.id)
                                  }
                                  className="px-3 py-1 text-red-700 border border-red-300 rounded hover:bg-red-50"
                                >
                                  Desactivar
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
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
          </div>
        ) : null}

        {!isEmisionPhase ? (
          <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Cotizaciones registradas
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                En flujo EXCEPCIONAL, una de estas cotizaciones puede sustentar
                la decision formal del expediente por MENOR_CUANTIA, URGENCIA o
                EMERGENCIA.
              </p>
            </div>
            <div className="p-4 space-y-3 md:hidden">
              {resumenCotizaciones.length > 0 ? (
                resumenCotizaciones.map((cotizacion) => (
                  <div
                    key={cotizacion.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <p className="font-medium text-gray-900">
                      {cotizacion.codigo} ·{" "}
                      {cotizacion.proveedor?.razonSocial || "-"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatCurrency(cotizacion.totalOferta)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Entrega:{" "}
                      {cotizacion.tiempoEntregaDias === 0
                        ? "Inmediata"
                        : cotizacion.tiempoEntregaDias != null
                          ? `${cotizacion.tiempoEntregaDias} días`
                          : "-"}{" "}
                      · Vigencia: {cotizacion.vigenciaOfertaDias ?? "-"} dias
                    </p>
                    {comparativoDecisionMeta?.cotizacionId ===
                    Number(cotizacion.id) ? (
                      <p className="mt-2 text-xs font-medium text-emerald-700">
                        {comparativoDecisionMeta.via === "EXCEPCIONAL"
                          ? "Seleccion formal por adjudicacion directa excepcional."
                          : "Seleccion formal del comparativo aprobado."}
                      </p>
                    ) : null}
                    <div className="mt-2">
                      <CotizacionEstadoBadge estado={cotizacion.estado} />
                    </div>
                    {cotizacion.activo === false ? (
                      <p className="mt-2 text-xs font-medium text-rose-700">
                        Inactiva
                        {cotizacion.motivoInactivacion
                          ? ` · ${cotizacion.motivoInactivacion}`
                          : ""}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => handlePrintCotizacion(cotizacion.id)}
                        className="px-3 py-1 border rounded border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        Imprimir
                      </button>
                      {canManageDrafts ? (
                        <button
                          type="button"
                          onClick={() =>
                            setCotizacionDraft(buildCotizacionDraft(cotizacion))
                          }
                          disabled={cotizacion.activo === false}
                          className="px-3 py-1 text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-50"
                        >
                          Editar
                        </button>
                      ) : null}
                      {canManageDrafts ? (
                        <button
                          type="button"
                          onClick={() =>
                            cotizacion.activo === false
                              ? handleReactivateCotizacion(cotizacion.id)
                              : handleInactivateCotizacion(cotizacion.id)
                          }
                          className={`rounded px-3 py-1 ${
                            cotizacion.activo === false
                              ? "border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              : "border border-red-300 text-red-700 hover:bg-red-50"
                          }`}
                        >
                          {cotizacion.activo === false
                            ? "Reactivar"
                            : "Inactivar"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-2 py-6 text-sm text-center text-gray-500">
                  Aun no se registraron cotizaciones para este expediente.
                </div>
              )}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left text-gray-600 uppercase">
                      Codigo
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left text-gray-600 uppercase">
                      Proveedor
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left text-gray-600 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left text-gray-600 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-right text-gray-600 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resumenCotizaciones.length > 0 ? (
                    resumenCotizaciones.map((cotizacion) => (
                      <tr key={cotizacion.id}>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <p className="font-medium text-gray-900">
                            {cotizacion.codigo}
                          </p>
                          <p className="text-xs text-gray-500">
                            {cotizacion.solicitudCodigo || "-"}
                          </p>
                          {comparativoDecisionMeta?.cotizacionId ===
                          Number(cotizacion.id) ? (
                            <p className="mt-1 text-xs font-medium text-emerald-700">
                              {comparativoDecisionMeta.via === "EXCEPCIONAL"
                                ? "Adjudicacion directa excepcional formal."
                                : "Seleccion formal del comparativo aprobado."}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {cotizacion.proveedor?.razonSocial || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          <p>{formatCurrency(cotizacion.totalOferta)}</p>
                          <p className="mt-1 text-xs font-normal text-gray-500">
                            {cotizacion.tiempoEntregaDias === 0
                              ? "Inmediata"
                              : cotizacion.tiempoEntregaDias != null
                                ? `${cotizacion.tiempoEntregaDias} días`
                                : "-"}{" "}
                            · vigencia {cotizacion.vigenciaOfertaDias ?? "-"}{" "}
                            dias
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <CotizacionEstadoBadge estado={cotizacion.estado} />
                          {cotizacion.activo === false ? (
                            <p className="mt-1 text-xs font-medium text-rose-700">
                              Inactiva
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handlePrintCotizacion(cotizacion.id)
                              }
                              className="px-3 py-1 border rounded border-slate-300 text-slate-700 hover:bg-slate-50"
                            >
                              Imprimir
                            </button>
                            {canManageDrafts && (
                              <button
                                type="button"
                                onClick={() =>
                                  setCotizacionDraft(
                                    buildCotizacionDraft(cotizacion),
                                  )
                                }
                                disabled={cotizacion.activo === false}
                                className="px-3 py-1 text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-50"
                              >
                                Editar
                              </button>
                            )}
                            {canManageDrafts && (
                              <button
                                type="button"
                                onClick={() =>
                                  cotizacion.activo === false
                                    ? handleReactivateCotizacion(cotizacion.id)
                                    : handleInactivateCotizacion(cotizacion.id)
                                }
                                className={`rounded px-3 py-1 ${
                                  cotizacion.activo === false
                                    ? "border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                    : "border border-red-300 text-red-700 hover:bg-red-50"
                                }`}
                              >
                                {cotizacion.activo === false
                                  ? "Reactivar"
                                  : "Inactivar"}
                              </button>
                            )}
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
                        Aun no se registraron cotizaciones para este expediente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProcesoLogisticoDetallePage;
