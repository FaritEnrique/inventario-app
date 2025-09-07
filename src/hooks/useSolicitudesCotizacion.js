import { useEffect, useState } from 'react';
import solicitudesCotizacionApi from '../api/solicitudesCotizacionApi';
import { toast } from 'react-toastify';

const useSolicitudesCotizacion = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarSolicitudes = async () => {
    try {
      setCargando(true);
      const data = await solicitudesCotizacionApi.obtenerTodas();
      setSolicitudes(data);
      setError(null);
    } catch (err) {
      console.error('Error cargando solicitudes de cotización:', err);
      setError('No se pudieron cargar las solicitudes de cotización.');
      toast.error('Error al cargar solicitudes de cotización.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const crearSolicitud = async (solicitud) => {
    try {
      const nuevaSolicitud = await solicitudesCotizacionApi.crear(solicitud);
      setSolicitudes((prev) => [...prev, nuevaSolicitud]);
      toast.success('Solicitud de cotización creada con éxito!');
      return nuevaSolicitud;
    } catch (err) {
      console.error('Error creando solicitud de cotización:', err);
      const errorMessage = err.message || 'Error al crear solicitud de cotización.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const actualizarSolicitud = async (id, datos) => {
    try {
      const solicitudActualizada = await solicitudesCotizacionApi.actualizar(id, datos);
      setSolicitudes((prev) =>
        prev.map((s) => (s.id === id ? solicitudActualizada : s))
      );
      toast.success('Solicitud de cotización actualizada con éxito!');
      return solicitudActualizada;
    } catch (err) {
      console.error('Error actualizando solicitud de cotización:', err);
      const errorMessage = err.message || 'Error al actualizar solicitud de cotización.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const eliminarSolicitud = async (id) => {
    try {
      await solicitudesCotizacionApi.eliminar(id);
      setSolicitudes((prev) => prev.filter((s) => s.id !== id));
      toast.success('Solicitud de cotización eliminada con éxito!');
    } catch (err) {
      console.error('Error eliminando solicitud de cotización:', err);
      const errorMessage = err.message || 'Error al eliminar solicitud de cotización.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    solicitudes,
    cargando,
    error,
    cargarSolicitudes,
    crearSolicitud,
    actualizarSolicitud,
    eliminarSolicitud,
  };
};

export default useSolicitudesCotizacion;