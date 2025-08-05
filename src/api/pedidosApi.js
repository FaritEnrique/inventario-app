import apiFetch from './apiFetch';

const pedidosApi = {
  obtenerTodos: (buscar) =>
    apiFetch(`pedidos${buscar ? `?buscar=${buscar}` : ''}`),

  crear: (datos) =>
    apiFetch('pedidos', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  eliminar: (id) =>
    apiFetch(`pedidos/${id}`, {
      method: 'DELETE',
    }),
};

export default pedidosApi;