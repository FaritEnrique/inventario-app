// src/api/marcasApi.js
import apiFetch from './apiFetch';

const marcasApi = {
  getTodas: async (buscar = '') => {
    const query = buscar ? `?buscar=${encodeURIComponent(buscar)}` : '';
    return await apiFetch(`marcas${query}`);
  },

  getPorId: async (id) => {
    return await apiFetch(`marcas/${id}`);
  },

  crear: async (marca) => {
    return await apiFetch('marcas', {
      method: 'POST',
      body: JSON.stringify(marca),
    });
  },

  actualizar: async (id, marca) => {
    return await apiFetch(`marcas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(marca),
    });
  },

  eliminar: async (id) => {
    return await apiFetch(`marcas/${id}`, {
      method: 'DELETE',
    });
  },
};

export default marcasApi;