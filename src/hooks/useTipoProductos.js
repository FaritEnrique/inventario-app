// src/hooks/useTipoProductos.js
import { useState, useEffect, useCallback } from 'react';
import tipoProductoApi from '../api/tipoProductoApi';
import { toast } from 'react-toastify';

const useTipoProductos = () => {
  // ✅ Cambiado de 'tipos' a 'tiposProducto' para que coincida con la desestructuración en GestionProductosPage
  const [tiposProducto, setTiposProducto] = useState([]);
  const [tipo, setTipo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Función auxiliar para logs condicionales en desarrollo (puedes moverla a un archivo de utilidades si la usas mucho)
  const devLog = (...args) => {
    if (import.meta.env.MODE === 'development') {
      console.log('[DEV_LOG_USE_TIPOS_PRODUCTO]', ...args);
    }
  };

  const fetchTiposProducto = useCallback(async (searchTerm = '') => {
    try {
      setCargando(true);
      setError(null);
      const data = await tipoProductoApi.getTodos(searchTerm);
      devLog('Datos de tipos de producto recibidos:', data); // Log para depuración
      setTiposProducto(data || []); // ✅ Asegura que siempre sea un array
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido al obtener tipos de producto';
      toast.error(`❌ ${msg}`);
      setError(msg);
      devLog('Error en fetchTiposProducto:', err); // Log para depuración
      setTiposProducto([]); // ✅ Asegura que sea un array vacío en caso de error
    } finally {
      setCargando(false);
    }
  }, []);

  const fetchTipoPorId = useCallback(async (id) => {
    try {
      setCargando(true);
      setError(null);
      const data = await tipoProductoApi.getPorId(id);
      setTipo(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido al obtener el tipo de producto para editar';
      toast.error(`❌ ${msg}`);
      setError(msg);
    } finally {
      setCargando(false);
    }
  }, []);

  const crearTipo = useCallback(async (nuevoTipo) => {
    try {
      setCargando(true);
      const data = await tipoProductoApi.crear(nuevoTipo);
      setTiposProducto((prevTipos) => [...prevTipos, data]); // ✅ Usa setTiposProducto
      toast.success('✅ Tipo de producto creado');
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido al crear tipo';
      toast.error(`❌ ${msg}`);
      setError(msg);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const actualizarTipo = useCallback(async (id, datos) => {
    try {
      setCargando(true);
      const actualizado = await tipoProductoApi.actualizar(id, datos);
      setTiposProducto((prevTipos) => prevTipos.map((t) => (t.id === id ? actualizado : t))); // ✅ Usa setTiposProducto
      setTipo(null);
      toast.success('✅ Tipo de producto actualizado');
      return actualizado;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido al actualizar tipo';
      toast.error(`❌ ${msg}`);
      setError(msg);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const eliminarTipo = useCallback(async (id) => {
    try {
      setCargando(true);
      await tipoProductoApi.eliminar(id);
      setTiposProducto((prevTipos) => prevTipos.filter((t) => t.id !== id)); // ✅ Usa setTiposProducto
      setTipo(null);
      toast.success('🗑️ Tipo de producto eliminado');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido al eliminar tipo';
      toast.error(`❌ ${msg}`);
      setError(msg);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const clearTipo = useCallback(() => {
    setTipo(null);
  }, []);

  // ✅ Añadimos useEffect para la carga inicial de los tipos
  useEffect(() => {
    fetchTiposProducto();
  }, [fetchTiposProducto]); // Dependencia del useCallback

  return {
    tiposProducto, // ✅ Exporta el nombre correcto
    tipo,
    cargando,
    error,
    fetchTiposProducto, // Lo mantienes por si quieres refetch con un searchTerm
    fetchTipoPorId,
    crearTipo,
    actualizarTipo,
    eliminarTipo,
    clearTipo,
  };
};

export default useTipoProductos;