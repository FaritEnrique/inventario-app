import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import cotizacionesApi from "../api/cotizacionesApi";

const useCotizaciones = ({ autoLoad = true } = {}) => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarCotizaciones = async () => {
    try {
      setCargando(true);
      const data = await cotizacionesApi.obtenerTodas();
      setCotizaciones(data);
      setError(null);
    } catch (err) {
      console.error("Error cargando cotizaciones:", err);
      setError("No se pudieron cargar las cotizaciones.");
      toast.error("Error al cargar cotizaciones.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      cargarCotizaciones();
    } else {
      setCargando(false);
    }
  }, [autoLoad]);

  const crearCotizacion = async (cotizacion) => {
    try {
      const nuevaCotizacion = await cotizacionesApi.crear(cotizacion);
      setCotizaciones((prev) => [...prev, nuevaCotizacion]);
      toast.success("Cotizacion creada con exito.");
      return nuevaCotizacion;
    } catch (err) {
      console.error("Error creando cotizacion:", err);
      const errorMessage = err.message || "Error al crear cotizacion.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const actualizarCotizacion = async (id, datos) => {
    try {
      const cotizacionActualizada = await cotizacionesApi.actualizar(id, datos);
      setCotizaciones((prev) =>
        prev.map((cotizacion) =>
          cotizacion.id === id ? cotizacionActualizada : cotizacion
        )
      );
      toast.success("Cotizacion actualizada con exito.");
      return cotizacionActualizada;
    } catch (err) {
      console.error("Error actualizando cotizacion:", err);
      const errorMessage = err.message || "Error al actualizar cotizacion.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const adjudicarCotizacion = async (id, payload = {}) => {
    try {
      const cotizacionAdjudicada = await cotizacionesApi.adjudicar(id, payload);
      const requerimientoId =
        cotizacionAdjudicada?.solicitud?.requerimiento?.id ??
        cotizacionAdjudicada?.solicitud?.requerimientoId ??
        null;

      setCotizaciones((prev) =>
        prev.map((cotizacion) => {
          const currentRequerimientoId =
            cotizacion?.solicitud?.requerimiento?.id ??
            cotizacion?.solicitud?.requerimientoId ??
            null;

          if (cotizacion.id === cotizacionAdjudicada.id) {
            return cotizacionAdjudicada;
          }

          if (
            requerimientoId &&
            currentRequerimientoId === requerimientoId &&
            cotizacion.estado !== "Rechazada"
          ) {
            return {
              ...cotizacion,
              estado: "Descartada",
            };
          }

          return cotizacion;
        })
      );

      toast.success(
        "Adjudicacion directa excepcional registrada con exito."
      );
      return cotizacionAdjudicada;
    } catch (err) {
      console.error("Error adjudicando cotizacion:", err);
      const errorMessage =
        err.message ||
        "Error al registrar la adjudicacion directa excepcional.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const eliminarCotizacion = async (id) => {
    try {
      await cotizacionesApi.eliminar(id);
      setCotizaciones((prev) => prev.filter((cotizacion) => cotizacion.id !== id));
      toast.success("Cotizacion eliminada con exito.");
    } catch (err) {
      console.error("Error eliminando cotizacion:", err);
      const errorMessage = err.message || "Error al eliminar cotizacion.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    cotizaciones,
    cargando,
    error,
    cargarCotizaciones,
    crearCotizacion,
    actualizarCotizacion,
    adjudicarCotizacion,
    eliminarCotizacion,
  };
};

export default useCotizaciones;
