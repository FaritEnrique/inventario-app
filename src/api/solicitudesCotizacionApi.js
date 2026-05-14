import apiFetch, { buildApiUrl } from './apiFetch';

const solicitudesCotizacionApi = {
  obtenerTodas: async () => {
    return await apiFetch('solicitudes-cotizacion');
  },
  obtenerPorId: async (id) => {
    return await apiFetch(`solicitudes-cotizacion/${id}`);
  },
  obtenerPorRequerimiento: async (requerimientoId) => {
    return await apiFetch(`solicitudes-cotizacion/requerimiento/${requerimientoId}`);
  },
  obtenerHistorialEnvios: async (id) => {
    return await apiFetch(`solicitudes-cotizacion/${id}/historial-envios`);
  },
  obtenerPdfUrl: (id) => {
    return buildApiUrl(`solicitudes-cotizacion/${id}/pdf`);
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
  inactivar: async (id) => {
    return apiFetch(`solicitudes-cotizacion/${id}`, {
      method: 'DELETE',
    });
  },
  desactivar: async (id) => {
    return solicitudesCotizacionApi.inactivar(id);
  },
  enviarCorreo: async (id, payload) => {
    return apiFetch(`solicitudes-cotizacion/${id}/enviar-correo`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },
  generarAccesoSistema: async (id, payload = {}) => {
    return apiFetch(`solicitudes-cotizacion/${id}/acceso-sistema`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
      sessionActivity: 'interactive',
    });
  },
  registrarEventoAccesoSistema: async (id, accesoId, payload = {}) => {
    return apiFetch(`solicitudes-cotizacion/${id}/acceso-sistema/${accesoId}/eventos`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
      sessionActivity: 'interactive',
    });
  },
};

export default solicitudesCotizacionApi;
