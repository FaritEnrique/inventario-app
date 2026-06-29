// src/api/almacenesApi.js
import apiFetch from "./apiFetch";

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.append(key, value);
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
};

const almacenesApi = {
  obtenerAlmacenes: (params = {}) =>
    apiFetch(`almacenes${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerAlmacenPorId: (id) =>
    apiFetch(`almacenes/${id}`, {
      sessionActivity: "interactive",
    }),

  crearAlmacen: (payload) =>
    apiFetch("almacenes", {
      method: "POST",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  actualizarAlmacen: (id, payload) =>
    apiFetch(`almacenes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  activarAlmacen: (id) =>
    apiFetch(`almacenes/${id}/activar`, {
      method: "PATCH",
      sessionActivity: "interactive",
    }),

  desactivarAlmacen: (id) =>
    apiFetch(`almacenes/${id}/desactivar`, {
      method: "PATCH",
      sessionActivity: "interactive",
    }),
};

export default almacenesApi;
