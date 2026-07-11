import { TIPOS_CONTROL_INVENTARIO } from "./productoControlInventario";

const normalizeText = (value) => String(value ?? "").trim();

export const normalizarIdentificadorBien = (value) =>
  normalizeText(value).replace(/\s+/g, " ").toLocaleUpperCase("es-PE");

export const esProductoIndividual = (producto = {}) =>
  String(
    producto.tipoControlInventario || TIPOS_CONTROL_INVENTARIO.CANTIDAD,
  ).toUpperCase() === TIPOS_CONTROL_INVENTARIO.INDIVIDUAL;

const createUnidadId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `unidad-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const crearUnidadInventarioVacia = () => ({
  id: createUnidadId(),
  numeroSerie: "",
  codigoPatrimonial: "",
  observaciones: "",
});

export const sincronizarUnidadesInventario = (unidades = [], cantidad) => {
  const requiredCount = Number(cantidad);

  if (!Number.isInteger(requiredCount) || requiredCount < 0) {
    return Array.isArray(unidades) ? unidades : [];
  }

  const current = Array.isArray(unidades) ? unidades : [];

  if (current.length === requiredCount) return current;
  if (current.length > requiredCount) return current.slice(0, requiredCount);

  return [
    ...current,
    ...Array.from(
      { length: requiredCount - current.length },
      crearUnidadInventarioVacia,
    ),
  ];
};

export const buildUnidadesInventarioPayload = (unidades = []) =>
  unidades.map((unidad) => ({
    numeroSerie: normalizeText(unidad.numeroSerie) || undefined,
    codigoPatrimonial:
      normalizeText(unidad.codigoPatrimonial) || undefined,
    observaciones: normalizeText(unidad.observaciones) || undefined,
  }));

const buildDuplicateGroups = (unidades, field) => {
  const groups = new Map();

  unidades.forEach((unidad, index) => {
    const normalized = normalizarIdentificadorBien(unidad?.[field]);
    if (!normalized) return;

    const current = groups.get(normalized) || {
      valor: normalizeText(unidad?.[field]),
      indices: [],
    };
    current.indices.push(index);
    groups.set(normalized, current);
  });

  return [...groups.values()].filter((group) => group.indices.length > 1);
};

export const getUnidadInventarioDuplicateGroups = (unidades = []) => ({
  numeroSerie: buildDuplicateGroups(unidades, "numeroSerie"),
  codigoPatrimonial: buildDuplicateGroups(unidades, "codigoPatrimonial"),
});

export const getUnidadInventarioDuplicateFields = (unidades = []) => {
  const duplicateGroups = getUnidadInventarioDuplicateGroups(unidades);
  const seriesDuplicadas = new Set(
    duplicateGroups.numeroSerie.flatMap((group) => group.indices),
  );
  const patrimonialesDuplicados = new Set(
    duplicateGroups.codigoPatrimonial.flatMap((group) => group.indices),
  );

  return unidades.map((_unidad, index) => ({
    numeroSerie: seriesDuplicadas.has(index),
    codigoPatrimonial: patrimonialesDuplicados.has(index),
  }));
};

export const validateUnidadesInventario = ({
  producto,
  cantidad,
  unidades = [],
}) => {
  if (!esProductoIndividual(producto)) {
    return unidades.length > 0
      ? "Los productos controlados por cantidad no admiten unidades individualizadas."
      : "";
  }

  const requiredCount = Number(cantidad);

  if (!Number.isInteger(requiredCount) || requiredCount < 0) {
    return "La cantidad aceptada de un producto individual debe ser un número entero.";
  }

  if (unidades.length !== requiredCount) {
    return `Debes registrar exactamente ${requiredCount} unidad(es) individualizada(s).`;
  }

  const missingSerieIndex = unidades.findIndex(
    (unidad) =>
      producto.requiereNumeroSerie &&
      !normalizarIdentificadorBien(unidad.numeroSerie),
  );

  if (missingSerieIndex >= 0) {
    return `La unidad ${missingSerieIndex + 1} requiere número de serie.`;
  }

  const duplicateFields = getUnidadInventarioDuplicateFields(unidades);

  if (duplicateFields.some((fields) => fields.numeroSerie)) {
    return "No se permiten números de serie repetidos en la misma recepción.";
  }

  if (duplicateFields.some((fields) => fields.codigoPatrimonial)) {
    return "No se permiten códigos patrimoniales repetidos en la misma recepción.";
  }

  return "";
};
