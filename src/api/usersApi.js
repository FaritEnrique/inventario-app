// src/api/usersApi.js
import apiFetch from './apiFetch';

const serializeUserPayload = (usuario = {}) => {
  const payload = { ...usuario };

  if ("name" in payload && !("nombre" in payload)) {
    payload.nombre = payload.name;
  }

  delete payload.name;
  delete payload.rangoId;

  return payload;
};

const usersApi = {
  // obtenerTodos acepta un objeto opcional { page, search }
  obtenerTodos: async ({ page = 1, search = '' } = {}) => {
    const q = [];
    if (page) q.push(`page=${page}`);
    if (search) q.push(`search=${encodeURIComponent(search)}`);
    const query = q.length ? `?${q.join('&')}` : '';
    // backend puede devolver array o { usuarios, totalPages, currentPage, totalItems }
    return apiFetch(`usuarios${query}`);
  },

  obtenerPorId: async (id) => {
    return apiFetch(`usuarios/${id}`);
  },

  crear: async (usuario) => {
    return apiFetch('usuarios', {
      method: 'POST',
      body: JSON.stringify(serializeUserPayload(usuario)),
    });
  },

  actualizar: async (id, usuario) => {
    return apiFetch(`usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serializeUserPayload(usuario)),
    });
  },

  eliminar: async (id) => {
    return apiFetch(`usuarios/${id}`, {
      method: 'DELETE',
    });
  },

  // patch para cambiar solo estado activo/inactivo
  toggleActivo: async (id, activo) => {
    return apiFetch(`usuarios/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },
};

export default usersApi;
