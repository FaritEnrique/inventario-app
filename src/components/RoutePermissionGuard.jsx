import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";

const RoutePermissionGuard = ({ allow, redirectTo = "/dashboard", children }) => {
  const { user, loading, activeContext, contextSelectionRequired } = useAuth();
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
