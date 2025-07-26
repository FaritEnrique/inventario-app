// src/hooks/useAreas.js
import { useState } from 'react';
import areasApi from '../api/areasApi';
import { toast } from 'react-toastify';

const useAreas = () => {
  const [areas, setAreas] = useState([]);
  const [area, setArea] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const fetchAreas = async (buscar = '') => {
    try {
      setCargando(true);
      const data = await areasApi.obtenerTodas(buscar); // asegúrate que el método se llame así
      setAreas(data);
      setError(null);
    } catch (err) {
      toast.error('❌ Error al obtener áreas');
      setError('Error al obtener áreas');
    } finally {
      setCargando(false);
    }
  };

  const fetchAreaPorId = async (id) => {
    try {
      setCargando(true);
      const data = await areasApi.obtenerPorId(id);
      setArea(data);
      setError(null);
    } catch (err) {
      toast.error('❌ Área no encontrada');
      setError('Área no encontrada');
    } finally {
      setCargando(false);
    }
  };

  const crearArea = async (nuevaArea) => {
    try {
      setCargando(true);
      const data = await areasApi.crear(nuevaArea);
      setAreas([...areas, data]);
      toast.success('✅ Área creada correctamente');
      return data;
    } catch (err) {
      toast.error(`❌ ${err.message}`);
      setError('Error al crear área');
      throw err;
    } finally {
      setCargando(false);
    }
  };

  const actualizarArea = async (id, datos) => {
    try {
      setCargando(true);
      const actualizada = await areasApi.actualizar(id, datos);
      setAreas((prev) =>
        prev.map((a) => (a.id === id ? actualizada : a))
      );
      toast.success('✅ Área actualizada correctamente');
      return actualizada;
    } catch (err) {
      toast.error(`❌ ${err.message}`);
      setError('Error al actualizar área');
      throw err;
    } finally {
      setCargando(false);
    }
  };

  const eliminarArea = async (id) => {
    try {
      setCargando(true);
      await areasApi.eliminar(id);
      setAreas((prev) => prev.filter((a) => a.id !== id));
      toast.success('🗑️ Área eliminada correctamente');
    } catch (err) {
      toast.error(`❌ ${err.message}`);
      setError('Error al eliminar área');
      throw err;
    } finally {
      setCargando(false);
    }
  };

  return {
    areas,
    area,
    cargando,
    error,
    fetchAreas,
    fetchAreaPorId,
    crearArea,
    actualizarArea,
    eliminarArea,
  };
};

export default useAreas;