import apiFetch from "./apiFetch";

const appendIfPresent = (params, key, value) => {
  if (value !== undefined && value !== null && value !== "") {
    params.append(key, value);
  }
};

const requerimientosApi = {
  obtenerTodos: ({
    search = "",
    page = 1,
    limit = 10,
    areaId = "",
    prioridad = "",
    estadoFlujo = "",
    estadoDocumento = "",
    fechaDesde = "",
    fechaHasta = "",
    includeInactive = false,
  } = {}) => {
    const params = new URLSearchParams();
    appendIfPresent(params, "search", search);
    appendIfPresent(params, "page", page);
    appendIfPresent(params, "limit", limit);
    appendIfPresent(params, "areaId", areaId);
    appendIfPresent(params, "prioridad", prioridad);
    appendIfPresent(params, "estadoFlujo", estadoFlujo);
    appendIfPresent(params, "estadoDocumento", estadoDocumento);
    appendIfPresent(params, "fechaDesde", fechaDesde);
    appendIfPresent(params, "fechaHasta", fechaHasta);
    if (includeInactive) params.append("includeInactive", "true");

    return apiFetch(`requerimientos?${params.toString()}`);
  },

  obtenerBandeja: (nivel, options = {}) => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => appendIfPresent(params, key, value));
    return apiFetch(`requerimientos/bandeja/${nivel}?${params.toString()}`);
  },

  obtenerPrioridades: () => apiFetch("requerimientos/prioridades"),
  buscarCatalogoProductos: ({ search = "", page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    appendIfPresent(params, "search", search);
    appendIfPresent(params, "page", page);
    appendIfPresent(params, "limit", limit);
    return apiFetch(`requerimientos/catalogo-productos?${params.toString()}`);
  },
  getById: (id) => apiFetch(`requerimientos/${id}`),
  getHistorial: (id) => apiFetch(`requerimientos/${id}/historial`),
  crear: (datos) =>
    apiFetch("requerimientos", {
      method: "POST",
      body: JSON.stringify(datos),
    }),
  actualizar: (id, datos) =>
    apiFetch(`requerimientos/${id}`, {
      method: "PUT",
      body: JSON.stringify(datos),
    }),
  eliminar: (id) =>
    apiFetch(`requerimientos/${id}`, {
      method: "DELETE",
    }),
  procesarAprobacion: (id, datos) =>
    apiFetch(`requerimientos/${id}/aprobacion`, {
      method: "POST",
      body: JSON.stringify(datos),
    }),
};

export default requerimientosApi;
