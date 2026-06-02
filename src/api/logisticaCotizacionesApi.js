import apiFetch, { buildApiUrl } from "./apiFetch";

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
  obtenerComparativo: async (requerimientoId) => {
    try {
      return await apiFetch(`logistica/requerimientos/${requerimientoId}/comparativo`);
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
  obtenerComparativoPdfUrl: (comparativoId) => {
    return buildApiUrl(`logistica/comparativos/${comparativoId}/pdf`);
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
  cerrarCotizaciones: async (requerimientoId, payload = {}) => {
    return apiFetch(`logistica/requerimientos/${requerimientoId}/cerrar-cotizaciones`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  reabrirCotizaciones: async (requerimientoId, payload = {}) => {
    return apiFetch(`logistica/requerimientos/${requerimientoId}/reabrir-cotizaciones`, {
      method: "PATCH",
      body: JSON.stringify(payload),
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
  crearComparativo: async (requerimientoId, payload) => {
    return apiFetch(`logistica/requerimientos/${requerimientoId}/comparativo`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  actualizarComparativo: async (comparativoId, payload) => {
    return apiFetch(`logistica/comparativos/${comparativoId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
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
