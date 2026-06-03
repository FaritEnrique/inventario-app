import apiFetch from "./apiFetch";

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

const productosTemporalesApi = {
  listar: async (params = {}) =>
    apiFetch(`inventario/productos-temporales${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  vincular: async (id, payload) =>
    apiFetch(`inventario/productos-temporales/${id}/vincular`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  crearProducto: async (id, payload) =>
    apiFetch(`inventario/productos-temporales/${id}/crear-producto`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),
};

export default productosTemporalesApi;
