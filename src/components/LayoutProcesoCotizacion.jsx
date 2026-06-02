// src/components/LayoutProcesoCotizacion.jsx
import React, { useCallback, useEffect, useState } from "react";
import { useParams, useLocation, Outlet } from "react-router-dom";
import { CircleAlert } from "lucide-react";
import useLogisticaCotizaciones from "../hooks/useLogisticaCotizaciones";
import HeaderProcesoLogistico from "./HeaderProcesoLogistico";
import Loader from "./Loader";
import ResumenProcesoLogisticoSkeleton from "./ui/skeletons/ResumenProcesoLogisticoSkeleton";
import SolicitudesProcesoLogisticoSkeleton from "./ui/skeletons/SolicitudesProcesoLogisticoSkeleton";

const LayoutProcesoCotizacion = () => {
  const { id } = useParams();
  const location = useLocation();
  const { obtenerDetalle, cargando, error } = useLogisticaCotizaciones();
  const [activeTab, setActiveTab] = useState("detalle");
  const [detalleGlobal, setDetalleGlobal] = useState(null);
  const normalizedPath = location.pathname.replace(/\/+$/, "");
  const procesoBasePath = `/cotizaciones/proceso/${id}`;
  const isResumenRoute = normalizedPath === procesoBasePath;
  const isSolicitudesRoute = normalizedPath === `${procesoBasePath}/solicitudes`;

  const cargarDetalle = useCallback(async () => {
    try {
      const data = await obtenerDetalle(id);
      setDetalleGlobal(data);
      return data;
    } catch (err) {
      console.error("Error al obtener detalle de cotizacion:", err);
      throw err;
    }
  }, [id, obtenerDetalle]);

  useEffect(() => {
    cargarDetalle().catch(() => {});
  }, [cargarDetalle]);

  return (
    <div className="w-full min-w-0 p-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <HeaderProcesoLogistico
        id={id}
        location={location}
        detalleGlobal={detalleGlobal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <main className="min-w-0 mt-4 overflow-x-hidden">
        {cargando ? (
          isSolicitudesRoute ? (
            <SolicitudesProcesoLogisticoSkeleton />
          ) : isResumenRoute ? (
            <ResumenProcesoLogisticoSkeleton />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader className="animate-spin" />
              <p className="text-sm font-medium text-gray-600">
                Cargando detalle de cotizacion...
              </p>
            </div>
          )
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <CircleAlert className="text-red-500 shrink-0" size={48} />
            <p className="font-semibold">Error al cargar detalles:</p>
            <p>{error}</p>
          </div>
        ) : (
          <Outlet
            context={{
              id,
              detalleGlobal,
              setDetalleGlobal,
              recargarDetalle: cargarDetalle,
              loading: cargando,
              error,
              activeTab,
              setActiveTab,
            }}
          />
        )}
      </main>
    </div>
  );
};

export default LayoutProcesoCotizacion;
