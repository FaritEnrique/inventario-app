import { hasAnyRole } from "./userRoles";

const privilegedAreaRoles = [
  "ADMINISTRADOR_SISTEMA",
  "GERENTE_GENERAL",
  "GERENTE_ADMINISTRACION",
];

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isAdministracionArea = (user) => {
  const candidates = [
    user?.areaNombre,
    user?.areaAbreviatura,
    user?.area?.nombre,
    user?.area?.abreviatura,
  ]
    .map(normalize)
    .filter(Boolean);

  return candidates.some(
    (value) =>
      value === "administracion" ||
      value === "adm" ||
      value.includes("administracion")
  );
};

export const canViewOrdenesCompra = (user) =>
  Boolean(user?.id && user?.activo !== false);

export const canApproveOrdenCompra = (user) =>
  hasAnyRole(user, ["ADMINISTRADOR_SISTEMA", "GERENTE_GENERAL"]);

export const canManageOrdenCompraLifecycle = (user) =>
  hasAnyRole(user, privilegedAreaRoles) || isAdministracionArea(user);

export default {
  canViewOrdenesCompra,
  canApproveOrdenCompra,
  canManageOrdenCompraLifecycle,
};
