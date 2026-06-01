export const CAUSALES_ANULACION_ORDEN_COMPRA = Object.freeze([
  {
    value: "ERROR_MATERIAL",
    label: "Error material",
  },
  {
    value: "FALTA_PRESUPUESTO",
    label: "Falta de presupuesto",
  },
  {
    value: "DESAPARICION_NECESIDAD",
    label: "Desaparición de la necesidad",
  },
  {
    value: "PROVEEDOR_DESISTE",
    label: "Desistimiento del proveedor",
  },
  {
    value: "DECISION_ADMINISTRATIVA",
    label: "Decisión administrativa",
  },
  {
    value: "OTRO",
    label: "Otro",
  },
]);

const CAUSALES_VALIDAS = new Set(
  CAUSALES_ANULACION_ORDEN_COMPRA.map((causal) => causal.value),
);

const ESTADOS_ANULABLES = new Set([
  "BORRADOR",
  "PENDIENTE_APROBACION",
  "RECHAZADA",
]);

export const normalizeOrdenCompraValue = (value) =>
  String(value ?? "").trim().toUpperCase();

export const getCausalAnulacionOrdenCompraLabel = (value) => {
  const normalized = normalizeOrdenCompraValue(value);
  return (
    CAUSALES_ANULACION_ORDEN_COMPRA.find(
      (causal) => causal.value === normalized,
    )?.label || "-"
  );
};

export const isCausalAnulacionOrdenCompraValida = (value) =>
  CAUSALES_VALIDAS.has(normalizeOrdenCompraValue(value));

export const validateMotivoAnulacionOrdenCompra = (value) => {
  const motivo = String(value ?? "").trim();

  if (!motivo) {
    return {
      valid: false,
      message: "El motivo de anulación es obligatorio.",
    };
  }

  if (motivo.length < 5) {
    return {
      valid: false,
      message: "El motivo debe tener al menos 5 caracteres.",
    };
  }

  return { valid: true, message: "" };
};

export const hasOrdenCompraReceptionStarted = (ordenCompra = {}) => {
  const estadoRecepcion = normalizeOrdenCompraValue(
    ordenCompra.estadoRecepcion,
  );

  if (estadoRecepcion && estadoRecepcion !== "PENDIENTE_RECEPCION") {
    return true;
  }

  const resumen = ordenCompra.resumen || {};
  if (
    Number(resumen.totalAceptado || 0) > 0 ||
    Number(resumen.totalRechazado || 0) > 0
  ) {
    return true;
  }

  return (ordenCompra.items || []).some(
    (item) =>
      Number(item?.cantidadAceptada || 0) > 0 ||
      Number(item?.cantidadRechazada || 0) > 0 ||
      (normalizeOrdenCompraValue(item?.estadoRecepcion) &&
        normalizeOrdenCompraValue(item?.estadoRecepcion) !==
          "PENDIENTE_RECEPCION"),
  );
};

export const canAnularOrdenCompra = (ordenCompra = {}) => {
  if (!ordenCompra || ordenCompra.activo === false) return false;

  const estadoAprobacion = normalizeOrdenCompraValue(
    ordenCompra.estadoAprobacion,
  );

  if (!ESTADOS_ANULABLES.has(estadoAprobacion)) return false;
  if (hasOrdenCompraReceptionStarted(ordenCompra)) return false;

  return true;
};

export const validateOrdenCompraAnulacionPayload = ({
  causalAnulacion,
  motivoAnulacion,
} = {}) => {
  if (!isCausalAnulacionOrdenCompraValida(causalAnulacion)) {
    return {
      valid: false,
      message: "Selecciona una causal de anulación válida.",
    };
  }

  const motivoValidation =
    validateMotivoAnulacionOrdenCompra(motivoAnulacion);
  if (!motivoValidation.valid) {
    return motivoValidation;
  }

  return { valid: true, message: "" };
};
