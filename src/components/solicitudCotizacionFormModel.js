import { INCOTERM_VERSION_2020 } from "../features/solicitud-cotizacion/solicitudCotizacionCatalog";

const IMPORT_COMPRA_EMPTY_STATE = Object.freeze({
  incoterm: "",
  incotermVersion: INCOTERM_VERSION_2020,
  incotermPuntoLogistico: "",
});

const LOCAL_LOGISTICS_EMPTY_STATE = Object.freeze({
  alcanceCompraLocal: "",
  lugarEntregaLocalTipo: "",
  lugarEntregaLocalDetalle: "",
  transporteAsumidoPor: "",
  cargaDescargaAsumidaPor: "",
  permiteEntregasParciales: "",
  condicionesLogisticasLocales: "",
});

const LOCAL_PAYMENT_EMPTY_STATE = Object.freeze({
  condicionPagoLocal: "",
  hitoPagoLocal: "",
  porcentajeAnticipoLocal: "",
  porcentajeSaldoLocal: "",
  diasCreditoLocal: "",
});

const IMPORT_PAYMENT_EMPTY_STATE = Object.freeze({
  estructuraPagoImportacion: "",
  instrumentoPagoImportacion: "",
  gatilloPagoImportacion: "",
  porcentajeAnticipoImportacion: "",
  porcentajeSaldoImportacion: "",
  diasCreditoImportacion: "",
  referenciaPlazoImportacion: "",
  gastosBancariosPor: "",
});

const parseNullableInteger = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return parseInt(value, 10);
};

const parseNullableFloat = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return parseFloat(value);
};

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const calculateSolicitudTotals = (formData = {}) => {
  const subtotal = (Array.isArray(formData.items) ? formData.items : []).reduce(
    (sum, item) => {
      const cantidad = Number(item?.cantidad || 0);
      const precioUnitario = Number(item?.precioUnitario || 0);

      if (!Number.isFinite(cantidad) || !Number.isFinite(precioUnitario)) {
        return sum;
      }

      return sum + cantidad * precioUnitario;
    },
    0,
  );

  const incluyeIgv =
    formData.incluyeIgv === true || formData.incluyeIgv === "true";
  const esExoneradoAmazonia =
    formData.esExoneradoAmazonia === true ||
    formData.esExoneradoAmazonia === "true";
  const igv = esExoneradoAmazonia || !incluyeIgv ? 0 : subtotal * 0.18;
  const total = subtotal + igv;

  return {
    subtotal: roundMoney(subtotal),
    igv: roundMoney(igv),
    total: roundMoney(total),
  };
};

export const formatSolicitudMoney = (value, formData = {}) => {
  const currency =
    formData.moneda === "OTRA"
      ? String(formData.codigoMonedaOtra || "").trim().toUpperCase()
      : formData.moneda;

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: /^[A-Z]{3}$/.test(currency) ? currency : "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

export const clearTipoCompraRelatedErrors = (prevErrors = {}) => ({
  ...prevErrors,
  tipoCompra: undefined,
  alcanceCompraLocal: undefined,
  lugarEntregaLocalTipo: undefined,
  lugarEntregaLocalDetalle: undefined,
  transporteAsumidoPor: undefined,
  cargaDescargaAsumidaPor: undefined,
  permiteEntregasParciales: undefined,
  condicionesLogisticasLocales: undefined,
  condicionPagoLocal: undefined,
  hitoPagoLocal: undefined,
  porcentajeAnticipoLocal: undefined,
  porcentajeSaldoLocal: undefined,
  diasCreditoLocal: undefined,
  estructuraPagoImportacion: undefined,
  instrumentoPagoImportacion: undefined,
  gatilloPagoImportacion: undefined,
  porcentajeAnticipoImportacion: undefined,
  porcentajeSaldoImportacion: undefined,
  diasCreditoImportacion: undefined,
  referenciaPlazoImportacion: undefined,
  gastosBancariosPor: undefined,
  incoterm: undefined,
  incotermVersion: undefined,
  incotermPuntoLogistico: undefined,
});

export const buildLocalPaymentConditionFormState = (
  prevFormData,
  nextCondition,
) => {
  const localPaymentMap = {
    CONTADO_CONTRA_ENTREGA: {
      condicionPagoLocal: "CONTADO",
      hitoPagoLocal: "CONTRA_ENTREGA",
    },
    PAGO_ANTICIPADO: {
      condicionPagoLocal: "CONTADO",
      hitoPagoLocal: "ANTICIPADO_TOTAL",
    },
    MIXTO: {
      condicionPagoLocal: "MIXTO",
      hitoPagoLocal: "",
    },
    CREDITO: {
      condicionPagoLocal: "CREDITO",
      hitoPagoLocal: "",
    },
  };
  const nextPayment = localPaymentMap[nextCondition] || {
    condicionPagoLocal: "",
    hitoPagoLocal: "",
  };

  return {
    ...prevFormData,
    ...nextPayment,
    porcentajeAnticipoLocal:
      nextPayment.condicionPagoLocal === "MIXTO"
        ? prevFormData.porcentajeAnticipoLocal
        : "",
    porcentajeSaldoLocal:
      nextPayment.condicionPagoLocal === "MIXTO"
        ? prevFormData.porcentajeSaldoLocal
        : "",
    diasCreditoLocal:
      nextPayment.condicionPagoLocal === "CREDITO"
        ? prevFormData.diasCreditoLocal
        : "",
  };
};

export const resolveLocalPaymentFormValue = (formData = {}) => {
  if (formData.condicionPagoLocal === "CONTADO") {
    if (formData.hitoPagoLocal === "CONTRA_ENTREGA") {
      return "CONTADO_CONTRA_ENTREGA";
    }
    if (formData.hitoPagoLocal === "ANTICIPADO_TOTAL") {
      return "PAGO_ANTICIPADO";
    }
    return "";
  }

  if (formData.condicionPagoLocal === "MIXTO") return "MIXTO";
  if (formData.condicionPagoLocal === "CREDITO") return "CREDITO";
  return "";
};

export const buildImportPaymentStructureFormState = (
  prevFormData,
  nextStructure,
) => ({
  ...prevFormData,
  estructuraPagoImportacion: nextStructure,
  gatilloPagoImportacion:
    nextStructure === "CONTRA_DOCUMENTOS"
      ? prevFormData.gatilloPagoImportacion
      : "",
  porcentajeAnticipoImportacion:
    nextStructure === "MIXTO" ? prevFormData.porcentajeAnticipoImportacion : "",
  porcentajeSaldoImportacion:
    nextStructure === "MIXTO" ? prevFormData.porcentajeSaldoImportacion : "",
  diasCreditoImportacion:
    nextStructure === "CREDITO_PLAZO"
      ? prevFormData.diasCreditoImportacion
      : "",
  referenciaPlazoImportacion:
    nextStructure === "CREDITO_PLAZO"
      ? prevFormData.referenciaPlazoImportacion
      : "",
});

export const buildImportPaymentInstrumentFormState = (
  prevFormData,
  nextInstrument,
) => ({
  ...prevFormData,
  instrumentoPagoImportacion: nextInstrument,
  gastosBancariosPor:
    nextInstrument === "CARTA_CREDITO" ? prevFormData.gastosBancariosPor : "",
});

export const buildTipoCompraFormState = (prevFormData, nextTipoCompra) => {
  const nextState = {
    ...prevFormData,
    tipoCompra: nextTipoCompra,
    ...LOCAL_LOGISTICS_EMPTY_STATE,
    ...LOCAL_PAYMENT_EMPTY_STATE,
    ...IMPORT_COMPRA_EMPTY_STATE,
    ...IMPORT_PAYMENT_EMPTY_STATE,
  };

  if (nextTipoCompra === "LOCAL") {
    return nextState;
  }

  if (nextTipoCompra === "IMPORTACION") {
    return nextState;
  }

  return nextState;
};

export const buildSolicitudCotizacionPayload = (
  formData,
  tiempoEntregaModo,
) => {
  const isLocal = formData.tipoCompra === "LOCAL";
  const isImport = formData.tipoCompra === "IMPORTACION";

  const basePayload = {
    proveedorId: Number(formData.proveedorId),
    requerimientoId: Number(formData.requerimientoId),
    cuerpoSolicitud: formData.cuerpoSolicitud.trim() || null,
    estado: formData.estado,
    moneda: formData.moneda,
    codigoMonedaOtra:
      formData.moneda === "OTRA"
        ? String(formData.codigoMonedaOtra || "")
            .trim()
            .toUpperCase() || null
        : null,
    vigenciaOfertaDias:
      formData.vigenciaOfertaDias !== ""
        ? parseInt(formData.vigenciaOfertaDias, 10)
        : null,
    tiempoEntregaDias:
      tiempoEntregaModo === "inmediata"
        ? 0
        : tiempoEntregaModo === "dias" && formData.tiempoEntregaDias !== ""
          ? parseInt(formData.tiempoEntregaDias, 10)
          : null,
    lugarEntrega: formData.lugarEntrega.trim() || null,
    garantia: formData.garantia.trim() || null,
    fechaLimiteRecepcion: formData.fechaLimiteRecepcion
      ? new Date(formData.fechaLimiteRecepcion).toISOString()
      : null,
    medioRecepcion: formData.medioRecepcion || null,
    tipoCompra: formData.tipoCompra,
    items: formData.itemIds.map((itemId) => ({
      itemRequerimientoId: Number(itemId),
    })),
  };

  if (isLocal) {
    return {
      ...basePayload,
      incluyeIgv: true,
      alcanceCompraLocal: formData.alcanceCompraLocal || null,
      lugarEntregaLocalTipo: formData.lugarEntregaLocalTipo || null,
      lugarEntregaLocalDetalle:
        String(formData.lugarEntregaLocalDetalle || "").trim() || null,
      transporteAsumidoPor: formData.transporteAsumidoPor || null,
      cargaDescargaAsumidaPor: formData.cargaDescargaAsumidaPor || null,
      permiteEntregasParciales:
        formData.permiteEntregasParciales === ""
          ? null
          : formData.permiteEntregasParciales === "true",
      condicionesLogisticasLocales:
        String(formData.condicionesLogisticasLocales || "").trim() || null,
      condicionPagoLocal: formData.condicionPagoLocal || null,
      hitoPagoLocal:
        formData.condicionPagoLocal === "CONTADO"
          ? formData.hitoPagoLocal || null
          : null,
      porcentajeAnticipoLocal:
        formData.condicionPagoLocal === "MIXTO"
          ? parseNullableFloat(formData.porcentajeAnticipoLocal)
          : null,
      porcentajeSaldoLocal:
        formData.condicionPagoLocal === "MIXTO"
          ? parseNullableFloat(formData.porcentajeSaldoLocal)
          : null,
      diasCreditoLocal:
        formData.condicionPagoLocal === "CREDITO"
          ? parseNullableInteger(formData.diasCreditoLocal)
          : null,
    };
  }

  if (isImport) {
    return {
      ...basePayload,
      estructuraPagoImportacion: formData.estructuraPagoImportacion || null,
      instrumentoPagoImportacion: formData.instrumentoPagoImportacion || null,
      gatilloPagoImportacion:
        formData.estructuraPagoImportacion === "CONTRA_DOCUMENTOS"
          ? formData.gatilloPagoImportacion || null
          : null,
      porcentajeAnticipoImportacion:
        formData.estructuraPagoImportacion === "MIXTO"
          ? parseNullableFloat(formData.porcentajeAnticipoImportacion)
          : null,
      porcentajeSaldoImportacion:
        formData.estructuraPagoImportacion === "MIXTO"
          ? parseNullableFloat(formData.porcentajeSaldoImportacion)
          : null,
      diasCreditoImportacion:
        formData.estructuraPagoImportacion === "CREDITO_PLAZO"
          ? parseNullableInteger(formData.diasCreditoImportacion)
          : null,
      referenciaPlazoImportacion:
        formData.estructuraPagoImportacion === "CREDITO_PLAZO"
          ? formData.referenciaPlazoImportacion || null
          : null,
      gastosBancariosPor:
        formData.instrumentoPagoImportacion === "CARTA_CREDITO"
          ? formData.gastosBancariosPor || null
          : null,
      incoterm: formData.incoterm || null,
      incotermVersion: INCOTERM_VERSION_2020,
      incotermPuntoLogistico: formData.incotermPuntoLogistico.trim() || null,
    };
  }

  return basePayload;
};
