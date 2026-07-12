const limaDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const getLimaDateInput = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const parts = Object.fromEntries(
    limaDateFormatter
      .formatToParts(date)
      .filter((part) => ["year", "month", "day"].includes(part.type))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const buildLimaNoonIso = (dateInput) =>
  new Date(`${dateInput}T12:00:00-05:00`).toISOString();

export const buildFechaDevolucionIso = (dateInput) =>
  dateInput === getLimaDateInput()
    ? new Date().toISOString()
    : buildLimaNoonIso(dateInput);

export const MODALIDAD_SALIDA_LABELS = {
  DEFINITIVA: "Salida definitiva",
  TEMPORAL: "Préstamo temporal",
};

export const ESTADO_PRESTAMO_LABELS = {
  PENDIENTE_DEVOLUCION: "Pendiente de devolución",
  PARCIALMENTE_DEVUELTO: "Parcialmente devuelto",
  DEVUELTO: "Devuelto",
  PARCIALMENTE_REGULARIZADO: "Parcialmente regularizado",
  CERRADO_CON_INCIDENCIA: "Cerrado con incidencia",
  VENCIDO: "Vencido",
  NO_APLICA: "No aplica",
};

export const getModalidadSalidaLabel = (value) =>
  MODALIDAD_SALIDA_LABELS[value] || value || MODALIDAD_SALIDA_LABELS.DEFINITIVA;

export const getEstadoPrestamoLabel = (value) =>
  ESTADO_PRESTAMO_LABELS[value] || value || "-";

export const isSalidaTemporal = (value) => value === "TEMPORAL";

export const getSalidaReporte = (reporte) =>
  Array.isArray(reporte?.salidas) ? reporte.salidas[0] || null : null;

export const buildDevolucionDraft = (salida) =>
  (salida?.lineas || [])
    .filter((linea) => Number(linea.cantidadPendienteDevolucion || 0) > 0)
    .map((linea) => ({
      notaSalidaDetalleId: linea.notaSalidaDetalleId,
      producto: linea.producto,
      cantidadPendiente: Number(linea.cantidadPendienteDevolucion || 0),
      cantidadDevuelta: "",
      bienesPendientes: Array.isArray(linea.bienesPendientes)
        ? linea.bienesPendientes
        : [],
      bienInventarioIds: [],
      observaciones: "",
    }));

export const isLineaIndividual = (linea) =>
  String(linea?.producto?.tipoControlInventario || "").toUpperCase() ===
    "INDIVIDUAL" ||
  (Array.isArray(linea?.bienesPendientes) && linea.bienesPendientes.length > 0);

export const normalizeDevolucionItems = (lineas = []) =>
  lineas
    .map((linea) => {
      const individual = isLineaIndividual(linea);
      const ids = Array.isArray(linea.bienInventarioIds)
        ? linea.bienInventarioIds.map(Number).filter(Number.isInteger)
        : [];
      const cantidad = individual
        ? ids.length
        : Number(linea.cantidadDevuelta || 0);

      return {
        notaSalidaDetalleId: Number(linea.notaSalidaDetalleId),
        cantidadDevuelta: cantidad,
        bienInventarioIds: individual ? ids : [],
        observaciones: String(linea.observaciones || "").trim() || undefined,
      };
    })
    .filter((item) => item.cantidadDevuelta > 0);

export const validateDevolucionDraft = (lineas = []) => {
  const items = normalizeDevolucionItems(lineas);
  if (!items.length) {
    return "Debe registrar al menos una cantidad o unidad devuelta.";
  }

  for (const item of items) {
    const linea = lineas.find(
      (candidate) =>
        Number(candidate.notaSalidaDetalleId) === item.notaSalidaDetalleId,
    );
    const pendiente = Number(linea?.cantidadPendiente || 0);
    if (item.cantidadDevuelta > pendiente) {
      return `La devolución de ${linea?.producto?.nombre || "la línea"} supera el saldo pendiente.`;
    }
    if (
      isLineaIndividual(linea) &&
      new Set(item.bienInventarioIds).size !== item.bienInventarioIds.length
    ) {
      return "Una unidad individualizada está repetida en la devolución.";
    }
  }

  return null;
};

export const MOTIVOS_REGULARIZACION_SALIDA = [
  ["ROBO", "Robo"],
  ["PERDIDA", "Pérdida"],
  ["DESTRUCCION", "Destrucción"],
  ["SINIESTRO", "Siniestro"],
  [
    "IMPOSIBILIDAD_MATERIAL_DEVOLUCION",
    "Imposibilidad material de devolución",
  ],
  ["OTRO", "Otro"],
];

export const buildRegularizacionDraft = (salida) =>
  (salida?.lineas || [])
    .filter((linea) => Number(linea.cantidadPendienteDevolucion || 0) > 0)
    .map((linea) => ({
      notaSalidaDetalleId: Number(linea.notaSalidaDetalleId),
      producto: linea.producto,
      cantidadEntregada: Number(linea.cantidadEntregada || 0),
      cantidadDevuelta: Number(linea.cantidadDevuelta || 0),
      cantidadRegularizadaAnterior: Number(
        linea.cantidadRegularizada || 0,
      ),
      cantidadPendiente: Number(linea.cantidadPendienteDevolucion || 0),
      cantidadRegularizada: "",
      bienesPendientes: Array.isArray(linea.bienesPendientes)
        ? linea.bienesPendientes
        : [],
      bienInventarioIds: [],
      observaciones: "",
    }));

export const normalizeRegularizacionItems = (lineas = []) =>
  lineas
    .map((linea) => {
      const individual = isLineaIndividual(linea);
      const ids = Array.isArray(linea.bienInventarioIds)
        ? linea.bienInventarioIds.map(Number).filter(Number.isInteger)
        : [];
      const cantidad = individual
        ? ids.length
        : Number(linea.cantidadRegularizada || 0);

      return {
        notaSalidaDetalleId: Number(linea.notaSalidaDetalleId),
        cantidadRegularizada: cantidad,
        bienInventarioIds: individual ? ids : [],
        observaciones: String(linea.observaciones || "").trim() || undefined,
      };
    })
    .filter((item) => item.cantidadRegularizada > 0);

export const validateRegularizacionDraft = (lineas = []) => {
  const items = normalizeRegularizacionItems(lineas);
  if (!items.length) {
    return "Debe consignar al menos una cantidad o unidad que no será devuelta.";
  }

  for (const item of items) {
    const linea = lineas.find(
      (candidate) =>
        Number(candidate.notaSalidaDetalleId) === item.notaSalidaDetalleId,
    );
    const pendiente = Number(linea?.cantidadPendiente || 0);
    if (item.cantidadRegularizada > pendiente) {
      return `La regularización de ${linea?.producto?.nombre || "la línea"} supera el saldo pendiente.`;
    }
    if (
      isLineaIndividual(linea) &&
      new Set(item.bienInventarioIds).size !== item.bienInventarioIds.length
    ) {
      return "Una unidad individualizada está repetida en el Acta.";
    }
  }

  return null;
};
