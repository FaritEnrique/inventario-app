// src/hooks/useAreas.js
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import areasApi from "../api/areasApi";

const useAreas = ({ enabled = true } = {}) => {
  const [areas, setAreas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const fetchAreas = useCallback(
    async (searchQuery = "") => {
      if (!enabled) {
        return [];
      }

      try {
        setCargando(true);
        const data = await areasApi.getAreas(searchQuery);
        setAreas(data || []);
        setError(null);
        return data || [];
      } catch (err) {
        console.error("Error al cargar areas:", err);
        setError(err);
        toast.error("Error al cargar las áreas.");
        throw err;
      } finally {
        setCargando(false);
      }
    },
    [enabled]
  );

  const createArea = useCallback(
    async (areaData) => {
      try {
        setCargando(true);
        const newArea = await areasApi.createArea(areaData);
        toast.success("Área creada correctamente.");
        await fetchAreas();
        return newArea;
      } catch (err) {
        console.error("Error al crear área:", err);
        setError(err);
        const message = err.response?.data?.message || "Error al crear el área.";
        toast.error(message);
        throw err;
      } finally {
        setCargando(false);
      }
    },
    [fetchAreas]
  );

  const updateArea = useCallback(
    async (id, areaData) => {
      try {
        setCargando(true);
        const updatedArea = await areasApi.updateArea(id, areaData);
        toast.success("Área actualizada correctamente.");
        await fetchAreas();
        return updatedArea;
      } catch (err) {
        console.error("Error al actualizar área:", err);
        setError(err);
        const message =
          err.response?.data?.message || "Error al actualizar el área.";
        toast.error(message);
        throw err;
      } finally {
        setCargando(false);
      }
    },
    [fetchAreas]
  );

  const deleteArea = useCallback(
    async (id) => {
      try {
        setCargando(true);
        await areasApi.deleteArea(id);
        toast.success("Área eliminada correctamente.");
        await fetchAreas();
      } catch (err) {
        console.error("Error al eliminar área:", err);
        setError(err);
        const message =
          err.response?.data?.message ||
          err.message ||
          "Error al eliminar el área.";
        toast.error(message);
        throw err;
      } finally {
        setCargando(false);
      }
    },
    [fetchAreas]
  );

  useEffect(() => {
    if (!enabled) {
      setAreas([]);
      setError(null);
      return;
    }

    fetchAreas().catch(() => {});
  }, [enabled, fetchAreas]);

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
