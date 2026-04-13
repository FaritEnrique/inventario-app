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
    apiFetch(`pedidos-internos${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerPedidoPorId: (id) =>
    apiFetch(`pedidos-internos/${id}`, { sessionActivity: "interactive" }),

  obtenerBandejaAprobacion: () =>
    apiFetch("pedidos-internos/bandeja/aprobacion", {
      sessionActivity: "interactive",
    }),

  obtenerBandejaAlmacen: (params = {}) =>
    apiFetch(`pedidos-internos/bandeja/almacen${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  crearPedido: (payload) =>
    apiFetch("pedidos-internos", {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  aprobarPedido: (id, payload) =>
    apiFetch(`pedidos-internos/${id}/aprobacion`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  atenderPedido: (id, payload) =>
    apiFetch(`pedidos-internos/${id}/atenciones`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),
};

export default pedidosInternosApi;
