export const BIEN_INVENTARIO_ESTADOS = Object.freeze({
  PENDIENTE_POSTEO: "PENDIENTE_POSTEO",
  DISPONIBLE: "DISPONIBLE",
  ENTREGADO: "ENTREGADO",
  BAJA: "BAJA",
});

const ESTADO_META = Object.freeze({
  PENDIENTE_POSTEO: {
    label: "Pendiente de posteo",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  DISPONIBLE: {
    label: "Disponible",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  RESERVADO: {
    label: "Reservado",
    className: "border-indigo-200 bg-indigo-50 text-indigo-800",
  },
  ENTREGADO: {
    label: "Entregado",
    className: "border-slate-300 bg-slate-100 text-slate-800",
  },
  BAJA: {
    label: "Baja",
    className: "border-red-200 bg-red-50 text-red-800",
  },
});

export const getBienInventarioEstadoMeta = (estado) =>
  ESTADO_META[String(estado || "").toUpperCase()] || {
    label: estado || "Sin estado",
    className: "border-gray-200 bg-gray-50 text-gray-700",
  };

export const getBienInventarioIdentificador = (bien = {}) => {
  if (bien.codigoPatrimonial && bien.numeroSerie) {
    return `${bien.codigoPatrimonial} / ${bien.numeroSerie}`;
  }

  return bien.codigoPatrimonial || bien.numeroSerie || `Unidad #${bien.id || "-"}`;
};

export const normalizeBienInventarioListResponse = (response) => ({
  data: Array.isArray(response?.data) ? response.data : [],
  totalItems: Number(response?.totalItems || 0),
  totalPages: Math.max(1, Number(response?.totalPages || 1)),
  currentPage: Math.max(1, Number(response?.currentPage || 1)),
  pageSize: Math.max(1, Number(response?.pageSize || 20)),
});

export const getBienInventarioDocumentPath = (documento) => {
  if (!documento?.id) return null;

  if (documento.tipo === "NOTA_INGRESO") {
    return `/modulo-almacen/notas-ingreso/${documento.id}`;
  }

  if (documento.tipo === "NOTA_SALIDA") {
    return `/modulo-almacen/notas-salida/${documento.id}`;
  }

  return null;
};
