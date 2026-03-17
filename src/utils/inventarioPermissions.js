const privilegedRoles = new Set([
  "ADMINISTRADOR_SISTEMA",
  "GERENTE_GENERAL",
  "GERENTE_ADMINISTRACION",
]);

const warehouseRoleCandidates = new Set(["JEFE_AREA", "OTROS"]);
const operationsManagerRoles = new Set(["GERENTE_FUNCIONAL", "GERENTE_GENERAL"]);

const normalize = (value) =>
  (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const isWarehouseContext = (user = {}) => {
  const areaNombre = normalize(user.areaNombre || user.area?.nombre);
  const areaAbreviatura = normalize(
    user.areaAbreviatura || user.area?.abreviatura
  );

  return (
    areaNombre.includes("almacen") ||
    areaAbreviatura === "alm" ||
    areaAbreviatura === "alma"
  );
};

const isOperationsContext = (user = {}) => {
  const areaNombre = normalize(user.areaNombre || user.area?.nombre);
  const areaAbreviatura = normalize(
    user.areaAbreviatura || user.area?.abreviatura
  );

  return (
    areaNombre.includes("operaciones") ||
    areaNombre.includes("operacion") ||
    areaAbreviatura === "ope" ||
    areaAbreviatura === "opr"
  );
};

export const canOperateInventory = (user = {}) => {
  if (privilegedRoles.has(user.rol)) return true;
  if (warehouseRoleCandidates.has(user.rol) && isWarehouseContext(user)) {
    return true;
  }
  if (operationsManagerRoles.has(user.rol) && isOperationsContext(user)) {
    return true;
  }
  return false;
};

export const canAdjustInventory = (user = {}) => {
  if (privilegedRoles.has(user.rol)) return true;
  if (isWarehouseContext(user) && warehouseRoleCandidates.has(user.rol)) {
    return true;
  }
  if (operationsManagerRoles.has(user.rol) && isOperationsContext(user)) {
    return true;
  }
  return false;
};

export const canApprovePedidoInterno = (user = {}) => {
  if (privilegedRoles.has(user.rol)) return true;
  return user.rol === "JEFE_AREA";
};

export const canViewWarehouseTray = (user = {}) => canOperateInventory(user);

export const canCreatePedidoInterno = (user = {}) =>
  Boolean(user?.id && user?.activo !== false);
