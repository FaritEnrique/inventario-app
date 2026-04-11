import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  hasLogisticaJefaturaContext,
  hasLogisticaOperadorContext,
  hasAnyLogisticaContext,
} from "../accessRules";
import { useAuth } from "../context/authContext";

const RoutePermissionGuard = ({
  allow,
  redirectTo = "/dashboard",
  contextGate,
  children,
}) => {
  const {
    user,
    loading,
    activeContext,
    contextSelectionRequired,
    availableContexts,
  } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Validando acceso...</div>;
  }

  if (contextSelectionRequired || !activeContext) {
    return (
      <Navigate
        to="/seleccionar-contexto"
        replace
        state={{ from: location }}
      />
    );
  }

  if (typeof allow === "function" && !allow(user)) {
    const canSwitchLogistica =
      contextGate === "logistica-jefatura"
        ? hasLogisticaJefaturaContext(availableContexts)
        : contextGate === "logistica-operador"
          ? hasLogisticaOperadorContext(availableContexts)
          : contextGate === "logistica-access"
            ? hasAnyLogisticaContext(availableContexts)
            : false;

    if (canSwitchLogistica) {
      return (
        <Navigate
          to="/seleccionar-contexto"
          replace
          state={{
            from: location,
            reason: "CONTEXT_INCOMPATIBLE",
            expectedContext: contextGate,
          }}
        />
      );
    }

    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: location, deniedByContext: true }}
      />
    );
  }

  return children;
};

export default RoutePermissionGuard;
