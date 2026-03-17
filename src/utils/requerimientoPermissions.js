export const canViewAllRequerimientos = (user) =>
  ["ADMINISTRADOR_SISTEMA", "GERENTE_ADMINISTRACION", "GERENTE_GENERAL"].includes(
    user?.rol
  );

export const canSelectAreaRequerimiento = (user) =>
  canViewAllRequerimientos(user);

export const canApproveJefatura = (user) => user?.rol === "JEFE_AREA";

export const canApproveGerenciaArea = (user) =>
  user?.rol === "GERENTE_FUNCIONAL";

export const canApproveGerenciaAdministracion = (user) =>
  user?.rol === "GERENTE_ADMINISTRACION";

export const canApproveGerenciaGeneral = (user) =>
  user?.rol === "GERENTE_GENERAL";

const isAdminOverride = (user) => user?.rol === "ADMINISTRADOR_SISTEMA";

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
      return user?.rol === "JEFE_AREA" || user?.rol === "ADMINISTRADOR_SISTEMA";
    case "gerencia-area":
      return (
        user?.rol === "GERENTE_FUNCIONAL" ||
        user?.rol === "ADMINISTRADOR_SISTEMA"
      );
    case "gerencia-administracion":
      return (
        user?.rol === "GERENTE_ADMINISTRACION" ||
        user?.rol === "GERENTE_GENERAL" ||
        user?.rol === "ADMINISTRADOR_SISTEMA"
      );
    case "gerencia-general":
      return (
        user?.rol === "GERENTE_GENERAL" ||
        user?.rol === "ADMINISTRADOR_SISTEMA"
      );
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
