import { hasAnyRole, hasRole } from "./userRoles";

export const USER_MANAGEMENT_ADMIN_ROLES = Object.freeze([
  "ADMINISTRADOR_SISTEMA",
  "GERENTE_ADMINISTRACION",
]);

export const canAccessUserManagement = (user) =>
  hasAnyRole(user, USER_MANAGEMENT_ADMIN_ROLES);

export const canCreateUsers = (user) => canAccessUserManagement(user);

export const canEditUsers = (user) => canAccessUserManagement(user);

export const canToggleUserStatus = (user) => canAccessUserManagement(user);

export const canAssignSystemAdminRole = (user) =>
  hasRole(user, "ADMINISTRADOR_SISTEMA");

export default {
  USER_MANAGEMENT_ADMIN_ROLES,
  canAccessUserManagement,
  canCreateUsers,
  canEditUsers,
  canToggleUserStatus,
  canAssignSystemAdminRole,
};
