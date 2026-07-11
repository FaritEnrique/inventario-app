export const BIEN_INVENTARIO_NOVEDAD_TIPOS = Object.freeze({
  DEVOLUCION: "DEVOLUCION",
  TRANSFERENCIA: "TRANSFERENCIA",
  BAJA: "BAJA",
});

export const CAUSALES_BAJA_BIEN = Object.freeze([
  { value: "OBSOLESCENCIA", label: "Obsolescencia" },
  { value: "DETERIORO_IRREPARABLE", label: "Deterioro irreparable" },
  { value: "PERDIDA", label: "Pérdida" },
  { value: "ROBO", label: "Robo" },
  { value: "SINIESTRO", label: "Siniestro" },
  { value: "DONACION", label: "Donación" },
  { value: "OTRO", label: "Otra causal" },
]);

export const TIPOS_SUSTENTO_BIEN = Object.freeze([
  { value: "ACTA", label: "Acta" },
  { value: "INFORME", label: "Informe" },
  { value: "RESOLUCION", label: "Resolución" },
  { value: "MEMORANDO", label: "Memorando" },
  { value: "OTRO", label: "Otro documento" },
]);

export const getBienInventarioAccionesDisponibles = ({
  estado,
  puedeOperar = false,
  puedeDarBaja = false,
} = {}) => {
  const normalized = String(estado || "").toUpperCase();
  const acciones = [];

  if (puedeOperar && normalized === "ENTREGADO") {
    acciones.push(BIEN_INVENTARIO_NOVEDAD_TIPOS.DEVOLUCION);
  }

  if (puedeOperar && normalized === "DISPONIBLE") {
    acciones.push(BIEN_INVENTARIO_NOVEDAD_TIPOS.TRANSFERENCIA);
  }

  if (
    puedeDarBaja &&
    ["DISPONIBLE", "ENTREGADO"].includes(normalized)
  ) {
    acciones.push(BIEN_INVENTARIO_NOVEDAD_TIPOS.BAJA);
  }

  return acciones;
};

const pad = (value) => String(value).padStart(2, "0");

export const formatDateTimeLocal = (date = new Date()) => {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return "";

  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
    value.getDate(),
  )}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
};

const requiredText = (value, label) => {
  const normalized = String(value || "").trim();
  if (!normalized) throw new Error(`${label} es obligatorio.`);
  return normalized;
};

export const buildBienInventarioNovedadPayload = (tipo, form = {}) => {
  const normalizedTipo = String(tipo || "").toUpperCase();
  const motivo = requiredText(form.motivo, "El motivo");
  if (motivo.length < 3) {
    throw new Error("El motivo debe tener al menos 3 caracteres.");
  }

  const referenciaTipo = requiredText(
    form.referenciaTipo,
    "El tipo de sustento",
  );
  const referenciaCodigo = requiredText(
    form.referenciaCodigo,
    "El código del sustento",
  );
  const fecha = form.fechaEvento ? new Date(form.fechaEvento) : new Date();

  if (Number.isNaN(fecha.getTime())) {
    throw new Error("La fecha del evento no es válida.");
  }

  if (fecha.getTime() > Date.now() + 5 * 60 * 1000) {
    throw new Error("La fecha del evento no puede estar en el futuro.");
  }

  const payload = {
    fechaEvento: fecha.toISOString(),
    motivo,
    referenciaTipo,
    referenciaCodigo,
    observaciones: String(form.observaciones || "").trim() || null,
  };

  if (
    [
      BIEN_INVENTARIO_NOVEDAD_TIPOS.DEVOLUCION,
      BIEN_INVENTARIO_NOVEDAD_TIPOS.TRANSFERENCIA,
    ].includes(normalizedTipo)
  ) {
    const almacenDestinoId = Number.parseInt(form.almacenDestinoId, 10);
    if (!Number.isInteger(almacenDestinoId) || almacenDestinoId <= 0) {
      throw new Error("El almacén de destino es obligatorio.");
    }
    payload.almacenDestinoId = almacenDestinoId;
  }

  if (normalizedTipo === BIEN_INVENTARIO_NOVEDAD_TIPOS.BAJA) {
    const causalBaja = requiredText(form.causalBaja, "La causal de baja");
    if (!CAUSALES_BAJA_BIEN.some((item) => item.value === causalBaja)) {
      throw new Error("La causal de baja no es válida.");
    }
    payload.causalBaja = causalBaja;
  }

  if (!Object.values(BIEN_INVENTARIO_NOVEDAD_TIPOS).includes(normalizedTipo)) {
    throw new Error("La novedad seleccionada no es válida.");
  }

  return payload;
};
