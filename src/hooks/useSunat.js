// src/hooks/useSunat.js
import { useState } from "react";
import { toast } from "react-toastify";
import sunatApi from "../api/sunatApi";

const useSunat = () => {
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actualizando, setActualizando] = useState(false);

  /**
   * 1. Actualizar el padrón SUNAT
   */
  const actualizarPadronSunat = async () => {
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
  };

  /**
   * 2. Obtener última actualización
   */
  const obtenerUltimaActualizacion = async () => {
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
  };

  /**
   * 3. Consultar padrón SUNAT por RUC
   */
  const consultarPadronSunat = async (ruc) => {
    if (!ruc || !/^\d{11}$/.test(ruc)) return null;

    setLoading(true);
    try {
      const response = await sunatApi.consultarPadronSunat(ruc);

      // RUC no encontrado -> ok: false, sin error en consola
      if (!response?.ok) return null;

      if (response.data) {
        const p = response.data;
        return {
          ruc: p.ruc,
          nombre: p.razonSocial || "",
          nombreComercial: p.nombreComercial || "",
          direccion: p.direccion || "",
          condicion: p.condicion || "",
          tipo: p.tipo || "",
          estado: p.estado || "",
        };
      }
      return null;
    } catch (err) {
      // Solo errores de conexión reales se loguean
      console.error("Error consultando SUNAT:", err);
      toast.error("No se pudo conectar con SUNAT. Verifica tu conexión.");
      return null;
    } finally {
      setLoading(false);
    }
  };

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