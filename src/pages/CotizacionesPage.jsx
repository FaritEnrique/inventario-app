import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { getCotizacionesHomePath } from "../utils/cotizacionPermissions";

const CotizacionesPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Cargando acceso a cotizaciones...</div>;
  }

  return <Navigate to={getCotizacionesHomePath(user)} replace />;
};

export default CotizacionesPage;
