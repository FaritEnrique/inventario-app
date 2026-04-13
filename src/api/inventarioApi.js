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
    apiFetch(`inventario/stock${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerStockPorProducto: (productoId) =>
    apiFetch(`inventario/stock/${productoId}`, {
      sessionActivity: "interactive",
    }),

  obtenerNotasIngreso: (params = {}) =>
    apiFetch(`inventario/notas-ingreso${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerNotaIngresoPorId: (id) =>
    apiFetch(`inventario/notas-ingreso/${id}`, {
      sessionActivity: "interactive",
    }),

  actualizarAprobacionDocumentalNotaIngreso: (id, payload) =>
    apiFetch(`inventario/notas-ingreso/${id}/aprobacion-documental`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  obtenerNotasSalida: (params = {}) =>
    apiFetch(`inventario/notas-salida${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerNotaSalidaPorId: (id) =>
    apiFetch(`inventario/notas-salida/${id}`, {
      sessionActivity: "interactive",
    }),

  actualizarAprobacionDocumentalNotaSalida: (id, payload) =>
    apiFetch(`inventario/notas-salida/${id}/aprobacion-documental`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  obtenerReservas: (params = {}) =>
    apiFetch(`inventario/reservas${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerReservaPorId: (id) =>
    apiFetch(`inventario/reservas/${id}`, {
      sessionActivity: "interactive",
    }),

  obtenerMovimientos: (params = {}) =>
    apiFetch(`inventario/movimientos${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerMovimientoPorId: (id) =>
    apiFetch(`inventario/movimientos/${id}`, {
      sessionActivity: "interactive",
    }),

  obtenerKardex: (productoId, params = {}) =>
    apiFetch(`inventario/kardex/${productoId}${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  registrarEntrada: (payload) =>
    apiFetch("inventario/entradas", {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  registrarIngresoPorNota: (payload) =>
    apiFetch("inventario/notas-ingreso", {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  registrarSalida: (payload) =>
    apiFetch("inventario/salidas", {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  registrarAjuste: (payload) =>
    apiFetch("inventario/ajustes", {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  registrarCargaInicial: (payload) =>
    apiFetch("inventario/carga-inicial", {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  registrarTransferencia: (payload) =>
    apiFetch("inventario/transferencias", {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  registrarReserva: (payload) =>
    apiFetch("inventario/reservas", {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  liberarReserva: (id, payload = {}) =>
    apiFetch(`inventario/reservas/${id}/liberar`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  despacharReserva: (id, payload = {}) =>
    apiFetch(`inventario/reservas/${id}/despachar`, {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),
};

export default inventarioApi;
