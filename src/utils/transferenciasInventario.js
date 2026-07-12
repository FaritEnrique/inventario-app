export const ESTADO_TRANSFERENCIA_LABELS = Object.freeze({
  PENDIENTE_APROBACION: "Pendiente de aprobación",
  EMITIDA: "Emitida / reservada",
  DESPACHADA: "Despachada / en tránsito",
  RECIBIDA: "Recibida",
  RECHAZADA: "Rechazada",
  CANCELADA: "Cancelada",
});

export const TIPO_SUSTENTO_TRANSFERENCIA_OPTIONS = Object.freeze([
  ["", "Sin documento adicional"],
  [
    "SOLICITUD_REQUERIMIENTO_MATERIALES",
    "Solicitud de Requerimiento de Materiales",
  ],
  ["PEDIDO_INTERNO_TRANSFERENCIA", "Pedido Interno de Transferencia"],
  ["OTRO", "Otro"],
]);

export const getEstadoTransferenciaLabel = (estado) =>
  ESTADO_TRANSFERENCIA_LABELS[estado] || estado || "-";

export const normalizeStockRows = (response) =>
  Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];

export const getDisponibleProductoAlmacen = (
  stockRows,
  productoId,
  almacenId,
) => {
  const row = normalizeStockRows(stockRows).find(
    (entry) => Number(entry?.producto?.id) === Number(productoId),
  );
  const almacen = (row?.almacenes || []).find(
    (entry) => Number(entry?.id) === Number(almacenId),
  );
  return Math.max(0, Number(almacen?.cantidadDisponible || 0));
};

export const validateTransferDraft = ({
  almacenOrigenId,
  almacenDestinoId,
  motivo,
  tipoSustento,
  sustentoOtro,
  items = [],
}) => {
  if (!almacenOrigenId) return "Selecciona el almacén que entregará los bienes.";
  if (!almacenDestinoId) return "Selecciona el almacén solicitante.";
  if (Number(almacenOrigenId) === Number(almacenDestinoId)) {
    return "El almacén de origen y destino deben ser diferentes.";
  }
  if (String(motivo || "").trim().length < 5) {
    return "Describe el motivo de la transferencia.";
  }
  if (tipoSustento === "OTRO" && String(sustentoOtro || "").trim().length < 3) {
    return "Especifica el tipo de sustento.";
  }
  if (!items.length) return "Agrega al menos un producto con stock disponible.";

  const seen = new Set();
  for (const item of items) {
    const productoId = Number(item?.producto?.id || item?.productoId);
    const cantidad = Number(item?.cantidadSolicitada || 0);
    const disponible = Number(item?.stockDisponible || 0);
    if (!Number.isInteger(productoId) || productoId <= 0) {
      return "Existe una línea sin producto válido.";
    }
    if (seen.has(productoId)) return "Un producto está repetido en la transferencia.";
    seen.add(productoId);
    if (!(cantidad > 0)) {
      return `Indica la cantidad de ${item?.producto?.nombre || "la línea"}.`;
    }
    if (cantidad > disponible) {
      return `La cantidad de ${item?.producto?.nombre || "la línea"} supera el disponible (${disponible}).`;
    }
  }
  return null;
};

export const buildTransferPayloadItems = (items = []) =>
  items.map((item) => ({
    productoId: Number(item.producto?.id || item.productoId),
    cantidadSolicitada: Number(item.cantidadSolicitada),
    observaciones: String(item.observaciones || "").trim() || undefined,
  }));
