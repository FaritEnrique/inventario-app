import { create } from "zustand";
import requerimientosApi from "../api/requerimientosApi";

const useHistorialAprobacionesStore = create((set) => ({
  historialPorRequerimiento: {},
  cargandoPorRequerimiento: {},
  errorPorRequerimiento: {},

  cargarHistorial: async (requerimientoId) => {
    if (!requerimientoId) return;

    const key = String(requerimientoId);

    set((state) => ({
      cargandoPorRequerimiento: {
        ...state.cargandoPorRequerimiento,
        [key]: true,
      },
      errorPorRequerimiento: {
        ...state.errorPorRequerimiento,
        [key]: null,
      },
    }));

    try {
      const data = await requerimientosApi.getHistorial(requerimientoId);

      set((state) => ({
        historialPorRequerimiento: {
          ...state.historialPorRequerimiento,
          [key]: Array.isArray(data) ? data : [],
        },
        cargandoPorRequerimiento: {
          ...state.cargandoPorRequerimiento,
          [key]: false,
        },
      }));
    } catch (error) {
      set((state) => ({
        errorPorRequerimiento: {
          ...state.errorPorRequerimiento,
          [key]:
            error.message || "No se pudo cargar el historial de aprobaciones.",
        },
        cargandoPorRequerimiento: {
          ...state.cargandoPorRequerimiento,
          [key]: false,
        },
      }));
    }
  },
}));

export default useHistorialAprobacionesStore;
