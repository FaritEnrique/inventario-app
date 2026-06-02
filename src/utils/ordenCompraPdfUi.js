const normalizeEstado = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

export const canViewOrdenCompraPdf = (ordenCompra) => {
  if (!ordenCompra || ordenCompra.activo === false) {
    return false;
  }

  const estadoAprobacion = normalizeEstado(ordenCompra.estadoAprobacion);
  const estadoRecepcion = normalizeEstado(ordenCompra.estadoRecepcion);

  return (
    estadoAprobacion === "APROBADA" &&
    !ordenCompra.fechaAnulacion &&
    estadoRecepcion !== "CANCELADA"
  );
};
