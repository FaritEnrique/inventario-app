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
  aprobarComparativo: async (comparativoId, payload = {}) => {
    return apiFetch(`logistica/comparativos/${comparativoId}/aprobar`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  observarComparativo: async (comparativoId, payload = {}) => {
    return apiFetch(`logistica/comparativos/${comparativoId}/observar`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  rechazarComparativo: async (comparativoId, payload = {}) => {
    return apiFetch(`logistica/comparativos/${comparativoId}/rechazar`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  adjudicarCotizacionDirectaExcepcional: async (cotizacionId, payload) => {
    return apiFetch(`logistica/cotizaciones/${cotizacionId}/adjudicacion-directa`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  generarOrdenCompra: async (requerimientoId) => {
    return apiFetch(`logistica/requerimientos/${requerimientoId}/generar-orden-compra`, {
      method: "POST",
    });
  },
};

export default logisticaCotizacionesApi;
