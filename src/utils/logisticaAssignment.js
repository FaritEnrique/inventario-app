const normalizeId = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const toIdString = (value) => {
  const normalizedValue = normalizeId(value);
  return normalizedValue ? String(normalizedValue) : "";
};

const appendUniqueResponsable = (collection, responsable) => {
  const id = normalizeId(responsable?.id);
  if (!id || collection.some((item) => item.id === id)) {
    return collection;
  }

  collection.push({
    id,
    nombre: String(responsable?.nombre || `Usuario ${id}`),
  });
  return collection;
};

export const createDirectResponsableOption = (
  user,
  canProcessDirectly = false,
) => {
  if (!canProcessDirectly) return null;

  const id = normalizeId(user?.id);
  if (!id) return null;

  return {
    id,
    nombre: String(user?.nombre || "Jefe de Logistica"),
  };
};

export const buildLogisticaResponsableOptions = ({
  operadores = [],
  responsableActual = null,
  directResponsable = null,
  extraResponsables = [],
}) => {
  const next = [];

  operadores.forEach((operador) => appendUniqueResponsable(next, operador));
  appendUniqueResponsable(next, directResponsable);
  extraResponsables.forEach((responsable) =>
    appendUniqueResponsable(next, responsable)
  );
  appendUniqueResponsable(next, responsableActual);

  return next;
};

export const getDefaultLogisticaResponsableSelection = ({
  responsableActualId = null,
  directResponsableId = null,
}) => toIdString(responsableActualId) || toIdString(directResponsableId) || "";

export const canSubmitLogisticaAssignment = ({
  selectedResponsableId = null,
  responsableActualId = null,
}) => {
  const selectedId = toIdString(selectedResponsableId);
  if (!selectedId) return false;

  const currentId = toIdString(responsableActualId);
  if (!currentId) return true;

  return selectedId !== currentId;
};

const getUserAssignments = (user = {}) => {
  const assignments = [];

  if (user?.rol) {
    assignments.push({
      rol: user.rol,
      areaId: user.areaId ?? user.area?.id ?? null,
      area: user.area || null,
      activo: user.activo !== false,
    });
  }

  toArray(user?.userRangos).forEach((rango) => {
    assignments.push({
      rol: rango?.rol,
      areaId: rango?.areaId ?? rango?.area?.id ?? null,
      area: rango?.area || null,
      activo: rango?.activo !== false,
    });
  });

  toArray(user?.asignacionesOperativas).forEach((assignment) => {
    assignments.push({
      rol: assignment?.rol,
      areaId: assignment?.areaId ?? assignment?.area?.id ?? null,
      area: assignment?.area || null,
      activo: assignment?.activo !== false,
    });
  });

  return assignments;
};

export const findLogisticaJefaturaResponsable = (
  usuarios = [],
  preferredAreaId = null,
) => {
  const normalizedPreferredAreaId = normalizeId(preferredAreaId);
  const preferredMatches = [];
  const fallbackMatches = [];

  toArray(usuarios).forEach((usuario) => {
    const userId = normalizeId(usuario?.id);
    if (!userId || usuario?.activo === false) return;

    getUserAssignments(usuario).forEach((assignment) => {
      if (!assignment || assignment.activo === false || assignment.rol !== "JEFE_AREA") {
        return;
      }

      const areaId = normalizeId(assignment.areaId);
      const isPreferredArea =
        normalizedPreferredAreaId && areaId === normalizedPreferredAreaId;
      const isLogisticaArea = assignment.area?.esAreaLogistica === true;

      if (!isLogisticaArea && !isPreferredArea) {
        return;
      }

      const responsable = {
        id: userId,
        nombre: String(usuario?.nombre || `Usuario ${userId}`),
      };

      if (isPreferredArea) {
        appendUniqueResponsable(preferredMatches, responsable);
        return;
      }

      appendUniqueResponsable(fallbackMatches, responsable);
    });
  });

  return preferredMatches[0] || fallbackMatches[0] || null;
};
