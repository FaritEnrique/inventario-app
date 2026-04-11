import apiFetch, { buildApiUrl } from './apiFetch';

const cotizacionesApi = {
  obtenerTodas: async () => {
    return await apiFetch('cotizaciones');
  },
  obtenerPorId: async (id) => {
    return await apiFetch(`cotizaciones/${id}`);
  },
  obtenerPdfUrl: (id) => {
    return buildApiUrl(`cotizaciones/${id}/pdf`);
  },
  crear: async (cotizacion) => {
    return apiFetch('cotizaciones', {
      method: 'POST',
      body: JSON.stringify(cotizacion),
    });
  },
  actualizar: async (id, cotizacion) => {
    return apiFetch(`cotizaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cotizacion),
    });
  },
  adjudicar: async (id, payload) => {
    return apiFetch(`cotizaciones/${id}/adjudicar`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },
  eliminar: async (id) => {
    return apiFetch(`cotizaciones/${id}`, {
      method: 'DELETE',
    });
  },
};

export default cotizacionesApi;
