// src/api/sunatApi.js
import apiFetch from "./apiFetch";

const sunatApi = {
  /**
   * Dispara la actualización del padrón SUNAT
   */
  actualizarPadronSunat: async () => {
    return await apiFetch("sunat/actualizar", {
      method: "POST",
    });
  },

  /**
   * Obtiene la última fecha de actualización registrada en el padrón SUNAT
   */
  obtenerUltimaActualizacion: async () => {
    return await apiFetch("sunat/ultima-actualizacion");
  },

  /**
   * Consulta el padrón SUNAT por RUC
   * @param {string} ruc - RUC de 11 dígitos
   */
  consultarPadronSunat: async (ruc) => {
    if (!ruc || !/^\d{11}$/.test(ruc)) {
      throw new Error("RUC inválido. Debe tener 11 dígitos numéricos.");
    }
    return await apiFetch(`sunat/consultar/${ruc}`);
  },
};

export default sunatApi;