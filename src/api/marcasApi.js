// src/api/marcasApi.js
import apiFetch from "./apiFetch";

const marcasApi = {
  getTodas: async (buscar = "") => {
    const query = buscar ? `?buscar=${encodeURIComponent(buscar)}` : "";
    return await apiFetch(`marcas${query}`, { sessionActivity: "interactive" });
  },

  getPorId: async (id) => {
    return await apiFetch(`marcas/${id}`, { sessionActivity: "interactive" });
  },

  crear: async (marca) => {
    return await apiFetch("marcas", {
      method: "POST",
      body: JSON.stringify(marca),
      sessionActivity: "interactive",
    });
  },

  actualizar: async (id, marca) => {
    return await apiFetch(`marcas/${id}`, {
      method: "PUT",
      body: JSON.stringify(marca),
      sessionActivity: "interactive",
    });
  },

  eliminar: async (id) => {
    return await apiFetch(`marcas/${id}`, {
      method: "DELETE",
      sessionActivity: "interactive",
    });
  },

  reactivar: async (id) => {
    return await apiFetch(`marcas/${id}/reactivate`, {
      method: "PATCH",
      sessionActivity: "interactive",
    });
  },
};

export default marcasApi;
