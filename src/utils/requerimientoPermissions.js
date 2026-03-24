import { hasAnyRole, hasRole } from "./userRoles";

export const canViewAllRequerimientos = (user) =>
  hasAnyRole(user, [
    "ADMINISTRADOR_SISTEMA",
    "GERENTE_ADMINISTRACION",
    "GERENTE_GENERAL",
  ]);

export const canSelectAreaRequerimiento = (user) =>
  canViewAllRequerimientos(user);

export const canApproveJefatura = (user) => hasRole(user, "JEFE_AREA");

export const canApproveGerenciaArea = (user) =>
  hasRole(user, "GERENTE_FUNCIONAL");

export const canApproveGerenciaAdministracion = (user) =>
  hasRole(user, "GERENTE_ADMINISTRACION");

export const canApproveGerenciaGeneral = (user) =>
  hasRole(user, "GERENTE_GENERAL");

const isAdminOverride = (user) => hasRole(user, "ADMINISTRADOR_SISTEMA");

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

export const canAccessTrayLevel = (user, nivel) => {
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

export const canEditRequerimiento = (user, requerimiento) => {
  if (!user || !requerimiento) return false;
  if (requerimiento.estadoDocumento === "ANULADO") return false;
  if (
    requerimiento.estadoDocumento === "APROBADO_SIN_MODIFICACIONES" ||
    requerimiento.estadoDocumento === "APROBADO_CON_MODIFICACIONES"
  ) {
    return false;
  }

  if (canViewAllRequerimientos(user)) return true;

  const sameArea =
    Number(user?.areaId || 0) === Number(requerimiento.areaId || 0);
  const isOwner =
    Number(requerimiento.solicitante?.id || 0) === Number(user?.id || 0);
  const isAssignedLeader =
    Number(requerimiento.jefe?.id || 0) === Number(user?.id || 0) ||
    Number(requerimiento.gerente?.id || 0) === Number(user?.id || 0);

  return sameArea && (isOwner || isAssignedLeader);
};

export const getAvailableApprovalTrays = (user) => {
  const trays = [];

  if (canApproveJefatura(user) || isAdminOverride(user)) {
    trays.push(trayDefinitions.jefatura);
  }

  if (canApproveGerenciaArea(user) || isAdminOverride(user)) {
    trays.push(trayDefinitions["gerencia-area"]);
  }

  if (canApproveGerenciaAdministracion(user) || isAdminOverride(user)) {
    trays.push(trayDefinitions["gerencia-administracion"]);
  }

  if (canApproveGerenciaGeneral(user) || isAdminOverride(user)) {
    trays.push(trayDefinitions["gerencia-general"]);
  }

  return trays;
};

export const getTrayGuidance = (user, nivel) => {
  if (isAdminOverride(user)) {
    return "Como administrador, esta bandeja muestra el nivel seleccionado segun lo que devuelve el backend.";
  }

  if (nivel === "jefatura" || nivel === "gerencia-area") {
    return "Esta bandeja solo muestra requerimientos donde eres el aprobador efectivo asignado en esta etapa.";
  }

  return "Esta bandeja muestra solo requerimientos pendientes del nivel actual.";
};

export const getTrayEmptyState = (user, nivel, hasActiveFilters = false) => {
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
