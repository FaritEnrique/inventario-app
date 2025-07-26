import apiFetch from './apiFetch';

const pedidosApi = {
  obtenerTodos: (buscar) =>
    apiFetch(`/api/pedidos${buscar ? `?buscar=${buscar}` : ''}`),

  crear: (datos) =>
    apiFetch('/api/pedidos', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  eliminar: (id) =>
    apiFetch(`/api/pedidos/${id}`, {
      method: 'DELETE',
    }),
};

export default pedidosApi;