import apiFetch from './apiFetch';

const solicitudesCotizacionApi = {
  obtenerTodas: async () => {
    return await apiFetch('solicitudes-cotizacion');
  },
  obtenerPorId: async (id) => {
    return await apiFetch(`solicitudes-cotizacion/${id}`);
  },
  crear: async (solicitud) => {
    return apiFetch('solicitudes-cotizacion', {
      method: 'POST',
      body: JSON.stringify(solicitud),
    });
  },
  actualizar: async (id, solicitud) => {
    return apiFetch(`solicitudes-cotizacion/${id}`, {
      method: 'PUT',
      body: JSON.stringify(solicitud),
    });
  },
  eliminar: async (id) => {
    return apiFetch(`solicitudes-cotizacion/${id}`, {
      method: 'DELETE',
    });
  },
};

export default solicitudesCotizacionApi;