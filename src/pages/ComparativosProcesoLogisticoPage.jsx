import React, { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { canAdjudicateCotizacionesLogisticaEffective } from "../accessRules";
import OrdenesCompraGeneradasPanel from "../components/OrdenesCompraGeneradasPanel";
import { useAuth } from "../context/authContext";
import useAppDialog from "../hooks/useAppDialog";
import useLogisticaCotizaciones from "../hooks/useLogisticaCotizaciones";
import {
  buildBuenaProPayload,
  canSelectOferta,
  validateBuenaProDraft,
} from "../utils/buenaProPayload";
import { buildComparativoFlujoViewModel } from "../utils/comparativoFlujoViewModel";
import { getFlujosActivos, isFlujoCerrado } from "../utils/flujoCotizacionUi";
import { formatInteger, formatQuantity } from "../utils/numberFormatters";
import {
  getOrdenesCompraFromBuenaPro,
  normalizeOrdenesGeneradasResponse,
} from "../utils/ordenCompraDesdeBuenaProViewModel";
import ComparativosProcesoLogisticoSkeleton from "../components/ui/skeletons/ComparativosProcesoLogisticoSkeleton";

const TIPO_COMPRA_LABELS = {
  LOCAL: "LOCAL",
  IMPORTACION: "IMPORTACIÓN",
};

const CAUSALES_ANULACION_BUENA_PRO = [
  ["RECLAMO_FUNDADO", "Reclamo fundado"],
  ["PROVEEDOR_NO_IDONEO", "Proveedor no idóneo"],
  ["IMPOSIBILIDAD_CUMPLIMIENTO", "Imposibilidad de cumplimiento"],
  ["ERROR_MATERIAL", "Error material"],
  ["FALTA_PRESUPUESTO", "Falta de presupuesto"],
  ["DESAPARICION_NECESIDAD", "Desaparición de necesidad"],
  ["DECISION_ADMINISTRATIVA", "Decisión administrativa"],
];

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";

const formatText = (value, fallback = "-") =>
  String(value ?? "").trim() || fallback;

const formatMoney = (value, currency = "PEN") => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";

  const normalizedCurrency = String(currency || "").toUpperCase();
  const prefix =
    normalizedCurrency === "USD"
      ? "US$"
      : normalizedCurrency === "PEN"
        ? "S/"
        : currency || "";

  return `${prefix} ${number.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const booleanText = (value) => {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return "";
};

const buildConditionRows = (condiciones = {}, tipoCompra) => {
  const commonRows = [
    ["Moneda", condiciones.moneda],
    ["Código moneda otra", condiciones.codigoMonedaOtra],
    ["Incluye IGV", booleanText(condiciones.incluyeIgv)],
    ["Tiempo de entrega", condiciones.tiempoEntregaDias],
    ["Garantía", condiciones.garantia],
    ["Vigencia de oferta", condiciones.vigenciaOfertaDias],
    ["Lugar de entrega", condiciones.lugarEntrega],
  ];

  const rows =
    tipoCompra === "IMPORTACION"
      ? [
          ["Incoterm", condiciones.incoterm],
          ["Versión Incoterm", condiciones.incotermVersion],
          ["Punto logístico", condiciones.incotermPuntoLogistico],
          ["Estructura de pago", condiciones.estructuraPagoImportacion],
          ["Instrumento de pago", condiciones.instrumentoPagoImportacion],
          ["Gatillo de pago", condiciones.gatilloPagoImportacion],
          ["Anticipo", condiciones.porcentajeAnticipoImportacion],
          ["Saldo", condiciones.porcentajeSaldoImportacion],
          ["Días de crédito", condiciones.diasCreditoImportacion],
          ["Referencia de plazo", condiciones.referenciaPlazoImportacion],
          ["Gastos bancarios", condiciones.gastosBancariosPor],
          ...commonRows,
        ]
      : [
          ["Alcance", condiciones.alcanceCompraLocal],
          ["Tipo lugar entrega", condiciones.lugarEntregaLocalTipo],
          ["Detalle lugar entrega", condiciones.lugarEntregaLocalDetalle],
          ["Transporte asumido por", condiciones.transporteAsumidoPor],
          ["Carga/descarga", condiciones.cargaDescargaAsumidaPor],
          [
            "Entregas parciales",
            booleanText(condiciones.permiteEntregasParciales),
          ],
          ["Condiciones logísticas", condiciones.condicionesLogisticasLocales],
          ["Condición de pago", condiciones.condicionPagoLocal],
          ["Hito de pago", condiciones.hitoPagoLocal],
          ["Anticipo", condiciones.porcentajeAnticipoLocal],
          ["Saldo", condiciones.porcentajeSaldoLocal],
          ["Días de crédito", condiciones.diasCreditoLocal],
          ...commonRows,
        ];

  return rows.filter(([, value]) => hasValue(value));
};

const buildOfferRows = (condiciones = {}, tipoCompra) => {
  const rows = [
    ["Pago propuesto", condiciones.pagoPropuestoResumen],
    ["Plazo de entrega", condiciones.tiempoEntregaDias],
    ["Lugar de entrega", condiciones.lugarEntrega],
    ["Garantía", condiciones.garantia],
    ["Vigencia de oferta", condiciones.vigenciaOfertaDias],
    ["Observaciones", condiciones.observaciones],
  ];

  if (tipoCompra === "IMPORTACION") {
    rows.push(
      ["Estructura de pago", condiciones.estructuraPagoImportacionPropuesta],
      ["Instrumento de pago", condiciones.instrumentoPagoImportacionPropuesta],
      ["Gatillo de pago", condiciones.gatilloPagoImportacionPropuesta],
      ["Anticipo", condiciones.porcentajeAnticipoImportacionPropuesto],
      ["Saldo", condiciones.porcentajeSaldoImportacionPropuesto],
      ["Días de crédito", condiciones.diasCreditoImportacionPropuesto],
      ["Referencia plazo", condiciones.referenciaPlazoImportacionPropuesta],
      ["Gastos bancarios", condiciones.gastosBancariosPorPropuesto],
      ["Documentos", condiciones.documentosPagoImportacionPropuestos],
      ["Observación pago", condiciones.observacionPagoImportacionPropuesta],
    );
  } else {
    rows.push(
      ["Forma de pago", condiciones.formaPagoLocalPropuesta],
      ["Días de crédito", condiciones.diasCreditoLocalPropuesto],
      ["Anticipo", condiciones.porcentajeAnticipoLocalPropuesto],
      ["Saldo", condiciones.porcentajeSaldoLocalPropuesto],
      ["Observación pago", condiciones.observacionPagoLocalPropuesta],
    );
  }

  return rows.filter(([, value]) => hasValue(value));
};

const findCurrencyForBuenaProDetalle = (
  detalle,
  cotizaciones = [],
  fallback = "PEN",
) => {
  const cotizacionId = Number(detalle?.cotizacionId || detalle?.cotizacion?.id);
  const cotizacion = cotizaciones.find(
    (entry) => Number(entry.cotizacionId || entry.id) === cotizacionId,
  );

  return (
    detalle?.moneda ||
    detalle?.itemCotizacion?.moneda ||
    detalle?.cotizacion?.moneda ||
    cotizacion?.moneda ||
    fallback
  );
};

const ComparativosProcesoLogisticoPage = () => {
  const { id, detalleGlobal, loading, error } = useOutletContext();
  const { user } = useAuth();
  const { confirm, dialogNode } = useAppDialog();
  const {
    obtenerComparativoPorFlujo,
    obtenerBuenaProPorFlujo,
    registrarBuenaPro,
    anularBuenaPro,
    generarOrdenesCompraDesdeBuenaPro,
  } = useLogisticaCotizaciones();
  const flujos = useMemo(
    () => getFlujosActivos(detalleGlobal?.flujosCotizacion),
    [detalleGlobal?.flujosCotizacion],
  );
  const [selectedFlujoId, setSelectedFlujoId] = useState(null);
  const [comparativoFlujo, setComparativoFlujo] = useState(null);
  const [buenaProVigente, setBuenaProVigente] = useState(null);
  const [loadingComparativo, setLoadingComparativo] = useState(false);
  const [loadingBuenaPro, setLoadingBuenaPro] = useState(false);
  const [selectedByItem, setSelectedByItem] = useState({});
  const [sustentoBuenaPro, setSustentoBuenaPro] = useState("");
  const [justificaciones, setJustificaciones] = useState({});
  const [savingBuenaPro, setSavingBuenaPro] = useState(false);
  const [anulandoBuenaPro, setAnulandoBuenaPro] = useState(false);
  const [generandoOrdenesCompra, setGenerandoOrdenesCompra] = useState(false);
  const [ordenesCompraGeneradas, setOrdenesCompraGeneradas] = useState([]);
  const [anulacionDraft, setAnulacionDraft] = useState({
    motivoAnulacion: "",
    causalAnulacion: "ERROR_MATERIAL",
  });
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!flujos.length) {
      setSelectedFlujoId(null);
      return;
    }

    setSelectedFlujoId((current) =>
      flujos.some((flujo) => Number(flujo.id) === Number(current))
        ? current
        : flujos[0].id,
    );
  }, [flujos]);

  const selectedFlujo = useMemo(
    () =>
      flujos.find((flujo) => Number(flujo.id) === Number(selectedFlujoId)) ||
      null,
    [flujos, selectedFlujoId],
  );
  const selectedFlujoCerrado = isFlujoCerrado(selectedFlujo);
  const canManageBuenaPro =
    selectedFlujoCerrado &&
    canAdjudicateCotizacionesLogisticaEffective(user, detalleGlobal);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!selectedFlujo?.id || !selectedFlujoCerrado) {
        setComparativoFlujo(null);
        setBuenaProVigente(null);
        return;
      }

      setLoadingComparativo(true);
      setLoadingBuenaPro(true);
      try {
        const [comparativoData, buenaProData] = await Promise.all([
          obtenerComparativoPorFlujo(selectedFlujo.id),
          obtenerBuenaProPorFlujo(selectedFlujo.id),
        ]);
        if (!cancelled) {
          setComparativoFlujo(comparativoData);
          setBuenaProVigente(buenaProData?.data ?? buenaProData ?? null);
        }
      } finally {
        if (!cancelled) {
          setLoadingComparativo(false);
          setLoadingBuenaPro(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    obtenerComparativoPorFlujo,
    obtenerBuenaProPorFlujo,
    refreshToken,
    selectedFlujo?.id,
    selectedFlujoCerrado,
  ]);

  useEffect(() => {
    setSelectedByItem({});
    setSustentoBuenaPro("");
    setJustificaciones({});
    setOrdenesCompraGeneradas(getOrdenesCompraFromBuenaPro(buenaProVigente));
    setAnulacionDraft({
      motivoAnulacion: "",
      causalAnulacion: "ERROR_MATERIAL",
    });
  }, [selectedFlujo?.id, buenaProVigente?.id]);

  const viewModel = useMemo(
    () => buildComparativoFlujoViewModel(comparativoFlujo || {}),
    [comparativoFlujo],
  );
  const tipoCompra = selectedFlujo?.tipoCompra || viewModel.tipoCompra;
  const tipoCompraLabel = TIPO_COMPRA_LABELS[tipoCompra] || tipoCompra || "-";
  const condicionesSolicitadasRows = buildConditionRows(
    viewModel.condicionesSolicitadas,
    tipoCompra,
  );
  const buenaProDraftValidation = useMemo(
    () =>
      validateBuenaProDraft({
        selectedByItem,
        sustento: sustentoBuenaPro,
        justificaciones,
      }),
    [justificaciones, selectedByItem, sustentoBuenaPro],
  );
  const selectedEntries = useMemo(
    () => Object.entries(selectedByItem).filter(([, oferta]) => oferta),
    [selectedByItem],
  );
  const selectedTotal = selectedEntries.reduce(
    (sum, [, oferta]) => sum + (Number(oferta?.precioTotal) || 0),
    0,
  );
  const selectedCurrency =
    selectedEntries[0]?.[1]?.moneda ||
    viewModel.cotizacionesComparables[0]?.moneda ||
    "PEN";
  const ordenesCompraVigentes = useMemo(
    () =>
      ordenesCompraGeneradas.length
        ? ordenesCompraGeneradas
        : getOrdenesCompraFromBuenaPro(buenaProVigente),
    [buenaProVigente, ordenesCompraGeneradas],
  );
  const hasOrdenesCompraGeneradas = ordenesCompraVigentes.length > 0;
  const canGenerateOrdenesCompra =
    canManageBuenaPro && Boolean(buenaProVigente?.id);
  const matrixMinWidth = `${520 + viewModel.cotizacionesComparables.length * 840}px`;

  const handleToggleOferta = (item, cotizacion, oferta) => {
    if (!canManageBuenaPro || buenaProVigente || !canSelectOferta(oferta)) return;

    setSelectedByItem((current) => {
      const key = String(item.itemRequerimientoId);
      const selected = current[key];
      const sameOferta =
        Number(selected?.cotizacionId) === Number(oferta.cotizacionId) &&
        Number(selected?.itemCotizacionId) === Number(oferta.itemCotizacionId);

      if (sameOferta) {
        const next = { ...current };
        delete next[key];
        return next;
      }

      return {
        ...current,
        [key]: {
          ...oferta,
          itemNumero: item.numero,
          itemDescripcion: item.descripcionSolicitada,
          proveedor: cotizacion.proveedor,
        },
      };
    });
  };

  const handleSubmitBuenaPro = async () => {
    if (!selectedFlujo?.id || !canManageBuenaPro || buenaProVigente) return;

    if (!buenaProDraftValidation.valid) {
      toast.error(buenaProDraftValidation.errors[0]);
      return;
    }

    const confirmed = await confirm({
      title: "Otorgar Buena Pro",
      message:
        "Se registrará la decisión formal de adjudicación para los ítems seleccionados. ¿Desea continuar?",
      confirmText: "Otorgar Buena Pro",
      cancelText: "Cancelar",
      variant: "warning",
    });

    if (!confirmed) return;

    setSavingBuenaPro(true);
    try {
      const payload = buildBuenaProPayload({
        selectedByItem,
        sustento: sustentoBuenaPro,
        justificaciones,
      });
      await registrarBuenaPro(selectedFlujo.id, payload);
      toast.success("Buena Pro registrada correctamente.");
      setRefreshToken((current) => current + 1);
    } catch (submitError) {
      if (submitError?.validationErrors?.length) {
        toast.error(submitError.validationErrors[0]);
      }
    } finally {
      setSavingBuenaPro(false);
    }
  };

  const handleGenerarOrdenesCompra = async () => {
    if (!buenaProVigente?.id || !canGenerateOrdenesCompra) return;

    if (hasOrdenesCompraGeneradas) {
      toast.info("La Buena Pro ya registra Orden(es) de Compra generada(s).");
      return;
    }

    const confirmed = await confirm({
      title: "Generar Orden(es) de Compra",
      message:
        "Se generará una Orden de Compra por cada proveedor adjudicado en la Buena Pro. Las órdenes quedarán pendientes de aprobación. ¿Desea continuar?",
      confirmText: "Generar Orden(es)",
      cancelText: "Cancelar",
      variant: "warning",
    });

    if (!confirmed) return;

    setGenerandoOrdenesCompra(true);
    try {
      const response = await generarOrdenesCompraDesdeBuenaPro(
        buenaProVigente.id,
      );
      const normalized = normalizeOrdenesGeneradasResponse(response);
      setOrdenesCompraGeneradas(normalized.ordenesCompra);
      toast.success(
        normalized.ordenesCompra.length === 1
          ? "Orden de Compra generada correctamente."
          : "Órdenes de Compra generadas correctamente.",
      );
    } finally {
      setGenerandoOrdenesCompra(false);
    }
  };

  const handleAnularBuenaPro = async () => {
    if (!buenaProVigente?.id || !canManageBuenaPro) return;

    const motivo = String(anulacionDraft.motivoAnulacion || "").trim();
    if (!motivo) {
      toast.error("Debe registrar el motivo de anulación.");
      return;
    }

    const confirmed = await confirm({
      title: "Anular Buena Pro",
      message: hasOrdenesCompraGeneradas
        ? "Esta Buena Pro ya tiene Orden(es) de Compra generada(s). La anulación puede requerir revisar o anular las órdenes asociadas. ¿Desea continuar?"
        : "La Buena Pro vigente será anulada lógicamente y los ítems quedarán liberados para una nueva adjudicación. ¿Desea continuar?",
      confirmText: "Anular Buena Pro",
      cancelText: "Cancelar",
      variant: "danger",
    });

    if (!confirmed) return;

    setAnulandoBuenaPro(true);
    try {
      await anularBuenaPro(buenaProVigente.id, {
        motivoAnulacion: motivo,
        causalAnulacion: anulacionDraft.causalAnulacion,
      });
      toast.success("Buena Pro anulada correctamente.");
      setRefreshToken((current) => current + 1);
    } finally {
      setAnulandoBuenaPro(false);
    }
  };

  if (loading && !detalleGlobal) {
    return <ComparativosProcesoLogisticoSkeleton />;
  }

  return (
    <section className="min-w-0 space-y-4">
      {dialogNode}
      <div>
        <h1 className="text-lg font-semibold leading-snug text-gray-900 sm:text-2xl">
          Cuadro comparativo de bienes por flujo
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm">
          LOCAL e IMPORTACIÓN se revisan como comparativos derivados separados.
          Esta matriz es informativa y deriva de las cotizaciones cerradas del flujo.
          La decisión formal se registrará en una etapa posterior.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!flujos.length ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Aún no existen flujos de cotización. Emita solicitudes para generar
          un flujo LOCAL o de IMPORTACIÓN.
        </section>
      ) : (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {flujos.map((flujo) => {
                const active = Number(flujo.id) === Number(selectedFlujoId);
                const closed = isFlujoCerrado(flujo);
                return (
                  <button
                    key={flujo.id}
                    type="button"
                    onClick={() => setSelectedFlujoId(flujo.id)}
                    className={`rounded border px-4 py-2 text-sm font-semibold ${
                      active
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {TIPO_COMPRA_LABELS[flujo.tipoCompra] || flujo.tipoCompra}
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                        closed
                          ? "bg-slate-100 text-slate-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {closed ? "CERRADO" : "ABIERTO"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {!selectedFlujoCerrado ? (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
              El flujo {tipoCompraLabel} se encuentra abierto. Cierre el flujo
              de cotización para generar el cuadro comparativo derivado.
              <div className="mt-3">
                <Link
                  to={`/cotizaciones/proceso/${id}/cotizaciones`}
                  className="inline-flex rounded border border-amber-400 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                >
                  Ir a cierre de cotizaciones
                </Link>
              </div>
            </section>
          ) : loadingComparativo || loadingBuenaPro ? (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="h-5 w-52 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-20 animate-pulse rounded-lg bg-slate-100" />
            </section>
          ) : (
            <>
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Comparativo {tipoCompraLabel}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Derivado desde solicitudes y cotizaciones activas del
                      flujo cerrado.
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    DERIVADO
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {[
                    ["Solicitudes", viewModel.resumen.totalSolicitudes],
                    ["Cotizaciones", viewModel.resumen.totalCotizaciones],
                    [
                      "Comparables",
                      viewModel.resumen.totalProveedoresComparables,
                    ],
                    [
                      "Sin cotización válida",
                      viewModel.resumen.totalProveedoresSinCotizacionValida,
                    ],
                    ["Ítems", viewModel.resumen.totalItemsRequeridos],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-slate-200 p-3"
                    >
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        {label}
                      </p>
                      <p className="mt-2 text-right text-xl font-bold tabular-nums text-slate-900">
                        {formatInteger(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">
                  Condiciones solicitadas por la entidad
                </h2>
                {condicionesSolicitadasRows.length ? (
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {condicionesSolicitadasRows.map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <dt className="text-xs font-semibold uppercase text-slate-500">
                          {label}
                        </dt>
                        <dd className="mt-1 text-sm text-slate-800">
                          {formatText(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No registrado</p>
                )}
              </section>

              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-4">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Matriz comparativa de bienes
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Los ítems NO COTIZA se mantienen visibles como
                    trazabilidad.
                  </p>
                </div>
                {viewModel.cotizacionesComparables.length ? (
                  <div className="max-w-full overflow-x-auto">
                    <table
                      className="w-full border-collapse text-sm"
                      style={{ minWidth: matrixMinWidth }}
                    >
                      <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                        <tr>
                          <th rowSpan={2} className="w-16 px-3 py-3 text-center">
                            Ítem
                          </th>
                          <th rowSpan={2} className="w-72 px-3 py-3 text-center">
                            Descripción requerida
                          </th>
                          <th rowSpan={2} className="w-24 px-3 py-3 text-center">
                            Unidad
                          </th>
                          <th rowSpan={2} className="w-28 px-3 py-3 text-center">
                            Cant. req.
                          </th>
                          {viewModel.cotizacionesComparables.map((cotizacion) => (
                            <th
                              key={cotizacion.cotizacionId}
                              colSpan={6}
                              className="border-l border-slate-200 px-3 py-3 text-center"
                            >
                              <div className="font-semibold text-slate-800">
                                {formatText(cotizacion.proveedor?.razonSocial)}
                              </div>
                              <div className="mt-1 text-[11px] normal-case text-slate-500">
                                RUC {formatText(cotizacion.proveedor?.ruc)} -{" "}
                                {formatText(cotizacion.solicitudCodigo)} -{" "}
                                {formatText(cotizacion.moneda)}
                              </div>
                            </th>
                          ))}
                        </tr>
                        <tr>
                          {viewModel.cotizacionesComparables.map((cotizacion) => (
                            <React.Fragment key={`sub-${cotizacion.cotizacionId}`}>
                              {[
                                "Especificación ofertada",
                                "Cantidad",
                                "P.U.",
                                "P.T.",
                                "Estado",
                                "Buena Pro",
                              ].map((label) => (
                                <th
                                  key={`${cotizacion.cotizacionId}-${label}`}
                                  className="border-b border-l border-slate-200 px-3 py-2 text-center"
                                >
                                  {label}
                                </th>
                              ))}
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {viewModel.itemsRequeridos.map((item) => (
                          <tr
                            key={item.itemRequerimientoId}
                            className="border-b border-slate-100 align-top"
                          >
                            <td className="px-3 py-3 text-center font-semibold text-slate-700">
                              {formatInteger(item.numero)}
                            </td>
                            <td className="px-3 py-3 text-slate-900">
                              <p>{item.descripcionSolicitada}</p>
                              {item.observaciones ? (
                                <p className="mt-1 text-xs text-slate-500">
                                  {item.observaciones}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {formatText(item.unidadMedida)}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums">
                              {formatQuantity(item.cantidadRequerida)}
                            </td>
                            {viewModel.cotizacionesComparables.map((cotizacion) => {
                              const cell =
                                cotizacion.matrizPorItem[
                                  String(item.itemRequerimientoId)
                                ];

                              return (
                                <React.Fragment
                                  key={`${item.itemRequerimientoId}-${cotizacion.cotizacionId}`}
                                >
                                  <td className="border-l border-slate-100 px-3 py-3 align-middle">
                                    {cell?.estado === "COTIZADO"
                                      ? formatText(
                                          cell.descripcionTecnicaOfertada,
                                        )
                                      : "-"}
                                  </td>
                                  <td className="px-3 py-3 text-right tabular-nums align-middle">
                                    {cell?.estado === "COTIZADO"
                                      ? formatQuantity(cell.cantidadOfrecida)
                                      : "-"}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums align-middle">
                                    {cell?.estado === "COTIZADO"
                                      ? formatMoney(
                                          cell.precioUnidad,
                                          cotizacion.moneda,
                                        )
                                      : "-"}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums align-middle">
                                    {cell?.estado === "COTIZADO"
                                      ? formatMoney(
                                          cell.precioTotal,
                                          cotizacion.moneda,
                                        )
                                      : "-"}
                                  </td>
                                  <td className="px-3 py-3 text-center align-middle">
                                    <span
                                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                        cell?.estado === "COTIZADO"
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {cell?.estado === "NO_COTIZA"
                                        ? "NO COTIZA"
                                        : cell?.estado || "SIN RESPUESTA"}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-center align-middle">
                                    {canSelectOferta(cell) ? (
                                      <input
                                        type="checkbox"
                                        checked={
                                          Number(
                                            selectedByItem[
                                              String(item.itemRequerimientoId)
                                            ]?.itemCotizacionId,
                                          ) === Number(cell.itemCotizacionId)
                                        }
                                        disabled={
                                          !canManageBuenaPro || Boolean(buenaProVigente)
                                        }
                                        onChange={() =>
                                          handleToggleOferta(
                                            item,
                                            cotizacion,
                                            cell,
                                          )
                                        }
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                                        aria-label={`Seleccionar ítem ${item.numero} para ${formatText(cotizacion.proveedor?.razonSocial)}`}
                                      />
                                    ) : (
                                      <span className="text-xs text-slate-400">
                                        No aplica
                                      </span>
                                    )}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-sm text-slate-500">
                    No hay cotizaciones comparables en este flujo.
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Buena Pro del flujo
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      La Buena Pro registra la decisión formal por ítem.
                    </p>
                  </div>
                  {buenaProVigente ? (
                    <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Vigente
                    </span>
                  ) : (
                    <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      Sin registrar
                    </span>
                  )}
                </div>

                {buenaProVigente ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                      <p className="font-semibold">
                        {formatText(buenaProVigente.codigo, "Buena Pro vigente")}
                      </p>
                      <p className="mt-1">
                        Registrada el {formatDate(buenaProVigente.fechaRegistro)}
                        {buenaProVigente.registradaPor?.nombre
                          ? ` por ${buenaProVigente.registradaPor.nombre}`
                          : ""}
                      </p>
                      <p className="mt-2 text-emerald-950">
                        {formatText(buenaProVigente.sustentoGeneral)}
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                          <tr>
                            <th className="px-3 py-2 text-center">Ítem</th>
                            <th className="px-3 py-2 text-center">Proveedor</th>
                            <th className="px-3 py-2 text-center">Cotización</th>
                            <th className="px-3 py-2 text-center">Cantidad</th>
                            <th className="px-3 py-2 text-center">Total</th>
                            <th className="px-3 py-2 text-center">Justificación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(buenaProVigente.detalles || []).map((detalle) => (
                            <tr key={detalle.id} className="border-b border-slate-100">
                              <td className="px-3 py-3">
                                {formatText(
                                  detalle.itemRequerimiento?.descripcionVisible,
                                  `Ítem ${detalle.itemRequerimientoId}`,
                                )}
                              </td>
                              <td className="px-3 py-3">
                                {formatText(detalle.proveedor?.razonSocial)}
                              </td>
                              <td className="px-3 py-3 text-center">
                                {formatText(detalle.cotizacion?.codigo)}
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums">
                                {formatQuantity(detalle.cantidadAdjudicada)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                                {formatMoney(
                                  detalle.precioTotal,
                                  findCurrencyForBuenaProDetalle(
                                    detalle,
                                    viewModel.cotizacionesComparables,
                                    selectedCurrency,
                                  ),
                                )}
                              </td>
                              <td className="px-3 py-3">
                                {formatText(detalle.justificacion)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {ordenesCompraVigentes.length ? (
                      <OrdenesCompraGeneradasPanel
                        ordenesCompra={ordenesCompraVigentes}
                      />
                    ) : null}

                    {canGenerateOrdenesCompra && !hasOrdenesCompraGeneradas ? (
                      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-indigo-950">
                              Generación de Orden(es) de Compra
                            </h3>
                            <p className="mt-1 text-sm text-indigo-900">
                              Se generará una Orden de Compra por cada proveedor
                              adjudicado. Las órdenes quedarán pendientes de
                              aprobación.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleGenerarOrdenesCompra}
                            disabled={generandoOrdenesCompra}
                            className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
                          >
                            {generandoOrdenesCompra
                              ? "Generando..."
                              : "Generar Orden(es) de Compra"}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {canManageBuenaPro ? (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                        <h3 className="text-sm font-semibold text-rose-900">
                          Anulación lógica
                        </h3>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-[240px_1fr_auto] xl:items-end">
                          <label className="block">
                            <span className="text-xs font-semibold uppercase text-rose-800">
                              Causal
                            </span>
                            <select
                              value={anulacionDraft.causalAnulacion}
                              onChange={(event) =>
                                setAnulacionDraft((current) => ({
                                  ...current,
                                  causalAnulacion: event.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded border border-rose-200 bg-white px-3 py-2 text-sm"
                            >
                              {CAUSALES_ANULACION_BUENA_PRO.map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-xs font-semibold uppercase text-rose-800">
                              Motivo
                            </span>
                            <textarea
                              value={anulacionDraft.motivoAnulacion}
                              onChange={(event) =>
                                setAnulacionDraft((current) => ({
                                  ...current,
                                  motivoAnulacion: event.target.value,
                                }))
                              }
                              rows={2}
                              className="mt-1 w-full rounded border border-rose-200 bg-white px-3 py-2 text-sm"
                              placeholder="Registre el motivo de anulación"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleAnularBuenaPro}
                            disabled={anulandoBuenaPro}
                            className="w-full rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 xl:col-span-1"
                          >
                            {anulandoBuenaPro ? "Anulando..." : "Anular Buena Pro"}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : canManageBuenaPro ? (
                  <div className="mt-4 space-y-4">
                    <label className="block">
                      <span className="text-xs font-semibold uppercase text-slate-600">
                        Sustento general de la Buena Pro
                      </span>
                      <textarea
                        value={sustentoBuenaPro}
                        onChange={(event) => setSustentoBuenaPro(event.target.value)}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        placeholder="Explique el sustento general de la adjudicación"
                      />
                    </label>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Ítems seleccionados
                      </h3>
                      {selectedEntries.length ? (
                        <div className="mt-3 space-y-3">
                          {selectedEntries.map(([itemId, oferta]) => (
                            <article
                              key={itemId}
                              className="rounded-lg border border-slate-200 p-3"
                            >
                              <div className="grid gap-2 xl:grid-cols-[1fr_220px_180px] xl:items-start">
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    Ítem {formatInteger(oferta.itemNumero)} -{" "}
                                    {formatText(oferta.itemDescripcion)}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-600">
                                    {formatText(oferta.proveedor?.razonSocial)} -{" "}
                                    {formatText(oferta.cotizacionCodigo)}
                                  </p>
                                </div>
                                <p className="text-sm text-slate-700 xl:text-right">
                                  Cantidad: {formatQuantity(oferta.cantidadOfrecida)}
                                </p>
                                <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-slate-900 xl:text-right">
                                  {formatMoney(oferta.precioTotal, oferta.moneda)}
                                </p>
                              </div>
                              <label className="mt-3 block">
                                <span className="text-xs font-semibold uppercase text-slate-600">
                                  Justificación del ítem adjudicado
                                </span>
                                <textarea
                                  value={justificaciones[String(itemId)] || ""}
                                  onChange={(event) =>
                                    setJustificaciones((current) => ({
                                      ...current,
                                      [String(itemId)]: event.target.value,
                                    }))
                                  }
                                  rows={2}
                                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                  placeholder="Registre la justificación específica"
                                />
                              </label>
                            </article>
                          ))}
                          <div className="rounded-lg bg-slate-50 p-3 text-right text-sm font-semibold text-slate-900">
                            Total seleccionado:{" "}
                            {formatMoney(selectedTotal, selectedCurrency)}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">
                          Seleccione ítems COTIZADO en la matriz para otorgar
                          Buena Pro.
                        </p>
                      )}
                    </div>

                    {!buenaProDraftValidation.valid && selectedEntries.length ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        {buenaProDraftValidation.errors[0]}
                      </div>
                    ) : null}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSubmitBuenaPro}
                        disabled={
                          savingBuenaPro ||
                          !selectedEntries.length ||
                          !buenaProDraftValidation.valid
                        }
                        className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingBuenaPro ? "Registrando..." : "Otorgar Buena Pro"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Puede visualizar el comparativo y la Buena Pro vigente, pero
                    no tiene permisos para registrar o anular adjudicaciones.
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">
                  Condiciones ofertadas por proveedor
                </h2>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  {viewModel.cotizacionesComparables.map((cotizacion) => {
                    const rows = buildOfferRows(
                      cotizacion.condicionesOfertadas,
                      tipoCompra,
                    );

                    return (
                      <article
                        key={cotizacion.cotizacionId}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {formatText(cotizacion.proveedor?.razonSocial)}
                            </h3>
                            <p className="text-sm text-slate-500">
                              RUC {formatText(cotizacion.proveedor?.ruc)} -{" "}
                              {formatText(cotizacion.solicitudCodigo)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Fecha cotización: {formatDate(cotizacion.fechaEmision)}
                            </p>
                          </div>
                          <p className="text-right font-semibold tabular-nums text-slate-900">
                            {formatMoney(cotizacion.totalOferta, cotizacion.moneda)}
                          </p>
                        </div>
                        {rows.length ? (
                          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                            {rows.map(([label, value]) => (
                              <div key={label}>
                                <dt className="text-xs font-semibold uppercase text-slate-500">
                                  {label}
                                </dt>
                                <dd className="mt-1 text-sm text-slate-800">
                                  {formatText(value)}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        ) : (
                          <p className="mt-3 text-sm text-slate-500">
                            No registrado
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">
                  Proveedores invitados sin cotización válida
                </h2>
                {viewModel.proveedoresSinCotizacionValida.length ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[820px] text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-center">Proveedor</th>
                          <th className="px-3 py-2 text-center">RUC</th>
                          <th className="px-3 py-2 text-center">Solicitud</th>
                          <th className="px-3 py-2 text-center">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewModel.proveedoresSinCotizacionValida.map((entry) => (
                          <tr
                            key={`${entry.solicitudId}-${entry.proveedor?.id}-${entry.motivo}`}
                            className="border-b border-slate-100"
                          >
                            <td className="px-3 py-3">
                              {formatText(entry.proveedor?.razonSocial)}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {formatText(entry.proveedor?.ruc)}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {formatText(entry.solicitudCodigo)}
                            </td>
                            <td className="px-3 py-3">
                              {formatText(entry.motivoLabel)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    No hay proveedores invitados pendientes de cotización
                    válida en este flujo.
                  </p>
                )}
              </section>
            </>
          )}
        </>
      )}
    </section>
  );
};

export default ComparativosProcesoLogisticoPage;
