// src/hooks/useAreas.js
import { useState, useEffect, useCallback } from "react";
import areasApi from "../api/areasApi";
import { toast } from "react-toastify";

const useAreas = () => {
  const [areas, setAreas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // 🟦 Cargar áreas activas (filtradas desde el backend)
  const fetchAreas = useCallback(async (searchQuery = "") => {
    try {
      setCargando(true);
      const data = await areasApi.getAreas(searchQuery);
      setAreas(data || []);
    } catch (err) {
      console.error("❌ Error al cargar áreas:", err);
      setError(err);
      toast.error("❌ Error al cargar las áreas.");
    } finally {
      setCargando(false);
    }
  }, []);

  // 🟩 Crear área (el backend la crea activa por defecto)
  const createArea = useCallback(
    async (areaData) => {
      try {
        setCargando(true);
        const newArea = await areasApi.createArea(areaData);
        toast.success("✅ Área creada correctamente.");
        await fetchAreas();
        return newArea;
      } catch (err) {
        console.error("❌ Error al crear área:", err);
        setError(err);
        const message = err.response?.data?.message || "Error al crear el área.";
        toast.error(`❌ ${message}`);
        throw err;
      } finally {
        setCargando(false);
      }
    },
    [fetchAreas]
  );

  // 🟨 Actualizar área
  const updateArea = useCallback(
    async (id, areaData) => {
      try {
        setCargando(true);
        const updatedArea = await areasApi.updateArea(id, areaData);
        toast.success("✅ Área actualizada correctamente.");
        await fetchAreas();
        return updatedArea;
      } catch (err) {
        console.error("❌ Error al actualizar área:", err);
        setError(err);
        const message =
          err.response?.data?.message || "Error al actualizar el área.";
        toast.error(`❌ ${message}`);
        throw err;
      } finally {
        setCargando(false);
      }
    },
    [fetchAreas]
  );

  // 🟥 Eliminar área (borrado lógico)
  const deleteArea = useCallback(
    async (id) => {
      try {
        setCargando(true);
        await areasApi.deleteArea(id);
        toast.success("✅ Área eliminada correctamente.");
        await fetchAreas();
      } catch (err) {
        console.error("❌ Error al eliminar área:", err);
        setError(err);
        const message =
          err.response?.data?.message || err.message || "Error al eliminar el área.";
        toast.error(`❌ ${message}`);
        throw err;
      } finally {
        setCargando(false);
      }
    },
    [fetchAreas]
  );

  // 🟦 Cargar al inicio
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