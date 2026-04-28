// src/api/areasApi.js
import apiFetch from "./apiFetch";

const areasApi = {
  getAreas: async (searchQuery = "") => {
    const url = searchQuery
      ? `areas?search=${encodeURIComponent(searchQuery)}`
      : "areas";
    return apiFetch(url, { sessionActivity: "interactive" });
  },

  getAreaById: async (id) =>
    apiFetch(`areas/${id}`, { sessionActivity: "interactive" }),

  getResponsablesDisponibles: async (tipoUnidad = "") => {
    const url = tipoUnidad
      ? `areas/responsables-disponibles?tipoUnidad=${encodeURIComponent(tipoUnidad)}`
      : "areas/responsables-disponibles";
    return apiFetch(url, { sessionActivity: "interactive" });
  },

  createArea: async (areaData) =>
    apiFetch("areas", {
      method: "POST",
      body: JSON.stringify(areaData),
      sessionActivity: "interactive",
    }),

  updateArea: async (id, areaData) =>
    apiFetch(`areas/${id}`, {
      method: "PUT",
      body: JSON.stringify(areaData),
      sessionActivity: "interactive",
    }),

  deleteArea: async (id) =>
    apiFetch(`areas/${id}`, {
      method: "DELETE",
      sessionActivity: "interactive",
    }),
};

export default areasApi;
