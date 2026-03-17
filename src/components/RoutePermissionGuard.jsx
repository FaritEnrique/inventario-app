import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";

const RoutePermissionGuard = ({ allow, redirectTo = "/dashboard", children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Validando acceso...</div>;
  }

  if (typeof allow === "function" && !allow(user)) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children;
};

export default RoutePermissionGuard;
