const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

const toNumberOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizeEstado = (value) => normalizeText(value).toUpperCase();

const isCotizacionActiva = (cotizacion) => cotizacion?.activo !== false;

const isCotizacionComparable = (cotizacion) => {
  const estado = normalizeEstado(cotizacion?.estado);
  return (
    isCotizacionActiva(cotizacion) &&
    !["RECHAZADA", "DESCARTADA"].includes(estado)
  );
};

const isItemCotizado = (item) =>
  normalizeEstado(item?.estadoRespuesta) === "COTIZADO";

const hasAtLeastOneQuotedItem = (cotizacion) =>
  (cotizacion?.items || []).some(isItemCotizado);

const buildDescripcionSolicitada = (item) =>
  normalizeText(item?.descripcionSolicitada) ||
  normalizeText(item?.descripcionVisible) ||
  normalizeText(item?.descripcion) ||
  normalizeText(item?.productoTemporal?.descripcion) ||
  normalizeText(item?.productoTemporal?.nombre) ||
  normalizeText(item?.producto?.nombre) ||
  "-";

const motivoLabels = {
  SIN_COTIZACION_REGISTRADA: "No presento cotizacion",
  SIN_ITEMS_COTIZADOS_VALIDOS: "No cotizo ningun item valido",
  COTIZACION_INACTIVA_O_DESCARTADA:
    "Cotizacion inactiva, rechazada o descartada",
};

const getCotizacionId = (cotizacion) =>
  cotizacion?.cotizacionId ?? cotizacion?.id ?? null;

const getItemId = (item) => item?.itemRequerimientoId ?? item?.id ?? null;

const getProveedorId = (entry) =>
  entry?.proveedorId ?? entry?.proveedor?.id ?? null;

const getProveedorKey = (proveedorId, cotizacionId) =>
  `${proveedorId || "proveedor"}:${cotizacionId || "cotizacion"}`;

const normalizeProveedor = (proveedor = {}) => ({
  id: proveedor?.id ?? null,
  razonSocial:
    normalizeText(proveedor?.razonSocial) ||
    normalizeText(proveedor?.nombre) ||
    "Proveedor no registrado",
  ruc: normalizeText(proveedor?.ruc) || null,
  telefono: normalizeText(proveedor?.telefono) || null,
  correoElectronico:
    normalizeText(proveedor?.correoElectronico) ||
    normalizeText(proveedor?.email) ||
    null,
});

const normalizeItemRequerido = (item, index) => {
  const id = getItemId(item);
  return {
    ...item,
    id,
    itemRequerimientoId: id,
    numero: item?.numero ?? index + 1,
    descripcionSolicitada: buildDescripcionSolicitada(item),
    observaciones: normalizeText(item?.observaciones) || null,
    unidadMedida:
      normalizeText(item?.unidadMedida) ||
      normalizeText(item?.producto?.unidadMedida) ||
      normalizeText(item?.productoTemporal?.unidadMedida) ||
      "-",
    cantidadRequerida: toNumberOrNull(item?.cantidadRequerida),
    valorReferencialUnitario: toNumberOrNull(item?.valorReferencialUnitario),
    subtotalReferencial: toNumberOrNull(item?.subtotalReferencial),
  };
};

const normalizeCotizacionItem = (item) => {
  const precioUnitario = toNumberOrNull(
    item?.precioUnitario ?? item?.precioUnidad,
  );
  return {
    ...item,
    id: item?.id ?? null,
    itemRequerimientoId: getItemId(item),
    estadoRespuesta: normalizeEstado(item?.estadoRespuesta) || "NO_COTIZA",
    descripcionTecnicaOfertada:
      normalizeText(item?.descripcionTecnicaOfertada) || "-",
    cantidadOfrecida: toNumberOrNull(item?.cantidadOfrecida),
    precioUnitario,
    precioUnidad: precioUnitario,
    precioTotal: toNumberOrNull(item?.precioTotal),
    observaciones: normalizeText(item?.observaciones) || null,
  };
};

const buildMatrizPorItem = (cotizacion, itemsRequeridos) => {
  const cotizacionId = getCotizacionId(cotizacion);
  const itemsCotizacion = (cotizacion?.items || []).map(normalizeCotizacionItem);

  return itemsRequeridos.reduce((acc, itemRequerido) => {
    const item = itemsCotizacion.find(
      (entry) =>
        Number(entry.itemRequerimientoId) ===
        Number(itemRequerido.itemRequerimientoId),
    );
    const estado = !item
      ? "NO_SOLICITADO"
      : isItemCotizado(item)
        ? "COTIZADO"
        : "NO_COTIZA";

    acc[itemRequerido.itemRequerimientoId] = {
      itemRequerimientoId: itemRequerido.itemRequerimientoId,
      cotizacionId,
      estado,
      descripcionTecnicaOfertada: item?.descripcionTecnicaOfertada || "-",
      cantidadOfrecida: item?.cantidadOfrecida ?? null,
      precioUnitario: item?.precioUnitario ?? null,
      precioUnidad: item?.precioUnidad ?? null,
      precioTotal: item?.precioTotal ?? null,
      observaciones: item?.observaciones || null,
      adjudicable: estado === "COTIZADO",
    };

    return acc;
  }, {});
};

const getTipoCompraFromSources = ({
  snapshot,
  cotizaciones,
  solicitudes,
  detalleGlobal,
}) =>
  normalizeEstado(snapshot?.tipoCompra) ||
  normalizeEstado(snapshot?.condicionesSolicitadas?.tipoCompra) ||
  normalizeEstado(cotizaciones.find((cotizacion) => cotizacion?.tipoCompra)?.tipoCompra) ||
  normalizeEstado(
    cotizaciones.find((cotizacion) => cotizacion?.solicitud?.tipoCompra)
      ?.solicitud?.tipoCompra,
  ) ||
  normalizeEstado(solicitudes.find((solicitud) => solicitud?.tipoCompra)?.tipoCompra) ||
  normalizeEstado(detalleGlobal?.tipoCompra) ||
  null;

const getMonedaFromSources = ({ snapshot, cotizaciones, solicitudes }) =>
  normalizeText(snapshot?.condicionesSolicitadas?.moneda) ||
  normalizeText(cotizaciones.find((cotizacion) => cotizacion?.moneda)?.moneda) ||
  normalizeText(
    cotizaciones.find((cotizacion) => cotizacion?.solicitud?.moneda)?.solicitud
      ?.moneda,
  ) ||
  normalizeText(solicitudes.find((solicitud) => solicitud?.moneda)?.moneda) ||
  "PEN";

const getMonedaLabel = (moneda) => {
  const value = normalizeEstado(moneda);
  if (value === "PEN" || value === "SOLES") return "S/";
  if (value === "USD" || value === "DOLARES") return "US$";
  return moneda || "";
};

const getSnapshot = (comparativo) =>
  comparativo?.cotizacionesConsideradasSnapshot || {};

const getCriterioSnapshot = (comparativo) =>
  comparativo?.criterioAdjudicacionSnapshot ||
  comparativo?.criterioAdjudicacion ||
  {};

const getItemsSource = (detalleGlobal, snapshot) => {
  if (Array.isArray(snapshot?.itemsRequeridos)) return snapshot.itemsRequeridos;
  if (Array.isArray(detalleGlobal?.requerimiento?.items)) {
    return detalleGlobal.requerimiento.items;
  }
  if (Array.isArray(detalleGlobal?.items)) return detalleGlobal.items;
  return [];
};

const getCotizacionesSource = (detalleGlobal, snapshot) => {
  if (Array.isArray(snapshot?.cotizaciones)) return snapshot.cotizaciones;
  if (Array.isArray(detalleGlobal?.cotizaciones)) return detalleGlobal.cotizaciones;
  if (Array.isArray(detalleGlobal?.cotizacionesRegistradas)) {
    return detalleGlobal.cotizacionesRegistradas;
  }
  return [];
};

const getSolicitudesSource = (detalleGlobal) => {
  if (Array.isArray(detalleGlobal?.solicitudes)) return detalleGlobal.solicitudes;
  if (Array.isArray(detalleGlobal?.solicitudesCotizacion)) {
    return detalleGlobal.solicitudesCotizacion;
  }
  return [];
};

const normalizeCotizacion = (cotizacion, itemsRequeridos) => {
  const id = getCotizacionId(cotizacion);
  const proveedor = normalizeProveedor(cotizacion?.proveedor);
  const items = (cotizacion?.items || []).map(normalizeCotizacionItem);
  const matrizPorItem = buildMatrizPorItem({ ...cotizacion, items }, itemsRequeridos);
  const totalOferta =
    toNumberOrNull(cotizacion?.totalOferta) ??
    items
      .filter(isItemCotizado)
      .reduce((total, item) => total + toNumber(item.precioTotal), 0);

  return {
    ...cotizacion,
    id,
    cotizacionId: id,
    codigo: normalizeText(cotizacion?.codigo) || `COT-${id || "-"}`,
    solicitudId: cotizacion?.solicitudId ?? cotizacion?.solicitud?.id ?? null,
    solicitudCodigo:
      normalizeText(cotizacion?.solicitudCodigo) ||
      normalizeText(cotizacion?.solicitud?.codigo) ||
      "-",
    proveedor,
    moneda:
      normalizeText(cotizacion?.moneda) ||
      normalizeText(cotizacion?.solicitud?.moneda) ||
      "PEN",
    totalOferta,
    condicionesOfertadas: cotizacion?.condicionesOfertadas || {},
    items,
    matrizPorItem,
  };
};

const buildProveedoresSinCotizacionFromSnapshot = (snapshot) =>
  (snapshot?.proveedoresSinCotizacionValida || []).map((entry) => ({
    ...entry,
    proveedor: normalizeProveedor(entry?.proveedor),
    motivo: entry?.motivo || "NO_INCLUIDO",
    motivoLabel:
      motivoLabels[entry?.motivo] || "No incluido en la matriz comparativa",
  }));

const buildProveedoresSinCotizacionFromDetalle = ({
  solicitudes,
  cotizaciones,
  cotizacionesComparables,
}) => {
  const comparablesIds = new Set(
    cotizacionesComparables.map((cotizacion) => Number(cotizacion.cotizacionId)),
  );

  return solicitudes
    .map((solicitud) => {
      const proveedor = normalizeProveedor(
        solicitud?.proveedor || solicitud?.proveedorInvitado,
      );
      const solicitudCotizaciones = cotizaciones.filter(
        (cotizacion) =>
          Number(cotizacion?.solicitudId ?? cotizacion?.solicitud?.id) ===
          Number(solicitud?.id),
      );

      if (!solicitudCotizaciones.length) {
        return {
          solicitudId: solicitud?.id ?? null,
          solicitudCodigo: normalizeText(solicitud?.codigo) || "-",
          proveedor,
          motivo: "SIN_COTIZACION_REGISTRADA",
          motivoLabel: motivoLabels.SIN_COTIZACION_REGISTRADA,
        };
      }

      const hasComparable = solicitudCotizaciones.some((cotizacion) =>
        comparablesIds.has(Number(getCotizacionId(cotizacion))),
      );

      if (hasComparable) return null;

      const motivo = solicitudCotizaciones.some(isCotizacionComparable)
        ? "SIN_ITEMS_COTIZADOS_VALIDOS"
        : "COTIZACION_INACTIVA_O_DESCARTADA";

      return {
        solicitudId: solicitud?.id ?? null,
        solicitudCodigo: normalizeText(solicitud?.codigo) || "-",
        proveedor,
        motivo,
        motivoLabel: motivoLabels[motivo],
      };
    })
    .filter(Boolean);
};

const buildAdjudicacionesIniciales = (criterio) => {
  const adjudicaciones = criterio?.adjudicacionesPorItem || [];

  if (Array.isArray(adjudicaciones)) {
    return adjudicaciones.reduce((acc, entry) => {
      if (entry?.itemRequerimientoId && entry?.cotizacionId) {
        acc[String(entry.itemRequerimientoId)] = Number(entry.cotizacionId);
      }
      return acc;
    }, {});
  }

  if (adjudicaciones && typeof adjudicaciones === "object") {
    return Object.entries(adjudicaciones).reduce((acc, [itemId, value]) => {
      const cotizacionId =
        typeof value === "object" ? value?.cotizacionId : value;
      if (cotizacionId) acc[String(itemId)] = Number(cotizacionId);
      return acc;
    }, {});
  }

  return {};
};

const buildSustentoInicialPorProveedor = (criterio) => {
  const result = {};

  (criterio?.sustentoPorProveedor || []).forEach((entry) => {
    const proveedorId = getProveedorId(entry);
    const cotizacionId = entry?.cotizacionId ?? null;
    const justificacion = normalizeText(entry?.justificacion);
    if (!proveedorId || !justificacion) return;

    result[getProveedorKey(proveedorId, cotizacionId)] = justificacion;
    result[String(proveedorId)] = justificacion;
  });

  const proveedores =
    criterio?.proveedoresAdjudicadosSnapshot ||
    criterio?.proveedoresAdjudicados ||
    [];

  proveedores.forEach((entry) => {
    const proveedorId = getProveedorId(entry);
    const justificacion = normalizeText(entry?.justificacion);
    if (!proveedorId || !justificacion) return;

    const cotizacionIds = [
      entry?.cotizacionId,
      ...(entry?.cotizaciones || []).map((cotizacion) => getCotizacionId(cotizacion)),
    ].filter(Boolean);

    if (!cotizacionIds.length) {
      result[String(proveedorId)] = justificacion;
      return;
    }

    cotizacionIds.forEach((cotizacionId) => {
      result[getProveedorKey(proveedorId, cotizacionId)] = justificacion;
    });
  });

  return result;
};

export const buildComparativoProcesoViewModel = ({
  detalleGlobal,
  comparativo,
} = {}) => {
  const snapshot = getSnapshot(comparativo);
  const criterio = getCriterioSnapshot(comparativo);
  const solicitudes = getSolicitudesSource(detalleGlobal);
  const itemsRequeridos = getItemsSource(detalleGlobal, snapshot).map(
    normalizeItemRequerido,
  );
  const cotizacionesSource = getCotizacionesSource(detalleGlobal, snapshot);
  const cotizacionesComparables = cotizacionesSource
    .filter(isCotizacionComparable)
    .filter(hasAtLeastOneQuotedItem)
    .map((cotizacion) => normalizeCotizacion(cotizacion, itemsRequeridos));

  const proveedoresSinCotizacionValida = Array.isArray(
    snapshot?.proveedoresSinCotizacionValida,
  )
    ? buildProveedoresSinCotizacionFromSnapshot(snapshot)
    : buildProveedoresSinCotizacionFromDetalle({
        solicitudes,
        cotizaciones: cotizacionesSource,
        cotizacionesComparables,
      });

  const tipoCompra = getTipoCompraFromSources({
    snapshot,
    cotizaciones: cotizacionesSource,
    solicitudes,
    detalleGlobal,
  });
  const moneda = getMonedaFromSources({
    snapshot,
    cotizaciones: cotizacionesSource,
    solicitudes,
  });
  const adjudicacionesIniciales = buildAdjudicacionesIniciales(criterio);
  const condicionesOfertadasPorCotizacion = cotizacionesComparables.reduce(
    (acc, cotizacion) => {
      acc[cotizacion.cotizacionId] = cotizacion.condicionesOfertadas || {};
      return acc;
    },
    {},
  );
  const montoTotalAdjudicado = Object.entries(adjudicacionesIniciales).reduce(
    (total, [itemId, cotizacionId]) => {
      const cotizacion = cotizacionesComparables.find(
        (entry) => Number(entry.cotizacionId) === Number(cotizacionId),
      );
      const cell = cotizacion?.matrizPorItem?.[itemId];
      return total + toNumber(cell?.precioTotal);
    },
    0,
  );

  return {
    tipoCompra,
    moneda,
    monedaLabel: getMonedaLabel(moneda),
    condicionesSolicitadas: snapshot?.condicionesSolicitadas || {},
    itemsRequeridos,
    cotizacionesComparables,
    proveedoresSinCotizacionValida,
    condicionesOfertadasPorCotizacion,
    adjudicacionesIniciales,
    criterioInicial: normalizeText(criterio?.resumen),
    observacionesIniciales: normalizeText(comparativo?.observaciones),
    sustentoInicialPorProveedor: buildSustentoInicialPorProveedor(criterio),
    resumen: {
      totalItems: itemsRequeridos.length,
      totalCotizacionesComparables: cotizacionesComparables.length,
      totalProveedoresSinCotizacionValida:
        proveedoresSinCotizacionValida.length,
      totalItemsAdjudicados: Object.keys(adjudicacionesIniciales).length,
      totalItemsPendientes: Math.max(
        itemsRequeridos.length - Object.keys(adjudicacionesIniciales).length,
        0,
      ),
      montoTotalAdjudicado,
    },
  };
};

