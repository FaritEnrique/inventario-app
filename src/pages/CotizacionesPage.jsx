import React from "react";
import { Navigate } from "react-router-dom";
import { getCotizacionesHomePathEffective } from "../accessRules";
import { useAuth } from "../context/authContext";

const CotizacionesPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Cargando acceso a cotizaciones...</div>;
  }

  return <Navigate to={getCotizacionesHomePathEffective(user)} replace />;
};

export default CotizacionesPage;
