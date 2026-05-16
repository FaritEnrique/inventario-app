import React, { useEffect, useMemo, useState } from "react";
import {
  BANK_CHARGE_PARTY_LABELS,
  BANK_CHARGE_PARTY_OPTIONS,
  buildSolicitudPaymentSummaryLabel,
  IMPORT_PAYMENT_INSTRUMENT_LABELS,
  IMPORT_PAYMENT_INSTRUMENT_OPTIONS,
  IMPORT_PAYMENT_STRUCTURE_LABELS,
  IMPORT_PAYMENT_STRUCTURE_OPTIONS,
  IMPORT_PAYMENT_TERM_REFERENCE_LABELS,
  IMPORT_PAYMENT_TERM_REFERENCE_OPTIONS,
  IMPORT_PAYMENT_TRIGGER_LABELS,
  IMPORT_PAYMENT_TRIGGER_OPTIONS,
  LOCAL_DELIVERY_PLACE_TYPE_LABELS,
  LOCAL_LOGISTICS_RESPONSIBLE_PARTY_LABELS,
  LOCAL_PAYMENT_CONDITION_LABELS,
  LOCAL_PAYMENT_MILESTONE_LABELS,
  LOCAL_PURCHASE_SCOPE_LABELS,
  PURCHASE_TYPE_LABELS,
  SOLICITUD_COTIZACION_CURRENCY_LABELS,
  SOLICITUD_COTIZACION_RECEPTION_CHANNEL_LABELS,
} from "../features/solicitud-cotizacion/solicitudCotizacionCatalog";

const cotizacionStates = ["Pendiente", "Rechazada"];
const formasPagoLocalPropuesta = [
  { value: "", label: "Seleccionar" },
  { value: "CONTRA_ENTREGA", label: "Contra entrega" },
  { value: "ADELANTO", label: "Adelanto" },
  { value: "CREDITO", label: "Credito" },
  { value: "MIXTO", label: "Mixto" },
];
const itemResponseOptions = [
  { value: "COTIZADO", label: "Cotiza" },
  { value: "NO_COTIZA", label: "No cotiza" },
];

const formatNumberInput = (value) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? ""
    : String(value);

const resetLocalPaymentProposalFields = (formaPagoLocalPropuesta) => ({
  formaPagoLocalPropuesta,
  diasCreditoLocalPropuesto: "",
  porcentajeAnticipoLocalPropuesto: "",
  porcentajeSaldoLocalPropuesto: "",
});

const resetImportPaymentProposalStructureFields = (
  estructuraPagoImportacionPropuesta,
) => ({
  estructuraPagoImportacionPropuesta,
  gatilloPagoImportacionPropuesta: "",
  porcentajeAnticipoImportacionPropuesto: "",
  porcentajeSaldoImportacionPropuesto: "",
  diasCreditoImportacionPropuesto: "",
  referenciaPlazoImportacionPropuesta: "",
});

const resetImportPaymentProposalInstrumentFields = (
  instrumentoPagoImportacionPropuesta,
) => ({
  instrumentoPagoImportacionPropuesta,
  gastosBancariosPorPropuesto: "",
});

const buildPaymentProposalPayload = (formData, isImportacion) =>
  isImportacion
    ? {
        estructuraPagoImportacionPropuesta:
          formData.estructuraPagoImportacionPropuesta || null,
        instrumentoPagoImportacionPropuesta:
          formData.instrumentoPagoImportacionPropuesta || null,
        gatilloPagoImportacionPropuesta:
          formData.estructuraPagoImportacionPropuesta === "CONTRA_DOCUMENTOS"
            ? formData.gatilloPagoImportacionPropuesta || null
            : null,
        porcentajeAnticipoImportacionPropuesto:
          formData.estructuraPagoImportacionPropuesta === "MIXTO"
            ? Number(formData.porcentajeAnticipoImportacionPropuesto)
            : null,
        porcentajeSaldoImportacionPropuesto:
          formData.estructuraPagoImportacionPropuesta === "MIXTO"
            ? Number(formData.porcentajeSaldoImportacionPropuesto)
            : null,
        diasCreditoImportacionPropuesto:
          formData.estructuraPagoImportacionPropuesta === "CREDITO_PLAZO"
            ? Number(formData.diasCreditoImportacionPropuesto)
            : null,
        referenciaPlazoImportacionPropuesta:
          formData.estructuraPagoImportacionPropuesta === "CREDITO_PLAZO"
            ? formData.referenciaPlazoImportacionPropuesta || null
            : null,
        gastosBancariosPorPropuesto:
          formData.instrumentoPagoImportacionPropuesta === "CARTA_CREDITO"
            ? formData.gastosBancariosPorPropuesto || null
            : null,
        documentosPagoImportacionPropuestos:
          formData.documentosPagoImportacionPropuestos.trim() || null,
        observacionPagoImportacionPropuesta:
          formData.observacionPagoImportacionPropuesta.trim() || null,
      }
    : {
        formaPagoLocalPropuesta: formData.formaPagoLocalPropuesta,
        diasCreditoLocalPropuesto:
          formData.formaPagoLocalPropuesta === "CREDITO"
            ? Number(formData.diasCreditoLocalPropuesto)
            : null,
        porcentajeAnticipoLocalPropuesto:
          formData.formaPagoLocalPropuesta === "MIXTO"
            ? Number(formData.porcentajeAnticipoLocalPropuesto)
            : null,
        porcentajeSaldoLocalPropuesto:
          formData.formaPagoLocalPropuesta === "MIXTO"
            ? Number(formData.porcentajeSaldoLocalPropuesto)
            : null,
        observacionPagoLocalPropuesta:
          formData.observacionPagoLocalPropuesta.trim() || null,
      };

const validatePaymentProposal = (formData, isImportacion) => {
  const errors = [];

  if (isImportacion) {
    if (!formData.estructuraPagoImportacionPropuesta) {
      errors.push("Selecciona la estructura de pago de importacion propuesta.");
    }
    if (!formData.instrumentoPagoImportacionPropuesta) {
      errors.push("Selecciona el instrumento de pago de importacion propuesto.");
    }
    if (formData.estructuraPagoImportacionPropuesta === "MIXTO") {
      const anticipo = Number(formData.porcentajeAnticipoImportacionPropuesto);
      const saldo = Number(formData.porcentajeSaldoImportacionPropuesto);
      if (
        !Number.isFinite(anticipo) ||
        !Number.isFinite(saldo) ||
        anticipo <= 0 ||
        saldo <= 0
      ) {
        errors.push("El pago mixto de importacion requiere anticipo y saldo mayores a 0.");
      } else if (Math.round((anticipo + saldo) * 100) / 100 !== 100) {
        errors.push("Los porcentajes de importacion propuestos deben sumar 100.");
      }
    }
    if (formData.estructuraPagoImportacionPropuesta === "CREDITO_PLAZO") {
      if (
        !Number.isInteger(Number(formData.diasCreditoImportacionPropuesto)) ||
        Number(formData.diasCreditoImportacionPropuesto) <= 0
      ) {
        errors.push("El credito de importacion requiere dias mayores a 0.");
      }
      if (!formData.referenciaPlazoImportacionPropuesta) {
        errors.push("Selecciona la referencia del plazo de importacion propuesta.");
      }
    }
    if (
      formData.estructuraPagoImportacionPropuesta === "CONTRA_DOCUMENTOS" &&
      !formData.gatilloPagoImportacionPropuesta
    ) {
      errors.push("Selecciona el gatillo documentario propuesto.");
    }
    if (
      formData.instrumentoPagoImportacionPropuesta === "CARTA_CREDITO" &&
      !formData.gastosBancariosPorPropuesto
    ) {
      errors.push("Selecciona quien asume los gastos bancarios propuestos.");
    }
    if (formData.documentosPagoImportacionPropuestos.length > 1000) {
      errors.push("Los documentos de pago propuestos no deben superar los 1000 caracteres.");
    }
    if (formData.observacionPagoImportacionPropuesta.length > 1000) {
      errors.push("La observacion de pago de importacion propuesta no debe superar los 1000 caracteres.");
    }
    return errors;
  }

  if (!formData.formaPagoLocalPropuesta) {
    errors.push("Selecciona la forma de pago local propuesta por el proveedor.");
  }
  if (formData.formaPagoLocalPropuesta === "CREDITO") {
    if (
      !Number.isInteger(Number(formData.diasCreditoLocalPropuesto)) ||
      Number(formData.diasCreditoLocalPropuesto) <= 0
    ) {
      errors.push("El credito local requiere dias mayores a 0.");
    }
  }
  if (formData.formaPagoLocalPropuesta === "MIXTO") {
    const anticipo = Number(formData.porcentajeAnticipoLocalPropuesto);
    const saldo = Number(formData.porcentajeSaldoLocalPropuesto);
    if (
      !Number.isFinite(anticipo) ||
      !Number.isFinite(saldo) ||
      anticipo <= 0 ||
      saldo <= 0
    ) {
      errors.push("El pago local mixto requiere anticipo y saldo mayores a 0.");
    } else if (Math.round((anticipo + saldo) * 100) / 100 !== 100) {
      errors.push("Los porcentajes de pago local propuestos deben sumar 100.");
    }
  }
  if (formData.observacionPagoLocalPropuesta.length > 1000) {
    errors.push("La observacion sobre pago local propuesto no debe superar los 1000 caracteres.");
  }

  return errors;
};

const hasValue = (value) =>
  value !== null && value !== undefined && String(value).trim() !== "";

const labelFrom = (labels, value) => labels?.[value] || value || null;

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : null;

const formatDays = (value, zeroLabel = "Inmediata") => {
  if (!hasValue(value)) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  if (numeric === 0) return zeroLabel;
  return `${numeric} dia${numeric === 1 ? "" : "s"}`;
};

const formatPercentage = (value) => {
  if (!hasValue(value)) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return `${numeric}%`;
};

const formatBoolean = (value) => {
  if (value === true) return "Si";
  if (value === false) return "No";
  return null;
};

const getCurrencyLabel = (solicitud = {}) => {
  const base =
    SOLICITUD_COTIZACION_CURRENCY_LABELS[solicitud.moneda] ||
    solicitud.moneda ||
    "PEN";

  if (solicitud.moneda === "OTRA" && solicitud.codigoMonedaOtra) {
    return `${base} (${solicitud.codigoMonedaOtra})`;
  }

  return base;
};

const getCurrencyPrefix = (solicitud = {}) => {
  if (solicitud.moneda === "USD") return "USD";
  if (solicitud.moneda === "OTRA") {
    return solicitud.codigoMonedaOtra || solicitud.moneda || "";
  }
  return "S/";
};

const formatCurrency = (value, solicitud = {}) => {
  const prefix = getCurrencyPrefix(solicitud);
  return `${prefix ? `${prefix} ` : ""}${Number(value || 0).toFixed(2)}`;
};

const buildContextGroup = (title, items = []) => {
  const visibleItems = items.filter((item) => hasValue(item.value));
  return visibleItems.length ? { title, items: visibleItems } : null;
};

const buildOfficialContextGroups = (solicitud = {}) => {
  if (!solicitud) return [];

  const paymentSummary = buildSolicitudPaymentSummaryLabel(solicitud);
  const groups = [
    buildContextGroup("Datos de solicitud y proveedor", [
      { label: "Solicitud", value: solicitud.codigo },
      {
        label: "Proveedor",
        value: solicitud.proveedor?.razonSocial || solicitud.proveedor?.nombre,
      },
      { label: "RUC", value: solicitud.proveedor?.ruc },
      {
        label: "Direccion",
        value:
          solicitud.proveedor?.direccion ||
          solicitud.proveedor?.domicilioLegal,
        wide: true,
      },
      {
        label: "Requerimiento",
        value: solicitud.requerimiento?.codigo || solicitud.requerimientoId,
      },
      {
        label: "Area solicitante",
        value: solicitud.requerimiento?.areaSolicitante,
      },
      { label: "Moneda", value: getCurrencyLabel(solicitud) },
      {
        label: "Medio de recepcion",
        value: labelFrom(
          SOLICITUD_COTIZACION_RECEPTION_CHANNEL_LABELS,
          solicitud.medioRecepcion,
        ),
      },
      {
        label: "Tipo de compra",
        value: labelFrom(PURCHASE_TYPE_LABELS, solicitud.tipoCompra),
      },
      {
        label: "Fecha limite",
        value: formatDate(solicitud.fechaLimiteRecepcion),
      },
    ]),
    buildContextGroup("Condiciones generales oficiales", [
      {
        label: "Vigencia solicitada",
        value: formatDays(solicitud.vigenciaOfertaDias, "Sin plazo indicado"),
      },
      {
        label: "Plazo de entrega solicitado",
        value: formatDays(solicitud.tiempoEntregaDias),
      },
      { label: "Garantia solicitada", value: solicitud.garantia },
      { label: "Lugar de entrega oficial", value: solicitud.lugarEntrega },
    ]),
    buildContextGroup("Condiciones oficiales de pago", [
      { label: "Resumen de pago oficial", value: paymentSummary, wide: true },
      {
        label: "Condicion de pago local",
        value: labelFrom(
          LOCAL_PAYMENT_CONDITION_LABELS,
          solicitud.condicionPagoLocal,
        ),
      },
      {
        label: "Hito de pago local",
        value: labelFrom(LOCAL_PAYMENT_MILESTONE_LABELS, solicitud.hitoPagoLocal),
      },
      {
        label: "Anticipo local",
        value: formatPercentage(solicitud.porcentajeAnticipoLocal),
      },
      {
        label: "Saldo local",
        value: formatPercentage(solicitud.porcentajeSaldoLocal),
      },
      {
        label: "Dias de credito local",
        value: formatDays(solicitud.diasCreditoLocal, "0 dias"),
      },
      {
        label: "Estructura de pago importacion",
        value: labelFrom(
          IMPORT_PAYMENT_STRUCTURE_LABELS,
          solicitud.estructuraPagoImportacion,
        ),
      },
      {
        label: "Instrumento de pago importacion",
        value: labelFrom(
          IMPORT_PAYMENT_INSTRUMENT_LABELS,
          solicitud.instrumentoPagoImportacion,
        ),
      },
      {
        label: "Gatillo documentario",
        value: labelFrom(
          IMPORT_PAYMENT_TRIGGER_LABELS,
          solicitud.gatilloPagoImportacion,
        ),
      },
      {
        label: "Anticipo importacion",
        value: formatPercentage(solicitud.porcentajeAnticipoImportacion),
      },
      {
        label: "Saldo importacion",
        value: formatPercentage(solicitud.porcentajeSaldoImportacion),
      },
      {
        label: "Dias de credito importacion",
        value: formatDays(solicitud.diasCreditoImportacion, "0 dias"),
      },
      {
        label: "Referencia del plazo",
        value: labelFrom(
          IMPORT_PAYMENT_TERM_REFERENCE_LABELS,
          solicitud.referenciaPlazoImportacion,
        ),
      },
      {
        label: "Gastos bancarios por",
        value: labelFrom(BANK_CHARGE_PARTY_LABELS, solicitud.gastosBancariosPor),
      },
    ]),
    buildContextGroup("Condiciones oficiales de entrega y logistica", [
      {
        label: "Alcance compra local",
        value: labelFrom(LOCAL_PURCHASE_SCOPE_LABELS, solicitud.alcanceCompraLocal),
      },
      {
        label: "Tipo de lugar local",
        value: labelFrom(
          LOCAL_DELIVERY_PLACE_TYPE_LABELS,
          solicitud.lugarEntregaLocalTipo,
        ),
      },
      {
        label: "Detalle lugar local",
        value: solicitud.lugarEntregaLocalDetalle,
        wide: true,
      },
      {
        label: "Transporte asumido por",
        value: labelFrom(
          LOCAL_LOGISTICS_RESPONSIBLE_PARTY_LABELS,
          solicitud.transporteAsumidoPor,
        ),
      },
      {
        label: "Carga/descarga asumida por",
        value: labelFrom(
          LOCAL_LOGISTICS_RESPONSIBLE_PARTY_LABELS,
          solicitud.cargaDescargaAsumidaPor,
        ),
      },
      {
        label: "Permite entregas parciales",
        value: formatBoolean(solicitud.permiteEntregasParciales),
      },
      {
        label: "Condiciones logisticas locales",
        value: solicitud.condicionesLogisticasLocales,
        wide: true,
      },
      { label: "Incoterm", value: solicitud.incoterm },
      { label: "Version Incoterm", value: solicitud.incotermVersion },
      {
        label: "Punto logistico Incoterm",
        value: solicitud.incotermPuntoLogistico,
        wide: true,
      },
    ]),
  ];

  return groups.filter(Boolean);
};

const ContextFieldGrid = ({ items = [] }) => (
  <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    {items.map((item) => (
      <div
        key={item.label}
        className={`rounded border border-slate-200 bg-white p-3 ${
          item.wide ? "md:col-span-2 xl:col-span-3" : ""
        }`}
      >
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {item.label}
        </dt>
        <dd className="mt-1 whitespace-pre-line text-sm font-medium text-slate-900">
          {item.value}
        </dd>
      </div>
    ))}
  </dl>
);

const buildDraftItem = (solicitudItem, existing = null) => {
  const itemId =
    solicitudItem.itemRequerimientoId || solicitudItem.itemRequerimiento?.id;
  const requiredQuantity = Number(
    solicitudItem.itemRequerimiento?.cantidadRequerida || 0
  );
  const estadoRespuesta =
    String(existing?.estadoRespuesta || "COTIZADO").toUpperCase() === "NO_COTIZA"
      ? "NO_COTIZA"
      : "COTIZADO";

  return {
    itemRequerimientoId: Number(itemId),
    estadoRespuesta,
    cantidadOfrecida:
      estadoRespuesta === "NO_COTIZA"
        ? ""
        : formatNumberInput(existing?.cantidadOfrecida ?? requiredQuantity),
    precioUnidad:
      estadoRespuesta === "NO_COTIZA"
        ? ""
        : formatNumberInput(existing?.precioUnidad),
    precioTotal:
      estadoRespuesta === "NO_COTIZA"
        ? null
        : Number(existing?.precioTotal ?? 0),
    descripcionTecnicaOfertada: existing?.descripcionTecnicaOfertada || "",
  };
};

const buildItemsFromSolicitud = (solicitud, sourceItems = []) => {
  const solicitudItems = Array.isArray(solicitud?.items) ? solicitud.items : [];

  return solicitudItems.map((solicitudItem) => {
    const itemId =
      solicitudItem.itemRequerimientoId || solicitudItem.itemRequerimiento?.id;
    const existing = sourceItems.find(
      (item) => Number(item.itemRequerimientoId) === Number(itemId)
    );
    return buildDraftItem(solicitudItem, existing);
  });
};

const normalizeInitialData = (initialData) => ({
  id: initialData?.id || null,
  codigo: initialData?.codigo || "",
  solicitudId: initialData?.solicitudId ? String(initialData.solicitudId) : "",
  fechaEmision: initialData?.fechaEmision
    ? new Date(initialData.fechaEmision).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10),
  estado: initialData?.estado || "Pendiente",
  garantia: initialData?.garantia || "",
  tiempoEntregaDias:
    initialData?.tiempoEntregaDias === null ||
    initialData?.tiempoEntregaDias === undefined
      ? ""
      : String(initialData.tiempoEntregaDias),
  vigenciaOfertaDias:
    initialData?.vigenciaOfertaDias === null ||
    initialData?.vigenciaOfertaDias === undefined
      ? ""
      : String(initialData.vigenciaOfertaDias),
  lugarEntrega: initialData?.lugarEntrega || "",
  formaPagoLocalPropuesta: initialData?.formaPagoLocalPropuesta || "",
  diasCreditoLocalPropuesto: formatNumberInput(
    initialData?.diasCreditoLocalPropuesto,
  ),
  porcentajeAnticipoLocalPropuesto: formatNumberInput(
    initialData?.porcentajeAnticipoLocalPropuesto,
  ),
  porcentajeSaldoLocalPropuesto: formatNumberInput(
    initialData?.porcentajeSaldoLocalPropuesto,
  ),
  observacionPagoLocalPropuesta:
    initialData?.observacionPagoLocalPropuesta || "",
  estructuraPagoImportacionPropuesta:
    initialData?.estructuraPagoImportacionPropuesta || "",
  instrumentoPagoImportacionPropuesta:
    initialData?.instrumentoPagoImportacionPropuesta || "",
  gatilloPagoImportacionPropuesta:
    initialData?.gatilloPagoImportacionPropuesta || "",
  porcentajeAnticipoImportacionPropuesto: formatNumberInput(
    initialData?.porcentajeAnticipoImportacionPropuesto,
  ),
  porcentajeSaldoImportacionPropuesto: formatNumberInput(
    initialData?.porcentajeSaldoImportacionPropuesto,
  ),
  diasCreditoImportacionPropuesto: formatNumberInput(
    initialData?.diasCreditoImportacionPropuesto,
  ),
  referenciaPlazoImportacionPropuesta:
    initialData?.referenciaPlazoImportacionPropuesta || "",
  gastosBancariosPorPropuesto: initialData?.gastosBancariosPorPropuesto || "",
  documentosPagoImportacionPropuestos:
    initialData?.documentosPagoImportacionPropuestos || "",
  observacionPagoImportacionPropuesta:
    initialData?.observacionPagoImportacionPropuesta || "",
  observaciones: initialData?.observaciones || "",
  items: Array.isArray(initialData?.items)
    ? initialData.items.map((item) => ({
        itemRequerimientoId: Number(item.itemRequerimientoId),
        estadoRespuesta:
          String(item.estadoRespuesta || "COTIZADO").toUpperCase() ===
          "NO_COTIZA"
            ? "NO_COTIZA"
            : "COTIZADO",
        cantidadOfrecida: formatNumberInput(item.cantidadOfrecida),
        precioUnidad: formatNumberInput(item.precioUnidad),
        precioTotal:
          item.precioTotal === null || item.precioTotal === undefined
            ? null
            : Number(item.precioTotal),
        descripcionTecnicaOfertada: item.descripcionTecnicaOfertada || "",
      }))
    : [],
});

const CotizacionForm = ({
  initialData,
  solicitudes,
  lockedSolicitudId = null,
  onSubmit,
  onCancel,
  submitting,
}) => {
  const [formData, setFormData] = useState(() => normalizeInitialData(initialData));
  const [formErrors, setFormErrors] = useState([]);

  useEffect(() => {
    const nextData = normalizeInitialData(initialData);
    setFormErrors([]);
    setFormData({
      ...nextData,
      solicitudId: lockedSolicitudId
        ? String(lockedSolicitudId)
        : nextData.solicitudId,
    });
  }, [initialData, lockedSolicitudId]);

  const solicitudSelectionLocked = Boolean(lockedSolicitudId || formData.id);

  const selectedSolicitud = useMemo(
    () =>
      solicitudes.find(
        (solicitud) => String(solicitud.id) === String(formData.solicitudId)
      ) || null,
    [formData.solicitudId, solicitudes]
  );

  useEffect(() => {
    if (!selectedSolicitud) return;

    setFormData((prev) => ({
      ...prev,
      items: buildItemsFromSolicitud(selectedSolicitud, prev.items),
    }));
  }, [selectedSolicitud]);

  const updateItemField = (itemRequerimientoId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (Number(item.itemRequerimientoId) !== Number(itemRequerimientoId)) {
          return item;
        }

        const nextItem = {
          ...item,
          [field]: value,
        };

        if (field === "estadoRespuesta" && value === "NO_COTIZA") {
          return {
            ...nextItem,
            cantidadOfrecida: "",
            precioUnidad: "",
            precioTotal: null,
          };
        }

        if (nextItem.estadoRespuesta === "NO_COTIZA") {
          return {
            ...nextItem,
            precioTotal: null,
          };
        }

        const cantidad = Number(nextItem.cantidadOfrecida || 0);
        const precioUnidad = Number(nextItem.precioUnidad || 0);

        return {
          ...nextItem,
          precioTotal:
            Number.isFinite(cantidad) && Number.isFinite(precioUnidad)
              ? cantidad * precioUnidad
              : 0,
        };
      }),
    }));
  };

  const totalOferta = useMemo(
    () =>
      formData.items.reduce(
        (acc, item) =>
          item.estadoRespuesta === "COTIZADO"
            ? acc + Number(item.precioTotal || 0)
            : acc,
        0
      ),
    [formData.items]
  );

  const officialContextGroups = useMemo(
    () => buildOfficialContextGroups(selectedSolicitud),
    [selectedSolicitud],
  );
  const currencyPrefix = getCurrencyPrefix(selectedSolicitud || {});
  const isImportacion =
    String(selectedSolicitud?.tipoCompra || "").toUpperCase() === "IMPORTACION";
  const isLocal =
    String(selectedSolicitud?.tipoCompra || "").toUpperCase() === "LOCAL";

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validatePaymentProposal(formData, isImportacion);
    if (errors.length) {
      setFormErrors(errors);
      return;
    }

    setFormErrors([]);

    await onSubmit({
      codigo: formData.codigo.trim(),
      solicitudId: Number(formData.solicitudId),
      proveedorId: selectedSolicitud?.proveedorId || selectedSolicitud?.proveedor?.id,
      fechaEmision: formData.fechaEmision,
      estado: formData.estado,
      garantia: formData.garantia.trim() || null,
      tiempoEntregaDias:
        formData.tiempoEntregaDias === "" ? null : Number(formData.tiempoEntregaDias),
      vigenciaOfertaDias:
        formData.vigenciaOfertaDias === "" ? null : Number(formData.vigenciaOfertaDias),
      lugarEntrega: formData.lugarEntrega.trim() || null,
      ...buildPaymentProposalPayload(formData, isImportacion),
      observaciones: formData.observaciones.trim() || null,
      items: formData.items.map((item) => ({
        itemRequerimientoId: Number(item.itemRequerimientoId),
        estadoRespuesta: item.estadoRespuesta,
        cantidadOfrecida:
          item.estadoRespuesta === "NO_COTIZA"
            ? null
            : Number(item.cantidadOfrecida),
        precioUnidad:
          item.estadoRespuesta === "NO_COTIZA"
            ? null
            : Number(item.precioUnidad),
        precioTotal:
          item.estadoRespuesta === "NO_COTIZA"
            ? null
            : Number(item.precioTotal || 0),
        descripcionTecnicaOfertada:
          item.descripcionTecnicaOfertada?.trim() || null,
      })),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {formData.id ? "Editar cotizacion" : "Nueva cotizacion"}
          </h2>
          <p className="text-sm text-gray-600">
            Registra una sola respuesta activa del proveedor y resuelve cada item
            de la solicitud como cotizado o no cotizado.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Codigo</span>
          <input
            type="text"
            value={formData.codigo}
            name="cotizacion-form-input-codigo"
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, codigo: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="COT-001"
            required
          />
        </label>

        <label className="space-y-1 text-sm text-gray-700 xl:col-span-2">
          <span className="font-medium">Solicitud de cotizacion</span>
          <select
            value={formData.solicitudId}
            name="cotizacion-form-select-solicitud"
            disabled={solicitudSelectionLocked}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                solicitudId: event.target.value,
                items: [],
              }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-600"
            required
          >
            <option value="">Selecciona solicitud</option>
            {solicitudes.map((solicitud) => (
              <option key={solicitud.id} value={solicitud.id}>
                {solicitud.codigo} · {solicitud.proveedor?.razonSocial}
              </option>
            ))}
          </select>
          {solicitudSelectionLocked ? (
            <span className="text-xs text-gray-500">
              La cotizacion queda vinculada a esta solicitud y a su proveedor.
            </span>
          ) : null}
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Fecha</span>
          <input
            type="date"
            value={formData.fechaEmision}
            name="cotizacion-form-input-fecha"
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, fechaEmision: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
            required
          />
        </label>
      </div>

      {selectedSolicitud && (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Contexto oficial de la Solicitud de Cotizacion
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Estos datos vienen de la solicitud emitida y son solo lectura. La
              cotizacion registra la oferta del proveedor sin modificar estas
              condiciones oficiales.
            </p>
          </div>
          {officialContextGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {group.title}
              </h4>
              <ContextFieldGrid items={group.items} />
            </div>
          ))}
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Estado</span>
          <select
            value={formData.estado}
            name="cotizacion-form-select-estado"
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, estado: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            {cotizacionStates.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Garantia ofertada</span>
          <input
            type="text"
            value={formData.garantia}
            name="cotizacion-form-input-garantia"
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, garantia: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Ej. Carta fianza"
          />
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Tiempo de entrega ofertado (dias)</span>
          <input
            type="number"
            min="0"
            value={formData.tiempoEntregaDias}
            name="cotizacion-form-input-entrega"
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                tiempoEntregaDias: event.target.value,
              }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Vigencia ofrecida (dias)</span>
          <input
            type="number"
            min="0"
            value={formData.vigenciaOfertaDias}
            name="cotizacion-form-input-vigencia"
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                vigenciaOfertaDias: event.target.value,
              }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-medium">Lugar de entrega propuesto</span>
          <input
            type="text"
            value={formData.lugarEntrega}
            name="cotizacion-form-input-lugar"
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, lugarEntrega: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>
      </div>

      {isLocal ? (
        <section className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-900">
              Forma de pago local propuesta por el proveedor
            </h3>
            <p className="text-xs text-blue-800">
              Registra la propuesta del proveedor; no reemplaza las condiciones
              oficiales de pago de la solicitud.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-gray-700">
              <span className="font-medium">Forma de pago local propuesta</span>
              <select
                value={formData.formaPagoLocalPropuesta}
                name="cotizacion-form-select-forma-pago-local"
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    ...resetLocalPaymentProposalFields(event.target.value),
                  }))
                }
                className="w-full rounded border border-gray-300 px-3 py-2"
                required
              >
                {formasPagoLocalPropuesta.map((option) => (
                  <option key={option.value || "empty"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {formData.formaPagoLocalPropuesta === "CREDITO" ? (
              <label className="space-y-1 text-sm text-gray-700">
                <span className="font-medium">Dias de credito local propuestos</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.diasCreditoLocalPropuesto}
                  name="cotizacion-form-input-dias-credito-local-propuesto"
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      diasCreditoLocalPropuesto: event.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  required
                />
              </label>
            ) : null}
            {formData.formaPagoLocalPropuesta === "MIXTO" ? (
              <>
                <label className="space-y-1 text-sm text-gray-700">
                  <span className="font-medium">% anticipo local propuesto</span>
                  <input
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={formData.porcentajeAnticipoLocalPropuesto}
                    name="cotizacion-form-input-porcentaje-anticipo-local-propuesto"
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        porcentajeAnticipoLocalPropuesto: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    required
                  />
                </label>
                <label className="space-y-1 text-sm text-gray-700">
                  <span className="font-medium">% saldo local propuesto</span>
                  <input
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={formData.porcentajeSaldoLocalPropuesto}
                    name="cotizacion-form-input-porcentaje-saldo-local-propuesto"
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        porcentajeSaldoLocalPropuesto: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    required
                  />
                </label>
              </>
            ) : null}
          </div>
          <label className="block space-y-1 text-sm text-gray-700">
            <span className="font-medium">Observacion sobre pago local propuesto</span>
            <textarea
              value={formData.observacionPagoLocalPropuesta}
              name="cotizacion-form-textarea-observacion-pago-local-propuesto"
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  observacionPagoLocalPropuesta: event.target.value,
                }))
              }
              rows={2}
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Opcional. Precisiones del proveedor sobre su propuesta de pago local."
            />
          </label>
        </section>
      ) : null}

      {isImportacion ? (
        <section className="space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-900">
              Propuesta de pago de importacion del proveedor
            </h3>
            <p className="text-xs text-indigo-800">
              Registra la estructura e instrumento propuestos por el proveedor.
              Incoterm y punto logistico se mantienen como contexto oficial.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-1 text-sm text-gray-700">
              <span className="font-medium">Estructura propuesta</span>
              <select
                value={formData.estructuraPagoImportacionPropuesta}
                name="cotizacion-form-select-estructura-pago-importacion-propuesta"
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    ...resetImportPaymentProposalStructureFields(event.target.value),
                  }))
                }
                className="w-full rounded border border-gray-300 px-3 py-2"
                required
              >
                <option value="">Seleccionar</option>
                {IMPORT_PAYMENT_STRUCTURE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm text-gray-700">
              <span className="font-medium">Instrumento propuesto</span>
              <select
                value={formData.instrumentoPagoImportacionPropuesta}
                name="cotizacion-form-select-instrumento-pago-importacion-propuesto"
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    ...resetImportPaymentProposalInstrumentFields(event.target.value),
                  }))
                }
                className="w-full rounded border border-gray-300 px-3 py-2"
                required
              >
                <option value="">Seleccionar</option>
                {IMPORT_PAYMENT_INSTRUMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {formData.estructuraPagoImportacionPropuesta === "MIXTO" ? (
              <>
                <label className="space-y-1 text-sm text-gray-700">
                  <span className="font-medium">% anticipo importacion propuesto</span>
                  <input
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={formData.porcentajeAnticipoImportacionPropuesto}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        porcentajeAnticipoImportacionPropuesto: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    required
                  />
                </label>
                <label className="space-y-1 text-sm text-gray-700">
                  <span className="font-medium">% saldo importacion propuesto</span>
                  <input
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={formData.porcentajeSaldoImportacionPropuesto}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        porcentajeSaldoImportacionPropuesto: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    required
                  />
                </label>
              </>
            ) : null}
            {formData.estructuraPagoImportacionPropuesta === "CREDITO_PLAZO" ? (
              <>
                <label className="space-y-1 text-sm text-gray-700">
                  <span className="font-medium">Dias credito importacion propuestos</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.diasCreditoImportacionPropuesto}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        diasCreditoImportacionPropuesto: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    required
                  />
                </label>
                <label className="space-y-1 text-sm text-gray-700">
                  <span className="font-medium">Referencia plazo propuesta</span>
                  <select
                    value={formData.referenciaPlazoImportacionPropuesta}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        referenciaPlazoImportacionPropuesta: event.target.value,
                      }))
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {IMPORT_PAYMENT_TERM_REFERENCE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
            {formData.estructuraPagoImportacionPropuesta === "CONTRA_DOCUMENTOS" ? (
              <label className="space-y-1 text-sm text-gray-700">
                <span className="font-medium">Gatillo documentario propuesto</span>
                <select
                  value={formData.gatilloPagoImportacionPropuesta}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      gatilloPagoImportacionPropuesta: event.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  required
                >
                  <option value="">Seleccionar</option>
                  {IMPORT_PAYMENT_TRIGGER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {formData.instrumentoPagoImportacionPropuesta === "CARTA_CREDITO" ? (
              <label className="space-y-1 text-sm text-gray-700">
                <span className="font-medium">Gastos bancarios propuestos por</span>
                <select
                  value={formData.gastosBancariosPorPropuesto}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      gastosBancariosPorPropuesto: event.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  required
                >
                  <option value="">Seleccionar</option>
                  {BANK_CHARGE_PARTY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <label className="block space-y-1 text-sm text-gray-700">
            <span className="font-medium">Documentos de pago propuestos</span>
            <textarea
              value={formData.documentosPagoImportacionPropuestos}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  documentosPagoImportacionPropuestos: event.target.value,
                }))
              }
              rows={2}
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Opcional. Factura comercial, packing list, BL, certificado u otros."
            />
          </label>
          <label className="block space-y-1 text-sm text-gray-700">
            <span className="font-medium">Observacion de pago de importacion propuesta</span>
            <textarea
              value={formData.observacionPagoImportacionPropuesta}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  observacionPagoImportacionPropuesta: event.target.value,
                }))
              }
              rows={2}
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Opcional. Precisiones comerciales de la propuesta de importacion."
            />
          </label>
        </section>
      ) : null}

      {formErrors.length ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <ul className="list-disc space-y-1 pl-5">
            {formErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <label className="block space-y-1 text-sm text-gray-700">
        <span className="font-medium">Observaciones del proveedor</span>
        <textarea
          value={formData.observaciones}
          name="cotizacion-form-textarea-observaciones"
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, observaciones: event.target.value }))
          }
          rows={3}
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="Notas comerciales o condiciones particulares."
        />
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Respuesta por item
            </h3>
            <p className="text-sm text-gray-600">
              Cada item invitado debe quedar resuelto como oferta cotizada o no
              cotizada.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Total oferta
            </p>
            <p className="text-lg font-semibold text-emerald-900">
              {formatCurrency(totalOferta, selectedSolicitud)}
            </p>
          </div>
        </div>

        {selectedSolicitud ? (
          <div className="space-y-3">
            {formData.items.map((item) => {
              const solicitudItem = selectedSolicitud.items?.find(
                (entry) =>
                  Number(entry.itemRequerimientoId || entry.itemRequerimiento?.id) ===
                  Number(item.itemRequerimientoId)
              );
              const itemSolicitado = solicitudItem?.itemRequerimiento || {};
              const descripcionSolicitada =
                itemSolicitado.producto?.descripcion ||
                itemSolicitado.productoTemporal?.descripcion ||
                "";

              return (
                <div
                  key={item.itemRequerimientoId}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {itemSolicitado.descripcionVisible ||
                          `Item ${item.itemRequerimientoId}`}
                      </p>
                      {descripcionSolicitada &&
                      descripcionSolicitada !== itemSolicitado.descripcionVisible ? (
                        <p className="mt-1 whitespace-pre-line text-xs text-gray-500">
                          {descripcionSolicitada}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-gray-500">
                        Cantidad requerida:{" "}
                        {Number(
                          itemSolicitado.cantidadRequerida || 0
                        )}{" "}
                        {itemSolicitado.unidadMedida || ""}
                      </p>
                    </div>

                    <label className="space-y-1 text-sm text-gray-700">
                      <span className="font-medium">Respuesta</span>
                      <select
                        value={item.estadoRespuesta}
                        name={`cotizacion-form-select-respuesta-${item.itemRequerimientoId}`}
                        onChange={(event) =>
                          updateItemField(
                            item.itemRequerimientoId,
                            "estadoRespuesta",
                            event.target.value
                          )
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2"
                      >
                        {itemResponseOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 text-sm text-gray-700">
                      <span className="font-medium">Cantidad ofrecida</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.cantidadOfrecida}
                        disabled={item.estadoRespuesta === "NO_COTIZA"}
                        name={`cotizacion-form-input-cantidad-${item.itemRequerimientoId}`}
                        onChange={(event) =>
                          updateItemField(
                            item.itemRequerimientoId,
                            "cantidadOfrecida",
                            event.target.value
                          )
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100"
                        required={item.estadoRespuesta === "COTIZADO"}
                      />
                    </label>

                    <label className="space-y-1 text-sm text-gray-700">
                      <span className="font-medium">
                        Precio unitario ({currencyPrefix})
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.precioUnidad}
                        disabled={item.estadoRespuesta === "NO_COTIZA"}
                        name={`cotizacion-form-input-precio-${item.itemRequerimientoId}`}
                        onChange={(event) =>
                          updateItemField(
                            item.itemRequerimientoId,
                            "precioUnidad",
                            event.target.value
                          )
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100"
                        required={item.estadoRespuesta === "COTIZADO"}
                      />
                    </label>
                  </div>

                  <label className="mt-3 block space-y-1 text-sm text-gray-700">
                    <span className="font-medium">
                      Descripcion tecnica ofertada
                    </span>
                    <textarea
                      rows="3"
                      maxLength={1000}
                      value={item.descripcionTecnicaOfertada}
                      name={`cotizacion-form-textarea-descripcion-ofertada-${item.itemRequerimientoId}`}
                      onChange={(event) =>
                        updateItemField(
                          item.itemRequerimientoId,
                          "descripcionTecnicaOfertada",
                          event.target.value
                        )
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      placeholder="Opcional. Registra marca, modelo, caracteristicas o mejoras si la oferta precisa algo distinto a lo solicitado."
                    />
                    <span className="block text-right text-xs text-gray-500">
                      {String(item.descripcionTecnicaOfertada || "").length}/1000
                    </span>
                  </label>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 font-medium ${
                        item.estadoRespuesta === "NO_COTIZA"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {item.estadoRespuesta === "NO_COTIZA"
                        ? "Proveedor no cotiza este item"
                        : "Item cotizado"}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {item.estadoRespuesta === "NO_COTIZA"
                        ? "Sin oferta"
                        : `Subtotal: ${formatCurrency(
                            item.precioTotal,
                            selectedSolicitud,
                          )}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            Selecciona una solicitud para registrar la respuesta del proveedor.
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting
            ? "Guardando..."
            : formData.id
              ? "Actualizar cotizacion"
              : "Registrar cotizacion"}
        </button>
      </div>
    </form>
  );
};

export default CotizacionForm;
