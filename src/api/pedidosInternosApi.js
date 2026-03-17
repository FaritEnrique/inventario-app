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

const pedidosInternosApi = {
  obtenerPedidos: (params = {}) =>
    apiFetch(`pedidos-internos${buildQuery(params)}`),

  obtenerPedidoPorId: (id) => apiFetch(`pedidos-internos/${id}`),

  obtenerBandejaAprobacion: () =>
    apiFetch("pedidos-internos/bandeja/aprobacion"),

  obtenerBandejaAlmacen: (params = {}) =>
    apiFetch(`pedidos-internos/bandeja/almacen${buildQuery(params)}`),

  crearPedido: (payload) =>
    apiFetch("pedidos-internos", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  aprobarPedido: (id, payload) =>
    apiFetch(`pedidos-internos/${id}/aprobacion`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  atenderPedido: (id, payload) =>
    apiFetch(`pedidos-internos/${id}/atenciones`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export default pedidosInternosApi;
