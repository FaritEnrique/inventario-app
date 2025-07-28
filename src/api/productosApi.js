// src/api/productosApi.js
import apiFetch from './apiFetch';

const productosApi = {
  // Obtener todos los productos (con búsqueda opcional)
  getTodos: async (buscar = '') => {
    const query = buscar ? `?buscar=${encodeURIComponent(buscar)}` : '';
    const res = await apiFetch(`/api/productos${query}`);
    // El backend ahora devuelve el stock calculado directamente en el objeto producto.
    // El precio ya no se devuelve.
    return res ?? []; 
  },

  // Obtener un producto por ID
  getPorId: async (id) => {
    // El backend ahora devuelve el stock calculado directamente en el objeto producto.
    // El precio ya no se devuelve.
    return await apiFetch(`/api/productos/${id}`);
  },

  // Función para obtener el siguiente código autogenerado
  getSiguienteCodigo: async (tipoProductoId) => {
    if (!tipoProductoId) {
      throw new Error('Tipo de producto ID es requerido para obtener el siguiente código.');
    }
    const res = await apiFetch(`/api/productos/siguiente-codigo/${tipoProductoId}`);
    return res.codigo; // El backend devuelve { codigo: "ABC-001" }
  },

  // Crear un nuevo producto
  crear: async (producto) => {
    // El frontend ya filtra los campos 'stock', 'precio', 'usaStockMinimo', 'stockMinimo'
    // El backend los ignorará o establecerá valores por defecto.
    return await apiFetch('/api/productos', {
      method: 'POST',
      body: JSON.stringify(producto),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Actualizar un producto
  actualizar: async (id, producto) => {
    // El frontend ya filtra los campos 'stock', 'precio', 'usaStockMinimo', 'stockMinimo'
    // El backend los ignorará.
    return await apiFetch(`/api/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(producto),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Eliminar un producto
  eliminar: async (id) => {
    return await apiFetch(`/api/productos/${id}`, {
      method: 'DELETE',
    });
  },
};

export default productosApi;