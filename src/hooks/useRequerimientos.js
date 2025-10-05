import { useState, useEffect, useCallback } from 'react';
import requerimientosApi from '../api/requerimientosApi';

const useRequerimientos = () => {
  const [requerimientos, setRequerimientos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const [prioridades, setPrioridades] = useState([]);
  const [cargandoPrioridades, setCargandoPrioridades] = useState(false);
  const [errorPrioridades, setErrorPrioridades] = useState(null);

  const fetchRequerimientos = useCallback(async (buscar = '') => {
    setCargando(true);
    try {
      const data = await requerimientosApi.obtenerTodos(buscar);
      // Assuming the API returns { data: [...] }
      setRequerimientos(data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  const getRequerimientoById = useCallback(async (id) => {
    setCargando(true);
    try {
      const data = await requerimientosApi.getById(id);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  const crearRequerimiento = async (datos) => {
    const nuevo = await requerimientosApi.crear(datos);
    setRequerimientos((prev) => [...prev, nuevo]);
  };

  const actualizarRequerimiento = async (id, datos) => {
    const actualizado = await requerimientosApi.actualizar(id, datos);
    setRequerimientos((prev) => 
      prev.map((req) => (req.id === id ? actualizado : req))
    );
  };

  const eliminarRequerimiento = async (id) => {
    await requerimientosApi.eliminar(id);
    setRequerimientos((prev) => prev.filter((req) => req.id !== id));
  };

  const fetchPrioridades = useCallback(async () => {
    setCargandoPrioridades(true);
    try {
      const data = await requerimientosApi.obtenerPrioridades();
      // Si la API devuelve null o algo inesperado, asignamos array vacío
      setPrioridades(Array.isArray(data) ? data : []);
      setErrorPrioridades(null);
    } catch (err) {
      setErrorPrioridades(err.message);
      setPrioridades([]); // Reseteamos en caso de error
    } finally {
      setCargandoPrioridades(false);
    }
  }, []);

  useEffect(() => {
    fetchPrioridades();
  }, [fetchPrioridades]);

  return {
    requerimientos,
    cargando,
    error,
    fetchRequerimientos,
    getRequerimientoById,
    crearRequerimiento,
    actualizarRequerimiento,
    eliminarRequerimiento,
    prioridades,
    cargandoPrioridades,
    errorPrioridades,
    fetchPrioridades,
  };
};

export default useRequerimientos;
