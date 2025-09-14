// src/hooks/useTipoProductos.js
import { useState, useEffect, useCallback } from 'react';
import tipoProductoApi from '../api/tipoProductoApi';
import { toast } from 'react-toastify';

const useTipoProductos = () => {
  const [tiposProducto, setTiposProducto] = useState([]);
  const [tipo, setTipo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const fetchTiposProducto = useCallback(async (searchTerm = '') => {
    try {
      setCargando(true);
      setError(null);
      const data = await tipoProductoApi.getTodos(searchTerm);
      setTiposProducto(data || []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido al obtener tipos de producto';
      toast.error(`❌ ${msg}`);
      setError(msg);
      setTiposProducto([]);
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
    } finally {
      setCargando(false);
    }
  }, []);

  const crearTipo = useCallback(async (nuevoTipo) => {
    try {
      setCargando(true);
      const data = await tipoProductoApi.crear(nuevoTipo);
      setTiposProducto((prevTipos) => [...prevTipos, data]);
      toast.success('✅ Tipo de producto creado');
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido al crear tipo';
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
      setTiposProducto((prevTipos) => prevTipos.map((t) => (t.id === id ? actualizado : t)));
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

  const reactivarTipo = useCallback(async (id) => {
    try {
      setCargando(true);
      const reactivado = await tipoProductoApi.reactivar(id);
      toast.success('✅ Tipo de producto reactivado');
      return reactivado;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido al reactivar tipo';
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
      setTiposProducto((prevTipos) => prevTipos.filter((t) => t.id !== id));
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

  useEffect(() => {
    fetchTiposProducto();
  }, [fetchTiposProducto]);

  return {
    tiposProducto,
    tipo,
    cargando,
    error,
    fetchTiposProducto,
    fetchTipoPorId,
    crearTipo,
    actualizarTipo,
    eliminarTipo,
    reactivarTipo,
    clearTipo,
  };
};

export default useTipoProductos;