export const INCOTERM_VERSION_2020 = "2020";

export const LOCAL_TAX_NOTICE =
  "El valor de la cotizacion debe incluir el IGV u otros tributos, tasas, contribuciones y gravamenes, ya sean directos o indirectos, que afecten la adquisicion del bien, de conformidad con los beneficios tributarios vigentes para la Region Loreto.";

export const INCOTERM_GROUPS = [
  {
    key: "ANY_MODE",
    label: "Cualquier modo de transporte",
    options: [
      {
        value: "EXW",
        label: "EXW - En fábrica",
        descripcion:
          "El proveedor pone la mercancía a disposición en sus instalaciones. Todos los riesgos y costos del transporte, exportación e importación corren por cuenta del comprador.",
        placeholderPunto: "Ej.: Planta del proveedor, Guangzhou, China",
      },
      {
        value: "FCA",
        label: "FCA - Franco transportista",
        descripcion:
          "El proveedor entrega la mercancía al transportista designado por el comprador en el lugar convenido. El riesgo se transfiere al comprador cuando el transportista toma posesión.",
        placeholderPunto: "Ej.: Terminal de carga, aeropuerto de Pudong, China",
      },
      {
        value: "CPT",
        label: "CPT - Transporte pagado hasta",
        descripcion:
          "El proveedor paga el transporte principal hasta el destino convenido, pero el riesgo se transfiere al comprador cuando la mercancía se entrega al primer transportista.",
        placeholderPunto: "Ej.: Almacén logístico de destino, Lima, Perú",
      },
      {
        value: "CIP",
        label: "CIP - Transporte y seguro pagados hasta",
        descripcion:
          "Como CPT, pero el proveedor además contrata y paga el seguro amplio de la mercancía hasta el destino convenido.",
        placeholderPunto: "Ej.: Centro de distribución, Lima, Perú",
      },
      {
        value: "DAP",
        label: "DAP - Entregado en lugar",
        descripcion:
          "El proveedor asume costos y riesgos hasta poner la mercancía lista para descarga en el lugar convenido del país de destino.",
        placeholderPunto: "Ej.: Almacén del comprador, Lima, Perú",
      },
      {
        value: "DPU",
        label: "DPU - Entregado en lugar descargado",
        descripcion:
          "El proveedor asume costos y riesgos hasta entregar la mercancia descargada en el lugar convenido. Es la regla vigente en Incoterms 2020 para entrega descargada.",
        placeholderPunto: "Ej.: Terminal logística descargada, Callao, Perú",
      },
      {
        value: "DDP",
        label: "DDP - Entregado con derechos pagados",
        descripcion:
          "El proveedor asume prácticamente todos los costos y riesgos, incluyendo importación y tributos, hasta entregar la mercancía en el lugar convenido.",
        placeholderPunto: "Ej.: Planta del comprador, Arequipa, Perú",
      },
    ],
  },
  {
    key: "SEA_WATERWAY_ONLY",
    label: "Exclusivo marítimo / fluvial",
    options: [
      {
        value: "FAS",
        label: "FAS - Franco al costado del buque",
        descripcion:
          "Uso exclusivo marítimo o fluvial. El proveedor entrega la mercancía al costado del buque en el puerto de embarque convenido.",
        placeholderPunto: "Ej.: Muelle del puerto de Shanghái, China",
      },
      {
        value: "FOB",
        label: "FOB - Franco a bordo",
        descripcion:
          "El proveedor despacha la mercancía para exportación y la entrega a bordo del buque en el puerto convenido. Desde ese punto, el riesgo lo asume el comprador.",
        placeholderPunto: "Ej.: Puerto de Shanghái, China",
      },
      {
        value: "CFR",
        label: "CFR - Costo y flete",
        descripcion:
          "El proveedor asume el costo y el flete hasta el puerto de destino convenido, pero el riesgo se transfiere al comprador una vez que la mercancía está a bordo en origen.",
        placeholderPunto: "Ej.: Puerto del Callao, Perú",
      },
      {
        value: "CIF",
        label: "CIF - Costo, seguro y flete",
        descripcion:
          "Como CFR, pero el proveedor también contrata y paga el seguro mínimo de la mercancía hasta el puerto de destino convenido.",
        placeholderPunto: "Ej.: Puerto del Callao, Perú",
      },
    ],
  },
];

export const INCOTERM_METADATA = Object.fromEntries(
  INCOTERM_GROUPS.flatMap((group) =>
    group.options.map((option) => [
      option.value,
      {
        ...option,
        scopeLabel: group.label,
      },
    ]),
  ),
);

export const SOLICITUD_COTIZACION_CURRENCY_OPTIONS = [
  { value: "PEN", label: "PEN (S/)" },
  { value: "USD", label: "USD (US$)" },
  { value: "OTRA", label: "Otra moneda" },
];

export const SOLICITUD_COTIZACION_CURRENCY_LABELS = {
  PEN: "PEN",
  USD: "USD",
  OTRA: "Otra moneda",
};

export const SOLICITUD_COTIZACION_RECEPTION_CHANNEL_OPTIONS = [
  {
    value: "FISICO",
    label: "Fisico",
    descripcion: "Recepcion por via fisica o documental.",
  },
  {
    value: "CORREO",
    label: "Correo",
    descripcion: "Envio por correo con PDF de la solicitud.",
  },
  {
    value: "SISTEMA",
    label: "Sistema",
    descripcion: "Canal digital registrado en el sistema.",
  },
];

export const SOLICITUD_COTIZACION_RECEPTION_CHANNEL_LABELS =
  Object.fromEntries(
    SOLICITUD_COTIZACION_RECEPTION_CHANNEL_OPTIONS.map((option) => [
      option.value,
      option.label,
    ]),
  );

export const PURCHASE_TYPE_LABELS = {
  LOCAL: "Compra local",
  IMPORTACION: "Importacion",
};

export const LOCAL_PURCHASE_SCOPE_OPTIONS = [
  { value: "LOCAL", label: "Local" },
  { value: "NACIONAL", label: "Nacional" },
];

export const LOCAL_DELIVERY_PLACE_TYPE_OPTIONS = [
  { value: "ALMACEN_COMPRADOR", label: "Almacen del comprador" },
  { value: "OBRA", label: "Obra / punto operativo" },
  { value: "PLANTA_PROVEEDOR", label: "Planta del proveedor" },
  { value: "OTRO", label: "Otro" },
];

export const LOCAL_LOGISTICS_RESPONSIBLE_PARTY_OPTIONS = [
  { value: "PROVEEDOR", label: "Proveedor" },
  { value: "COMPRADOR", label: "Comprador" },
  { value: "COMPARTIDO", label: "Compartido" },
  { value: "POR_COORDINAR", label: "Por coordinar" },
];

export const LOCAL_PURCHASE_SCOPE_LABELS = Object.fromEntries(
  LOCAL_PURCHASE_SCOPE_OPTIONS.map((option) => [option.value, option.label]),
);

export const LOCAL_DELIVERY_PLACE_TYPE_LABELS = Object.fromEntries(
  LOCAL_DELIVERY_PLACE_TYPE_OPTIONS.map((option) => [
    option.value,
    option.label,
  ]),
);

export const LOCAL_LOGISTICS_RESPONSIBLE_PARTY_LABELS = Object.fromEntries(
  LOCAL_LOGISTICS_RESPONSIBLE_PARTY_OPTIONS.map((option) => [
    option.value,
    option.label,
  ]),
);

export const LOCAL_PAYMENT_CONDITION_OPTIONS = [
  { value: "CONTADO", label: "Contado" },
  { value: "MIXTO", label: "Mixto" },
  { value: "CREDITO", label: "Crédito" },
];

export const LOCAL_PAYMENT_FORM_OPTIONS = [
  { value: "CONTADO_CONTRA_ENTREGA", label: "Contado contra entrega" },
  { value: "PAGO_ANTICIPADO", label: "Pago anticipado" },
  { value: "MIXTO", label: "Mixto" },
  { value: "CREDITO", label: "Crédito" },
];

export const LOCAL_PAYMENT_FORM_LABELS = Object.fromEntries(
  LOCAL_PAYMENT_FORM_OPTIONS.map((option) => [option.value, option.label]),
);

export const LOCAL_PAYMENT_MILESTONE_OPTIONS = [
  { value: "CONTRA_ENTREGA", label: "Contra entrega" },
  { value: "ANTICIPADO_TOTAL", label: "Anticipado total" },
];

export const IMPORT_PAYMENT_STRUCTURE_OPTIONS = [
  { value: "ANTICIPADO_TOTAL", label: "Anticipado total" },
  { value: "MIXTO", label: "Mixto" },
  { value: "CREDITO_PLAZO", label: "Crédito a plazo" },
  { value: "CONTRA_DOCUMENTOS", label: "Contra documentos" },
];

export const IMPORT_PAYMENT_INSTRUMENT_OPTIONS = [
  { value: "TRANSFERENCIA_TT", label: "Transferencia TT" },
  { value: "CARTA_CREDITO", label: "Carta de crédito" },
  { value: "COBRANZA_DOCUMENTARIA", label: "Cobranza documentaria" },
  { value: "CUENTA_ABIERTA", label: "Cuenta abierta" },
];

export const IMPORT_PAYMENT_TRIGGER_OPTIONS = [
  { value: "AL_PEDIDO", label: "Al pedido" },
  { value: "ANTES_DE_EMBARQUE", label: "Antes de embarque" },
  { value: "CONTRA_COPIA_BL", label: "Contra copia de BL" },
  { value: "CONTRA_BL_ORIGINAL", label: "Contra BL original" },
  {
    value: "CONTRA_DOCUMENTOS_EMBARQUE",
    label: "Contra documentos de embarque",
  },
  { value: "A_DIAS_FACTURA", label: "A días factura" },
  { value: "A_DIAS_BL", label: "A días BL" },
  { value: "A_DIAS_ARRIBO", label: "A días arribo" },
];

export const IMPORT_PAYMENT_TERM_REFERENCE_OPTIONS = [
  { value: "FACTURA", label: "Factura" },
  { value: "BL", label: "BL" },
  { value: "ARRIBO", label: "Arribo" },
];

export const BANK_CHARGE_PARTY_OPTIONS = [
  { value: "PROVEEDOR", label: "Proveedor" },
  { value: "COMPRADOR", label: "Comprador" },
  { value: "COMPARTIDO", label: "Compartido" },
];

export const LOCAL_PAYMENT_CONDITION_LABELS = Object.fromEntries(
  LOCAL_PAYMENT_CONDITION_OPTIONS.map((option) => [option.value, option.label]),
);

export const LOCAL_PAYMENT_MILESTONE_LABELS = Object.fromEntries(
  LOCAL_PAYMENT_MILESTONE_OPTIONS.map((option) => [option.value, option.label]),
);

export const IMPORT_PAYMENT_STRUCTURE_LABELS = Object.fromEntries(
  IMPORT_PAYMENT_STRUCTURE_OPTIONS.map((option) => [
    option.value,
    option.label,
  ]),
);

export const IMPORT_PAYMENT_INSTRUMENT_LABELS = Object.fromEntries(
  IMPORT_PAYMENT_INSTRUMENT_OPTIONS.map((option) => [
    option.value,
    option.label,
  ]),
);

export const IMPORT_PAYMENT_TRIGGER_LABELS = Object.fromEntries(
  IMPORT_PAYMENT_TRIGGER_OPTIONS.map((option) => [option.value, option.label]),
);

export const IMPORT_PAYMENT_TERM_REFERENCE_LABELS = Object.fromEntries(
  IMPORT_PAYMENT_TERM_REFERENCE_OPTIONS.map((option) => [
    option.value,
    option.label,
  ]),
);

export const BANK_CHARGE_PARTY_LABELS = Object.fromEntries(
  BANK_CHARGE_PARTY_OPTIONS.map((option) => [option.value, option.label]),
);

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const formatNumberLabel = (value) => {
  if (!hasValue(value)) return null;

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  if (Number.isInteger(numeric)) return String(numeric);

  return numeric
    .toFixed(2)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
};

export const formatPercentageLabel = (value) => {
  const label = formatNumberLabel(value);
  return label ? `${label}%` : null;
};

export const formatDaysLabel = (value) => {
  const label = formatNumberLabel(value);
  return label ? `${label} días` : null;
};

export const buildSolicitudPaymentSummaryLabel = (solicitud = {}) => {
  if (solicitud?.tipoCompra === "LOCAL") {
    if (solicitud?.condicionPagoLocal === "CONTADO") {
      if (solicitud?.hitoPagoLocal === "CONTRA_ENTREGA") {
        return LOCAL_PAYMENT_FORM_LABELS.CONTADO_CONTRA_ENTREGA;
      }
      if (solicitud?.hitoPagoLocal === "ANTICIPADO_TOTAL") {
        return LOCAL_PAYMENT_FORM_LABELS.PAGO_ANTICIPADO;
      }
      return LOCAL_PAYMENT_CONDITION_LABELS.CONTADO;
    }

    if (solicitud?.condicionPagoLocal === "MIXTO") {
      const anticipo = formatPercentageLabel(
        solicitud?.porcentajeAnticipoLocal,
      );
      const saldo = formatPercentageLabel(solicitud?.porcentajeSaldoLocal);
      if (anticipo && saldo) {
        return `Mixto: ${anticipo} anticipo / ${saldo} saldo`;
      }
      return LOCAL_PAYMENT_CONDITION_LABELS.MIXTO;
    }

    if (solicitud?.condicionPagoLocal === "CREDITO") {
      const dias = formatDaysLabel(solicitud?.diasCreditoLocal);
      return dias ? `Crédito: ${dias}` : LOCAL_PAYMENT_CONDITION_LABELS.CREDITO;
    }
  }

  if (solicitud?.tipoCompra === "IMPORTACION") {
    const structureLabel =
      IMPORT_PAYMENT_STRUCTURE_LABELS[solicitud?.estructuraPagoImportacion] ||
      null;
    const instrumentLabel =
      IMPORT_PAYMENT_INSTRUMENT_LABELS[solicitud?.instrumentoPagoImportacion] ||
      null;

    if (structureLabel && instrumentLabel) {
      return `${structureLabel} / ${instrumentLabel}`;
    }

    return structureLabel || instrumentLabel || null;
  }

  return null;
};
