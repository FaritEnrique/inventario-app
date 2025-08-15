import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import proveedoresApi from '../api/proveedoresApi'; // IMPORTANTE: Importamos el API

const useProveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProveedores = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await proveedoresApi.getTodas(query); // CORREGIDO: Usando proveedoresApi
      setProveedores(data);
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const crearProveedor = async (nuevoProveedor) => {
    try {
      const data = await proveedoresApi.crear(nuevoProveedor); // CORREGIDO: Usando proveedoresApi
      setProveedores([...proveedores, data]);
      toast.success('Proveedor creado exitosamente.');
      return data;
    } catch (err) {
      toast.error(`Error al crear proveedor: ${err.message}`);
      throw err;
    }
  };

  const actualizarProveedor = async (id, datosActualizados) => {
    try {
      const data = await proveedoresApi.actualizar(id, datosActualizados); // CORREGIDO: Usando proveedoresApi
      setProveedores(
        proveedores.map((p) => (p.id === parseInt(id) ? data : p))
      );
      toast.success('Proveedor actualizado exitosamente.');
      return data;
    } catch (err) {
      toast.error(`Error al actualizar proveedor: ${err.message}`);
      throw err;
    }
  };

  const actualizarEstadoProveedor = async (id, nuevoEstado) => {
    try {
      await proveedoresApi.actualizarEstado(id, nuevoEstado); // CORREGIDO: Usando proveedoresApi
      await fetchProveedores();
      toast.success(`Proveedor actualizado exitosamente.`);
    } catch (err) {
      toast.error(`Error al actualizar estado del proveedor: ${err.message}`);
      throw err;
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  return {
    proveedores,
    loading,
    error,
    fetchProveedores,
    crearProveedor,
    actualizarProveedor,
    actualizarEstadoProveedor,
  };
};

export default useProveedores;