// src/api/areasApi.js
import apiFetch from "./apiFetch";

const areasApi = {
  getAreas: async (searchQuery = "") => {
    const url = searchQuery
      ? `areas?search=${encodeURIComponent(searchQuery)}`
      : "areas";
    return apiFetch(url);
  },

  getAreaById: async (id) => apiFetch(`areas/${id}`),

  getResponsablesDisponibles: async (tipoUnidad = "") => {
    const url = tipoUnidad
      ? `areas/responsables-disponibles?tipoUnidad=${encodeURIComponent(tipoUnidad)}`
      : "areas/responsables-disponibles";
    return apiFetch(url);
  },

  createArea: async (areaData) =>
    apiFetch("areas", {
      method: "POST",
      body: JSON.stringify(areaData),
    }),

  updateArea: async (id, areaData) =>
    apiFetch(`areas/${id}`, {
      method: "PUT",
      body: JSON.stringify(areaData),
    }),

  deleteArea: async (id) => {
    try {
      return await apiFetch(`areas/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      throw error;
    }
  },
};

export default areasApi;
