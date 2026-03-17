import apiFetch from "./apiFetch";

const logisticaCotizacionesApi = {
  obtenerBandejaJefatura: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`logistica/bandeja/jefatura${query ? `?${query}` : ""}`);
  },
  obtenerBandejaOperador: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`logistica/bandeja/operador${query ? `?${query}` : ""}`);
  },
  obtenerDetalle: async (requerimientoId) => {
    return apiFetch(`logistica/requerimientos/${requerimientoId}`);
  },
  obtenerOperadores: async () => {
    return apiFetch("logistica/operadores");
  },
  asignar: async (requerimientoId, payload) => {
    return apiFetch(`logistica/requerimientos/${requerimientoId}/asignacion`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  iniciar: async (requerimientoId) => {
    return apiFetch(`logistica/requerimientos/${requerimientoId}/iniciar`, {
      method: "POST",
    });
  },
  marcarListoAdjudicacion: async (requerimientoId) => {
    return apiFetch(`logistica/requerimientos/${requerimientoId}/listo-adjudicacion`, {
      method: "POST",
    });
  },
  generarOrdenCompra: async (requerimientoId) => {
    return apiFetch(`logistica/requerimientos/${requerimientoId}/generar-orden-compra`, {
      method: "POST",
    });
  },
};

export default logisticaCotizacionesApi;
