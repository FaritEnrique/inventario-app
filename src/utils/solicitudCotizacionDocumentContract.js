import {
  BANK_CHARGE_PARTY_LABELS,
  buildSolicitudPaymentSummaryLabel,
  formatDaysLabel,
  formatPercentageLabel,
  INCOTERM_METADATA,
  IMPORT_PAYMENT_INSTRUMENT_LABELS,
  IMPORT_PAYMENT_STRUCTURE_LABELS,
  IMPORT_PAYMENT_TERM_REFERENCE_LABELS,
  IMPORT_PAYMENT_TRIGGER_LABELS,
  LOCAL_DELIVERY_PLACE_TYPE_LABELS,
  LOCAL_LOGISTICS_RESPONSIBLE_PARTY_LABELS,
  LOCAL_PAYMENT_CONDITION_LABELS,
  LOCAL_PAYMENT_MILESTONE_LABELS,
  LOCAL_PURCHASE_SCOPE_LABELS,
  LOCAL_TAX_NOTICE,
  PURCHASE_TYPE_LABELS,
  SOLICITUD_COTIZACION_CURRENCY_LABELS,
  SOLICITUD_COTIZACION_RECEPTION_CHANNEL_LABELS,
} from "../features/solicitud-cotizacion/solicitudCotizacionCatalog.js";

const DEFAULT_CUERPO_SOLICITUD =
  "Por medio de la presente, solicitamos a usted presentar su mejor cotizaci\u00f3n por los bienes detallados a continuaci\u00f3n, de acuerdo con las especificaciones requeridas.";

const MONEDA_LABELS = {
  ...SOLICITUD_COTIZACION_CURRENCY_LABELS,
};

const MONEDA_SIGNS = {
  PEN: "S/",
  USD: "US$",
};

const MEDIO_RECEPCION_LABELS = {
  ...SOLICITUD_COTIZACION_RECEPTION_CHANNEL_LABELS,
};

export const solicitudCotizacionDocumentFieldLabels = {
  moneda: "Moneda",
  fechaLimiteRecepcion: "Fecha límite de recepción",
  medioRecepcion: "Medio de recepción",
};

const readText = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const readNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeBooleanLabel = (value) => {
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return readText(value);
};

const normalizeMonedaLabel = (value) => {
  const normalized = readText(value);
  return normalized ? MONEDA_LABELS[normalized] || normalized : null;
};

const normalizeMonedaSign = (value) => {
  const normalized = readText(value);
  return normalized ? MONEDA_SIGNS[normalized] || normalized : null;
};

const normalizeMedioRecepcionLabel = (value) => {
  const normalized = readText(value);
  return normalized ? MEDIO_RECEPCION_LABELS[normalized] || normalized : null;
};

const normalizeComparableText = (value) =>
  readText(value)?.toLocaleLowerCase("es-PE").replace(/\s+/g, " ").trim() ||
  null;

const resolveSolicitudItemDescription = (item, index) => {
  const itemRequerimiento = item?.itemRequerimiento;
  const nombre =
    readText(itemRequerimiento?.producto?.nombre) ||
    readText(itemRequerimiento?.productoTemporal?.nombreTemporal) ||
    readText(itemRequerimiento?.productoTemporal?.nombre) ||
    readText(item?.producto?.nombre) ||
    readText(item?.productoTemporal?.nombreTemporal) ||
    readText(item?.productoTemporal?.nombre) ||
    readText(itemRequerimiento?.descripcionVisible) ||
    readText(item?.descripcion) ||
    `Ítem ${index + 1}`;
  const descripcionAdicional =
    readText(itemRequerimiento?.productoTemporal?.descripcion) ||
    readText(itemRequerimiento?.producto?.descripcion) ||
    readText(item?.productoTemporal?.descripcion) ||
    readText(item?.producto?.descripcion) ||
    readText(itemRequerimiento?.descripcionVisible) ||
    readText(item?.descripcion);

  return descripcionAdicional &&
    normalizeComparableText(descripcionAdicional) !==
      normalizeComparableText(nombre)
    ? `${nombre}\n${descripcionAdicional}`
    : nombre;
};

const resolveSolicitudItemUnit = (item) =>
  item?.itemRequerimiento?.unidadMedida || item?.unidadMedida || null;

const resolveSolicitudItemQuantity = (item) =>
  Number(item?.itemRequerimiento?.cantidadRequerida || item?.cantidad || 0);

const deriveDocumentItems = (solicitud = {}) =>
  (Array.isArray(solicitud?.items) ? solicitud.items : []).map(
    (item, index) => ({
      orden: index + 1,
      descripcion: resolveSolicitudItemDescription(item, index),
      unidad: resolveSolicitudItemUnit(item),
      cantidad: resolveSolicitudItemQuantity(item),
    }),
  );

const inferPendingDocumentFields = (contract) =>
  Object.keys(solicitudCotizacionDocumentFieldLabels).filter((field) => {
    if (field === "moneda") return !contract.condiciones.moneda;
    if (field === "fechaLimiteRecepcion")
      return contract.recepcion.fechaLimiteRecepcion == null;
    if (field === "medioRecepcion") return !contract.recepcion.medioRecepcion;
    return false;
  });

export const buildSolicitudCotizacionDocumentContract = (solicitud = {}) => {
  const source = solicitud ?? {};
  const documento = source?.documento || {};
  const condiciones = documento?.condiciones || {};
  const recepcion = documento?.recepcion || {};
  const resolvedTipoCompra =
    readText(condiciones?.tipoCompra) || readText(source?.tipoCompra);

  const contract = {
    version: documento?.version || 1,
    codigo: readText(documento?.codigo) || readText(source?.codigo),
    fechaEmision: documento?.fechaEmision || source?.fechaEmision || null,
    requerimientoAsociado:
      readText(documento?.requerimientoAsociado) ||
      readText(source?.requerimiento?.codigo) ||
      readText(source?.requerimientoCodigo),
    areaSolicitante:
      readText(documento?.areaSolicitante) ||
      readText(source?.requerimiento?.areaNombreSnapshot) ||
      readText(source?.requerimiento?.area?.nombre) ||
      readText(source?.areaSolicitante),
    proveedor:
      readText(documento?.proveedor) ||
      readText(source?.proveedor?.razonSocial),
    ruc: readText(documento?.ruc) || readText(source?.proveedor?.ruc),
    domicilioLegal:
      readText(documento?.domicilioLegal) ||
      readText(source?.proveedor?.direccion),
    elaborador:
      readText(documento?.elaborador) ||
      readText(source?.elaborador?.nombre) ||
      readText(source?.elaborador),
    cargo:
      readText(documento?.cargo) ||
      readText(source?.elaborador?.cargo) ||
      readText(source?.cargoEmisor),
    cuerpoSolicitud:
      readText(documento?.cuerpoSolicitud) ||
      readText(source?.cuerpoSolicitud) ||
      DEFAULT_CUERPO_SOLICITUD,
    estado: readText(documento?.estado) || readText(source?.estado),
    condiciones: {
      moneda: condiciones?.moneda ?? source?.moneda ?? null,
      monedaLabel:
        readText(condiciones?.monedaLabel) ||
        normalizeMonedaLabel(condiciones?.moneda ?? source?.moneda),
      monedaSign:
        readText(condiciones?.monedaSign) ||
        normalizeMonedaSign(condiciones?.moneda ?? source?.moneda),
      codigoMonedaOtra:
        readText(condiciones?.codigoMonedaOtra) ||
        readText(source?.codigoMonedaOtra),
      tratamientoTributarioLocal:
        resolvedTipoCompra === "LOCAL" ? LOCAL_TAX_NOTICE : null,
      vigenciaOfertaDias:
        condiciones?.vigenciaOfertaDias ?? source?.vigenciaOfertaDias ?? null,
      tiempoEntregaDias:
        condiciones?.tiempoEntregaDias ?? source?.tiempoEntregaDias ?? null,
      lugarEntrega:
        readText(condiciones?.lugarEntrega) || readText(source?.lugarEntrega),
      garantia: readText(condiciones?.garantia) || readText(source?.garantia),
      tipoCompra: resolvedTipoCompra,
      tipoCompraLabel:
        readText(condiciones?.tipoCompraLabel) ||
        PURCHASE_TYPE_LABELS[resolvedTipoCompra] ||
        null,
      alcanceCompraLocal:
        readText(condiciones?.alcanceCompraLocal) ||
        readText(source?.alcanceCompraLocal),
      alcanceCompraLocalLabel:
        readText(condiciones?.alcanceCompraLocalLabel) ||
        LOCAL_PURCHASE_SCOPE_LABELS[
          condiciones?.alcanceCompraLocal ?? source?.alcanceCompraLocal
        ] ||
        null,
      lugarEntregaLocalTipo:
        readText(condiciones?.lugarEntregaLocalTipo) ||
        readText(source?.lugarEntregaLocalTipo),
      lugarEntregaLocalTipoLabel:
        readText(condiciones?.lugarEntregaLocalTipoLabel) ||
        LOCAL_DELIVERY_PLACE_TYPE_LABELS[
          condiciones?.lugarEntregaLocalTipo ?? source?.lugarEntregaLocalTipo
        ] ||
        null,
      lugarEntregaLocalDetalle:
        readText(condiciones?.lugarEntregaLocalDetalle) ||
        readText(source?.lugarEntregaLocalDetalle),
      transporteAsumidoPor:
        readText(condiciones?.transporteAsumidoPor) ||
        readText(source?.transporteAsumidoPor),
      transporteAsumidoPorLabel:
        readText(condiciones?.transporteAsumidoPorLabel) ||
        LOCAL_LOGISTICS_RESPONSIBLE_PARTY_LABELS[
          condiciones?.transporteAsumidoPor ?? source?.transporteAsumidoPor
        ] ||
        null,
      cargaDescargaAsumidaPor:
        readText(condiciones?.cargaDescargaAsumidaPor) ||
        readText(source?.cargaDescargaAsumidaPor),
      cargaDescargaAsumidaPorLabel:
        readText(condiciones?.cargaDescargaAsumidaPorLabel) ||
        LOCAL_LOGISTICS_RESPONSIBLE_PARTY_LABELS[
          condiciones?.cargaDescargaAsumidaPor ??
            source?.cargaDescargaAsumidaPor
        ] ||
        null,
      permiteEntregasParciales:
        condiciones?.permiteEntregasParciales ??
        source?.permiteEntregasParciales ??
        null,
      permiteEntregasParcialesLabel:
        readText(condiciones?.permiteEntregasParcialesLabel) ||
        normalizeBooleanLabel(
          condiciones?.permiteEntregasParciales ??
            source?.permiteEntregasParciales,
        ),
      condicionesLogisticasLocales:
        readText(condiciones?.condicionesLogisticasLocales) ||
        readText(source?.condicionesLogisticasLocales),
      condicionPagoLocal:
        readText(condiciones?.condicionPagoLocal) ||
        readText(source?.condicionPagoLocal) ||
        null,
      condicionPagoLocalLabel:
        readText(condiciones?.condicionPagoLocalLabel) ||
        LOCAL_PAYMENT_CONDITION_LABELS[
          condiciones?.condicionPagoLocal ?? source?.condicionPagoLocal
        ] ||
        null,
      formaPagoLocalLabel:
        readText(condiciones?.formaPagoLocalLabel) ||
        buildSolicitudPaymentSummaryLabel({
          tipoCompra: resolvedTipoCompra,
          condicionPagoLocal:
            condiciones?.condicionPagoLocal ?? source?.condicionPagoLocal,
          hitoPagoLocal: condiciones?.hitoPagoLocal ?? source?.hitoPagoLocal,
          porcentajeAnticipoLocal:
            condiciones?.porcentajeAnticipoLocal ??
            source?.porcentajeAnticipoLocal,
          porcentajeSaldoLocal:
            condiciones?.porcentajeSaldoLocal ?? source?.porcentajeSaldoLocal,
          diasCreditoLocal:
            condiciones?.diasCreditoLocal ?? source?.diasCreditoLocal,
        }),
      hitoPagoLocal:
        readText(condiciones?.hitoPagoLocal) ||
        readText(source?.hitoPagoLocal) ||
        null,
      hitoPagoLocalLabel:
        readText(condiciones?.hitoPagoLocalLabel) ||
        LOCAL_PAYMENT_MILESTONE_LABELS[
          condiciones?.hitoPagoLocal ?? source?.hitoPagoLocal
        ] ||
        null,
      porcentajeAnticipoLocal:
        condiciones?.porcentajeAnticipoLocal ??
        source?.porcentajeAnticipoLocal ??
        null,
      porcentajeAnticipoLocalLabel:
        readText(condiciones?.porcentajeAnticipoLocalLabel) ||
        formatPercentageLabel(
          condiciones?.porcentajeAnticipoLocal ??
            source?.porcentajeAnticipoLocal,
        ),
      porcentajeSaldoLocal:
        condiciones?.porcentajeSaldoLocal ??
        source?.porcentajeSaldoLocal ??
        null,
      porcentajeSaldoLocalLabel:
        readText(condiciones?.porcentajeSaldoLocalLabel) ||
        formatPercentageLabel(
          condiciones?.porcentajeSaldoLocal ?? source?.porcentajeSaldoLocal,
        ),
      diasCreditoLocal:
        readNumber(condiciones?.diasCreditoLocal ?? source?.diasCreditoLocal) ??
        null,
      diasCreditoLocalLabel:
        readText(condiciones?.diasCreditoLocalLabel) ||
        formatDaysLabel(
          condiciones?.diasCreditoLocal ?? source?.diasCreditoLocal,
        ),
      estructuraPagoImportacion:
        readText(condiciones?.estructuraPagoImportacion) ||
        readText(source?.estructuraPagoImportacion) ||
        null,
      estructuraPagoImportacionLabel:
        readText(condiciones?.estructuraPagoImportacionLabel) ||
        IMPORT_PAYMENT_STRUCTURE_LABELS[
          condiciones?.estructuraPagoImportacion ??
            source?.estructuraPagoImportacion
        ] ||
        null,
      instrumentoPagoImportacion:
        readText(condiciones?.instrumentoPagoImportacion) ||
        readText(source?.instrumentoPagoImportacion) ||
        null,
      instrumentoPagoImportacionLabel:
        readText(condiciones?.instrumentoPagoImportacionLabel) ||
        IMPORT_PAYMENT_INSTRUMENT_LABELS[
          condiciones?.instrumentoPagoImportacion ??
            source?.instrumentoPagoImportacion
        ] ||
        null,
      gatilloPagoImportacion:
        readText(condiciones?.gatilloPagoImportacion) ||
        readText(source?.gatilloPagoImportacion),
      gatilloPagoImportacionLabel:
        readText(condiciones?.gatilloPagoImportacionLabel) ||
        IMPORT_PAYMENT_TRIGGER_LABELS[
          condiciones?.gatilloPagoImportacion ?? source?.gatilloPagoImportacion
        ] ||
        null,
      porcentajeAnticipoImportacion:
        condiciones?.porcentajeAnticipoImportacion ??
        source?.porcentajeAnticipoImportacion ??
        null,
      porcentajeAnticipoImportacionLabel:
        readText(condiciones?.porcentajeAnticipoImportacionLabel) ||
        formatPercentageLabel(
          condiciones?.porcentajeAnticipoImportacion ??
            source?.porcentajeAnticipoImportacion,
        ),
      porcentajeSaldoImportacion:
        condiciones?.porcentajeSaldoImportacion ??
        source?.porcentajeSaldoImportacion ??
        null,
      porcentajeSaldoImportacionLabel:
        readText(condiciones?.porcentajeSaldoImportacionLabel) ||
        formatPercentageLabel(
          condiciones?.porcentajeSaldoImportacion ??
            source?.porcentajeSaldoImportacion,
        ),
      diasCreditoImportacion: readNumber(
        condiciones?.diasCreditoImportacion ?? source?.diasCreditoImportacion,
      ),
      diasCreditoImportacionLabel:
        readText(condiciones?.diasCreditoImportacionLabel) ||
        formatDaysLabel(
          condiciones?.diasCreditoImportacion ?? source?.diasCreditoImportacion,
        ),
      referenciaPlazoImportacion:
        readText(condiciones?.referenciaPlazoImportacion) ||
        readText(source?.referenciaPlazoImportacion),
      referenciaPlazoImportacionLabel:
        readText(condiciones?.referenciaPlazoImportacionLabel) ||
        IMPORT_PAYMENT_TERM_REFERENCE_LABELS[
          condiciones?.referenciaPlazoImportacion ??
            source?.referenciaPlazoImportacion
        ] ||
        null,
      gastosBancariosPor:
        readText(condiciones?.gastosBancariosPor) ||
        readText(source?.gastosBancariosPor),
      gastosBancariosPorLabel:
        readText(condiciones?.gastosBancariosPorLabel) ||
        BANK_CHARGE_PARTY_LABELS[
          condiciones?.gastosBancariosPor ?? source?.gastosBancariosPor
        ] ||
        null,
      incoterm: readText(condiciones?.incoterm) || readText(source?.incoterm),
      incotermTransportModeLabel:
        readText(condiciones?.incotermTransportModeLabel) ||
        INCOTERM_METADATA[condiciones?.incoterm ?? source?.incoterm]
          ?.scopeLabel ||
        null,
      incotermVersion:
        readText(condiciones?.incotermVersion) ||
        readText(source?.incotermVersion),
      incotermPuntoLogistico:
        readText(condiciones?.incotermPuntoLogistico) ||
        readText(source?.incotermPuntoLogistico),
    },
    recepcion: {
      fechaLimiteRecepcion:
        recepcion?.fechaLimiteRecepcion ?? source?.fechaLimiteRecepcion ?? null,
      medioRecepcion:
        readText(recepcion?.medioRecepcion) || readText(source?.medioRecepcion),
      medioRecepcionLabel:
        readText(recepcion?.medioRecepcionLabel) ||
        normalizeMedioRecepcionLabel(
          recepcion?.medioRecepcion ?? source?.medioRecepcion,
        ),
    },
    items:
      Array.isArray(documento?.items) && documento.items.length > 0
        ? documento.items.map((item, index) => ({
            orden: item?.orden || index + 1,
            descripcion: readText(item?.descripcion) || `Ítem ${index + 1}`,
            unidad: readText(item?.unidad),
            cantidad: Number(item?.cantidad || 0),
          }))
        : deriveDocumentItems(source),
  };

  contract.camposPendientes =
    Array.isArray(documento?.camposPendientes) &&
    documento.camposPendientes.length > 0
      ? documento.camposPendientes
      : inferPendingDocumentFields(contract);

  return contract;
};

const buildFallbackTraceContract = (solicitud = {}) => {
  const eventos = [];

  if (solicitud?.fechaEmision) {
    eventos.push({
      tipo: "SOLICITUD_CREADA",
      titulo: "Solicitud creada",
      fecha: solicitud.fechaEmision,
      actor: readText(solicitud?.elaborador?.nombre),
      descripcion: `Estado actual: ${readText(solicitud?.estado) || "-"}`,
    });
  }

  (Array.isArray(solicitud?.cotizaciones)
    ? solicitud.cotizaciones
    : []
  ).forEach((cotizacion) => {
    eventos.push({
      tipo: "COTIZACION_REGISTRADA",
      titulo: "Cotización registrada",
      fecha: cotizacion?.fechaEmision || null,
      actor: readText(cotizacion?.proveedor?.razonSocial),
      descripcion: `${readText(cotizacion?.codigo) || "Sin código"} - Estado ${readText(cotizacion?.estado) || "-"}`,
    });
  });

  eventos.sort((left, right) => {
    const leftTime = left.fecha ? new Date(left.fecha).getTime() : 0;
    const rightTime = right.fecha ? new Date(right.fecha).getTime() : 0;
    return leftTime - rightTime;
  });

  return {
    version: 1,
    completa: false,
    faltantes: ["envioCorreo", "cambiosEstado", "auditoriaEdicion"],
    eventos,
  };
};

export const buildSolicitudCotizacionTraceContract = (solicitud = {}) => {
  if (solicitud?.trazabilidad?.eventos) {
    return {
      version: solicitud.trazabilidad.version || 1,
      completa: Boolean(solicitud.trazabilidad.completa),
      faltantes: Array.isArray(solicitud.trazabilidad.faltantes)
        ? solicitud.trazabilidad.faltantes
        : [],
      eventos: solicitud.trazabilidad.eventos.map((evento) => ({
        tipo: evento?.tipo || "EVENTO",
        titulo: readText(evento?.titulo) || "Evento",
        fecha: evento?.fecha || null,
        actor: readText(evento?.actor),
        descripcion: readText(evento?.descripcion),
      })),
    };
  }

  return buildFallbackTraceContract(solicitud);
};
