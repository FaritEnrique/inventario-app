// src/api/usersApi.js
import apiFetch from './apiFetch';

const usersApi = {
  obtenerTodos: async () => {
    return await apiFetch('/api/usuarios');
  },
  obtenerPorId: async (id) => {
    return await apiFetch(`/api/usuarios/${id}`);
  },
  crear: async (usuario) => { // Cambiado de 'Crear' a 'crear'
    return apiFetch('/api/usuarios', {
      method: 'POST',
      body: JSON.stringify(usuario),
    });
  },
  actualizar: async (id, usuario) => {
    return apiFetch(`/api/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(usuario),
    });
  },
  eliminar: async (id) => {
    return apiFetch(`/api/usuarios/${id}`, {
      method: 'DELETE',
    });
  },
};

export default usersApi;