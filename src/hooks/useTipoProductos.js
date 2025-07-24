// src/hooks/useTipoProductos.js
import { useState, useEffect } from 'react';
import tipoProductoApi from '../api/tipoProductoApi';
import { toast } from 'react-toastify';

const useTipoProductos = () => {
  const [tipos, setTipos] = useState([]);
  const [tipo, setTipo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const fetchTipos = async () => {
    try {
      setCargando(true);
      const data = await tipoProductoApi.getTodos();
      setTipos(data);
      setError(null);
    } catch (err) {
      toast.error('❌ Error al obtener tipos de producto');
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const crearTipo = async (nuevoTipo) => {
    try {
      setCargando(true);
      const data = await tipoProductoApi.crear(nuevoTipo);
      setTipos([...tipos, data]);
      toast.success('✅ Tipo de producto creado');
      return data;
    } catch (err) {
      toast.error(`❌ ${err.message}`);
      setError(err.message);
      throw err;
    } finally {
      setCargando(false);
    }
  };

  const actualizarTipo = async (id, datos) => {
    try {
      setCargando(true);
      const actualizado = await tipoProductoApi.actualizar(id, datos);
      setTipos((prev) => prev.map((t) => (t.id === id ? actualizado : t)));
      toast.success('✅ Tipo de producto actualizado');
      return actualizado;
    } catch (err) {
      toast.error(`❌ ${err.message}`);
      setError(err.message);
      throw err;
    } finally {
      setCargando(false);
    }
  };

  const eliminarTipo = async (id) => {
    try {
      setCargando(true);
      await tipoProductoApi.eliminar(id);
      setTipos((prev) => prev.filter((t) => t.id !== id));
      toast.success('🗑️ Tipo de producto eliminado');
    } catch (err) {
      toast.error(`❌ ${err.message}`);
      setError(err.message);
      throw err;
    } finally {
      setCargando(false);
    }
  };

  return {
    tipos,
    tipo,
    cargando,
    error,
    fetchTipos,
    crearTipo,
    actualizarTipo,
    eliminarTipo,
  };
};

export default useTipoProductos;