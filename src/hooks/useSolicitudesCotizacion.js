import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import solicitudesCotizacionApi from "../api/solicitudesCotizacionApi";

const useSolicitudesCotizacion = ({ autoLoad = true } = {}) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarSolicitudes = async () => {
    try {
      setCargando(true);
      const data = await solicitudesCotizacionApi.obtenerTodas();
      setSolicitudes(data);
      setError(null);
    } catch (err) {
      console.error("Error cargando solicitudes de cotizacion:", err);
      setError("No se pudieron cargar las solicitudes de cotizacion.");
      toast.error("Error al cargar solicitudes de cotizacion.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      cargarSolicitudes();
    } else {
      setCargando(false);
    }
  }, [autoLoad]);

  const crearSolicitud = async (solicitud) => {
    try {
      const nuevaSolicitud = await solicitudesCotizacionApi.crear(solicitud);
      setSolicitudes((prev) => [...prev, nuevaSolicitud]);
      toast.success("Solicitud de cotizacion creada con exito.");
      return nuevaSolicitud;
    } catch (err) {
      console.error("Error creando solicitud de cotizacion:", err);
      const errorMessage =
        err.message || "Error al crear solicitud de cotizacion.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const actualizarSolicitud = async (id, datos) => {
    try {
      const solicitudActualizada = await solicitudesCotizacionApi.actualizar(
        id,
        datos
      );
      setSolicitudes((prev) =>
        prev.map((solicitud) =>
          solicitud.id === id ? solicitudActualizada : solicitud
        )
      );
      toast.success("Solicitud de cotizacion actualizada con exito.");
      return solicitudActualizada;
    } catch (err) {
      console.error("Error actualizando solicitud de cotizacion:", err);
      const errorMessage =
        err.message || "Error al actualizar solicitud de cotizacion.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const eliminarSolicitud = async (id) => {
    try {
      await solicitudesCotizacionApi.eliminar(id);
      setSolicitudes((prev) =>
        prev.filter((solicitud) => solicitud.id !== id)
      );
      toast.success("Solicitud de cotizacion eliminada con exito.");
    } catch (err) {
      console.error("Error eliminando solicitud de cotizacion:", err);
      const errorMessage =
        err.message || "Error al eliminar solicitud de cotizacion.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    solicitudes,
    cargando,
    error,
    cargarSolicitudes,
    crearSolicitud,
    actualizarSolicitud,
    eliminarSolicitud,
  };
};

export default useSolicitudesCotizacion;
