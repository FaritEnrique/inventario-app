import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import solicitudesCotizacionApi from "../api/solicitudesCotizacionApi";

const useSolicitudesCotizacion = ({ autoLoad = true } = {}) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarSolicitudes = async () => {
    try {
      setCargando(true);
      const data = await solicitudesCotizacionApi.obtenerTodas();
      setSolicitudes(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Error cargando solicitudes de cotización:", err);
      setError("No se pudieron cargar las solicitudes de cotización.");
      toast.error("Error al cargar solicitudes de cotización.");
    } finally {
      setCargando(false);
    }
  };

  const cargarSolicitudesPorRequerimiento = async (requerimientoId) => {
    try {
      setCargando(true);
      const data = await solicitudesCotizacionApi.obtenerPorRequerimiento(
        requerimientoId
      );
      const normalizedData = Array.isArray(data) ? data : [];
      setSolicitudes(normalizedData);
      setError(null);
      return normalizedData;
    } catch (err) {
      console.error("Error cargando solicitudes por requerimiento:", err);
      const errorMessage =
        err.message ||
        "No se pudieron cargar las solicitudes de cotización del requerimiento.";
      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      cargarSolicitudes();
    } else {
      setCargando(false);
    }
  }, [autoLoad]);

  const crearSolicitud = async (solicitud) => {
    try {
      const nuevaSolicitud = await solicitudesCotizacionApi.crear(solicitud);
      setSolicitudes((prev) => [...prev, nuevaSolicitud]);
      toast.success("Solicitud de cotización creada con éxito.");
      return nuevaSolicitud;
    } catch (err) {
      console.error("Error creando solicitud de cotización:", err);
      const errorMessage =
        err.message || "Error al crear solicitud de cotización.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const actualizarSolicitud = async (id, datos) => {
    try {
      const solicitudActualizada = await solicitudesCotizacionApi.actualizar(
        id,
        datos
      );
      setSolicitudes((prev) =>
        prev.map((solicitud) =>
          solicitud.id === id ? solicitudActualizada : solicitud
        )
      );
      toast.success("Solicitud de cotización actualizada con éxito.");
      return solicitudActualizada;
    } catch (err) {
      console.error("Error actualizando solicitud de cotización:", err);
      const errorMessage =
        err.message || "Error al actualizar solicitud de cotización.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const inactivarSolicitud = async (id) => {
    try {
      const solicitudInactivada = await solicitudesCotizacionApi.inactivar(id);
      setSolicitudes((prev) =>
        prev.map((solicitud) =>
          solicitud.id === id ? solicitudInactivada : solicitud
        )
      );
      toast.success("Solicitud de cotización inactivada con éxito.");
      return solicitudInactivada;
    } catch (err) {
      console.error("Error inactivando solicitud de cotización:", err);
      const errorMessage =
        err.message || "Error al inactivar solicitud de cotización.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const obtenerSolicitudPdfUrl = (id) =>
    solicitudesCotizacionApi.obtenerPdfUrl(id);

  const obtenerHistorialEnvios = useCallback(
    (id) => solicitudesCotizacionApi.obtenerHistorialEnvios(id),
    [],
  );

  const enviarSolicitudCorreo = async (id, payload) => {
    try {
      const response = await solicitudesCotizacionApi.enviarCorreo(id, payload);
      toast.success("Solicitud de cotización enviada por correo.");
      return response;
    } catch (err) {
      console.error("Error enviando solicitud de cotización por correo:", err);
      const errorMessage =
        err.message || "Error al enviar solicitud de cotización por correo.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const generarAccesoSistemaSolicitud = async (id, payload = {}) => {
    try {
      const response = await solicitudesCotizacionApi.generarAccesoSistema(
        id,
        payload,
      );

      if (response?.status === "EXISTENTE") {
        toast.info("Ya existe un acceso por sistema activo para esta solicitud.");
      } else {
        toast.success("Acceso por sistema generado correctamente.");
      }

      return response;
    } catch (err) {
      console.error("Error generando acceso por sistema:", err);
      const errorMessage =
        err.message || "Error al generar acceso por sistema.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const registrarEventoAccesoSistema = async (id, accesoId, payload = {}) => {
    try {
      return await solicitudesCotizacionApi.registrarEventoAccesoSistema(
        id,
        accesoId,
        payload,
      );
    } catch (err) {
      console.error("Error registrando evento de acceso por sistema:", err);
      throw err;
    }
  };

  return {
    solicitudes,
    cargando,
    error,
    cargarSolicitudes,
    cargarSolicitudesPorRequerimiento,
    crearSolicitud,
    actualizarSolicitud,
    inactivarSolicitud,
    obtenerSolicitudPdfUrl,
    obtenerHistorialEnvios,
    enviarSolicitudCorreo,
    generarAccesoSistemaSolicitud,
    registrarEventoAccesoSistema,
  };
};

export default useSolicitudesCotizacion;
