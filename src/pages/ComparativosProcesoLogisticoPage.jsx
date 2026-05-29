import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useOutletContext } from "react-router-dom";
import { CheckCircle2, FileText, Save } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../components/Modal";
import useLogisticaCotizaciones from "../hooks/useLogisticaCotizaciones";
import {
  formatInteger,
  formatQuantity,
} from "../utils/numberFormatters";
import { buildComparativoProcesoViewModel } from "../utils/comparativoProcesoViewModel";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";

const formatText = (value, fallback = "No registrado") =>
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
  if (value === true) return "Si";
  if (value === false) return "No";
  return "";
};

const buildConditionRows = (condiciones = {}, tipoCompra) => {
  const commonRows = [
    ["Moneda", condiciones.moneda],
    ["Incluye IGV", booleanText(condiciones.incluyeIgv)],
    ["Plazo de entrega", condiciones.tiempoEntregaDias],
    ["Garantia", condiciones.garantia],
    ["Vigencia de oferta", condiciones.vigenciaOfertaDias],
  ];

  if (tipoCompra === "IMPORTACION") {
    return [
      ["Incoterm", condiciones.incoterm],
      ["Version Incoterm", condiciones.incotermVersion],
      ["Punto logistico", condiciones.incotermPuntoLogistico],
      ["Estructura de pago", condiciones.estructuraPagoImportacion],
      ["Instrumento de pago", condiciones.instrumentoPagoImportacion],
      ["Gatillo de pago", condiciones.gatilloPagoImportacion],
      ["Gastos bancarios", condiciones.gastosBancariosPor],
      ["Dias de credito", condiciones.diasCreditoImportacion],
      ["Referencia de plazo", condiciones.referenciaPlazoImportacion],
      ...commonRows,
    ].filter(([, value]) => hasValue(value));
  }

  return [
    ["Alcance", condiciones.alcanceCompraLocal],
    ["Lugar de entrega", condiciones.lugarEntregaLocalDetalle],
    ["Tipo de entrega", condiciones.lugarEntregaLocalTipo],
    ["Transporte asumido por", condiciones.transporteAsumidoPor],
    ["Carga y descarga", condiciones.cargaDescargaAsumidaPor],
    ["Entregas parciales", booleanText(condiciones.permiteEntregasParciales)],
    ["Condicion de pago", condiciones.condicionPagoLocal],
    ["Hito de pago", condiciones.hitoPagoLocal],
    ["Dias de credito", condiciones.diasCreditoLocal],
    ["Anticipo", condiciones.porcentajeAnticipoLocal],
    ["Saldo", condiciones.porcentajeSaldoLocal],
    ...commonRows,
  ].filter(([, value]) => hasValue(value));
};

const buildOfferRows = (condiciones = {}, tipoCompra) => {
  const rows = [
    ["Pago propuesto", condiciones.pagoPropuestoResumen],
    ["Forma de pago", condiciones.formaPagoLocalPropuesta],
    ["Dias de credito", condiciones.diasCreditoLocalPropuesto],
    ["Anticipo", condiciones.porcentajeAnticipoLocalPropuesto],
    ["Saldo", condiciones.porcentajeSaldoLocalPropuesto],
    ["Plazo de entrega", condiciones.tiempoEntregaDias],
    ["Lugar de entrega", condiciones.lugarEntrega],
    ["Garantia", condiciones.garantia],
    ["Vigencia de oferta", condiciones.vigenciaOfertaDias],
    ["Observacion de pago", condiciones.observacionPagoLocalPropuesta],
  ];

  if (tipoCompra === "IMPORTACION") {
    rows.push(
      ["Estructura de pago", condiciones.estructuraPagoImportacionPropuesta],
      ["Instrumento de pago", condiciones.instrumentoPagoImportacionPropuesta],
      ["Gatillo de pago", condiciones.gatilloPagoImportacionPropuesta],
      ["Gastos bancarios", condiciones.gastosBancariosPorPropuesto],
      ["Documentos", condiciones.documentosPagoImportacionPropuestos],
      ["Referencia plazo", condiciones.referenciaPlazoImportacionPropuesta],
      [
        "Observacion importacion",
        condiciones.observacionPagoImportacionPropuesta,
      ],
    );
  }

  return rows.filter(([, value]) => hasValue(value));
};

const ComparativosProcesoLogisticoPage = () => {
  const { id, detalleGlobal, loading, error } = useOutletContext();
  const {
    obtenerComparativo,
    crearComparativo,
    actualizarComparativo,
    aprobarComparativo,
    obtenerComparativoPdfUrl,
  } = useLogisticaCotizaciones();
  const [showTrazabilidad, setShowTrazabilidad] = useState(false);
  const [comparativo, setComparativo] = useState(null);
  const [loadingComparativo, setLoadingComparativo] = useState(false);
  const [savingComparativo, setSavingComparativo] = useState(false);
  const [reviewingComparativo, setReviewingComparativo] = useState(false);
  const [adjudicacionesByItem, setAdjudicacionesByItem] = useState({});
  const [criterioResumen, setCriterioResumen] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [sustentoPorProveedor, setSustentoPorProveedor] = useState({});
  const [hydratedKey, setHydratedKey] = useState("");

  const etapaCerrada = detalleGlobal?.cotizacionesCerradas === true;
  const resumen = detalleGlobal?.resumenComparativo || {};
  const coberturaItems = Array.isArray(resumen.coberturaItems)
    ? resumen.coberturaItems
    : [];
  const coberturaCompleta =
    coberturaItems.length > 0 &&
    coberturaItems.every((item) => item.cumpleCoberturaValida);
  const itemsIncompletos = coberturaItems.filter(
    (item) => !item.cumpleCoberturaValida,
  );
  const flujoRegular = detalleGlobal?.modalidadFlujoLogistico === "REGULAR";
  const cierreJustificado =
    etapaCerrada &&
    flujoRegular &&
    !coberturaCompleta &&
    Boolean(detalleGlobal?.motivoCierreCotizaciones);

  const gate = useMemo(() => {
    const reasons = [];
    const totalSolicitudes = Number(resumen.totalSolicitudes || 0);
    const totalCotizaciones = Number(
      resumen.totalCotizaciones || resumen.totalCotizacionesRegistradas || 0,
    );
    const proveedoresConRespuesta = Number(
      resumen.proveedoresConRespuesta || 0,
    );

    if (!detalleGlobal?.modalidadFlujoLogistico) {
      reasons.push({
        key: "modalidad",
        text: "Primero define la modalidad del proceso logistico.",
        actionLabel: "Revisar detalle",
        actionTo: `/cotizaciones/proceso/${id}`,
      });
    } else if (totalSolicitudes <= 0) {
      reasons.push({
        key: "solicitudes",
        text: "Aun no existen solicitudes de cotizacion emitidas.",
        actionLabel: "Ir a solicitudes",
        actionTo: `/cotizaciones/proceso/${id}/solicitudes`,
      });
    } else if (totalCotizaciones <= 0 || proveedoresConRespuesta <= 0) {
      reasons.push({
        key: "respuestas",
        text: "Aun no hay respuestas de proveedores registradas.",
        actionLabel: "Ir a cotizaciones",
        actionTo: `/cotizaciones/proceso/${id}/cotizaciones`,
      });
    } else if (!etapaCerrada) {
      reasons.push({
        key: "cierre",
        text: "La etapa de cotizacion todavia esta abierta. Debes cerrarla para habilitar el comparativo.",
        actionLabel: "Cerrar desde cotizaciones",
        actionTo: `/cotizaciones/proceso/${id}/cotizaciones`,
      });
    } else if (flujoRegular && !coberturaCompleta && !cierreJustificado) {
      reasons.push({
        key: "cobertura",
        text: "Aun no se cumple la cobertura minima de cotizaciones por item. Revisa los items pendientes o cierra con sustento si ya agotaste la gestion.",
        actionLabel: "Revisar cobertura",
        actionTo: `/cotizaciones/proceso/${id}/cotizaciones`,
      });
    }

    return {
      blocked: reasons.length > 0,
      reasons,
      primaryAction: reasons[0] || null,
    };
  }, [
    cierreJustificado,
    coberturaCompleta,
    detalleGlobal?.modalidadFlujoLogistico,
    etapaCerrada,
    flujoRegular,
    id,
    resumen.proveedoresConRespuesta,
    resumen.totalCotizaciones,
    resumen.totalCotizacionesRegistradas,
    resumen.totalSolicitudes,
  ]);

  const cargarComparativo = useCallback(async () => {
    if (gate.blocked || !id) return;

    setLoadingComparativo(true);
    try {
      const data = await obtenerComparativo(id);
      setComparativo(data || null);
    } finally {
      setLoadingComparativo(false);
    }
  }, [gate.blocked, id, obtenerComparativo]);

  useEffect(() => {
    cargarComparativo();
  }, [cargarComparativo]);

  const viewModel = useMemo(
    () =>
      buildComparativoProcesoViewModel({
        detalleGlobal,
        comparativo,
      }),
    [detalleGlobal, comparativo],
  );

  const hydrationKey = `${comparativo?.id || "nuevo"}:${
    comparativo?.fechaActualizacion ||
    comparativo?.updatedAt ||
    comparativo?.version ||
    ""
  }`;

  useEffect(() => {
    if (gate.blocked || loadingComparativo || hydratedKey === hydrationKey) {
      return;
    }

    setAdjudicacionesByItem(viewModel.adjudicacionesIniciales || {});
    setCriterioResumen(viewModel.criterioInicial || "");
    setObservaciones(viewModel.observacionesIniciales || "");
    setSustentoPorProveedor(viewModel.sustentoInicialPorProveedor || {});
    setHydratedKey(hydrationKey);
  }, [gate.blocked, hydratedKey, hydrationKey, loadingComparativo, viewModel]);

  const estadoComparativo = String(
    comparativo?.estadoDocumento || comparativo?.estado || "BORRADOR",
  ).toUpperCase();
  const isEditable =
    !comparativo || ["BORRADOR", "OBSERVADO"].includes(estadoComparativo);

  const itemsById = useMemo(
    () =>
      viewModel.itemsRequeridos.reduce((acc, item) => {
        acc[String(item.itemRequerimientoId)] = item;
        return acc;
      }, {}),
    [viewModel.itemsRequeridos],
  );

  const handleToggleAdjudicacion = (itemRequerimientoId, cotizacionId) => {
    if (!isEditable) return;

    setAdjudicacionesByItem((prev) => {
      const key = String(itemRequerimientoId);
      const current = prev[key];

      if (Number(current) === Number(cotizacionId)) {
        const next = { ...prev };
        delete next[key];
        return next;
      }

      return {
        ...prev,
        [key]: Number(cotizacionId),
      };
    });
  };

  const proveedoresAdjudicados = useMemo(() => {
    const grouped = {};

    Object.entries(adjudicacionesByItem).forEach(([itemId, cotizacionId]) => {
      const cotizacion = viewModel.cotizacionesComparables.find(
        (entry) => Number(entry.cotizacionId) === Number(cotizacionId),
      );
      const cell = cotizacion?.matrizPorItem?.[itemId];

      if (!cotizacion || !cell?.adjudicable) return;

      const proveedorId = cotizacion.proveedor?.id;
      const key = `${proveedorId || "proveedor"}:${cotizacion.cotizacionId}`;

      if (!grouped[key]) {
        grouped[key] = {
          key,
          proveedorId,
          cotizacionId: cotizacion.cotizacionId,
          proveedor: cotizacion.proveedor,
          itemRequerimientoIds: [],
          items: [],
          montoAdjudicado: 0,
        };
      }

      grouped[key].itemRequerimientoIds.push(Number(itemId));
      grouped[key].items.push({
        ...itemsById[String(itemId)],
        precioTotal: cell.precioTotal,
      });
      grouped[key].montoAdjudicado += Number(cell.precioTotal || 0);
    });

    return Object.values(grouped);
  }, [
    adjudicacionesByItem,
    itemsById,
    viewModel.cotizacionesComparables,
  ]);

  const totalItems = viewModel.itemsRequeridos.length;
  const totalAdjudicados = Object.keys(adjudicacionesByItem).length;
  const totalPendientes = Math.max(totalItems - totalAdjudicados, 0);
  const montoTotalAdjudicado = proveedoresAdjudicados.reduce(
    (total, entry) => total + Number(entry.montoAdjudicado || 0),
    0,
  );
  const proveedoresSinJustificacion = proveedoresAdjudicados.filter(
    (entry) => !String(sustentoPorProveedor[entry.key] || "").trim(),
  );
  const canSave =
    isEditable &&
    viewModel.cotizacionesComparables.length > 0 &&
    !savingComparativo;
  const canApprove =
    Boolean(comparativo?.id) &&
    isEditable &&
    totalPendientes === 0 &&
    proveedoresAdjudicados.length > 0 &&
    proveedoresSinJustificacion.length === 0 &&
    Boolean(String(criterioResumen || "").trim()) &&
    !reviewingComparativo;

  const buildPayload = useCallback(
    () => ({
      cotizacionIdsConsideradas: viewModel.cotizacionesComparables
        .map((cotizacion) => Number(cotizacion.id || cotizacion.cotizacionId))
        .filter(Boolean),
      adjudicacionesItems: Object.entries(adjudicacionesByItem).map(
        ([itemRequerimientoId, cotizacionId]) => ({
          itemRequerimientoId: Number(itemRequerimientoId),
          cotizacionId: Number(cotizacionId),
        }),
      ),
      criterioAdjudicacion: {
        via: "COMPARATIVO_REGULAR",
        modoSeleccion:
          proveedoresAdjudicados.length > 1
            ? "POR_ITEM"
            : "COTIZACION_UNICA",
        adjudicacionPorItem: true,
        resumen: criterioResumen,
        sustentoPorProveedor: proveedoresAdjudicados.map((entry) => ({
          proveedorId: Number(entry.proveedorId),
          cotizacionId: Number(entry.cotizacionId),
          itemRequerimientoIds: entry.itemRequerimientoIds.map(Number),
          montoAdjudicado: entry.montoAdjudicado,
          justificacion: sustentoPorProveedor[entry.key] || "",
        })),
      },
      observaciones,
    }),
    [
      adjudicacionesByItem,
      criterioResumen,
      observaciones,
      proveedoresAdjudicados,
      sustentoPorProveedor,
      viewModel.cotizacionesComparables,
    ],
  );

  const handleGuardarComparativo = async () => {
    if (!canSave) return null;

    setSavingComparativo(true);
    try {
      const payload = buildPayload();
      const saved = comparativo?.id
        ? await actualizarComparativo(comparativo.id, payload)
        : await crearComparativo(id, payload);

      toast.success("Comparativo guardado correctamente.");
      await cargarComparativo();
      return saved;
    } finally {
      setSavingComparativo(false);
    }
  };

  const handleAprobarComparativo = async () => {
    if (!canApprove) {
      toast.warning("Completa adjudicaciones, criterio y sustentos antes de aprobar.");
      return;
    }

    setReviewingComparativo(true);
    try {
      const saved = await handleGuardarComparativo();
      const comparativoId = saved?.id || comparativo?.id;
      if (!comparativoId) return;

      await aprobarComparativo(comparativoId, {
        comentario: criterioResumen,
      });
      toast.success("Comparativo aprobado correctamente.");
      await cargarComparativo();
    } finally {
      setReviewingComparativo(false);
    }
  };

  const handleVerPdf = () => {
    if (!comparativo?.id) return;
    const url = obtenerComparativoPdfUrl(comparativo.id);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const condicionesSolicitadasRows = buildConditionRows(
    viewModel.condicionesSolicitadas,
    viewModel.tipoCompra,
  );

  if (loading && !detalleGlobal) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold leading-snug text-gray-900 sm:text-2xl">
          Cuadro comparativo de bienes
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm">
          Compara lo solicitado contra lo ofertado, adjudica por item y sustenta
          la Buena Pro antes de continuar.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {gate.blocked ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Aun no puedes generar el comparativo
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-800">
                Antes de continuar, completa los pasos pendientes de la etapa de
                cotizacion.
              </p>
            </div>
            {gate.primaryAction ? (
              <Link
                to={gate.primaryAction.actionTo}
                className="inline-flex w-full items-center justify-center rounded border border-amber-400 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 sm:w-fit"
              >
                {gate.primaryAction.actionLabel}
              </Link>
            ) : null}
          </div>

          <ul className="mt-4 space-y-2 text-sm text-amber-900">
            {gate.reasons.map((reason) => (
              <li key={reason.key} className="flex gap-2">
                <span aria-hidden="true">-</span>
                <span>{reason.text}</span>
              </li>
            ))}
          </ul>

          {gate.reasons.some((reason) => reason.key === "cobertura") &&
          itemsIncompletos.length > 0 ? (
            <details className="mt-4 rounded-lg border border-amber-200 bg-white/70 p-3 text-sm text-amber-900">
              <summary className="cursor-pointer font-semibold">
                Ver items con cobertura pendiente
              </summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {itemsIncompletos.map((item) => (
                  <div
                    key={item.itemRequerimientoId}
                    className="rounded border border-amber-100 bg-white p-3"
                  >
                    <p className="font-medium text-slate-900">
                      {item.descripcionVisible || "Item"}
                    </p>
                    <p className="mt-1 text-right text-xs text-slate-600 tabular-nums">
                      {formatInteger(item.coberturaValida)} /{" "}
                      {formatInteger(item.coverageMinimum)} cotizaciones validas
                    </p>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
        </section>
      ) : (
        <>
          {loadingComparativo ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="h-5 w-52 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-20 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : null}

          {!isEditable ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Este comparativo ya no es editable por su estado actual.
            </div>
          ) : null}

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Resumen del comparativo
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {cierreJustificado
                    ? "La etapa fue cerrada con sustento. Puedes consultar la trazabilidad cuando lo necesites."
                    : "La etapa de cotizacion fue cerrada y el expediente esta listo para comparar ofertas."}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {cierreJustificado ? (
                  <button
                    type="button"
                    onClick={() => setShowTrazabilidad(true)}
                    className="inline-flex items-center justify-center rounded border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50"
                  >
                    Ver sustento
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleVerPdf}
                  disabled={!comparativo?.id}
                  className="inline-flex items-center justify-center gap-2 rounded border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileText size={16} />
                  Ver PDF
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              {[
                ["Tipo de compra", viewModel.tipoCompra || "No definido"],
                ["Items requeridos", formatInteger(totalItems)],
                [
                  "Cotizaciones comparables",
                  formatInteger(viewModel.cotizacionesComparables.length),
                ],
                ["Items adjudicados", formatInteger(totalAdjudicados)],
                ["Items pendientes", formatInteger(totalPendientes)],
                [
                  "Monto adjudicado",
                  formatMoney(montoTotalAdjudicado, viewModel.moneda),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-right text-lg font-bold text-slate-900 tabular-nums">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              {viewModel.tipoCompra === "IMPORTACION"
                ? "Condiciones de importacion solicitadas por la entidad"
                : "Condiciones solicitadas por la entidad"}
            </h2>
            {condicionesSolicitadasRows.length > 0 ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {condicionesSolicitadasRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      {label}
                    </p>
                    <p className="mt-1 text-sm text-slate-900">
                      {formatText(value)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No registrado</p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-indigo-200 p-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Matriz comparativa de bienes
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Solo los items COTIZADO pueden adjudicarse. Los items NO COTIZA
                quedan visibles, pero bloqueados.
              </p>
            </div>

            {viewModel.cotizacionesComparables.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-[1400px] w-full border-collapse text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                    <tr>
                      <th
                        rowSpan={2}
                        className="border-b border-slate-200 px-3 py-3 text-center"
                      >
                        Item
                      </th>
                      <th
                        rowSpan={2}
                        className="min-w-72 border-b border-slate-200 px-3 py-3 text-center"
                      >
                        Descripcion / especificacion solicitada
                      </th>
                      <th
                        rowSpan={2}
                        className="border-b border-slate-200 px-3 py-3 text-center"
                      >
                        Unidad
                      </th>
                      <th
                        rowSpan={2}
                        className="border-b border-slate-200 px-3 py-3 text-center"
                      >
                        Cantidad requerida
                      </th>
                      {viewModel.cotizacionesComparables.map((cotizacion) => (
                        <th
                          key={cotizacion.cotizacionId}
                          colSpan={6}
                          className="border-b border-l border-slate-200 px-3 py-3 text-center"
                        >
                          <div className="font-semibold text-slate-900">
                            {cotizacion.proveedor.razonSocial}
                          </div>
                          <div className="mt-1 normal-case text-slate-500">
                            RUC {formatText(cotizacion.proveedor.ruc, "-")} ·{" "}
                            {cotizacion.solicitudCodigo} · {cotizacion.moneda}
                          </div>
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {viewModel.cotizacionesComparables.map((cotizacion) => (
                        <React.Fragment key={`sub-${cotizacion.cotizacionId}`}>
                          {[
                            "Especificacion ofertada",
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
                          {formatText(item.unidadMedida, "-")}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {formatQuantity(item.cantidadRequerida)}
                        </td>
                        {viewModel.cotizacionesComparables.map((cotizacion) => {
                          const cell =
                            cotizacion.matrizPorItem[item.itemRequerimientoId];
                          const checked =
                            Number(
                              adjudicacionesByItem[item.itemRequerimientoId],
                            ) === Number(cotizacion.cotizacionId);

                          return (
                            <React.Fragment
                              key={`${item.itemRequerimientoId}-${cotizacion.cotizacionId}`}
                            >
                              <td className="border-l border-slate-100 px-3 py-3">
                                {cell?.estado === "COTIZADO"
                                  ? formatText(
                                      cell.descripcionTecnicaOfertada,
                                      "-",
                                    )
                                  : cell?.estado}
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums">
                                {cell?.estado === "COTIZADO"
                                  ? formatQuantity(cell.cantidadOfrecida)
                                  : "-"}
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums">
                                {cell?.estado === "COTIZADO"
                                  ? formatMoney(
                                      cell.precioUnitario,
                                      cotizacion.moneda,
                                    )
                                  : "-"}
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums">
                                {cell?.estado === "COTIZADO"
                                  ? formatMoney(cell.precioTotal, cotizacion.moneda)
                                  : "-"}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                    cell?.estado === "COTIZADO"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {cell?.estado || "NO_SOLICITADO"}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                {cell?.adjudicable ? (
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={!isEditable}
                                    onChange={() =>
                                      handleToggleAdjudicacion(
                                        item.itemRequerimientoId,
                                        cotizacion.cotizacionId,
                                      )
                                    }
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label={`Adjudicar item ${item.numero} a ${cotizacion.proveedor.razonSocial}`}
                                  />
                                ) : (
                                  <span className="text-xs text-slate-400">-</span>
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
                No hay cotizaciones comparables para construir la matriz.
              </div>
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
                  viewModel.tipoCompra,
                );

                return (
                  <article
                    key={cotizacion.cotizacionId}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {cotizacion.proveedor.razonSocial}
                        </h3>
                        <p className="text-sm text-slate-500">
                          RUC {formatText(cotizacion.proveedor.ruc, "-")} ·{" "}
                          {cotizacion.solicitudCodigo}
                        </p>
                      </div>
                      <p className="text-right font-semibold tabular-nums text-slate-900">
                        {formatMoney(cotizacion.totalOferta, cotizacion.moneda)}
                      </p>
                    </div>
                    {rows.length > 0 ? (
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
              Sustento de Buena Pro por proveedor adjudicado
            </h2>
            {proveedoresAdjudicados.length > 0 ? (
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {proveedoresAdjudicados.map((entry) => (
                  <article
                    key={entry.key}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          Justificacion de Buena Pro para{" "}
                          {entry.proveedor.razonSocial}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Items adjudicados:{" "}
                          {entry.items
                            .map((item) => item.numero || item.itemRequerimientoId)
                            .join(", ")}
                        </p>
                      </div>
                      <p className="text-right font-semibold tabular-nums text-slate-900">
                        {formatMoney(entry.montoAdjudicado, viewModel.moneda)}
                      </p>
                    </div>
                    <textarea
                      value={sustentoPorProveedor[entry.key] || ""}
                      onChange={(event) =>
                        setSustentoPorProveedor((prev) => ({
                          ...prev,
                          [entry.key]: event.target.value,
                        }))
                      }
                      disabled={!isEditable}
                      className="mt-3 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                      placeholder="Ej.: Cumple las especificaciones tecnicas y ofrece la mejor condicion economica para los items adjudicados."
                    />
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Selecciona al menos un item para habilitar el sustento por
                proveedor.
              </p>
            )}
          </section>

          {viewModel.proveedoresSinCotizacionValida.length > 0 ? (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Proveedores invitados sin cotizacion valida
              </h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
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
                          {entry.proveedor.razonSocial}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {formatText(entry.proveedor.ruc, "-")}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {formatText(entry.solicitudCodigo, "-")}
                        </td>
                        <td className="px-3 py-3">
                          {formatText(entry.motivoLabel)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Criterio y observaciones
            </h2>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Criterio general de adjudicacion
                </span>
                <textarea
                  value={criterioResumen}
                  onChange={(event) => setCriterioResumen(event.target.value)}
                  disabled={!isEditable}
                  className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                  placeholder="Describe el criterio tecnico-economico usado para seleccionar la Buena Pro."
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Observaciones del comparativo
                </span>
                <textarea
                  value={observaciones}
                  onChange={(event) => setObservaciones(event.target.value)}
                  disabled={!isEditable}
                  className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                  placeholder="Registra observaciones relevantes del proceso comparativo."
                />
              </label>
            </div>

            {totalPendientes > 0 ||
            proveedoresSinJustificacion.length > 0 ||
            !String(criterioResumen || "").trim() ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">
                  Pendiente para aprobar el comparativo
                </p>
                <ul className="mt-2 space-y-1">
                  {totalPendientes > 0 ? (
                    <li>
                      - Adjudica {formatInteger(totalPendientes)} item(s)
                      pendiente(s).
                    </li>
                  ) : null}
                  {proveedoresSinJustificacion.length > 0 ? (
                    <li>- Completa la justificacion de cada proveedor.</li>
                  ) : null}
                  {!String(criterioResumen || "").trim() ? (
                    <li>- Registra el criterio general de adjudicacion.</li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </section>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleGuardarComparativo}
              disabled={!canSave}
              className="inline-flex items-center justify-center gap-2 rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {savingComparativo ? "Guardando..." : "Guardar comparativo"}
            </button>
            <button
              type="button"
              onClick={handleAprobarComparativo}
              disabled={!canApprove}
              className="inline-flex items-center justify-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              {reviewingComparativo ? "Aprobando..." : "Aprobar comparativo"}
            </button>
          </div>
        </>
      )}

      <Modal
        isOpen={showTrazabilidad}
        onClose={() => setShowTrazabilidad(false)}
        title="Sustento de cierre"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-sm text-slate-700">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <p className="font-semibold">Cierre con cobertura incompleta</p>
            <p className="mt-1">
              Fecha de cierre:{" "}
              {formatDate(detalleGlobal?.fechaCierreCotizaciones)}
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Motivo registrado</p>
            <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 leading-relaxed">
              {detalleGlobal?.motivoCierreCotizaciones || "No registrado"}
            </p>
          </div>

          {itemsIncompletos.length > 0 ? (
            <div>
              <p className="font-semibold text-slate-900">
                Items con cobertura pendiente
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {itemsIncompletos.map((item) => (
                  <div
                    key={item.itemRequerimientoId}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <p className="font-medium text-slate-900">
                      {item.descripcionVisible || "Item"}
                    </p>
                    <p className="mt-1 text-right text-xs text-slate-600 tabular-nums">
                      {formatInteger(item.coberturaValida)} /{" "}
                      {formatInteger(item.coverageMinimum)} cotizaciones validas
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowTrazabilidad(false)}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default ComparativosProcesoLogisticoPage;
