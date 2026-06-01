const asArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
};

export const normalizeOrdenesGeneradasResponse = (response) => {
  const payload = response?.data ?? response;
  const ordenesCompra =
    payload?.ordenesCompra ??
    payload?.ordenes ??
    payload?.ordenCompra ??
    payload?.orden ??
    [];

  return {
    buenaProId: payload?.buenaProId ?? null,
    buenaProCodigo: payload?.buenaProCodigo ?? null,
    ordenesCompra: asArray(ordenesCompra),
  };
};

export const getOrdenesCompraFromBuenaPro = (buenaPro) => {
  const ordenesCompra =
    buenaPro?.ordenesCompra ??
    buenaPro?.ordenesCompraActivas ??
    buenaPro?.ordenesGeneradas ??
    buenaPro?.ordenes ??
    [];

  return asArray(ordenesCompra);
};

export const hasOrdenesCompraGeneradas = (source) => {
  if (!source) return false;
  if (Array.isArray(source)) return source.length > 0;
  return getOrdenesCompraFromBuenaPro(source).length > 0;
};

export const buildOrdenCompraGeneradaViewModel = (orden = {}) => ({
  id: orden.id ?? orden.ordenCompraId ?? null,
  codigo: orden.codigo ?? orden.numero ?? "Orden de Compra",
  proveedor:
    orden.proveedor?.razonSocial ??
    orden.proveedor?.nombre ??
    orden.proveedorRazonSocial ??
    "-",
  proveedorRuc: orden.proveedor?.ruc ?? orden.proveedorRuc ?? "",
  montoTotal: Number(
    orden.montoTotal ?? orden.total ?? orden.montoTotalFinal ?? 0,
  ),
  moneda: orden.moneda ?? orden.monedaCodigo ?? "PEN",
  estadoAprobacion: orden.estadoAprobacion ?? "PENDIENTE_APROBACION",
});
