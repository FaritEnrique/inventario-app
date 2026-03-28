import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import sunatApi from "../api/sunatApi";

const useSunat = () => {
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [ultimaActualizacionReducido, setUltimaActualizacionReducido] =
    useState(null);
  const [loading, setLoading] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [actualizandoReducido, setActualizandoReducido] = useState(false);

  const obtenerUltimaActualizacion = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sunatApi.obtenerUltimaActualizacion();
      setUltimaActualizacion(data?.ultimaActualizacion || null);
      return data;
    } catch (err) {
      toast.error("Error al obtener la ultima actualizacion del padron SUNAT.");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const obtenerUltimaActualizacionReducido = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sunatApi.obtenerUltimaActualizacionReducido();
      setUltimaActualizacionReducido(
        data?.ultimaActualizacionReducido || null
      );
      return data;
    } catch (err) {
      toast.error(
        "Error al obtener la ultima actualizacion del padron reducido."
      );
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarPadronSunat = useCallback(async () => {
    if (actualizando) {
      toast.warn("Ya hay una actualizacion en curso. Espera a que finalice.");
      return null;
    }

    setActualizando(true);
    try {
      toast.info("Actualizando padron SUNAT, esto puede tardar unos minutos...");

      const response = await sunatApi.actualizarPadronSunat();
      const mensaje =
        response?.mensaje ||
        response?.message ||
        "Padron SUNAT actualizado correctamente.";

      if (response?.updated === false) {
        toast.info(mensaje);
      } else {
        toast.success(mensaje);
      }

      await obtenerUltimaActualizacion();
      return response;
    } catch (err) {
      console.error("Error en actualizarPadronSunat:", err);
      toast.error(err?.message || "Error al actualizar el padron SUNAT.");
      return null;
    } finally {
      setActualizando(false);
    }
  }, [actualizando, obtenerUltimaActualizacion]);

  const actualizarPadronReducido = useCallback(async () => {
    if (actualizandoReducido) {
      toast.warn("Ya hay una actualizacion del padron reducido en curso.");
      return null;
    }

    setActualizandoReducido(true);
    try {
      toast.info(
        "Actualizando padron reducido, esto puede tardar unos minutos..."
      );

      const response = await sunatApi.actualizarPadronReducido();
      const mensaje =
        response?.mensaje ||
        response?.message ||
        "Padron reducido actualizado correctamente.";

      if (response?.updated === false) {
        toast.info(mensaje);
      } else {
        toast.success(mensaje);
      }

      await obtenerUltimaActualizacionReducido();
      return response;
    } catch (err) {
      console.error("Error en actualizarPadronReducido:", err);
      toast.error(err?.message || "Error al actualizar el padron reducido.");
      return null;
    } finally {
      setActualizandoReducido(false);
    }
  }, [actualizandoReducido, obtenerUltimaActualizacionReducido]);

  const consultarPadronSunat = useCallback(async (ruc) => {
    if (!ruc || !/^\d{11}$/.test(ruc)) return null;

    setLoading(true);
    try {
      const response = await sunatApi.consultarPadronSunat(ruc);

      if (!response?.ok) return null;

      if (
        response.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
      ) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.error("Error consultando SUNAT:", err);
      toast.error("No se pudo conectar con SUNAT. Verifica tu conexion.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    ultimaActualizacion,
    ultimaActualizacionReducido,
    loading,
    actualizando,
    actualizandoReducido,
    actualizarPadronSunat,
    actualizarPadronReducido,
    obtenerUltimaActualizacion,
    obtenerUltimaActualizacionReducido,
    consultarPadronSunat,
  };
};

export default useSunat;
