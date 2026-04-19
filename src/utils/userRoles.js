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
      branchDescription:
        area.branchDescription || fallback.branchDescription || null,
      tipoUnidad: area.tipoUnidad || fallback.tipoUnidad || null,
      esAreaLogistica:
        area.esAreaLogistica ?? fallback.esAreaLogistica ?? null,
      esAreaAlmacen: area.esAreaAlmacen ?? fallback.esAreaAlmacen ?? null,
    };
  }

  return {
    id: normalizeAreaId(fallback.areaId),
    nombre: fallback.areaNombre || null,
    abreviatura: fallback.areaAbreviatura || null,
    codigo: fallback.areaCodigo || null,
    branchDescription: fallback.branchDescription || null,
    tipoUnidad: fallback.tipoUnidad || null,
    esAreaLogistica: fallback.esAreaLogistica ?? null,
    esAreaAlmacen: fallback.esAreaAlmacen ?? null,
  };
};

const normalizeOperationalAssignments = (assignments = []) =>
  toArray(assignments)
    .filter(
      (assignment) =>
        assignment &&
        assignment.activo !== false &&
        assignment.rol &&
        normalizeAreaId(assignment.areaId ?? assignment.area?.id)
    )
    .map((assignment) => ({
      ...assignment,
      areaId: normalizeAreaId(assignment.areaId ?? assignment.area?.id),
      area: normalizeArea(assignment.area, assignment),
    }));

const appendUniqueAssignment = (collection, assignment) => {
  if (!assignment?.rol) return collection;

  const key = `${assignment.source}:${assignment.rol}:${assignment.areaId ?? "none"}`;
  if (
    collection.some(
      (current) =>
        `${current.source}:${current.rol}:${current.areaId ?? "none"}` === key
    )
  ) {
    return collection;
  }

  collection.push(assignment);
  return collection;
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
  if (user?.activeContext) {
    const activeArea = normalizeArea(user.activeContext.area, {
      areaId: user.activeContext.areaId,
      areaNombre: user.activeContext.areaNombre,
      areaAbreviatura: user.areaAbreviatura,
      areaCodigo: user.areaCodigo,
      branchDescription: user.activeContext.branchDescription,
      tipoUnidad: user.activeContext.area?.tipoUnidad,
      esAreaLogistica:
        user.activeContext.area?.esAreaLogistica ??
        user.activeContext.esAreaLogistica ??
        user.esAreaLogistica ??
        null,
      esAreaAlmacen:
        user.activeContext.area?.esAreaAlmacen ??
        user.activeContext.esAreaAlmacen ??
        user.esAreaAlmacen ??
        null,
    });

    return [
      {
        rol: user.activeContext.role || user.activeContext.rolOperativo,
        areaId: normalizeAreaId(user.activeContext.areaId ?? activeArea.id),
        area: activeArea,
        branchDescription: user.activeContext.branchDescription || null,
        source: "active_context",
      },
    ].filter((assignment) => assignment.rol);
  }

  const assignments = [];

  if (user?.rol) {
    appendUniqueAssignment(assignments, {
      rol: user.rol,
      areaId: normalizeAreaId(user?.areaId || user?.area?.id),
      area: normalizeArea(user?.area, user),
      branchDescription: null,
      source: "primary",
    });
  }

  for (const rango of getActiveUserRangos(user)) {
    appendUniqueAssignment(assignments, {
      rol: rango.rol,
      areaId: rango.areaId,
      area: normalizeArea(rango.area, rango),
      branchDescription: rango.branchDescription || null,
      source: "rango",
    });
  }

  for (const assignment of normalizeOperationalAssignments(
    user?.asignacionesOperativas || user?.operationalAssignments
  )) {
    appendUniqueAssignment(assignments, {
      rol: assignment.rol,
      areaId: assignment.areaId,
      area: normalizeArea(assignment.area, assignment),
      branchDescription: assignment.branchDescription || null,
      tipoAsignacion: assignment.tipoAsignacion || null,
      source: "operational_assignment",
    });
  }

  return assignments;
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
    asignacionesOperativas: normalizeOperationalAssignments(
      user.asignacionesOperativas || user.operationalAssignments
    ),
  };
};
