// src/hooks/useProveedores.js
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import proveedoresApi from "../api/proveedoresApi";
import sunatApi from "../api/sunatApi";

const useProveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ultimaActualizacionSunat, setUltimaActualizacionSunat] =
    useState(null);

  const fetchProveedores = async (query = "", filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await proveedoresApi.getTodas(query, filters);
      setProveedores(data);
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(`Error al cargar proveedores: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const crearProveedor = async (nuevoProveedor) => {
    try {
      const data = await proveedoresApi.crear(nuevoProveedor);
      setProveedores([...proveedores, data]);
      toast.success("Proveedor creado exitosamente.");
      return data;
    } catch (err) {
      toast.error(`Error al crear proveedor: ${err.message}`);
      throw err;
    }
  };

  const actualizarProveedor = async (id, datosActualizados) => {
    try {
      const data = await proveedoresApi.actualizar(id, datosActualizados);
      setProveedores(
        proveedores.map((p) => (p.id === parseInt(id, 10) ? data : p))
      );
      toast.success("Proveedor actualizado exitosamente.");
      return data;
    } catch (err) {
      toast.error(`Error al actualizar proveedor: ${err.message}`);
      throw err;
    }
  };

  const actualizarEstadoProveedor = async (id, nuevoEstado) => {
    try {
      await proveedoresApi.actualizarEstado(id, nuevoEstado);
      await fetchProveedores();
      toast.success("Proveedor actualizado exitosamente.");
    } catch (err) {
      toast.error(`Error al actualizar estado del proveedor: ${err.message}`);
      throw err;
    }
  };

  const actualizarPadronSunat = async () => {
    try {
      await toast.promise(sunatApi.actualizarPadronSunat(), {
        pending: "Actualizando padrón SUNAT. Esto puede tardar unos minutos...",
        success: "Padrón SUNAT actualizado correctamente.",
        error:
          "Error al actualizar el padrón SUNAT. Revisa la consola para más detalles.",
      });
      fetchProveedores();
      obtenerUltimaActualizacion();
    } catch (err) {
      console.error("Error en actualizarPadronSunat:", err);
    }
  };

  const obtenerUltimaActualizacion = async () => {
    try {
      const data = await sunatApi.obtenerUltimaActualizacion();
      setUltimaActualizacionSunat(data?.ultimaActualizacion || null);
    } catch (err) {
      console.error("Error al obtener la última actualización de SUNAT:", err);
    }
  };

  useEffect(() => {
    fetchProveedores();
    obtenerUltimaActualizacion();
  }, []);

  return {
    proveedores,
    loading,
    error,
    ultimaActualizacionSunat,
    fetchProveedores,
    crearProveedor,
    actualizarProveedor,
    actualizarEstadoProveedor,
    actualizarPadronSunat,
  };
};

export default useProveedores;
