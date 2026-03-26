const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeAreaId = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
};

const normalizeArea = (area, fallback = {}) => {
  if (area && typeof area === "object") {
    return {
      ...area,
      id: normalizeAreaId(area.id ?? fallback.areaId),
      nombre: area.nombre || fallback.areaNombre || null,
      abreviatura: area.abreviatura || fallback.areaAbreviatura || null,
      codigo: area.codigo || fallback.areaCodigo || null,
    };
  }

  return {
    id: normalizeAreaId(fallback.areaId),
    nombre: fallback.areaNombre || null,
    abreviatura: fallback.areaAbreviatura || null,
    codigo: fallback.areaCodigo || null,
  };
};

export const getActiveUserRangos = (user) =>
  toArray(user?.userRangos || user?.rangos)
    .filter((rango) => rango && rango.activo !== false && rango.rol)
    .map((rango) => ({
      ...rango,
      areaId: normalizeAreaId(rango.areaId ?? rango.area?.id),
      area: normalizeArea(rango.area, rango),
    }));

export const getActiveRoleAssignments = (user) => {
  const assignments = [];

  if (user?.rol) {
    assignments.push({
      rol: user.rol,
      areaId: normalizeAreaId(user?.areaId || user?.area?.id),
      area: normalizeArea(user?.area, user),
      branchDescription: null,
      source: "primary",
    });
  }

  for (const rango of getActiveUserRangos(user)) {
    assignments.push({
      rol: rango.rol,
      areaId: rango.areaId,
      area: normalizeArea(rango.area, rango),
      branchDescription: rango.branchDescription || null,
      source: "rango",
    });
  }

  return assignments.filter((assignment, index, collection) => {
    const key = `${assignment.source}:${assignment.rol}:${assignment.areaId ?? "none"}`;
    return (
      collection.findIndex(
        (current) =>
          `${current.source}:${current.rol}:${current.areaId ?? "none"}` === key
      ) === index
    );
  });
};

export const getActiveRoles = (user) =>
  [...new Set(getActiveRoleAssignments(user).map((assignment) => assignment.rol))];

export const hasRole = (user, role) =>
  Boolean(role) && getActiveRoles(user).includes(role);

export const hasAnyRole = (user, roles = []) =>
  toArray(roles).some((role) => hasRole(user, role));

export const hasAreaRole = (user, role, areaId) => {
  const normalizedAreaId = normalizeAreaId(areaId);
  if (!role || !normalizedAreaId) return false;

  return getActiveRoleAssignments(user).some(
    (assignment) =>
      assignment.rol === role && assignment.areaId === normalizedAreaId
  );
};

export const normalizeSessionUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    area: normalizeArea(user.area, user),
    userRangos: getActiveUserRangos(user),
  };
};
