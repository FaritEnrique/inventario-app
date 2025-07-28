// src/hooks/useProductos.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import productosApi from '../api/productosApi';
import { toast } from 'react-toastify';

const useProductos = () => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const obtenerProductos = useCallback(async (buscar = '') => {
    try {
      setCargando(true);
      setError(null);
      const data = await productosApi.getTodos(buscar);

      if (import.meta.env.MODE === 'development') {
        console.log('✅ Productos desde backend:', data);
      }

      // ✅ Ya no se formatea el precio aquí, ya que no existe en el modelo Producto
      // El stock ya viene calculado del backend, no necesita parseFloat aquí.
      const formateados = Array.isArray(data)
        ? data.map((producto) => ({
            ...producto,
            // ✅ ELIMINADO: precio: parseFloat(producto.precio).toFixed(2),
            // Asegurarse que stock sea un número si viene como string
            stock: parseFloat(producto.stock),
          }))
        : [];

      setProductos(formateados);
    } catch (err) {
      console.error('❌ Error al obtener productos:', err);
      toast.error('❌ Error al obtener productos');
      setProductos([]);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    obtenerProductos();
  }, [obtenerProductos]);

  const crearProducto = useCallback(async (nuevoProducto) => {
    try {
      const creado = await productosApi.crear(nuevoProducto);
      setProductos((prev) => [
        ...prev,
        { 
          ...creado, 
          // ✅ ELIMINADO: precio: parseFloat(creado.precio).toFixed(2),
          stock: parseFloat(creado.stock), // Asegurar que stock sea un número
        },
      ]);
      toast.success('✅ Producto creado correctamente');
      return creado;
    } catch (err) {
      console.error('❌ Error al crear producto:', err);
      // ✅ Tu apiFetch ya lanza un error con el mensaje del backend.
      const msg = err.message || 'Error desconocido';
      toast.error(`❌ ${msg}`);
      throw err;
    }
  }, []);

  const actualizarProducto = useCallback(async (id, datos) => {
    try {
      const actualizado = await productosApi.actualizar(id, datos);
      setProductos((prev) =>
        prev.map((p) =>
          p.id === id
            ? { 
                ...actualizado, 
                // ✅ ELIMINADO: precio: parseFloat(actualizado.precio).toFixed(2),
                stock: parseFloat(actualizado.stock), // Asegurar que stock sea un número
              }
            : p
        )
      );
      toast.success('✅ Producto actualizado correctamente');
      return actualizado;
    } catch (err) {
      console.error('❌ Error al actualizar producto:', err);
      const msg = err.message || 'Error desconocido';
      toast.error(`❌ ${msg}`);
      throw err;
    }
  }, []);

  const eliminarProducto = useCallback(async (id) => {
    try {
      await productosApi.eliminar(id);
      setProductos((prev) => prev.filter((p) => p.id !== id));
      toast.success('🗑️ Producto eliminado correctamente');
    } catch (err) {
      console.error('❌ Error al eliminar producto:', err);
      const msg = err.message || 'Error desconocido';
      toast.error(`❌ ${msg}`);
      throw err;
    }
  }, []);

  return {
    productos,
    fetchProductos: obtenerProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    cargando,
    error,
  };
};

export default useProductos;