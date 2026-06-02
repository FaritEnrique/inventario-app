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
  listarFlujosCotizacion: async (requerimientoId) => {
    return apiFetch(`logistica/requerimientos/${requerimientoId}/flujos`);
  },
  cerrarFlujoCotizacion: async (flujoId, payload = {}) => {
    return apiFetch(`logistica/flujos/${flujoId}/cerrar-cotizaciones`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  reabrirFlujoCotizacion: async (flujoId, payload = {}) => {
    return apiFetch(`logistica/flujos/${flujoId}/reabrir-cotizaciones`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  obtenerComparativoPorFlujo: async (flujoId) => {
    return apiFetch(`logistica/flujos/${flujoId}/comparativo`);
  },
  obtenerBuenaProPorFlujo: async (flujoId) => {
    return apiFetch(`logistica/flujos/${flujoId}/buena-pro`);
  },
  registrarBuenaPro: async (flujoId, payload) => {
    return apiFetch(`logistica/flujos/${flujoId}/buena-pro`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  anularBuenaPro: async (buenaProId, payload) => {
    return apiFetch(`logistica/buenas-pro/${buenaProId}/anular`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  generarOrdenesCompraDesdeBuenaPro: async (buenaProId) => {
    return apiFetch(`logistica/buenas-pro/${buenaProId}/generar-orden-compra`, {
      method: "POST",
    });
  },
  definirFlujo: async (requerimientoId, payload) => {
    return apiFetch(`logistica/requerimientos/${requerimientoId}/flujo`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
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
  formalizarDecisionExcepcional: async (requerimientoId, payload) => {
    return apiFetch(`logistica/requerimientos/${requerimientoId}/decision-excepcional`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  marcarListoAdjudicacion: async (requerimientoId) => {
    return apiFetch(`logistica/requerimientos/${requerimientoId}/listo-adjudicacion`, {
      method: "POST",
    });
  },
  adjudicarCotizacionDirectaExcepcional: async (cotizacionId, payload) => {
    return apiFetch(`logistica/cotizaciones/${cotizacionId}/adjudicacion-directa`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

export default logisticaCotizacionesApi;
