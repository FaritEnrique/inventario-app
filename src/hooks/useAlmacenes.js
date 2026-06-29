// src/hooks/useAlmacenes.js
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import almacenesApi from "../api/almacenesApi";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const useAlmacenes = () => {
  const [almacenes, setAlmacenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const obtenerAlmacenes = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const data = await almacenesApi.obtenerAlmacenes(params);
      const list = Array.isArray(data) ? data : [];
      setAlmacenes(list);
      setError(null);
      return list;
    } catch (err) {
      setError(err);
      toast.error(getErrorMessage(err, "No se pudieron cargar los almacenes."));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const crearAlmacen = useCallback(
    async (payload) => {
      try {
        setLoading(true);
        const data = await almacenesApi.crearAlmacen(payload);
        toast.success("Almacén creado correctamente.");
        await obtenerAlmacenes();
        return data;
      } catch (err) {
        setError(err);
        toast.error(getErrorMessage(err, "No se pudo crear el almacén."));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [obtenerAlmacenes],
  );

  const actualizarAlmacen = useCallback(
    async (id, payload) => {
      try {
        setLoading(true);
        const data = await almacenesApi.actualizarAlmacen(id, payload);
        toast.success("Almacén actualizado correctamente.");
        await obtenerAlmacenes();
        return data;
      } catch (err) {
        setError(err);
        toast.error(getErrorMessage(err, "No se pudo actualizar el almacén."));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [obtenerAlmacenes],
  );

  const activarAlmacen = useCallback(
    async (id) => {
      try {
        setLoading(true);
        const data = await almacenesApi.activarAlmacen(id);
        toast.success("Almacén activado correctamente.");
        await obtenerAlmacenes({ estado: "todos" });
        return data;
      } catch (err) {
        setError(err);
        toast.error(getErrorMessage(err, "No se pudo activar el almacén."));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [obtenerAlmacenes],
  );

  const desactivarAlmacen = useCallback(
    async (id) => {
      try {
        setLoading(true);
        const data = await almacenesApi.desactivarAlmacen(id);
        toast.success("Almacén desactivado correctamente.");
        await obtenerAlmacenes({ estado: "todos" });
        return data;
      } catch (err) {
        setError(err);
        toast.error(getErrorMessage(err, "No se pudo desactivar el almacén."));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [obtenerAlmacenes],
  );

  return {
    almacenes,
    loading,
    error,
    obtenerAlmacenes,
    crearAlmacen,
    actualizarAlmacen,
    activarAlmacen,
    desactivarAlmacen,
  };
};

export default useAlmacenes;
