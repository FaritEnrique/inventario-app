import React from "react";
import { useOutletContext } from "react-router-dom";

const CotizacionesProcesoLogisticoPage = () => {
  const { id, detalleGlobal, loading, error } = useOutletContext();

  return (
    <section>
      <h2>Cotizaciones Proceso Logistico</h2>
      <pre>
        {JSON.stringify({ id, detalleGlobal, loading, error }, null, 2)}
      </pre>
    </section>
  );
};

export default CotizacionesProcesoLogisticoPage;
