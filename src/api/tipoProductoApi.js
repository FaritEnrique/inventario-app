// src/api/tipoProductoApi.js
import apiFetch from './apiFetch';

const tipoProductoApi = {
  // MODIFICADO: Ahora acepta un parámetro 'searchTerm'
  getTodos: async (searchTerm = '') => {
    let url = '/api/tipos-producto';
    if (searchTerm) {
      // Añade el searchTerm como un parámetro de query a la URL
      url += `?search=${encodeURIComponent(searchTerm)}`;
    }
    return await apiFetch(url);
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