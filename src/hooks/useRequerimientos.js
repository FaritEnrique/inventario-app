import { useCallback, useEffect, useState } from "react";
import requerimientosApi from "../api/requerimientosApi";

const useRequerimientos = () => {
  const [requerimientos, setRequerimientos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    totalItems: 0,
  });
  const [prioridades, setPrioridades] = useState([]);
  const [cargandoPrioridades, setCargandoPrioridades] = useState(false);

  const fetchRequerimientos = useCallback(async (options = {}) => {
    setCargando(true);
    try {
      const data = await requerimientosApi.obtenerTodos(options);
      setRequerimientos(Array.isArray(data?.data) ? data.data : []);
      setPagination({
        totalPages: data?.totalPages || 1,
        currentPage: data?.currentPage || 1,
        totalItems: data?.totalItems || 0,
      });
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const fetchTray = useCallback(async (nivel, options = {}) => {
    setCargando(true);
    try {
      const data = await requerimientosApi.obtenerBandeja(nivel, options);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
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
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const crearRequerimiento = useCallback(async (datos) => {
    const nuevo = await requerimientosApi.crear(datos);
    return nuevo;
  }, []);

  const actualizarRequerimiento = useCallback(async (id, datos) => {
    return requerimientosApi.actualizar(id, datos);
  }, []);

  const eliminarRequerimiento = useCallback(async (id) => {
    return requerimientosApi.eliminar(id);
  }, []);

  const procesarAprobacion = useCallback(async (id, datos) => {
    return requerimientosApi.procesarAprobacion(id, datos);
  }, []);

  const buscarCatalogoProductos = useCallback(async (options = {}) => {
    return requerimientosApi.buscarCatalogoProductos(options);
  }, []);

  const fetchPrioridades = useCallback(async () => {
    setCargandoPrioridades(true);
    try {
      const data = await requerimientosApi.obtenerPrioridades();
      setPrioridades(Array.isArray(data) ? data : []);
      return data;
    } finally {
      setCargandoPrioridades(false);
    }
  }, []);

  useEffect(() => {
    fetchPrioridades().catch(() => {});
  }, [fetchPrioridades]);

  return {
    requerimientos,
    cargando,
    error,
    pagination,
    prioridades,
    cargandoPrioridades,
    fetchRequerimientos,
    fetchTray,
    getRequerimientoById,
    crearRequerimiento,
    actualizarRequerimiento,
    eliminarRequerimiento,
    procesarAprobacion,
    buscarCatalogoProductos,
    fetchPrioridades,
  };
};

export default useRequerimientos;
