// src/hooks/useProveedores.js
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import proveedoresApi from "../api/proveedoresApi";
import sunatApi from "../api/sunatApi";

const inFlightProveedorRequests = new Map();

const getProveedorRequestKey = (query = "", filters = {}) =>
  JSON.stringify({
    query: String(query || ""),
    filters: filters || {},
  });

const runSharedProveedorRequest = (key, requestFactory) => {
  if (inFlightProveedorRequests.has(key)) {
    return inFlightProveedorRequests.get(key);
  }

  const request = Promise.resolve()
    .then(requestFactory)
    .finally(() => {
      inFlightProveedorRequests.delete(key);
    });

  inFlightProveedorRequests.set(key, request);
  return request;
};

const useProveedores = ({ autoLoad = true } = {}) => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ultimaActualizacionSunat, setUltimaActualizacionSunat] =
    useState(null);

  const fetchProveedores = useCallback(async (query = "", filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await runSharedProveedorRequest(
        getProveedorRequestKey(query, filters),
        () => proveedoresApi.getTodas(query, filters)
      );
      setProveedores(data);
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(`Error al cargar proveedores: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const consultarProveedores = useCallback(async (query = "", filters = {}) => {
    try {
      return await runSharedProveedorRequest(
        getProveedorRequestKey(query, filters),
        () => proveedoresApi.getTodas(query, filters)
      );
    } catch (err) {
      toast.error(`Error al consultar proveedores: ${err.message}`);
      return [];
    }
  }, []);

  const crearProveedor = useCallback(async (nuevoProveedor) => {
    try {
      const data = await proveedoresApi.crear(nuevoProveedor);
      setProveedores((prev) => [...prev, data]);
      toast.success("Proveedor creado exitosamente.");
      return data;
    } catch (err) {
      toast.error(`Error al crear proveedor: ${err.message}`);
      throw err;
    }
  }, []);

  const actualizarProveedor = useCallback(async (id, datosActualizados) => {
    try {
      const data = await proveedoresApi.actualizar(id, datosActualizados);
      setProveedores((prev) =>
        prev.map((p) => (p.id === parseInt(id, 10) ? data : p))
      );
      toast.success("Proveedor actualizado exitosamente.");
      return data;
    } catch (err) {
      toast.error(`Error al actualizar proveedor: ${err.message}`);
      throw err;
    }
  }, []);

  const actualizarEstadoProveedor = useCallback(
    async (id, nuevoEstado) => {
      try {
        await proveedoresApi.actualizarEstado(id, nuevoEstado);
        await fetchProveedores();
        toast.success("Proveedor actualizado exitosamente.");
      } catch (err) {
        toast.error(`Error al actualizar estado del proveedor: ${err.message}`);
        throw err;
      }
    },
    [fetchProveedores]
  );

  const obtenerUltimaActualizacion = useCallback(async () => {
    try {
      const data = await sunatApi.obtenerUltimaActualizacion();
      setUltimaActualizacionSunat(data?.ultimaActualizacion || null);
    } catch (err) {
      console.error("Error al obtener la ultima actualizacion de SUNAT:", err);
    }
  }, []);

  const actualizarPadronSunat = useCallback(async () => {
    try {
      await toast.promise(sunatApi.actualizarPadronSunat(), {
        pending: "Actualizando padron SUNAT. Esto puede tardar unos minutos...",
        success: "Padron SUNAT actualizado correctamente.",
        error:
          "Error al actualizar el padron SUNAT. Revisa la consola para mas detalles.",
      });
      await fetchProveedores();
      await obtenerUltimaActualizacion();
    } catch (err) {
      console.error("Error en actualizarPadronSunat:", err);
    }
  }, [fetchProveedores, obtenerUltimaActualizacion]);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    void fetchProveedores();
    void obtenerUltimaActualizacion();
  }, [autoLoad, fetchProveedores, obtenerUltimaActualizacion]);

  return {
    proveedores,
    loading,
    error,
    ultimaActualizacionSunat,
    fetchProveedores,
    consultarProveedores,
    crearProveedor,
    actualizarProveedor,
    actualizarEstadoProveedor,
    actualizarPadronSunat,
  };
};

export default useProveedores;
