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

const inventarioApi = {
  obtenerStock: (params = {}) =>
    apiFetch(`inventario/stock${buildQuery(params)}`),

  obtenerStockPorProducto: (productoId) =>
    apiFetch(`inventario/stock/${productoId}`),

  obtenerNotasIngreso: (params = {}) =>
    apiFetch(`inventario/notas-ingreso${buildQuery(params)}`),

  obtenerNotaIngresoPorId: (id) => apiFetch(`inventario/notas-ingreso/${id}`),

  obtenerNotasSalida: (params = {}) =>
    apiFetch(`inventario/notas-salida${buildQuery(params)}`),

  obtenerNotaSalidaPorId: (id) => apiFetch(`inventario/notas-salida/${id}`),

  obtenerReservas: (params = {}) =>
    apiFetch(`inventario/reservas${buildQuery(params)}`),

  obtenerReservaPorId: (id) => apiFetch(`inventario/reservas/${id}`),

  obtenerMovimientos: (params = {}) =>
    apiFetch(`inventario/movimientos${buildQuery(params)}`),

  obtenerMovimientoPorId: (id) => apiFetch(`inventario/movimientos/${id}`),

  obtenerKardex: (productoId, params = {}) =>
    apiFetch(`inventario/kardex/${productoId}${buildQuery(params)}`),

  registrarEntrada: (payload) =>
    apiFetch("inventario/entradas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  registrarIngresoPorNota: (payload) =>
    apiFetch("inventario/notas-ingreso", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  registrarSalida: (payload) =>
    apiFetch("inventario/salidas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  registrarAjuste: (payload) =>
    apiFetch("inventario/ajustes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  registrarCargaInicial: (payload) =>
    apiFetch("inventario/carga-inicial", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  registrarTransferencia: (payload) =>
    apiFetch("inventario/transferencias", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  registrarReserva: (payload) =>
    apiFetch("inventario/reservas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  liberarReserva: (id, payload = {}) =>
    apiFetch(`inventario/reservas/${id}/liberar`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  despacharReserva: (id, payload = {}) =>
    apiFetch(`inventario/reservas/${id}/despachar`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export default inventarioApi;
