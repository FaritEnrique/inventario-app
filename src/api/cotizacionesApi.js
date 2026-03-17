import apiFetch from './apiFetch';

const cotizacionesApi = {
  obtenerTodas: async () => {
    return await apiFetch('cotizaciones');
  },
  obtenerPorId: async (id) => {
    return await apiFetch(`cotizaciones/${id}`);
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
  adjudicar: async (id) => {
    return apiFetch(`cotizaciones/${id}/adjudicar`, {
      method: 'POST',
    });
  },
  eliminar: async (id) => {
    return apiFetch(`cotizaciones/${id}`, {
      method: 'DELETE',
    });
  },
};

export default cotizacionesApi;
