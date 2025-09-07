import { useEffect, useState } from 'react';
import cotizacionesApi from '../api/cotizacionesApi';
import { toast } from 'react-toastify';

const useCotizaciones = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarCotizaciones = async () => {
    try {
      setCargando(true);
      const data = await cotizacionesApi.obtenerTodas();
      setCotizaciones(data);
      setError(null);
    } catch (err) {
      console.error('Error cargando cotizaciones:', err);
      setError('No se pudieron cargar las cotizaciones.');
      toast.error('Error al cargar cotizaciones.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const crearCotizacion = async (cotizacion) => {
    try {
      const nuevaCotizacion = await cotizacionesApi.crear(cotizacion);
      setCotizaciones((prev) => [...prev, nuevaCotizacion]);
      toast.success('Cotización creada con éxito!');
      return nuevaCotizacion;
    } catch (err) {
      console.error('Error creando cotización:', err);
      const errorMessage = err.message || 'Error al crear cotización.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const actualizarCotizacion = async (id, datos) => {
    try {
      const cotizacionActualizada = await cotizacionesApi.actualizar(id, datos);
      setCotizaciones((prev) =>
        prev.map((c) => (c.id === id ? cotizacionActualizada : c))
      );
      toast.success('Cotización actualizada con éxito!');
      return cotizacionActualizada;
    } catch (err) {
      console.error('Error actualizando cotización:', err);
      const errorMessage = err.message || 'Error al actualizar cotización.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const eliminarCotizacion = async (id) => {
    try {
      await cotizacionesApi.eliminar(id);
      setCotizaciones((prev) => prev.filter((c) => c.id !== id));
      toast.success('Cotización eliminada con éxito!');
    } catch (err) {
      console.error('Error eliminando cotización:', err);
      const errorMessage = err.message || 'Error al eliminar cotización.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    cotizaciones,
    cargando,
    error,
    cargarCotizaciones,
    crearCotizacion,
    actualizarCotizacion,
    eliminarCotizacion,
  };
};

export default useCotizaciones;