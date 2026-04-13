// src/api/tipoProductoApi.js
import apiFetch from "./apiFetch";

const tipoProductoApi = {
  getTodos: async (searchTerm = "") => {
    let url = "tipos-producto";
    if (searchTerm) {
      url += `?search=${encodeURIComponent(searchTerm)}`;
    }
    return await apiFetch(url, { sessionActivity: "interactive" });
  },

  getPorId: async (id) => {
    return await apiFetch(`tipos-producto/${id}`, {
      sessionActivity: "interactive",
    });
  },

  crear: async (tipo) => {
    return await apiFetch("tipos-producto", {
      method: "POST",
      body: JSON.stringify(tipo),
      sessionActivity: "interactive",
    });
  },

  actualizar: async (id, tipo) => {
    return await apiFetch(`tipos-producto/${id}`, {
      method: "PUT",
      body: JSON.stringify(tipo),
      sessionActivity: "interactive",
    });
  },

  eliminar: async (id) => {
    return await apiFetch(`tipos-producto/${id}`, {
      method: "DELETE",
      sessionActivity: "interactive",
    });
  },

  reactivar: async (id) => {
    return await apiFetch(`tipos-producto/${id}/reactivate`, {
      method: "PATCH",
      sessionActivity: "interactive",
    });
  },
};

export default tipoProductoApi;
