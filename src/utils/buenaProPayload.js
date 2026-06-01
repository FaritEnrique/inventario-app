const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

const toNumberOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizeEstado = (value) => normalizeText(value).toUpperCase();

const hasPositiveId = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0;
};

export const isCotizadoComparable = (itemOferta) =>
  normalizeEstado(itemOferta?.estadoRespuesta || itemOferta?.estado) ===
  "COTIZADO";

export const canSelectOferta = (itemOferta) =>
  isCotizadoComparable(itemOferta) &&
  hasPositiveId(itemOferta?.itemRequerimientoId) &&
  hasPositiveId(itemOferta?.proveedorId) &&
  hasPositiveId(itemOferta?.cotizacionId) &&
  hasPositiveId(itemOferta?.itemCotizacionId);

export const buildBuenaProDetalleFromOferta = (oferta, extra = {}) => ({
  itemRequerimientoId: Number(oferta.itemRequerimientoId),
  proveedorId: Number(oferta.proveedorId),
  cotizacionId: Number(oferta.cotizacionId),
  itemCotizacionId: Number(oferta.itemCotizacionId),
  cantidadAdjudicada:
    toNumberOrNull(extra.cantidadAdjudicada) ??
    toNumberOrNull(oferta.cantidadOfrecida) ??
    0,
  precioUnidad:
    toNumberOrNull(extra.precioUnidad) ??
    toNumberOrNull(oferta.precioUnidad) ??
    toNumberOrNull(oferta.precioUnitario) ??
    0,
  precioTotal:
    toNumberOrNull(extra.precioTotal) ??
    toNumberOrNull(oferta.precioTotal) ??
    0,
  justificacion: normalizeText(extra.justificacion),
});

const getSelectedEntries = (selectedByItem = {}) =>
  Object.entries(selectedByItem || {}).filter(([, oferta]) => oferta);

const validateDetalleValues = (itemId, oferta, errors) => {
  const detalle = buildBuenaProDetalleFromOferta(oferta);

  if (!(detalle.cantidadAdjudicada > 0)) {
    errors.push(
      `La cantidad adjudicada del ítem ${itemId} debe ser mayor a cero.`,
    );
  }

  if (!(detalle.precioUnidad >= 0)) {
    errors.push(`El precio unitario del ítem ${itemId} no puede ser negativo.`);
  }

  if (!(detalle.precioTotal >= 0)) {
    errors.push(`El precio total del ítem ${itemId} no puede ser negativo.`);
  }
};

export const validateBuenaProDraft = ({
  selectedByItem = {},
  sustento = "",
  justificaciones = {},
  requireJustificacion = true,
} = {}) => {
  const errors = [];
  const normalizedSustento = normalizeText(sustento);
  const selectedEntries = getSelectedEntries(selectedByItem);

  if (!normalizedSustento) {
    errors.push("Debe registrar el sustento general de la Buena Pro.");
  }

  if (!selectedEntries.length) {
    errors.push("Debe seleccionar al menos un ítem cotizado.");
  }

  const itemIds = selectedEntries.map(([itemId, oferta]) =>
    Number(oferta?.itemRequerimientoId || itemId),
  );
  if (new Set(itemIds).size !== itemIds.length) {
    errors.push("No puede adjudicar el mismo ítem más de una vez.");
  }

  selectedEntries.forEach(([itemId, oferta]) => {
    if (!canSelectOferta(oferta)) {
      errors.push(
        `La oferta seleccionada para el ítem ${itemId} no es válida.`,
      );
    }

    validateDetalleValues(itemId, oferta, errors);

    if (
      requireJustificacion &&
      !normalizeText(justificaciones[String(itemId)])
    ) {
      errors.push(`Debe registrar la justificación del ítem ${itemId}.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const buildBuenaProPayload = ({
  selectedByItem = {},
  sustento = "",
  justificaciones = {},
  requireJustificacion = true,
} = {}) => {
  const validation = validateBuenaProDraft({
    selectedByItem,
    sustento,
    justificaciones,
    requireJustificacion,
  });

  if (!validation.valid) {
    const error = new Error(validation.errors[0]);
    error.validationErrors = validation.errors;
    throw error;
  }

  return {
    sustento: normalizeText(sustento),
    detalles: getSelectedEntries(selectedByItem).map(([itemId, oferta]) =>
      buildBuenaProDetalleFromOferta(oferta, {
        justificacion: justificaciones[String(itemId)],
      }),
    ),
  };
};

export default {
  isCotizadoComparable,
  canSelectOferta,
  buildBuenaProDetalleFromOferta,
  validateBuenaProDraft,
  buildBuenaProPayload,
};
