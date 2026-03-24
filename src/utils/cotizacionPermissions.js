import { hasRole } from "./userRoles";

const technicalOverrideRoles = new Set(["ADMINISTRADOR_SISTEMA"]);

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

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

export const isPrivilegedLogisticaRole = (user) =>
  technicalOverrideRoles.has(user?.rol) || hasRole(user, "ADMINISTRADOR_SISTEMA");

export const isLogisticaAreaUser = (user) =>
  isLogisticaScope([
    user?.areaNombre,
    user?.areaAbreviatura,
    user?.area?.nombre,
    user?.area?.abreviatura,
    user?.area?.codigo,
  ]);

export const isLogisticaJefatura = (user) =>
  hasRole(user, "JEFE_AREA") && isLogisticaAreaUser(user);

export const isLogisticaOperador = (user) =>
  hasRole(user, "OPERADOR") && isLogisticaAreaUser(user);

export const canAccessCotizaciones = (user) =>
  isPrivilegedLogisticaRole(user) ||
  isLogisticaJefatura(user) ||
  isLogisticaOperador(user);

export const canViewAllCotizacionesLogistica = (user) =>
  isPrivilegedLogisticaRole(user) || isLogisticaJefatura(user);

export const canAssignCotizacionesLogistica = (user) =>
  hasRole(user, "ADMINISTRADOR_SISTEMA") || isLogisticaJefatura(user);

export const canAdjudicateCotizacionesLogistica = (user) =>
  canAssignCotizacionesLogistica(user);

export const isLogisticaResponsible = (user, requerimiento) =>
  Number(user?.id) > 0 &&
  Number(
    requerimiento?.responsableLogisticaId || requerimiento?.responsableLogistica?.id
  ) === Number(user.id);

export const canOperateCotizacionesLogistica = (user, requerimiento) =>
  canViewAllCotizacionesLogistica(user) || isLogisticaResponsible(user, requerimiento);

export const getCotizacionesHomePath = (user) => {
  if (canViewAllCotizacionesLogistica(user)) {
    return "/cotizaciones/bandeja/jefatura";
  }

  if (isLogisticaOperador(user)) {
    return "/cotizaciones/bandeja/operador";
  }

  return "/dashboard";
};

export default {
  isPrivilegedLogisticaRole,
  isLogisticaAreaUser,
  isLogisticaJefatura,
  isLogisticaOperador,
  canAccessCotizaciones,
  canViewAllCotizacionesLogistica,
  canAssignCotizacionesLogistica,
  canAdjudicateCotizacionesLogistica,
  isLogisticaResponsible,
  canOperateCotizacionesLogistica,
  getCotizacionesHomePath,
};
