export const TIPOS_CONTROL_INVENTARIO = Object.freeze({
  CANTIDAD: "CANTIDAD",
  INDIVIDUAL: "INDIVIDUAL",
});

const TIPOS_CONTROL_VALIDOS = new Set(Object.values(TIPOS_CONTROL_INVENTARIO));

export const normalizarTipoControlInventario = (value) => {
  const normalized = String(value || TIPOS_CONTROL_INVENTARIO.CANTIDAD)
    .trim()
    .toUpperCase();

  return TIPOS_CONTROL_VALIDOS.has(normalized)
    ? normalized
    : TIPOS_CONTROL_INVENTARIO.CANTIDAD;
};

export const esProductoControlIndividual = (producto = {}) =>
  normalizarTipoControlInventario(producto?.tipoControlInventario) ===
  TIPOS_CONTROL_INVENTARIO.INDIVIDUAL;

export const normalizarControlInventarioProducto = (producto = {}) => {
  const tipoControlInventario = normalizarTipoControlInventario(
    producto.tipoControlInventario,
  );
  const esControlIndividual =
    tipoControlInventario === TIPOS_CONTROL_INVENTARIO.INDIVIDUAL;

  return {
    tipoControlInventario,
    requiereNumeroSerie: esControlIndividual ? true : false,
    requiereCodigoPatrimonial: esControlIndividual
      ? Boolean(producto.requiereCodigoPatrimonial)
      : false,
  };
};

export const validarControlInventarioProducto = (producto = {}) => {
  const tipoControlInventario = normalizarTipoControlInventario(
    producto.tipoControlInventario,
  );

  if (
    tipoControlInventario === TIPOS_CONTROL_INVENTARIO.INDIVIDUAL &&
    producto.requiereNumeroSerie !== true
  ) {
    return "Un producto de control individual debe requerir número de serie. El código patrimonial es opcional y puede asignarse posteriormente.";
  }

  return null;
};

export const getControlInventarioLabel = (value) =>
  normalizarTipoControlInventario(value) ===
  TIPOS_CONTROL_INVENTARIO.INDIVIDUAL
    ? "Individual"
    : "Por cantidad";

export const getControlInventarioRequisitosLabel = (producto = {}) => {
  const control = normalizarControlInventarioProducto(producto);

  if (control.tipoControlInventario !== TIPOS_CONTROL_INVENTARIO.INDIVIDUAL) {
    return "Sin identificación unitaria";
  }

  return control.requiereCodigoPatrimonial
    ? "Serie obligatoria; gestiona patrimonio opcional"
    : "Número de serie obligatorio";
};
