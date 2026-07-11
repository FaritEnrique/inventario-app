import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import solicitudesTipoProductoApi from "../api/solicitudesTipoProductoApi";

const useSolicitudesTipoProducto = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (action, { successMessage, updateState } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const data = await action();

      if (typeof updateState === "function") {
        updateState(data);
      }

      if (successMessage) {
        toast.success(successMessage);
      }

      return data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Ocurrio un error al procesar la solicitud.";

      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSolicitudes = useCallback((filters = {}) =>
    execute(() => solicitudesTipoProductoApi.listar(filters), {
      updateState: (data) => setSolicitudes(Array.isArray(data) ? data : []),
    }), [execute]);

  const crearSolicitud = useCallback((payload) =>
    execute(() => solicitudesTipoProductoApi.crear(payload), {
      successMessage: "Solicitud registrada correctamente.",
      updateState: (data) =>
        setSolicitudes((prev) => [data, ...prev.filter((item) => item.id !== data.id)]),
    }), [execute]);

  const observarSolicitud = useCallback((id, payload) =>
    execute(() => solicitudesTipoProductoApi.observar(id, payload), {
      successMessage: "Solicitud observada correctamente.",
      updateState: (data) =>
        setSolicitudes((prev) => prev.map((item) => (item.id === data.id ? data : item))),
    }), [execute]);

  const homologarSolicitud = useCallback((id, payload) =>
    execute(() => solicitudesTipoProductoApi.homologar(id, payload), {
      successMessage: "Solicitud homologada correctamente.",
      updateState: (data) =>
        setSolicitudes((prev) => prev.map((item) => (item.id === data.id ? data : item))),
    }), [execute]);

  const crearTipoDesdeSolicitud = useCallback((id, payload) =>
    execute(() => solicitudesTipoProductoApi.crearTipo(id, payload), {
      successMessage: "Solicitud resuelta con tipo oficial.",
      updateState: (data) =>
        setSolicitudes((prev) => prev.map((item) => (item.id === data.id ? data : item))),
    }), [execute]);

  const rechazarSolicitud = useCallback((id, payload) =>
    execute(() => solicitudesTipoProductoApi.rechazar(id, payload), {
      successMessage: "Solicitud rechazada correctamente.",
      updateState: (data) =>
        setSolicitudes((prev) => prev.map((item) => (item.id === data.id ? data : item))),
    }), [execute]);

  return {
    solicitudes,
    loading,
    error,
    fetchSolicitudes,
    crearSolicitud,
    observarSolicitud,
    homologarSolicitud,
    crearTipoDesdeSolicitud,
    rechazarSolicitud,
  };
};

export default useSolicitudesTipoProducto;
