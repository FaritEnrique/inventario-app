// src/hooks/useProductos.js
import { useState, useEffect, useCallback } from 'react';
import productosApi from '../api/productosApi';
import { toast } from 'react-toastify';

const useProductos = () => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // 📦 Obtener todos los productos
  const obtenerProductos = useCallback(async (buscar = '') => {
    try {
      setCargando(true);
      setError(null);
      const data = await productosApi.getTodos(buscar);

      const formateados = Array.isArray(data)
        ? data.map((producto) => ({
            ...producto,
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

  // 🆕 Crear producto
  const crearProducto = useCallback(async (nuevoProducto) => {
    try {
      const creado = await productosApi.crear(nuevoProducto);
      setProductos((prev) => [
        ...prev,
        { ...creado, stock: parseFloat(creado.stock) },
      ]);
      toast.success('✅ Producto creado correctamente');
      return creado;
    } catch (err) {
      console.error('❌ Error al crear producto:', err);
      const msg = err.message || 'Error desconocido';
      toast.error(`❌ ${msg}`);
      throw err;
    }
  }, []);

  // ✏️ Actualizar producto
  const actualizarProducto = useCallback(async (id, datos) => {
    try {
      const respuesta = await productosApi.actualizar(id, datos);

      // ✅ El backend devuelve { message, producto }
      const { message, producto } = respuesta;

      setProductos((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...producto, stock: parseFloat(producto.stock) }
            : p
        )
      );

      toast.success(`✅ ${message || 'Producto actualizado correctamente'}`);
      return producto;
    } catch (err) {
      console.error('❌ Error al actualizar producto:', err);
      const msg = err.message || 'Error desconocido';
      toast.error(`❌ ${msg}`);
      throw err;
    }
  }, []);

  // 🗑️ Eliminar producto
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