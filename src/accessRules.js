import {
  getActiveRoleAssignments,
  hasAnyRole,
  hasRole,
} from "./utils/userRoles.js";

const pedidoInternoApprovalRoles = Object.freeze([
  "ADMINISTRADOR_SISTEMA",
  "GERENTE_GENERAL",
  "GERENTE_ADMINISTRACION",
]);

export const USER_MANAGEMENT_ADMIN_ROLES = Object.freeze([
  "ADMINISTRADOR_SISTEMA",
  "GERENTE_ADMINISTRACION",
]);

export const COMPANY_SETTINGS_ADMIN_ROLES = Object.freeze([
  "ADMINISTRADOR_SISTEMA",
  "GERENTE_ADMINISTRACION",
]);

const hasIdentityRole = (user = {}, role) =>
  Boolean(role) &&
  Array.isArray(user?.identityRoles) &&
  user.identityRoles.includes(role);

const isAdminOverride = (user = {}) =>
  hasRole(user, "ADMINISTRADOR_SISTEMA") ||
  hasIdentityRole(user, "ADMINISTRADOR_SISTEMA");

export const hasAdminOverrideEffective = isAdminOverride;
const hasOperationalSession = (user = {}) =>
  Boolean(user?.id && user?.activo !== false && user?.activeContext);

const isLogisticaAssignment = (assignment = {}) =>
  assignment?.area?.esAreaLogistica === true;

export const isLogisticaContext = (context = {}) =>
  context?.area?.esAreaLogistica === true;

export const isLogisticaJefaturaContext = (context = {}) =>
  (context?.rolOperativo || context?.role) === "JEFE_AREA" &&
  isLogisticaContext(context);

export const isLogisticaOperadorContext = (context = {}) =>
  (context?.rolOperativo || context?.role) === "OPERADOR" &&
  isLogisticaContext(context);

export const hasAnyLogisticaContext = (contexts = []) =>
  Array.isArray(contexts) && contexts.some(isLogisticaContext);

export const hasLogisticaJefaturaContext = (contexts = []) =>
  Array.isArray(contexts) && contexts.some(isLogisticaJefaturaContext);

export const hasLogisticaOperadorContext = (contexts = []) =>
  Array.isArray(contexts) && contexts.some(isLogisticaOperadorContext);

const isWarehouseContext = (assignment = {}) =>
  assignment?.area?.esAreaAlmacen === true;

const isAdministracionContext = (assignment = {}) =>
  assignment?.area?.tipoUnidad === "GERENCIA_ADMINISTRACION";

const isLogisticaJefaturaAssignment = (assignment = {}) =>
  assignment?.rol === "JEFE_AREA" && isLogisticaAssignment(assignment);

const isAdministracionOperativeAssignment = (assignment = {}) =>
  ["JEFE_AREA", "OPERADOR"].includes(assignment?.rol) &&
  isAdministracionContext(assignment);

const isAdministracionJefaturaAssignment = (assignment = {}) =>
  assignment?.rol === "JEFE_AREA" && isAdministracionContext(assignment);

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
    label: "Bandeja Gerencia de Área",
    path: "/requerimientos/bandeja/gerencia-area",
    description:
      "Revisa requerimientos pendientes de gerencia de area. Solo veras expedientes donde seas el aprobador efectivo asignado.",
  },
  "gerencia-administracion": {
    key: "gerencia-administracion",
    label: "Bandeja Gerencia Administración",
    path: "/requerimientos/bandeja/gerencia-administracion",
    description:
      "Revisa requerimientos pendientes de gerencia de administración para este nivel.",
  },
  "gerencia-general": {
    key: "gerencia-general",
    label: "Bandeja Gerencia General",
    path: "/requerimientos/bandeja/gerencia-general",
    description:
      "Revisa requerimientos pendientes de aprobación final en gerencia general.",
  },
};

export const isLogisticaOperadorEffective = (user) =>
  getActiveRoleAssignments(user).some(
    (assignment) =>
      assignment.rol === "OPERADOR" && isLogisticaAssignment(assignment),
  );

export const canAccessCotizacionesEffective = (user) =>
  isAdminOverride(user) ||
  getActiveRoleAssignments(user).some(
    (assignment) =>
      ["JEFE_AREA", "OPERADOR"].includes(assignment.rol) &&
      isLogisticaAssignment(assignment),
  );

export const canAccessProveedorManagementEffective = (user = {}) =>
  hasRole(user, "ADMINISTRADOR_SISTEMA") ||
  hasRole(user, "GERENTE_ADMINISTRACION") ||
  getActiveRoleAssignments(user).some(
    (assignment) =>
      ["JEFE_AREA", "OPERADOR"].includes(assignment.rol) &&
      isLogisticaAssignment(assignment),
  );

export const canViewAllCotizacionesLogisticaEffective = (user) =>
  isAdminOverride(user) ||
  getActiveRoleAssignments(user).some(
    (assignment) =>
      assignment.rol === "JEFE_AREA" && isLogisticaAssignment(assignment),
  );

export const canViewAssignedCotizacionesLogisticaEffective = (user) =>
  isLogisticaOperadorEffective(user) &&
  !canViewAllCotizacionesLogisticaEffective(user);

export const canAccessLogisticaOperativeTrayFromRequerimientosEffective = (
  user,
) => canAccessCotizacionesEffective(user);

export const getLogisticaOperativeTrayPathEffective = (user) =>
  getCotizacionesHomePathEffective(user);

export const canAssignCotizacionesLogisticaEffective = (user) =>
  canViewAllCotizacionesLogisticaEffective(user);

export const canAdjudicateCotizacionesLogisticaEffective = (user) =>
  canAssignCotizacionesLogisticaEffective(user);

export const canOperateCotizacionesLogisticaEffective = (user, requerimiento) =>
  canViewAllCotizacionesLogisticaEffective(user) ||
  Number(
    requerimiento?.responsableLogisticaId ||
      requerimiento?.responsableLogistica?.id,
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
  if (isAdminOverride(user)) return true;

  return getActiveRoleAssignments(user).some(
    (assignment) =>
      ["JEFE_AREA", "OPERADOR"].includes(assignment.rol) &&
      isWarehouseContext(assignment),
  );
};

export const canAdjustInventoryEffective = (user = {}) => {
  if (isAdminOverride(user)) return true;

  return getActiveRoleAssignments(user).some(
    (assignment) =>
      assignment.rol === "JEFE_AREA" && isWarehouseContext(assignment),
  );
};

export const canViewWarehouseTrayEffective = (user = {}) =>
  canOperateInventoryEffective(user);

export const canCreatePedidoInternoEffective = (user = {}) =>
  hasOperationalSession(user);

export const canViewPedidosInternosModuleEffective = (user = {}) =>
  hasOperationalSession(user);

export const canApprovePedidoInternoEffective = (user = {}) =>
  hasAnyRole(user, [
    ...pedidoInternoApprovalRoles,
    "JEFE_AREA",
    "GERENTE_FUNCIONAL",
  ]);

export const canViewOrdenCompraListEffective = (user = {}) =>
  isAdminOverride(user) ||
  getActiveRoleAssignments(user).some(
    (assignment) =>
      isAdministracionOperativeAssignment(assignment) ||
      isLogisticaJefaturaAssignment(assignment),
  );

export const canViewOrdenCompraApprovalTrayEffective = (user = {}) =>
  isAdminOverride(user) ||
  hasAnyRole(user, ["GERENTE_ADMINISTRACION", "GERENTE_GENERAL"]) ||
  getActiveRoleAssignments(user).some(isLogisticaJefaturaAssignment);

export const canViewOrdenesCompraEffective = (user = {}) =>
  canViewOrdenCompraListEffective(user) ||
  canViewOrdenCompraApprovalTrayEffective(user);

export const canManageOrdenCompraLifecycleEffective = (user = {}) => {
  if (isAdminOverride(user)) return true;

  return getActiveRoleAssignments(user).some(
    isAdministracionJefaturaAssignment,
  );
};

export const canApproveOrdenCompraStageEffective = (user, ordenCompra) => {
  if (!user || !ordenCompra) return false;
  if (isAdminOverride(user)) return true;

  const pendingLevel =
    ordenCompra?.nivelPendienteActual ||
    ordenCompra?.snapshotFormal?.nivelPendienteActualSnapshot ||
    null;

  if (pendingLevel === "JEFATURA_LOGISTICA") {
    return (
      getActiveRoleAssignments(user).some(isLogisticaJefaturaAssignment) &&
      Number(ordenCompra?.snapshotFormal?.aprobadorLogisticaIdSnapshot || 0) ===
        Number(user?.id || 0)
    );
  }

  if (pendingLevel === "GERENCIA_ADMINISTRACION") {
    return (
      hasRole(user, "GERENTE_ADMINISTRACION") &&
      Number(
        ordenCompra?.snapshotFormal?.aprobadorAdministracionIdSnapshot || 0,
      ) === Number(user?.id || 0)
    );
  }

  if (pendingLevel === "GERENCIA_GENERAL") {
    if (!hasRole(user, "GERENTE_GENERAL")) return false;

    const approverId = Number(
      ordenCompra?.snapshotFormal?.aprobadorGerenciaGeneralIdSnapshot || 0,
    );

    return approverId > 0 ? approverId === Number(user?.id || 0) : true;
  }

  return false;
};

export const canViewNotaIngresoGerenciaConformidadEffective = (user = {}) =>
  isAdminOverride(user) || hasAnyRole(user, ["GERENTE_FUNCIONAL"]);

export const canActOnNoteDocument = (user, documentoFormal) => {
  if (!user || !documentoFormal) return false;
  if (isAdminOverride(user)) return true;

  const pendingLevel = documentoFormal?.nivelPendienteActual || null;
  if (!pendingLevel) return false;

  if (pendingLevel === "APROBACION_ALMACEN") {
    return (
      Number(documentoFormal?.aprobadorAlmacenIdSnapshot || 0) ===
      Number(user?.id || 0)
    );
  }

  if (pendingLevel === "CONFORMIDAD_GERENCIA") {
    return (
      Number(documentoFormal?.gerenteConformidadIdSnapshot || 0) ===
      Number(user?.id || 0)
    );
  }

  return false;
};

export const canViewAllRequerimientosEffective = (user = {}) =>
  hasAnyRole(user, [
    "ADMINISTRADOR_SISTEMA",
    "GERENTE_ADMINISTRACION",
    "GERENTE_GENERAL",
  ]);

export const canAccessGerenciaModuleEffective = (user = {}) =>
  isAdminOverride(user) ||
  hasAnyRole(user, ["GERENTE_ADMINISTRACION", "GERENTE_GENERAL"]);

export const canViewGerenciaExpedienteLogisticoEffective = (user = {}) =>
  canAccessGerenciaModuleEffective(user);

export const canViewRequerimientosModuleEffective = (user = {}) =>
  hasOperationalSession(user);

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

const getPendingApprovalStageDetail = (requerimiento = {}) =>
  Array.isArray(requerimiento?.rutaAprobacionDetalle)
    ? requerimiento.rutaAprobacionDetalle.find(
        (step) => step?.esPendiente || step?.estadoEtapa === "PENDIENTE",
      ) || null
    : null;

export const canEditRequerimientoEffective = (user, requerimiento) => {
  if (!user || !requerimiento) return false;
  if (requerimiento.estadoDocumento === "ANULADO") return false;
  if (
    requerimiento.estadoDocumento === "APROBADO_SIN_MODIFICACIONES" ||
    requerimiento.estadoDocumento === "APROBADO_CON_MODIFICACIONES"
  ) {
    return false;
  }

  if (isAdminOverride(user)) return true;

  const pendingStage = getPendingApprovalStageDetail(requerimiento);
  const isOwner =
    Number(
      requerimiento.solicitante?.id || requerimiento.solicitanteId || 0,
    ) === Number(user?.id || 0);
  const isCurrentPendingApprover =
    Number(pendingStage?.aprobadorId || 0) > 0 &&
    Number(pendingStage.aprobadorId) === Number(user?.id || 0);

  if (isCurrentPendingApprover) return true;

  if (!isOwner) return false;

  if (!pendingStage) {
    return (
      requerimiento.estadoDocumento === "GENERADO" &&
      requerimiento.estadoFlujo === "GENERADO"
    );
  }

  return pendingStage.nivelLegacy === "JEFATURA";
};

export const getAvailableApprovalTraysEffective = (user = {}) => {
  const trays = [];

  if (canApproveJefaturaEffective(user) || isAdminOverride(user)) {
    trays.push(trayDefinitions.jefatura);
  }

  if (canApproveGerenciaAreaEffective(user) || isAdminOverride(user)) {
    trays.push(trayDefinitions["gerencia-area"]);
  }

  if (
    canApproveGerenciaAdministracionEffective(user) ||
    isAdminOverride(user)
  ) {
    trays.push(trayDefinitions["gerencia-administracion"]);
  }

  if (canApproveGerenciaGeneralEffective(user) || isAdminOverride(user)) {
    trays.push(trayDefinitions["gerencia-general"]);
  }

  return trays;
};

export const getTrayGuidanceEffective = (user = {}, nivel) => {
  if (isAdminOverride(user)) {
    return "Como administrador, esta bandeja muestra el nivel seleccionado según lo que devuelve el backend.";
  }

  if (nivel === "jefatura" || nivel === "gerencia-area") {
    return "Esta bandeja solo muestra requerimientos donde eres el aprobador efectivo asignado en esta etapa.";
  }

  return "Esta bandeja muestra solo requerimientos pendientes del nivel actual.";
};

export const getTrayEmptyStateEffective = (
  user = {},
  nivel,
  hasActiveFilters = false,
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
        "El backend no devolvió expedientes pendientes para la etapa seleccionada.",
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
      "En este momento no hay expedientes pendientes para este nivel de aprobación.",
  };
};

export const canAccessUserManagementEffective = (user = {}) =>
  hasAnyRole(user, USER_MANAGEMENT_ADMIN_ROLES);

// Regla explícita para operaciones de mantenimiento SUNAT (actualización de padrón).
// Separada de canAccessUserManagementEffective para que si los roles divergen en el futuro
// se pueda ajustar de forma independiente sin afectar la gestión de usuarios.
export const canManageSunatEffective = (user = {}) =>
  hasAnyRole(user, USER_MANAGEMENT_ADMIN_ROLES);

export const canAccessCompanySettingsEffective = (user = {}) =>
  hasAnyRole(user, COMPANY_SETTINGS_ADMIN_ROLES);

export const canAccessAreasManagementEffective = (user = {}) =>
  canAccessUserManagementEffective(user);

export const canManageCatalogMasterEffective = (user = {}) =>
  hasRole(user, "ADMINISTRADOR_SISTEMA") ||
  getActiveRoleAssignments(user).some(
    (assignment) =>
      assignment.rol === "JEFE_AREA" && isWarehouseContext(assignment),
  );

export const canAccessAdministrationCatalogsEffective = (user = {}) => {
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
    isAdministracionContext(assignment),
  );
};

export const canCreateUsersEffective = (user = {}) =>
  canAccessUserManagementEffective(user);

export const canEditUsersEffective = (user = {}) =>
  canAccessUserManagementEffective(user);

export const canToggleUserStatusEffective = (user = {}) =>
  canAccessUserManagementEffective(user);

export const canAssignSystemAdminRoleEffective = (user = {}) =>
  hasRole(user, "ADMINISTRADOR_SISTEMA");

export const getRequerimientosHomePathEffective = (user = {}) => {
  const trays = getAvailableApprovalTraysEffective(user);
  return trays[0]?.path || "/requerimientos";
};

export const getPedidosInternosHomePathEffective = (user = {}) => {
  if (canViewWarehouseTrayEffective(user)) return "/notas-pedido/almacen";
  if (canApprovePedidoInternoEffective(user))
    return "/notas-pedido/aprobaciones";
  if (canCreatePedidoInternoEffective(user)) return "/notas-pedido/nueva";
  return "/notas-pedido";
};

export const getAdministrationHomePathEffective = (user = {}) => {
  if (canAccessUserManagementEffective(user)) return "/gestion-usuarios";
  if (canManageCatalogMasterEffective(user)) {
    return "/gestion-productos";
  }
  return "/dashboard";
};

export const getPrimaryNavigationLinksEffective = (user = {}) => {
  const links = [
    { to: "/", label: "Inicio" },
    { to: "/dashboard", label: "Dashboard" },
  ];

  if (!hasOperationalSession(user)) {
    return links;
  }

  if (canViewRequerimientosModuleEffective(user)) {
    links.push({
      to: getRequerimientosHomePathEffective(user),
      label: "Requerimientos",
    });
  }

  if (canViewPedidosInternosModuleEffective(user)) {
    links.push({
      to: getPedidosInternosHomePathEffective(user),
      label: "Notas de pedido",
    });
  }

  if (canOperateInventoryEffective(user)) {
    links.push({ to: "/inventario-stock", label: "Inventario" });
  }

  if (canAccessCotizacionesEffective(user)) {
    links.push({
      to: getCotizacionesHomePathEffective(user),
      label: "Atención Logística",
    });
  }

  if (canViewOrdenesCompraEffective(user)) {
    links.push({ to: "/ordenes-compra", label: "Ordenes de compra" });
  }

  if (
    canManageCatalogMasterEffective(user) ||
    canAccessUserManagementEffective(user)
  ) {
    links.push({
      to: getAdministrationHomePathEffective(user),
      label: "Gestión",
    });
  }

  return links.filter(
    (link, index, collection) =>
      collection.findIndex((current) => current.to === link.to) === index,
  );
};
