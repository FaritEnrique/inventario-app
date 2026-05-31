export const TIPO_COMPRA_LABELS = {
  LOCAL: "LOCAL",
  IMPORTACION: "IMPORTACIÓN",
};

const VALID_TIPOS_COMPRA = new Set(Object.keys(TIPO_COMPRA_LABELS));

export const normalizeTipoCompra = (value) => {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();
  return VALID_TIPOS_COMPRA.has(normalized) ? normalized : "";
};

export const getFlujosActivos = (flujosCotizacion) =>
  Array.isArray(flujosCotizacion)
    ? flujosCotizacion.filter((flujo) => flujo?.activo !== false)
    : [];

export const findFlujoByTipoCompra = (flujosCotizacion, tipoCompra) => {
  const normalizedTipoCompra = normalizeTipoCompra(tipoCompra);
  if (!normalizedTipoCompra) return null;

  return (
    getFlujosActivos(flujosCotizacion).find(
      (flujo) =>
        normalizeTipoCompra(flujo?.tipoCompra) === normalizedTipoCompra,
    ) || null
  );
};

export const findOtherActiveFlow = (flujosCotizacion, tipoCompra) => {
  const normalizedTipoCompra = normalizeTipoCompra(tipoCompra);
  if (!normalizedTipoCompra) return null;

  return (
    getFlujosActivos(flujosCotizacion).find(
      (flujo) =>
        normalizeTipoCompra(flujo?.tipoCompra) !== normalizedTipoCompra,
    ) || null
  );
};

export const isFlujoCerrado = (flujo) =>
  String(flujo?.estado || "")
    .trim()
    .toUpperCase() === "CERRADO";

const buildClosedFlowMessage = (tipoCompra) =>
  `El flujo de cotización ${TIPO_COMPRA_LABELS[tipoCompra] || tipoCompra} se encuentra cerrado. Reabralo con sustento antes de emitir nuevas solicitudes.`;

const buildIndependentFlowMessage = (existingTipoCompra, nextTipoCompra) =>
  `Este requerimiento ya tiene solicitudes de cotización de tipo ${TIPO_COMPRA_LABELS[existingTipoCompra] || existingTipoCompra}. Una solicitud de tipo ${TIPO_COMPRA_LABELS[nextTipoCompra] || nextTipoCompra} no sera comparable dentro del mismo cuadro ${String(existingTipoCompra || "").toLowerCase()}. Si continua, se generara o usara un flujo comparativo independiente de ${TIPO_COMPRA_LABELS[nextTipoCompra] || nextTipoCompra}. Los items adjudicados en un flujo no podran adjudicarse nuevamente en otro. Desea continuar?`;

export const buildFlujoTipoCompraWarning = ({
  flujosCotizacion,
  nextTipoCompra,
} = {}) => {
  const normalizedNextTipoCompra = normalizeTipoCompra(nextTipoCompra);

  if (!normalizedNextTipoCompra) {
    return {
      shouldConfirm: false,
      blocked: false,
      title: "",
      message: "",
      nextTipoCompra: "",
      flujoElegido: null,
    };
  }

  const activeFlows = getFlujosActivos(flujosCotizacion);
  const flujoElegido = findFlujoByTipoCompra(
    activeFlows,
    normalizedNextTipoCompra,
  );

  if (flujoElegido && isFlujoCerrado(flujoElegido)) {
    return {
      shouldConfirm: false,
      blocked: true,
      title: "Flujo de cotizacion cerrado",
      message: buildClosedFlowMessage(normalizedNextTipoCompra),
      nextTipoCompra: normalizedNextTipoCompra,
      flujoElegido,
    };
  }

  if (!activeFlows.length || flujoElegido) {
    return {
      shouldConfirm: false,
      blocked: false,
      title: "",
      message: "",
      nextTipoCompra: normalizedNextTipoCompra,
      flujoElegido,
    };
  }

  const otherFlow = findOtherActiveFlow(activeFlows, normalizedNextTipoCompra);
  const existingTipoCompra = normalizeTipoCompra(otherFlow?.tipoCompra);

  if (!existingTipoCompra) {
    return {
      shouldConfirm: false,
      blocked: false,
      title: "",
      message: "",
      nextTipoCompra: normalizedNextTipoCompra,
      flujoElegido,
    };
  }

  return {
    shouldConfirm: true,
    blocked: false,
    title: "Crear flujo comparativo independiente",
    message: buildIndependentFlowMessage(
      existingTipoCompra,
      normalizedNextTipoCompra,
    ),
    existingTipoCompra,
    nextTipoCompra: normalizedNextTipoCompra,
    flujoElegido,
  };
};
