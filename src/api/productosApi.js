// src/api/productosApi.js
import apiFetch from './apiFetch';

const productosApi = {
  getTodos: async (buscar = '', page = 1, limit = 10, estado = 'activos') => {
    const params = new URLSearchParams();
    if (buscar) params.append('buscar', buscar);
    params.append('page', page);
    params.append('limit', limit);
    if (estado) params.append('estado', estado);

    const res = await apiFetch(`productos?${params.toString()}`);
    return res ?? { productos: [], total: 0, page, limit };
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
    const isFormData = producto instanceof FormData;
    return await apiFetch('productos', {
      method: 'POST',
      body: isFormData ? producto : JSON.stringify(producto),
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    });
  },

  actualizar: async (id, producto) => {
    const isFormData = producto instanceof FormData;
    return await apiFetch(`productos/${id}`, {
      method: 'PUT',
      body: isFormData ? producto : JSON.stringify(producto),
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    });
  },

  desactivar: async (id) => {
    return await apiFetch(`productos/${id}/desactivar`, {
      method: 'PATCH',
    });
  },

  reactivar: async (id) => {
    return await apiFetch(`productos/${id}/reactivar`, {
      method: 'PATCH',
    });
  },
};

export default productosApi;
