export const ALERTA_COTIZACION_TYPES = new Set([
  "PLAZO_VENCIDO",
  "PLAZO_POR_VENCER",
  "COBERTURA_INCOMPLETA",
]);

export const ALERTA_BUENA_PRO_TYPES = new Set([
  "FLUJO_CERRADO_SIN_BUENA_PRO",
  "BUENA_PRO_SIN_OC",
]);

export const ALERTA_ORDEN_COMPRA_TYPES = new Set([
  "OC_PENDIENTE_APROBACION",
  "OC_APROBADA_PENDIENTE_RECEPCION",
]);

export const getAlertasSeguimientoSource = (value) =>
  value?.alertasSeguimiento || value?.alertas || value || null;

export const getAlertasSeguimientoCount = (value) => {
  const alertas = getAlertasSeguimientoSource(value);
  if (!alertas) return 0;
  if (Array.isArray(alertas)) return alertas.length;
  if (Array.isArray(alertas.resumen)) {
    return alertas.resumen.reduce(
      (total, entry) => total + Number(entry?.cantidad || 0),
      0,
    );
  }
  if (alertas.byTipo && typeof alertas.byTipo === "object") {
    return Object.values(alertas.byTipo).reduce(
      (total, entry) => total + Number(entry?.totalExpedientes || 0),
      0,
    );
  }

  return [
    "solicitudesVencidas",
    "solicitudesPorVencer",
    "itemsCoberturaIncompleta",
    "flujosCerradosSinBuenaPro",
    "buenasProSinOrdenCompra",
    "ordenesCompraPendientesAprobacion",
    "ordenesCompraAprobadasPendientesRecepcion",
  ].reduce((total, key) => total + Number(alertas[key] || 0), 0);
};

export const hasAlertasSeguimiento = (value) =>
  getAlertasSeguimientoCount(value) > 0;

export const getAlertasByCategoryCount = (alertas, category = "todas") => {
  const source = getAlertasSeguimientoSource(alertas);
  if (!source?.byTipo || category === "todas") {
    return getAlertasSeguimientoCount(source);
  }

  const categoryTypes =
    category === "cotizaciones"
      ? ALERTA_COTIZACION_TYPES
      : category === "buenaPro"
        ? ALERTA_BUENA_PRO_TYPES
        : category === "ordenesCompra"
          ? ALERTA_ORDEN_COMPRA_TYPES
          : null;

  if (!categoryTypes) return getAlertasSeguimientoCount(source);

  return Object.entries(source.byTipo).reduce(
    (total, [tipo, entry]) =>
      categoryTypes.has(tipo)
        ? total + Number(entry?.totalExpedientes || 0)
        : total,
    0,
  );
};

export const filterAlertasByCategory = (alertas, category = "todas") => {
  const source = getAlertasSeguimientoSource(alertas);
  if (!source?.byTipo || category === "todas") return source;

  const categoryTypes =
    category === "cotizaciones"
      ? ALERTA_COTIZACION_TYPES
      : category === "buenaPro"
        ? ALERTA_BUENA_PRO_TYPES
        : category === "ordenesCompra"
          ? ALERTA_ORDEN_COMPRA_TYPES
          : null;

  if (!categoryTypes) return source;

  const byTipo = Object.fromEntries(
    Object.entries(source.byTipo).map(([tipo, entry]) => [
      tipo,
      categoryTypes.has(tipo)
        ? entry
        : { ...entry, totalExpedientes: 0, expedientes: [] },
    ]),
  );

  return {
    ...source,
    totalExpedientesConAlertas: Object.values(byTipo).reduce(
      (total, entry) => total + Number(entry?.totalExpedientes || 0),
      0,
    ),
    byTipo,
  };
};
