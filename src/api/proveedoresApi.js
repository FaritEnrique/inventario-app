import apiFetch from './apiFetch';

const proveedoresApi = {
  getTodas: async (buscar = '') => {
    const query = buscar ? `?buscar=${encodeURIComponent(buscar)}` : '';
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