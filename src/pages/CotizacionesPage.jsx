import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  canAccessCotizacionesEffective,
  getCotizacionesHomePathEffective,
  hasLogisticaJefaturaContext,
  hasLogisticaOperadorContext,
} from "../accessRules";
import { useAuth } from "../context/authContext";

const CotizacionesPage = () => {
  const { user, loading, availableContexts } = useAuth();
  const location = useLocation();
  const hasJefaturaContext = hasLogisticaJefaturaContext(availableContexts);
  const hasOperadorContext = hasLogisticaOperadorContext(availableContexts);
  const canAccess = canAccessCotizacionesEffective(user);

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Cargando acceso a cotizaciones…</div>;
  }

  if (!canAccess && (hasJefaturaContext || hasOperadorContext)) {
    return (
      <Navigate
        to="/seleccionar-contexto"
        replace
        state={{
          from: location,
          reason: "CONTEXT_INCOMPATIBLE",
          expectedContext: hasJefaturaContext ? "logistica-jefatura" : "logistica-operador",
        }}
      />
    );
  }

  return <Navigate to={getCotizacionesHomePathEffective(user)} replace />;
};

export default CotizacionesPage;
