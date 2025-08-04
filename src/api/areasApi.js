// src/api/areasApi.js
import apiFetch from './apiFetch';

const areasApi = {
  /**
   * Obtiene todas las áreas, opcionalmente filtradas por búsqueda.
   * @param {string} [searchQuery=''] - Término de búsqueda para filtrar áreas.
   * @returns {Promise<Array>} Una promesa que resuelve con un array de objetos de área.
   */
  getAreas: async (searchQuery = '') => {
    const url = searchQuery ? `/api/areas?buscar=${encodeURIComponent(searchQuery)}` : '/api/areas';
    return apiFetch(url);
  },

  /**
   * Obtiene un área por su ID.
   * @param {number} id - El ID del área.
   * @returns {Promise<Object>} Una promesa que resuelve con un objeto de área.
   */
  getAreaById: async (id) => {
    return apiFetch(`/api/areas/${id}`);
  },

  /**
   * Crea una nueva área.
   * @param {Object} areaData - Los datos de la nueva área (nombre, branchDescription opcional).
   * @returns {Promise<Object>} Una promesa que resuelve con el área creada.
   */
  createArea: async (areaData) => {
    return apiFetch('/api/areas', {
      method: 'POST',
      body: JSON.stringify(areaData),
    });
  },

  /**
   * Actualiza un área existente.
   * @param {number} id - El ID del área a actualizar.
   * @param {Object} areaData - Los datos actualizados del área (nombre, branchDescription opcional).
   * @returns {Promise<Object>} Una promesa que resuelve con el área actualizada.
   */
  updateArea: async (id, areaData) => {
    // ✅ areaData ahora contendrá nombre y branchDescription (si existe)
    return apiFetch(`/api/areas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(areaData),
    });
  },

  /**
   * Elimina un área.
   * @param {number} id - El ID del área a eliminar.
   * @returns {Promise<void>} Una promesa que resuelve cuando el área es eliminada.
   */
  deleteArea: async (id) => {
    return apiFetch(`/api/areas/${id}`, {
      method: 'DELETE',
    });
  },
};

export default areasApi;