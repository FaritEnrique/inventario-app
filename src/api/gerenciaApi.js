import apiFetch from "./apiFetch";

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.append(key, String(value));
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

const gerenciaApi = {
  listarRequerimientos: async (filters = {}) =>
    apiFetch(`/gerencia/requerimientos${buildQuery(filters)}`),

  listarExpedientesLogisticos: async (filters = {}) =>
    apiFetch(`/gerencia/expedientes-logisticos${buildQuery(filters)}`),

  obtenerExpedienteLogistico: async (id) =>
    apiFetch(`/gerencia/expedientes-logisticos/${id}`),

  listarOrdenesCompra: async (filters = {}) =>
    apiFetch(`/gerencia/ordenes-compra${buildQuery(filters)}`),

  listarOrdenesCompraAprobaciones: async (filters = {}) =>
    apiFetch(`/gerencia/ordenes-compra/aprobaciones${buildQuery(filters)}`),
};

export default gerenciaApi;