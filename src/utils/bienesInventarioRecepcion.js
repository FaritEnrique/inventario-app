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

export const getUnidadInventarioDuplicateFields = (unidades = []) => {
  const seriesCount = new Map();
  const patrimonialesCount = new Map();

  unidades.forEach((unidad) => {
    const serie = normalizarIdentificadorBien(unidad.numeroSerie);
    const patrimonial = normalizarIdentificadorBien(
      unidad.codigoPatrimonial,
    );

    if (serie) seriesCount.set(serie, (seriesCount.get(serie) || 0) + 1);
    if (patrimonial) {
      patrimonialesCount.set(
        patrimonial,
        (patrimonialesCount.get(patrimonial) || 0) + 1,
      );
    }
  });

  return unidades.map((unidad) => ({
    numeroSerie:
      (seriesCount.get(normalizarIdentificadorBien(unidad.numeroSerie)) || 0) >
      1,
    codigoPatrimonial:
      (patrimonialesCount.get(
        normalizarIdentificadorBien(unidad.codigoPatrimonial),
      ) || 0) > 1,
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

  const missingPatrimonialIndex = unidades.findIndex(
    (unidad) =>
      producto.requiereCodigoPatrimonial &&
      !normalizarIdentificadorBien(unidad.codigoPatrimonial),
  );

  if (missingPatrimonialIndex >= 0) {
    return `La unidad ${missingPatrimonialIndex + 1} requiere código patrimonial.`;
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
