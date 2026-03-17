import apiFetch from "./apiFetch";

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    query.append(key, value);
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
};

const ordenesCompraApi = {
  obtenerOrdenesCompra: (params = {}) =>
    apiFetch(`ordenes-compra${buildQuery(params)}`),

  obtenerOrdenCompraPorId: (id) => apiFetch(`ordenes-compra/${id}`),

  actualizarAprobacionOrdenCompra: (id, payload) =>
    apiFetch(`ordenes-compra/${id}/aprobacion`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  cerrarOrdenCompra: (id, payload) =>
    apiFetch(`ordenes-compra/${id}/cerrar`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  cancelarOrdenCompra: (id, payload) =>
    apiFetch(`ordenes-compra/${id}/cancelar`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

export default ordenesCompraApi;
