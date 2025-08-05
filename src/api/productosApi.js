// src/api/productosApi.js
import apiFetch from './apiFetch';

const productosApi = {
  getTodos: async (buscar = '') => {
    const query = buscar ? `?buscar=${encodeURIComponent(buscar)}` : '';
    const res = await apiFetch(`productos${query}`);
    return res ?? []; 
  },

  getPorId: async (id) => {

    return await apiFetch(`productos/${id}`);
  },

  getSiguienteCodigo: async (tipoProductoId) => {
    if (!tipoProductoId) {
      throw new Error('Tipo de producto ID es requerido para obtener el siguiente código.');
    }
    const res = await apiFetch(`productos/siguiente-codigo/${tipoProductoId}`);
    return res.codigo;
  },

  crear: async (producto) => {
    return await apiFetch('productos', {
      method: 'POST',
      body: JSON.stringify(producto),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  actualizar: async (id, producto) => {
    return await apiFetch(`productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(producto),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Eliminar un producto
  eliminar: async (id) => {
    return await apiFetch(`productos/${id}`, {
      method: 'DELETE',
    });
  },
};

export default productosApi;