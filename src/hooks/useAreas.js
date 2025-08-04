// src/hooks/useAreas.js
import { useState, useEffect, useCallback } from 'react';
import areasApi from '../api/areasApi';
import { toast } from 'react-toastify';

const useAreas = () => {
  const [areas, setAreas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const fetchAreas = useCallback(async (searchQuery = '') => {
    setCargando(true);
    setError(null);
    try {
      const data = await areasApi.getAreas(searchQuery);
      setAreas(data);
    } catch (err) {
      console.error('Error al cargar áreas:', err);
      setError(err);
      toast.error('❌ Error al cargar las áreas.');
    } finally {
      setCargando(false);
    }
  }, []);

  const createArea = useCallback(async (areaData) => {
    setCargando(true);
    setError(null);
    try {
      const newArea = await areasApi.createArea(areaData);
      return newArea;
    } catch (err) {
      console.error('Error al crear área:', err);
      setError(err);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const updateArea = useCallback(async (id, areaData) => {
    setCargando(true);
    setError(null);
    try {
      const updatedArea = await areasApi.updateArea(id, areaData);
      return updatedArea;
    } catch (err) {
      console.error('Error al actualizar área:', err);
      setError(err);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const deleteArea = useCallback(async (id) => {
    setCargando(true);
    setError(null);
    try {
      await areasApi.deleteArea(id);
    } catch (err) {
      console.error('Error al eliminar área:', err);
      setError(err);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  return {
    areas,
    cargando,
    error,
    fetchAreas,
    createArea,
    updateArea,
    deleteArea,
  };
};

export default useAreas;