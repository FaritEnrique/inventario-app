import apiFetch from "./apiFetch";

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.estado) {
    params.set("estado", filters.estado);
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};

const solicitudesTipoProductoApi = {
  listar: async (filters = {}) =>
    apiFetch(`solicitudes-tipo-producto${buildQuery(filters)}`),

  crear: async (payload) =>
    apiFetch("solicitudes-tipo-producto", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  observar: async (id, payload) =>
    apiFetch(`solicitudes-tipo-producto/${id}/observar`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  homologar: async (id, payload) =>
    apiFetch(`solicitudes-tipo-producto/${id}/homologar`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  crearTipo: async (id, payload) =>
    apiFetch(`solicitudes-tipo-producto/${id}/crear-tipo`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  rechazar: async (id, payload) =>
    apiFetch(`solicitudes-tipo-producto/${id}/rechazar`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

export default solicitudesTipoProductoApi;
