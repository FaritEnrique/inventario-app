// src/api/areasApi.js
import apiFetch from './apiFetch';

const areasApi = {
  // Obtener todas las áreas (con búsqueda opcional)
  obtenerTodas: async (buscar = '') => {
    const query = buscar ? `?buscar=${encodeURIComponent(buscar)}` : '';
    return await apiFetch(`/api/areas${query}`);
  },

  // Obtener una sola área por ID
  obtenerPorId: async (id) => {
    return await apiFetch(`/api/areas/${id}`);
  },

  // Crear nueva área
  crear: async (area) => {
    return await apiFetch('/api/areas', {
      method: 'POST',
      body: JSON.stringify(area),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Actualizar un área existente
  actualizar: async (id, area) => {
    return await apiFetch(`/api/areas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(area),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Eliminar un área
  eliminar: async (id) => {
    return await apiFetch(`/api/areas/${id}`, {
      method: 'DELETE',
    });
  },
};

export default areasApi;