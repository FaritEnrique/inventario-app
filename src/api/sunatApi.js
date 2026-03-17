import apiFetch from "./apiFetch";

const sunatApi = {
  actualizarPadronSunat: async () => {
    return apiFetch("sunat/actualizar", {
      method: "POST",
    });
  },

  obtenerUltimaActualizacion: async () => {
    return apiFetch("sunat/ultima-actualizacion");
  },

  consultarPadronSunat: async (ruc) => {
    if (!ruc || !/^\d{11}$/.test(ruc)) {
      throw new Error("RUC invalido. Debe tener 11 digitos numericos.");
    }

    return apiFetch(`sunat/consultar/${ruc}`);
  },
};

export default sunatApi;
