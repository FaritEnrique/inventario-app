import { useState, useEffect } from 'react';
import productosApi from '../api/productosApi';
import { toast } from 'react-toastify';

const useProductos = () => {
  const [productos, setProductos] = useState([]);
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Obtener todos los productos (con búsqueda opcional)
  const fetchProductos = async (buscar = '') => {
    try {
      setCargando(true);
      const data = await productosApi.getTodos(buscar);
      setProductos(data);
      setError(null);
    } catch (err) {
      toast.error('❌ Error al obtener productos');
      setError('Error al obtener productos');
    } finally {
      setCargando(false);
    }
  };

  // Obtener un producto por ID
  const fetchProductoPorId = async (id) => {
    try {
      setCargando(true);
      const data = await productosApi.getPorId(id);
      setProducto(data);
      setError(null);
    } catch (err) {
      toast.error('❌ Producto no encontrado');
      setError('Producto no encontrado');
    } finally {
      setCargando(false);
    }
  };

  // Crear producto
  const crearProducto = async (nuevoProducto) => {
    try {
      setCargando(true);
      const data = await productosApi.crear(nuevoProducto);
      setProductos([...productos, data]);
      setError(null);
      toast.success('✅ Producto creado correctamente');
      return data;
    } catch (err) {
      toast.error(`❌ ${err.message}`);
      setError('Error al crear producto');
      throw err;
    } finally {
      setCargando(false);
    }
  };

  // Actualizar producto
  const actualizarProducto = async (id, datos) => {
    try {
      setCargando(true);
      const actualizado = await productosApi.actualizar(id, datos);
      setProductos((prev) =>
        prev.map((p) => (p.id === id ? actualizado : p))
      );
      toast.success('✅ Producto actualizado correctamente');
      setError(null);
      return actualizado;
    } catch (err) {
      toast.error(`❌ ${err.message}`);
      setError('Error al actualizar producto');
      throw err;
    } finally {
      setCargando(false);
    }
  };

  // Eliminar producto
  const eliminarProducto = async (id) => {
    try {
      setCargando(true);
      await productosApi.eliminar(id);
      setProductos((prev) => prev.filter((p) => p.id !== id));
      toast.success('🗑️ Producto eliminado correctamente');
      setError(null);
    } catch (err) {
      toast.error(`❌ ${err.message}`);
      setError('Error al eliminar producto');
      throw err;
    } finally {
      setCargando(false);
    }
  };

  return {
    productos,
    producto,
    cargando,
    error,
    fetchProductos,
    fetchProductoPorId,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
  };
};

export default useProductos;