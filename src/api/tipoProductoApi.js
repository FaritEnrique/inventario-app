// src/api/tipoProductoApi.js
import apiFetch from './apiFetch';

const tipoProductoApi = {
  getTodos: async () => {
    return await apiFetch('/api/tipos-producto');
  },

  getPorId: async (id) => {
    return await apiFetch(`/api/tipos-producto/${id}`);
  },

  crear: async (tipo) => {
    return await apiFetch('/api/tipos-producto', {
      method: 'POST',
      body: JSON.stringify(tipo),
    });
  },

  actualizar: async (id, tipo) => {
    return await apiFetch(`/api/tipos-producto/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tipo),
    });
  },

  eliminar: async (id) => {
    return await apiFetch(`/api/tipos-producto/${id}`, {
      method: 'DELETE',
    });
  },
};

export default tipoProductoApi;