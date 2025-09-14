// src/hooks/useMarcas.js
import { useState, useEffect, useCallback } from 'react';
import marcasApi from '../api/marcasApi';
import { toast } from 'react-toastify';

const useMarcas = () => {
  const [marcas, setMarcas] = useState([]);
  const [marca, setMarca] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const fetchMarcas = useCallback(async (buscar = '') => {
    try {
      setCargando(true);
      setError(null);
      const data = await marcasApi.getTodas(buscar);
      setMarcas(data || []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido al obtener marcas';
      toast.error(`❌ ${msg}`);
      setError(msg);
      setMarcas([]);
    } finally {
      setCargando(false);
    }
  }, []);

  const fetchMarcaPorId = useCallback(async (id) => {
    try {
      setCargando(true);
      setError(null);
      const data = await marcasApi.getPorId(id);
      setMarca(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Marca no encontrada';
      toast.error(`❌ ${msg}`);
      setError(msg);
    } finally {
      setCargando(false);
    }
  }, []);

  const crearMarca = useCallback(async (nuevaMarca) => {
    try {
      setCargando(true);
      const data = await marcasApi.crear(nuevaMarca);
      setMarcas(prev => [...prev, data]);
      toast.success('✅ Marca creada correctamente');
      return data;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error desconocido al crear marca');
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const reactivarMarca = useCallback(async (id) => {
    try {
      setCargando(true);
      const reactivada = await marcasApi.reactivar(id);
      toast.success('✅ Marca reactivada correctamente');
      return reactivada;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido al reactivar marca';
      toast.error(`❌ ${msg}`);
      setError(msg);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const actualizarMarca = useCallback(async (id, datos) => {
    try {
      setCargando(true);
      const actualizada = await marcasApi.actualizar(id, datos);
      setMarcas((prev) =>
        prev.map((m) => (m.id === id ? actualizada : m))
      );
      toast.success('✅ Marca actualizada correctamente');
      return actualizada;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido al actualizar marca';
      toast.error(`❌ ${msg}`);
      setError(msg);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const eliminarMarca = useCallback(async (id) => {
    try {
      setCargando(true);
      await marcasApi.eliminar(id);
      setMarcas((prev) => prev.filter((m) => m.id !== id));
      toast.success('🗑️ Marca eliminada correctamente');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido al eliminar marca';
      toast.error(`❌ ${msg}`);
      setError(msg);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    fetchMarcas();
  }, [fetchMarcas]);

  return {
    marcas,
    marca,
    cargando,
    error,
    fetchMarcas,
    fetchMarcaPorId,
    crearMarca,
    actualizarMarca,
    eliminarMarca,
    reactivarMarca,
  };
};

export default useMarcas;