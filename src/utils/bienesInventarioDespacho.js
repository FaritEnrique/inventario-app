export const esProductoControlIndividual = (producto = {}) =>
  String(producto.tipoControlInventario || "CANTIDAD").toUpperCase() ===
  "INDIVIDUAL";

export const normalizarLineasBienesDespacho = (response = {}) => {
  const lineas = Array.isArray(response.lineas) ? response.lineas : [];

  return lineas.reduce((acc, linea) => {
    const detalleId = Number(linea.pedidoInternoDetalleId);
    if (!Number.isInteger(detalleId) || detalleId <= 0) return acc;

    acc[detalleId] = {
      ...linea,
      cantidadPendiente: Number(linea.cantidadPendiente || 0),
      stockDisponibleActual: Number(linea.stockDisponibleActual || 0),
      cantidadReservadaVigente: Number(
        linea.cantidadReservadaVigente || 0,
      ),
      capacidadAtencionActual: Number(linea.capacidadAtencionActual || 0),
      totalBienesDisponibles: Number(linea.totalBienesDisponibles || 0),
      bienesDisponibles: Array.isArray(linea.bienesDisponibles)
        ? linea.bienesDisponibles
        : [],
    };
    return acc;
  }, {});
};


export const getMaximoSeleccionBienesDespacho = ({
  linea,
  cantidadPendiente,
}) => {
  const pendiente = Math.max(0, Number(cantidadPendiente || 0));
  const capacidad = Math.max(0, Number(linea?.capacidadAtencionActual || 0));
  const bienesDisponibles = Array.isArray(linea?.bienesDisponibles)
    ? linea.bienesDisponibles.length
    : 0;

  return Math.min(pendiente, capacidad, bienesDisponibles);
};

export const buildSeleccionInicialBienesDespacho = (lineasByDetalle = {}) =>
  Object.keys(lineasByDetalle).reduce((acc, detalleId) => {
    // La reserva garantiza cantidad, pero no preasigna series. Almacén siempre
    // inicia la atención sin unidades seleccionadas y decide cuáles entrega.
    acc[detalleId] = [];
    return acc;
  }, {});

export const toggleBienDespacho = ({ seleccion = [], bienId, maximo }) => {
  const id = Number(bienId);
  const current = Array.isArray(seleccion)
    ? seleccion.map(Number).filter(Number.isInteger)
    : [];

  if (!Number.isInteger(id) || id <= 0) return current;

  if (current.includes(id)) {
    return current.filter((value) => value !== id);
  }

  if (current.length >= Number(maximo || 0)) {
    return current;
  }

  return [...current, id];
};

export const buildAtencionItem = ({ detalle, cantidad, bienInventarioIds }) => {
  const individual = esProductoControlIndividual(detalle?.producto);
  const ids = Array.isArray(bienInventarioIds)
    ? bienInventarioIds.map(Number).filter(Number.isInteger)
    : [];
  const cantidadEntregada = individual ? ids.length : Number(cantidad || 0);

  if (
    individual &&
    cantidadEntregada > Number(detalle?.cantidadPendiente || 0)
  ) {
    throw new Error(
      `La selección del producto ${detalle?.producto?.nombre || detalle?.producto?.codigo || "individual"} supera el saldo pendiente.`,
    );
  }

  return {
    pedidoInternoDetalleId: detalle.id,
    cantidadEntregada,
    ...(individual ? { bienInventarioIds: ids } : {}),
  };
};

export const getBienInventarioLabel = (bien = {}) => {
  const parts = [];
  if (bien.numeroSerie) parts.push(`Serie: ${bien.numeroSerie}`);
  if (bien.codigoPatrimonial) {
    parts.push(`Patrimonial: ${bien.codigoPatrimonial}`);
  }
  return parts.length ? parts.join(" · ") : `Unidad #${bien.id || "-"}`;
};
