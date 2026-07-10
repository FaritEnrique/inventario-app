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

export const normalizarControlInventarioProducto = (producto = {}) => {
  const tipoControlInventario = normalizarTipoControlInventario(
    producto.tipoControlInventario,
  );
  const esControlIndividual =
    tipoControlInventario === TIPOS_CONTROL_INVENTARIO.INDIVIDUAL;

  return {
    tipoControlInventario,
    requiereNumeroSerie: esControlIndividual
      ? Boolean(producto.requiereNumeroSerie)
      : false,
    requiereCodigoPatrimonial: esControlIndividual
      ? Boolean(producto.requiereCodigoPatrimonial)
      : false,
  };
};

export const validarControlInventarioProducto = (producto = {}) => {
  const control = normalizarControlInventarioProducto(producto);

  if (
    control.tipoControlInventario === TIPOS_CONTROL_INVENTARIO.INDIVIDUAL &&
    !control.requiereNumeroSerie &&
    !control.requiereCodigoPatrimonial
  ) {
    return "Un producto de control individual debe requerir número de serie, código patrimonial o ambos.";
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

  if (control.requiereNumeroSerie && control.requiereCodigoPatrimonial) {
    return "Serie y código patrimonial";
  }

  if (control.requiereNumeroSerie) return "Número de serie";
  if (control.requiereCodigoPatrimonial) return "Código patrimonial";

  return "Sin requisito configurado";
};
