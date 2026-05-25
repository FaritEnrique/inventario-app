import React from "react";
import { useOutletContext } from "react-router-dom";

const SolicitudesProcesoLogisticoPage = () => {
  const { id, detalleGlobal, loading, error } = useOutletContext();
  return (
    <section>
      <h2>Solicitudes Proceso Logístico</h2>
      <pre>
        {JSON.stringify({ id, detalleGlobal, loading, error }, null, 2)}
      </pre>
    </section>
  );
};

export default SolicitudesProcesoLogisticoPage;
