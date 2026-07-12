export const BIEN_INVENTARIO_NOVEDAD_TIPOS = Object.freeze({
  TRANSFERENCIA: "TRANSFERENCIA",
});

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
} = {}) =>
  puedeOperar && String(estado || "").toUpperCase() === "DISPONIBLE"
    ? [BIEN_INVENTARIO_NOVEDAD_TIPOS.TRANSFERENCIA]
    : [];

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
  if (normalizedTipo !== BIEN_INVENTARIO_NOVEDAD_TIPOS.TRANSFERENCIA) {
    throw new Error(
      "La única operación directa disponible para una unidad en Almacén es la transferencia.",
    );
  }

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

  const almacenDestinoId = Number.parseInt(form.almacenDestinoId, 10);
  if (!Number.isInteger(almacenDestinoId) || almacenDestinoId <= 0) {
    throw new Error("El almacén de destino es obligatorio.");
  }

  return {
    fechaEvento: fecha.toISOString(),
    motivo,
    referenciaTipo,
    referenciaCodigo,
    almacenDestinoId,
    observaciones: String(form.observaciones || "").trim() || null,
  };
};
