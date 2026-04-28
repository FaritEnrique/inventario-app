import apiFetch, { buildApiUrl } from "./apiFetch";

const cotizacionesApi = {
  obtenerTodas: async () => {
    return await apiFetch("cotizaciones", { sessionActivity: "interactive" });
  },
  obtenerPorId: async (id) => {
    return await apiFetch(`cotizaciones/${id}`, {
      sessionActivity: "interactive",
    });
  },
  obtenerPdfUrl: (id) => {
    return buildApiUrl(`cotizaciones/${id}/pdf`);
  },
  crear: async (cotizacion) => {
    return apiFetch("cotizaciones", {
      method: "POST",
      body: JSON.stringify(cotizacion),
      sessionActivity: "interactive",
    });
  },
  actualizar: async (id, cotizacion) => {
    return apiFetch(`cotizaciones/${id}`, {
      method: "PUT",
      body: JSON.stringify(cotizacion),
      sessionActivity: "interactive",
    });
  },
  adjudicar: async (id, payload) => {
    return apiFetch(`cotizaciones/${id}/adjudicar`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
      sessionActivity: "interactive",
    });
  },
  inactivar: async (id, payload = {}) => {
    return apiFetch(`cotizaciones/${id}/inactivar`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    });
  },
  reactivar: async (id, payload = {}) => {
    return apiFetch(`cotizaciones/${id}/reactivar`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    });
  },
};

export default cotizacionesApi;
