//src/api/rangoApi.js
import apiFetch from "./apiFetch";

const rangoApi = {
  getTodos: async () => {
    return await apiFetch("rangos");
  },

  getPorId: async (id) => {
    return await apiFetch(`rangos/${id}`);
  },

  crear: async (rango) => {
    return await apiFetch("rangos", {
      method: "POST",
      body: JSON.stringify(rango),
    });
  },

  actualizar: async (id, rango) => {
    return await apiFetch(`rangos/${id}`, {
      method: "PUT",
      body: JSON.stringify(rango),
    });
  },

  eliminar: async (id) => {
    return await apiFetch(`rangos/${id}`, {
      method: "DELETE",
    });
  },
};

export default rangoApi;
