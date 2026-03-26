import { getActiveRoleAssignments, hasAnyRole, hasRole } from "./utils/userRoles";

const privilegedInventoryRoles = Object.freeze([
  "ADMINISTRADOR_SISTEMA",
  "GERENTE_GENERAL",
  "GERENTE_ADMINISTRACION",
]);

export const USER_MANAGEMENT_ADMIN_ROLES = Object.freeze([
  "ADMINISTRADOR_SISTEMA",
  "GERENTE_ADMINISTRACION",
]);

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isAdminOverride = (user = {}) => hasRole(user, "ADMINISTRADOR_SISTEMA");

const isLogisticaScope = (rawValues = []) => {
  const values = rawValues.map((value) => normalize(value)).filter(Boolean);

  return values.some(
    (value) =>
      value === "logistica" ||
      value === "log" ||
      value.includes("logistica") ||
      value.includes("log")
  );
};

const isLogisticaAssignment = (assignment = {}) =>
  isLogisticaScope([
    assignment?.branchDescription,
    assignment?.area?.nombre,
    assignment?.area?.abreviatura,
    assignment?.area?.codigo,
  ]);

const isWarehouseContext = (assignment = {}) => {
  const areaNombre = normalize(assignment.area?.nombre);
  const areaAbreviatura = normalize(assignment.area?.abreviatura);

  return (
    areaNombre.includes("almacen") ||
    areaAbreviatura === "alm" ||
    areaAbreviatura === "alma"
  );
};

const isOperationsContext = (assignment = {}) => {
  const areaNombre = normalize(assignment.area?.nombre);
  const areaAbreviatura = normalize(assignment.area?.abreviatura);

  return (
    areaNombre.includes("operaciones") ||
    areaNombre.includes("operacion") ||
    areaAbreviatura === "ope" ||
    areaAbreviatura === "opr"
  );
};

const isAdministracionContext = (assignment = {}) => {
  const areaNombre = normalize(assignment.area?.nombre);
  const areaAbreviatura = normalize(assignment.area?.abreviatura);

  return (
    areaNombre === "administracion" ||
    areaNombre.includes("administracion") ||
    areaAbreviatura === "adm"
  );
};

const trayDefinitions = {
  jefatura: {
    key: "jefatura",
    label: "Bandeja Jefatura",
    path: "/requerimientos/bandeja/jefatura",
    description:
      "Revisa requerimientos pendientes de jefatura. Solo veras expedientes donde seas el aprobador efectivo asignado.",
  },
  "gerencia-area": {
    key: "gerencia-area",
    label: "Bandeja Gerencia de Area",
    path: "/requerimientos/bandeja/gerencia-area",
    description:
      "Revisa requerimientos pendientes de gerencia de area. Solo veras expedientes donde seas el aprobador efectivo asignado.",
  },
  "gerencia-administracion": {
    key: "gerencia-administracion",
    label: "Bandeja Gerencia Administracion",
    path: "/requerimientos/bandeja/gerencia-administracion",
    description:
      "Revisa requerimientos pendientes de gerencia de administracion para este nivel.",
  },
  "gerencia-general": {
    key: "gerencia-general",
    label: "Bandeja Gerencia General",
    path: "/requerimientos/bandeja/gerencia-general",
    description:
      "Revisa requerimientos pendientes de aprobacion final en gerencia general.",
  },
};

export const isLogisticaOperadorEffective = (user) =>
  getActiveRoleAssignments(user).some(
    (assignment) =>
      assignment.rol === "OPERADOR" && isLogisticaAssignment(assignment)
  );

export const canAccessCotizacionesEffective = (user) =>
  isAdminOverride(user) ||
  getActiveRoleAssignments(user).some(
    (assignment) =>
      (["JEFE_AREA", "OPERADOR"].includes(assignment.rol) &&
        isLogisticaAssignment(assignment))
  );

export const canViewAllCotizacionesLogisticaEffective = (user) =>
  isAdminOverride(user) ||
  getActiveRoleAssignments(user).some(
    (assignment) =>
      assignment.rol === "JEFE_AREA" && isLogisticaAssignment(assignment)
  );

export const canAssignCotizacionesLogisticaEffective = (user) =>
  canViewAllCotizacionesLogisticaEffective(user);

export const canAdjudicateCotizacionesLogisticaEffective = (user) =>
  canAssignCotizacionesLogisticaEffective(user);

export const canOperateCotizacionesLogisticaEffective = (user, requerimiento) =>
  canViewAllCotizacionesLogisticaEffective(user) ||
  Number(
    requerimiento?.responsableLogisticaId || requerimiento?.responsableLogistica?.id
  ) === Number(user?.id || 0);

export const getCotizacionesHomePathEffective = (user) => {
  if (canViewAllCotizacionesLogisticaEffective(user)) {
    return "/cotizaciones/bandeja/jefatura";
  }

  if (isLogisticaOperadorEffective(user)) {
    return "/cotizaciones/bandeja/operador";
  }

  return "/dashboard";
};

export const canOperateInventoryEffective = (user = {}) => {
  if (hasAnyRole(user, privilegedInventoryRoles)) return true;

  return getActiveRoleAssignments(user).some(
    (assignment) =>
      (["JEFE_AREA", "OPERADOR"].includes(assignment.rol) &&
        isWarehouseContext(assignment)) ||
      (["GERENTE_FUNCIONAL", "GERENTE_GENERAL"].includes(assignment.rol) &&
        isOperationsContext(assignment))
  );
};

export const canAdjustInventoryEffective = (user = {}) =>
  canOperateInventoryEffective(user);

export const canViewWarehouseTrayEffective = (user = {}) =>
  canOperateInventoryEffective(user);

export const canCreatePedidoInternoEffective = (user = {}) =>
  Boolean(user?.id && user?.activo !== false);

export const canApprovePedidoInternoEffective = (user = {}) =>
  hasAnyRole(user, [
    ...privilegedInventoryRoles,
    "JEFE_AREA",
    "GERENTE_FUNCIONAL",
  ]);

export const canViewOrdenesCompraEffective = (user = {}) =>
  Boolean(user?.id && user?.activo !== false);

export const canViewOrdenCompraApprovalTrayEffective = (user = {}) =>
  hasAnyRole(user, [
    "ADMINISTRADOR_SISTEMA",
    "GERENTE_ADMINISTRACION",
    "GERENTE_GENERAL",
  ]);

export const canManageOrdenCompraLifecycleEffective = (user = {}) => {
  if (
    hasAnyRole(user, [
      "ADMINISTRADOR_SISTEMA",
      "GERENTE_GENERAL",
      "GERENTE_ADMINISTRACION",
    ])
  ) {
    return true;
  }

  return getActiveRoleAssignments(user).some((assignment) =>
    isAdministracionContext(assignment)
  );
};

export const canApproveOrdenCompraStageEffective = (user, ordenCompra) => {
  if (!user || !ordenCompra) return false;
  if (isAdminOverride(user)) return true;

  const pendingLevel =
    ordenCompra?.nivelPendienteActual ||
    ordenCompra?.snapshotFormal?.nivelPendienteActualSnapshot ||
    null;

  if (pendingLevel === "GERENCIA_ADMINISTRACION") {
    return (
      hasRole(user, "GERENTE_ADMINISTRACION") &&
      Number(ordenCompra?.snapshotFormal?.aprobadorAdministracionIdSnapshot || 0) ===
        Number(user?.id || 0)
    );
  }

  if (pendingLevel === "GERENCIA_GENERAL") {
    if (!hasRole(user, "GERENTE_GENERAL")) return false;

    const approverId = Number(
      ordenCompra?.snapshotFormal?.aprobadorGerenciaGeneralIdSnapshot || 0
    );

    return approverId > 0 ? approverId === Number(user?.id || 0) : true;
  }

  return false;
};

export const canActOnNoteDocument = (user, documentoFormal) => {
  if (!user || !documentoFormal) return false;
  if (isAdminOverride(user)) return true;

  const pendingLevel = documentoFormal?.nivelPendienteActual || null;
  if (!pendingLevel) return false;

  if (pendingLevel === "APROBACION_ALMACEN") {
    return Number(documentoFormal?.aprobadorAlmacenIdSnapshot || 0) === Number(user?.id || 0);
  }

  if (pendingLevel === "CONFORMIDAD_GERENCIA") {
    return Number(documentoFormal?.gerenteConformidadIdSnapshot || 0) === Number(user?.id || 0);
  }

  return false;
};

export const canViewAllRequerimientosEffective = (user = {}) =>
  hasAnyRole(user, [
    "ADMINISTRADOR_SISTEMA",
    "GERENTE_ADMINISTRACION",
    "GERENTE_GENERAL",
  ]);

export const canSelectAreaRequerimientoEffective = (user = {}) =>
  canViewAllRequerimientosEffective(user);

export const canApproveJefaturaEffective = (user = {}) =>
  hasRole(user, "JEFE_AREA");

export const canApproveGerenciaAreaEffective = (user = {}) =>
  hasRole(user, "GERENTE_FUNCIONAL");

export const canApproveGerenciaAdministracionEffective = (user = {}) =>
  hasRole(user, "GERENTE_ADMINISTRACION");

export const canApproveGerenciaGeneralEffective = (user = {}) =>
  hasRole(user, "GERENTE_GENERAL");

export const canAccessTrayLevelEffective = (user = {}, nivel) => {
  switch (nivel) {
    case "jefatura":
      return hasAnyRole(user, ["JEFE_AREA", "ADMINISTRADOR_SISTEMA"]);
    case "gerencia-area":
      return hasAnyRole(user, ["GERENTE_FUNCIONAL", "ADMINISTRADOR_SISTEMA"]);
    case "gerencia-administracion":
      return hasAnyRole(user, [
        "GERENTE_ADMINISTRACION",
        "GERENTE_GENERAL",
        "ADMINISTRADOR_SISTEMA",
      ]);
    case "gerencia-general":
      return hasAnyRole(user, ["GERENTE_GENERAL", "ADMINISTRADOR_SISTEMA"]);
    default:
      return false;
  }
};

export const canEditRequerimientoEffective = (user, requerimiento) => {
  if (!user || !requerimiento) return false;
  if (requerimiento.estadoDocumento === "ANULADO") return false;
  if (
    requerimiento.estadoDocumento === "APROBADO_SIN_MODIFICACIONES" ||
    requerimiento.estadoDocumento === "APROBADO_CON_MODIFICACIONES"
  ) {
    return false;
  }

  if (canViewAllRequerimientosEffective(user)) return true;

  const sameArea = Number(user?.areaId || 0) === Number(requerimiento.areaId || 0);
  const isOwner = Number(requerimiento.solicitante?.id || 0) === Number(user?.id || 0);
  const routeApproverIds = [
    ...new Set(
      Array.isArray(requerimiento.rutaAprobacionDetalle)
        ? requerimiento.rutaAprobacionDetalle
            .map((step) => Number(step?.aprobadorId || 0))
            .filter((id) => id > 0)
        : []
    ),
  ];
  const isAssignedLeader = routeApproverIds.includes(Number(user?.id || 0));

  return sameArea && (isOwner || isAssignedLeader);
};

export const getAvailableApprovalTraysEffective = (user = {}) => {
  const trays = [];

  if (canApproveJefaturaEffective(user) || isAdminOverride(user)) {
    trays.push(trayDefinitions.jefatura);
  }

  if (canApproveGerenciaAreaEffective(user) || isAdminOverride(user)) {
    trays.push(trayDefinitions["gerencia-area"]);
  }

  if (canApproveGerenciaAdministracionEffective(user) || isAdminOverride(user)) {
    trays.push(trayDefinitions["gerencia-administracion"]);
  }

  if (canApproveGerenciaGeneralEffective(user) || isAdminOverride(user)) {
    trays.push(trayDefinitions["gerencia-general"]);
  }

  return trays;
};

export const getTrayGuidanceEffective = (user = {}, nivel) => {
  if (isAdminOverride(user)) {
    return "Como administrador, esta bandeja muestra el nivel seleccionado segun lo que devuelve el backend.";
  }

  if (nivel === "jefatura" || nivel === "gerencia-area") {
    return "Esta bandeja solo muestra requerimientos donde eres el aprobador efectivo asignado en esta etapa.";
  }

  return "Esta bandeja muestra solo requerimientos pendientes del nivel actual.";
};

export const getTrayEmptyStateEffective = (
  user = {},
  nivel,
  hasActiveFilters = false
) => {
  if (hasActiveFilters) {
    return {
      title: "No hay requerimientos para los filtros actuales.",
      description:
        "Ajusta o limpia los filtros para volver a consultar la bandeja completa.",
    };
  }

  if (isAdminOverride(user)) {
    return {
      title: "No hay requerimientos pendientes en este nivel.",
      description:
        "El backend no devolvio expedientes pendientes para la etapa seleccionada.",
    };
  }

  if (nivel === "jefatura" || nivel === "gerencia-area") {
    return {
      title: "No tienes requerimientos pendientes asignados en esta bandeja.",
      description:
        "Si esperabas ver expedientes, recuerda que el backend solo devuelve aquellos donde eres el aprobador efectivo asignado.",
    };
  }

  return {
    title: "No hay requerimientos pendientes en esta bandeja.",
    description:
      "En este momento no hay expedientes pendientes para este nivel de aprobacion.",
  };
};

export const canAccessUserManagementEffective = (user = {}) =>
  hasAnyRole(user, USER_MANAGEMENT_ADMIN_ROLES);

export const canCreateUsersEffective = (user = {}) =>
  canAccessUserManagementEffective(user);

export const canEditUsersEffective = (user = {}) =>
  canAccessUserManagementEffective(user);

export const canToggleUserStatusEffective = (user = {}) =>
  canAccessUserManagementEffective(user);

export const canAssignSystemAdminRoleEffective = (user = {}) =>
  hasRole(user, "ADMINISTRADOR_SISTEMA");
