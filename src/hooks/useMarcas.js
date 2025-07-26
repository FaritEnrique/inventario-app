// src/hooks/useMarcas.js
import { useState } from 'react';
import marcasApi from '../api/marcasApi';
import { toast } from 'react-toastify';

const useMarcas = () => {
  const [marcas, setMarcas] = useState([]);
  const [marca, setMarca] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const fetchMarcas = async (buscar = '') => {
    try {
      setCargando(true);
      const data = await marcasApi.getTodas(buscar);
      setMarcas(data);
      setError(null);
    } catch (err) {
      toast.error('❌ Error al obtener marcas');
      setError('Error al obtener marcas');
    } finally {
      setCargando(false);
    }
  };

  const fetchMarcaPorId = async (id) => {
    try {
      setCargando(true);
      const data = await marcasApi.getPorId(id);
      setMarca(data);
      setError(null);
    } catch (err) {
      toast.error('❌ Marca no encontrada');
      setError('Marca no encontrada');
    } finally {
      setCargando(false);
    }
  };

  const crearMarca = async (nuevaMarca) => {
    try {
      setCargando(true);
      const data = await marcasApi.crear(nuevaMarca);
      setMarcas([...marcas, data]);
      toast.success('✅ Marca creada correctamente');
      return data;
    } catch (err) {
      toast.error(`❌ ${err.message}`);
      setError('Error al crear marca');
      throw err;
    } finally {
      setCargando(false);
    }
  };

  const actualizarMarca = async (id, datos) => {
    try {
      setCargando(true);
      const actualizada = await marcasApi.actualizar(id, datos);
      setMarcas((prev) =>
        prev.map((m) => (m.id === id ? actualizada : m))
      );
      toast.success('✅ Marca actualizada correctamente');
      return actualizada;
    } catch (err) {
      toast.error(`❌ ${err.message}`);
      setError('Error al actualizar marca');
      throw err;
    } finally {
      setCargando(false);
    }
  };

  const eliminarMarca = async (id) => {
    try {
      setCargando(true);
      await marcasApi.eliminar(id);
      setMarcas((prev) => prev.filter((m) => m.id !== id));
      toast.success('🗑️ Marca eliminada correctamente');
    } catch (err) {
      toast.error(`❌ ${err.message}`);
      setError('Error al eliminar marca');
      throw err;
    } finally {
      setCargando(false);
    }
  };

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