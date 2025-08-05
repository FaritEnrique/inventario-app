import apiFetch from './apiFetch';

const usersApi = {
  obtenerTodos: async () => {
    return await apiFetch('usuarios'); // ✅ Endpoint corregido
  },
  obtenerPorId: async (id) => {
    return await apiFetch(`usuarios/${id}`); // ✅ Endpoint corregido
  },
  crear: async (usuario) => {
    return apiFetch('usuarios', { // ✅ Endpoint corregido
      method: 'POST',
      body: JSON.stringify(usuario),
    });
  },
  actualizar: async (id, usuario) => {
    return apiFetch(`usuarios/${id}`, { // ✅ Endpoint corregido
      method: 'PUT',
      body: JSON.stringify(usuario),
    });
  },
  eliminar: async (id) => {
    return apiFetch(`usuarios/${id}`, { // ✅ Endpoint corregido
      method: 'DELETE',
    });
  },
};

export default usersApi;