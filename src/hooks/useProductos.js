// src/hooks/useProductos.js
import { useState, useEffect, useCallback } from 'react';
import productosApi from '../api/productosApi';
import { toast } from 'react-toastify';

const useProductos = () => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [desde, setDesde] = useState(1);
  const [hasta, setHasta] = useState(0);

  const obtenerProductos = useCallback(async (buscar = '', pageNumber = page, limitNumber = limit) => {
    try {
      setCargando(true);
      setError(null);
      const data = await productosApi.getTodos(buscar, pageNumber, limitNumber);

      const formateados = Array.isArray(data.productos)
        ? data.productos.map((producto) => ({ ...producto, stock: parseFloat(producto.stock) }))
        : [];

      setProductos(formateados);
      setTotal(data.total);
      setPage(data.page);
      setLimit(data.limit);
      setDesde(data.desde);
      setHasta(data.hasta);
    } catch (err) {
      console.error('❌ Error al obtener productos:', err);
      toast.error('❌ Error al obtener productos');
      setProductos([]);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [page, limit]);

  useEffect(() => {
    obtenerProductos();
  }, [obtenerProductos]);

  const crearProducto = useCallback(async (nuevoProducto) => {
    try {
      const creado = await productosApi.crear(nuevoProducto);
      setProductos((prev) => [...prev, { ...creado, stock: parseFloat(creado.stock) }]);
      toast.success('✅ Producto creado correctamente');
      return creado;
    } catch (err) {
      console.error('❌ Error al crear producto:', err);
      toast.error(`❌ ${err.message || 'Error desconocido'}`);
      throw err;
    }
  }, []);

  const actualizarProducto = useCallback(async (id, datos) => {
    try {
      const { message, producto } = await productosApi.actualizar(id, datos);
      setProductos((prev) =>
        prev.map((p) => (p.id === id ? { ...producto, stock: parseFloat(producto.stock) } : p))
      );
      toast.success(`✅ ${message || 'Producto actualizado correctamente'}`);
      return producto;
    } catch (err) {
      console.error('❌ Error al actualizar producto:', err);
      toast.error(`❌ ${err.message || 'Error desconocido'}`);
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
      toast.error(`❌ ${err.message || 'Error desconocido'}`);
      throw err;
    }
  }, []);

  return {
    productos,
    total,
    page,
    limit,
    desde,
    hasta,
    setPage,
    setLimit,
    fetchProductos: obtenerProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    cargando,
    error,
  };
};

export default useProductos;