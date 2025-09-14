// src/api/tipoProductoApi.js
import apiFetch from './apiFetch';

const tipoProductoApi = {
  getTodos: async (searchTerm = '') => {
    let url = 'tipos-producto';
    if (searchTerm) {
      url += `?search=${encodeURIComponent(searchTerm)}`;
    }
    return await apiFetch(url);
  },

  getPorId: async (id) => {
    return await apiFetch(`tipos-producto/${id}`);
  },

  crear: async (tipo) => {
    return await apiFetch('tipos-producto', {
      method: 'POST',
      body: JSON.stringify(tipo),
    });
  },

  actualizar: async (id, tipo) => {
    return await apiFetch(`tipos-producto/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tipo),
    });
  },

  eliminar: async (id) => {
    return await apiFetch(`tipos-producto/${id}`, {
      method: 'DELETE',
    });
  },

  reactivar: async (id) => {
    return await apiFetch(`tipos-producto/${id}/reactivate`, {
      method: 'PATCH',
    });
  },
};

export default tipoProductoApi;