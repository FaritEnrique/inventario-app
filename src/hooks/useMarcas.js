// src/hooks/useMarcas.js
import { useState, useEffect, useCallback } from 'react'; // ✅ Importa useEffect
import marcasApi from '../api/marcasApi';
import { toast } from 'react-toastify';

const useMarcas = () => {
  const [marcas, setMarcas] = useState([]); // ✅ Correcto, inicializado como array
  const [marca, setMarca] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Función auxiliar para logs condicionales en desarrollo
  const devLog = (...args) => {
    if (import.meta.env.MODE === 'development') {
      console.log('[DEV_LOG_USE_MARCAS]', ...args);
    }
  };

  const fetchMarcas = useCallback(async (buscar = '') => {
    try {
      devLog('Fetching marcas with search term (useMarcas):', buscar);
      setCargando(true);
      setError(null); // ✅ Resetear error al inicio de la fetch
      const data = await marcasApi.getTodas(buscar); // O getTodos, según tu API
      devLog('Datos de marcas recibidos:', data);
      setMarcas(data || []); // ✅ Asegura que siempre sea un array
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido al obtener marcas';
      toast.error(`❌ ${msg}`);
      setError(msg);
      devLog('Error en fetchMarcas:', err);
      setMarcas([]); // ✅ Asegura que sea un array vacío en caso de error
    } finally {
      setCargando(false);
    }
  }, []);

  const fetchMarcaPorId = useCallback(async (id) => {
    try {
      setCargando(true);
      setError(null); // ✅ Resetear error al inicio de la fetch
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
      const msg = err.response?.data?.message || err.message || 'Error desconocido al crear marca';
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

  // ✅ Añadimos useEffect para la carga inicial de las marcas
  useEffect(() => {
    fetchMarcas();
  }, [fetchMarcas]); // Dependencia del useCallback

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
  };
};

export default useMarcas;