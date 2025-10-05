import apiFetch from './apiFetch';

const requerimientosApi = {
  obtenerTodos: (buscar) =>
    apiFetch(`requerimientos${buscar ? `?buscar=${buscar}` : ''}`),

  getById: (id) =>
    apiFetch(`requerimientos/${id}`),

  crear: (datos) =>
    apiFetch('requerimientos', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  actualizar: (id, datos) =>
    apiFetch(`requerimientos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),

  eliminar: (id) =>
    apiFetch(`requerimientos/${id}`, {
      method: 'DELETE',
    }),
  
  obtenerPrioridades: () => apiFetch('requerimientos/prioridades'),

};

export default requerimientosApi;
