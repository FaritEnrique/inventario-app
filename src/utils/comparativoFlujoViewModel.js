const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizeEstado = (value) => normalizeText(value).toUpperCase();

const isItemCotizado = (item) =>
  normalizeEstado(item?.estadoRespuesta || item?.estado) === "COTIZADO";

const buildDescripcionSolicitada = (item) =>
  normalizeText(item?.descripcionSolicitada) ||
  normalizeText(item?.descripcionVisible) ||
  normalizeText(item?.descripcion) ||
  normalizeText(item?.productoTemporal?.descripcion) ||
  normalizeText(item?.productoTemporal?.nombre) ||
  normalizeText(item?.producto?.nombre) ||
  "-";

const buildItemsRequeridos = (items = []) =>
  (Array.isArray(items) ? items : []).map((item, index) => ({
    id: item?.id || item?.itemRequerimientoId,
    itemRequerimientoId: item?.itemRequerimientoId || item?.id,
    numero: index + 1,
    descripcionSolicitada: buildDescripcionSolicitada(item),
    observaciones: item?.observaciones || null,
    unidadMedida: item?.unidadMedida || item?.producto?.unidadMedida || "-",
    cantidadRequerida: toNumber(item?.cantidadRequerida),
    valorReferencialUnitario: toNumber(item?.valorReferencialUnitario),
    subtotalReferencial: toNumber(item?.subtotalReferencial),
  }));

const buildMatrizPorItem = (itemsRequeridos, cotizacion) => {
  const itemsById = new Map(
    (Array.isArray(cotizacion?.items) ? cotizacion.items : []).map((item) => [
      Number(item?.itemRequerimientoId || 0),
      item,
    ]),
  );

  return itemsRequeridos.reduce((acc, item) => {
    const itemId = Number(item.itemRequerimientoId || 0);
    const cotizacionItem = itemsById.get(itemId);
    const estado = cotizacionItem
      ? normalizeEstado(cotizacionItem.estadoRespuesta) || "NO_COTIZA"
      : "SIN_RESPUESTA";

    acc[String(itemId)] = {
      itemRequerimientoId: itemId,
      cotizacionId: cotizacion?.cotizacionId || cotizacion?.id,
      estado,
      descripcionTecnicaOfertada:
        cotizacionItem?.descripcionTecnicaOfertada || "-",
      cantidadOfrecida: cotizacionItem?.cantidadOfrecida ?? null,
      precioUnitario:
        cotizacionItem?.precioUnitario ?? cotizacionItem?.precioUnidad ?? null,
      precioUnidad:
        cotizacionItem?.precioUnidad ?? cotizacionItem?.precioUnitario ?? null,
      precioTotal: cotizacionItem?.precioTotal ?? null,
      adjudicable: false,
      cotizado: isItemCotizado(cotizacionItem),
    };

    return acc;
  }, {});
};

const buildCotizacionesComparables = (cotizaciones, itemsRequeridos) =>
  (Array.isArray(cotizaciones) ? cotizaciones : []).map((cotizacion) => {
    const cotizacionId = cotizacion?.cotizacionId || cotizacion?.id;
    return {
      id: cotizacionId,
      cotizacionId,
      codigo: cotizacion?.codigo || "-",
      solicitudId: cotizacion?.solicitudId || cotizacion?.solicitud?.id || null,
      solicitudCodigo:
        cotizacion?.solicitudCodigo || cotizacion?.solicitud?.codigo || "-",
      proveedor: cotizacion?.proveedor || {},
      moneda:
        cotizacion?.moneda ||
        cotizacion?.solicitud?.moneda ||
        cotizacion?.solicitud?.codigoMonedaOtra ||
        "PEN",
      totalOferta: toNumber(cotizacion?.totalOferta),
      fechaEmision: cotizacion?.fechaEmision || null,
      condicionesOfertadas:
        cotizacion?.condicionesOfertadas || cotizacion?.condiciones || {},
      items: Array.isArray(cotizacion?.items) ? cotizacion.items : [],
      matrizPorItem: buildMatrizPorItem(itemsRequeridos, cotizacion),
    };
  });

const MOTIVO_LABELS = {
  SIN_COTIZACION_REGISTRADA: "No respondio",
  SIN_ITEMS_COTIZADOS_VALIDOS: "Respondio sin items cotizados validos",
  COTIZACION_INACTIVA_O_DESCARTADA: "Cotizacion no valida",
};

const buildProveedoresSinCotizacionValida = (proveedores = []) =>
  (Array.isArray(proveedores) ? proveedores : []).map((entry) => ({
    ...entry,
    proveedor: entry?.proveedor || {},
    motivoLabel:
      MOTIVO_LABELS[entry?.motivo] || "No incluido en la matriz comparativa",
  }));

export const buildComparativoFlujoViewModel = (comparativo = {}) => {
  const itemsRequeridos = buildItemsRequeridos(comparativo.itemsRequeridos);
  const cotizacionesComparables = buildCotizacionesComparables(
    comparativo.cotizacionesComparables,
    itemsRequeridos,
  );
  const proveedoresSinCotizacionValida =
    buildProveedoresSinCotizacionValida(
      comparativo.proveedoresSinCotizacionValida,
    );
  const resumen = {
    totalSolicitudes: toNumber(comparativo?.resumen?.totalSolicitudes),
    totalCotizaciones: toNumber(comparativo?.resumen?.totalCotizaciones),
    totalProveedoresComparables:
      toNumber(comparativo?.resumen?.totalProveedoresComparables) ||
      cotizacionesComparables.length,
    totalProveedoresSinCotizacionValida:
      toNumber(comparativo?.resumen?.totalProveedoresSinCotizacionValida) ||
      proveedoresSinCotizacionValida.length,
    totalItemsRequeridos:
      toNumber(comparativo?.resumen?.totalItemsRequeridos) ||
      itemsRequeridos.length,
  };

  return {
    flujoCotizacion: comparativo.flujoCotizacion || null,
    requerimiento: comparativo.requerimiento || null,
    estadoComparativo:
      comparativo.estadoComparativo ||
      (normalizeEstado(comparativo?.flujoCotizacion?.estado) === "CERRADO"
        ? "DERIVADO"
        : "PENDIENTE_CIERRE"),
    tipoCompra:
      comparativo.tipoCompra || comparativo?.flujoCotizacion?.tipoCompra || "",
    condicionesSolicitadas: comparativo.condicionesSolicitadas || {},
    condicionesOfertadasPorCotizacion:
      comparativo.condicionesOfertadasPorCotizacion || {},
    itemsRequeridos,
    cotizacionesComparables,
    proveedoresSinCotizacionValida,
    resumen,
  };
};

export default buildComparativoFlujoViewModel;
