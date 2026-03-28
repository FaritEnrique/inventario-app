import apiFetch from "./apiFetch";

const sunatApi = {
  actualizarPadronSunat: async () => {
    return apiFetch("sunat/actualizar", {
      method: "POST",
    });
  },

  actualizarPadronReducido: async () => {
    return apiFetch("sunat/actualizar-reducido", {
      method: "POST",
    });
  },

  obtenerUltimaActualizacion: async () => {
    return apiFetch("sunat/ultima-actualizacion");
  },

  obtenerUltimaActualizacionReducido: async () => {
    return apiFetch("sunat/ultima-actualizacion-reducido");
  },

  consultarPadronSunat: async (ruc) => {
    if (!ruc || !/^\d{11}$/.test(ruc)) {
      throw new Error("RUC invalido. Debe tener 11 digitos numericos.");
    }

    return apiFetch(`sunat/consultar/${ruc}`);
  },
};

export default sunatApi;
