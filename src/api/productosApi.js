import apiFetch from './apiFetch';

const productosApi = {
  // Obtener todos los productos (con búsqueda opcional)
  getTodos: async (buscar = '') => {
    const query = buscar ? `?buscar=${encodeURIComponent(buscar)}` : '';
    return await apiFetch(`/productos${query}`);
  },

  // Obtener un producto por ID
  getPorId: async (id) => {
    return await apiFetch(`/productos/${id}`);
  },

  // Crear un nuevo producto
  crear: async (producto) => {
    return await apiFetch('/productos', {
      method: 'POST',
      body: JSON.stringify(producto),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Actualizar un producto
  actualizar: async (id, producto) => {
    return await apiFetch(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(producto),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Eliminar un producto
  eliminar: async (id) => {
    return await apiFetch(`/productos/${id}`, {
      method: 'DELETE',
    });
  },
};

export default productosApi;