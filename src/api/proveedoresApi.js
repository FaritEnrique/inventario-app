import apiFetch from './apiFetch';

const proveedoresApi = {
  getTodas: async (buscar = '', filters = {}) => {
    const params = new URLSearchParams();
    if (buscar) {
      params.set('buscar', buscar);
    }
    if (filters?.tipoProductoId) {
      params.set('tipoProductoId', String(filters.tipoProductoId));
    }
    if (Array.isArray(filters?.tipoProductoIds) && filters.tipoProductoIds.length > 0) {
      params.set('tipoProductoIds', filters.tipoProductoIds.join(','));
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiFetch(`proveedores${query}`);
  },

  getPorId: async (id) => {
    return await apiFetch(`proveedores/${id}`);
  },

  crear: async (proveedor) => {
    return await apiFetch('proveedores', {
      method: 'POST',
      body: JSON.stringify(proveedor),
    });
  },

  actualizar: async (id, proveedor) => {
    return await apiFetch(`proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(proveedor),
    });
  },
  
  // Agregamos una función específica para actualizar el estado (borrado suave)
  actualizarEstado: async (id, activo) => {
    return await apiFetch(`proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ activo }),
    });
  },

  eliminar: async (id) => {
    return await proveedoresApi.actualizarEstado(id, false);
  },
};

export default proveedoresApi;
