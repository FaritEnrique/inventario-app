const DEFAULT_CUERPO_SOLICITUD =
  "Por medio de la presente, solicitamos a usted presentar su mejor cotizacion por los bienes detallados a continuacion, de acuerdo con las especificaciones requeridas.";

const FORMA_PAGO_LABELS = {
  ContraEntrega: "Contra entrega",
  Adelanto: "Adelanto",
  Credito: "Credito",
};

const MONEDA_LABELS = {
  PEN: "PEN",
  USD: "USD",
  "S/": "PEN",
};

const MONEDA_SIGNS = {
  PEN: "S/",
  USD: "US$",
  "S/": "S/",
};

const MEDIO_RECEPCION_LABELS = {
  CORREO: "Correo",
  SISTEMA: "Sistema",
  CORREO_Y_SISTEMA: "Correo y sistema",
};

export const solicitudCotizacionDocumentFieldLabels = {
  moneda: "Moneda",
  incluyeIgv: "Incluye IGV",
  fechaLimiteRecepcion: "Fecha limite de recepcion",
  medioRecepcion: "Medio de recepcion",
};

const readText = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const normalizeBooleanLabel = (value) => {
  if (typeof value === "boolean") return value ? "Si" : "No";
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

const resolveSolicitudItemDescription = (item, index) =>
  item?.itemRequerimiento?.descripcionVisible ||
  item?.itemRequerimiento?.producto?.nombre ||
  item?.itemRequerimiento?.productoTemporal?.nombreTemporal ||
  item?.descripcion ||
  `Item ${index + 1}`;

const resolveSolicitudItemUnit = (item) =>
  item?.itemRequerimiento?.unidadMedida || item?.unidadMedida || null;

const resolveSolicitudItemQuantity = (item) =>
  Number(item?.itemRequerimiento?.cantidadRequerida || item?.cantidad || 0);

const resolveSolicitudItemReferenceValue = (item) =>
  item?.itemRequerimiento?.valorReferencialUnitario ??
  item?.valorReferencialUnitario ??
  item?.precioUnitarioReferencial ??
  null;

const deriveDocumentItems = (solicitud = {}) =>
  (Array.isArray(solicitud?.items) ? solicitud.items : []).map((item, index) => ({
    orden: index + 1,
    descripcion: resolveSolicitudItemDescription(item, index),
    unidad: resolveSolicitudItemUnit(item),
    cantidad: resolveSolicitudItemQuantity(item),
    valorReferencialUnitario: resolveSolicitudItemReferenceValue(item),
  }));

const inferPendingDocumentFields = (contract) =>
  Object.keys(solicitudCotizacionDocumentFieldLabels).filter((field) => {
    if (field === "moneda") return !contract.condiciones.moneda;
    if (field === "incluyeIgv") {
      return contract.condiciones.incluyeIgv == null || contract.condiciones.incluyeIgv === "";
    }
    if (field === "fechaLimiteRecepcion") return contract.recepcion.fechaLimiteRecepcion == null;
    if (field === "medioRecepcion") return !contract.recepcion.medioRecepcion;
    return false;
  });

export const buildSolicitudCotizacionDocumentContract = (solicitud = {}) => {
  const source = solicitud ?? {};
  const documento = source?.documento || {};
  const condiciones = documento?.condiciones || {};
  const recepcion = documento?.recepcion || {};

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
      readText(documento?.proveedor) || readText(source?.proveedor?.razonSocial),
    ruc: readText(documento?.ruc) || readText(source?.proveedor?.ruc),
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
      incluyeIgv: condiciones?.incluyeIgv ?? source?.incluyeIgv ?? null,
      incluyeIgvLabel:
        readText(condiciones?.incluyeIgvLabel) ||
        normalizeBooleanLabel(condiciones?.incluyeIgv ?? source?.incluyeIgv),
      vigenciaOfertaDias:
        condiciones?.vigenciaOfertaDias ?? source?.vigenciaOfertaDias ?? null,
      tiempoEntregaDias:
        condiciones?.tiempoEntregaDias ?? source?.tiempoEntregaDias ?? null,
      lugarEntrega:
        readText(condiciones?.lugarEntrega) || readText(source?.lugarEntrega),
      formaPago: condiciones?.formaPago ?? source?.formaPago ?? null,
      formaPagoLabel:
        readText(condiciones?.formaPagoLabel) ||
        FORMA_PAGO_LABELS[condiciones?.formaPago ?? source?.formaPago] ||
        readText(condiciones?.formaPago ?? source?.formaPago),
      garantia: readText(condiciones?.garantia) || readText(source?.garantia),
    },
    recepcion: {
      fechaLimiteRecepcion:
        recepcion?.fechaLimiteRecepcion ?? source?.fechaLimiteRecepcion ?? null,
      medioRecepcion:
        readText(recepcion?.medioRecepcion) || readText(source?.medioRecepcion),
      medioRecepcionLabel:
        readText(recepcion?.medioRecepcionLabel) ||
        normalizeMedioRecepcionLabel(
          recepcion?.medioRecepcion ?? source?.medioRecepcion
        ),
    },
    items:
      Array.isArray(documento?.items) && documento.items.length > 0
        ? documento.items.map((item, index) => ({
            orden: item?.orden || index + 1,
            descripcion: readText(item?.descripcion) || `Item ${index + 1}`,
            unidad: readText(item?.unidad),
            cantidad: Number(item?.cantidad || 0),
            valorReferencialUnitario: item?.valorReferencialUnitario ?? null,
          }))
        : deriveDocumentItems(source),
  };

  contract.camposPendientes =
    Array.isArray(documento?.camposPendientes) && documento.camposPendientes.length > 0
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

  (Array.isArray(solicitud?.cotizaciones) ? solicitud.cotizaciones : []).forEach(
    (cotizacion) => {
      eventos.push({
        tipo: "COTIZACION_REGISTRADA",
        titulo: "Cotizacion registrada",
        fecha: cotizacion?.fechaEmision || null,
        actor: readText(cotizacion?.proveedor?.razonSocial),
        descripcion: `${readText(cotizacion?.codigo) || "Sin codigo"} - Estado ${readText(cotizacion?.estado) || "-"}`,
      });
    },
  );

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
