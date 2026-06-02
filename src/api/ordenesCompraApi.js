import apiFetch, { buildApiUrl } from "./apiFetch";

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
    apiFetch(`ordenes-compra${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerBandejaAprobacion: (params = {}) =>
    apiFetch(`ordenes-compra/bandeja/aprobacion${buildQuery(params)}`, {
      sessionActivity: "interactive",
    }),

  obtenerOrdenCompraPorId: (id) =>
    apiFetch(`ordenes-compra/${id}`, { sessionActivity: "interactive" }),

  obtenerOrdenCompraPdfBlob: async (id) => {
    const response = await fetch(buildApiUrl(`ordenes-compra/${id}/pdf`), {
      method: "GET",
      headers: {
        Accept: "application/pdf",
        "X-Session-Activity": "interactive",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      let message = "No se pudo obtener el PDF de la Orden de Compra.";

      if (contentType.includes("application/json")) {
        const data = await response.json().catch(() => null);
        message =
          data?.error?.message ||
          data?.mensaje ||
          data?.message ||
          message;
      }

      throw new Error(message);
    }

    return response.blob();
  },

  actualizarAprobacionOrdenCompra: (id, payload) =>
    apiFetch(`ordenes-compra/${id}/aprobacion`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  cerrarOrdenCompra: (id, payload) =>
    apiFetch(`ordenes-compra/${id}/cerrar`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  cancelarOrdenCompra: (id, payload) =>
    apiFetch(`ordenes-compra/${id}/cancelar`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),

  anularOrdenCompra: (id, payload) =>
    apiFetch(`ordenes-compra/${id}/anular`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      sessionActivity: "interactive",
    }),
};

export default ordenesCompraApi;
