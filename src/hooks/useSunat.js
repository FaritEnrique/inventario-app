import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import sunatApi from "../api/sunatApi";

const useSunat = () => {
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actualizando, setActualizando] = useState(false);

  const obtenerUltimaActualizacion = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sunatApi.obtenerUltimaActualizacion();
      setUltimaActualizacion(data?.ultimaActualizacion || null);
      return data;
    } catch (err) {
      toast.error("Error al obtener última actualización del padrón SUNAT.");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarPadronSunat = useCallback(async () => {
    if (actualizando) {
      toast.warn("Ya hay una actualización en curso. Espere a que finalice.");
      return;
    }
    setActualizando(true);
    try {
      await toast.promise(sunatApi.actualizarPadronSunat(), {
        pending: "Actualizando padrón SUNAT, esto puede tardar unos minutos...",
        success: "✅ Padrón SUNAT actualizado exitosamente.",
        error: "❌ Error al actualizar el padrón SUNAT.",
      });
      await obtenerUltimaActualizacion();
    } catch (err) {
      console.error("Error en actualizarPadronSunat:", err);
    } finally {
      setActualizando(false);
    }
  }, [actualizando, obtenerUltimaActualizacion]);

  const consultarPadronSunat = useCallback(async (ruc) => {
    if (!ruc || !/^\d{11}$/.test(ruc)) return null;

    setLoading(true);
    try {
      const response = await sunatApi.consultarPadronSunat(ruc);

      if (!response?.ok) return null;

      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.error("Error consultando SUNAT:", err);
      toast.error("No se pudo conectar con SUNAT. Verifica tu conexión.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    ultimaActualizacion,
    loading,
    actualizando,
    actualizarPadronSunat,
    obtenerUltimaActualizacion,
    consultarPadronSunat,
  };
};

export default useSunat;
