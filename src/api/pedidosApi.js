import apiFetch from "./apiFetch";

const pedidosApi = {
  obtenerTodos: (buscar) =>
    apiFetch(`pedidos${buscar ? `?buscar=${buscar}` : ""}`, {
      sessionActivity: "interactive",
    }),

  crear: (datos) =>
    apiFetch("pedidos", {
      method: "POST",
      body: JSON.stringify(datos),
      sessionActivity: "interactive",
    }),

  eliminar: (id) =>
    apiFetch(`pedidos/${id}`, {
      method: "DELETE",
      sessionActivity: "interactive",
    }),
};

export default pedidosApi;
