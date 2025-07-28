// src/pages/GestionAreas.jsx
import { useEffect, useState, useCallback } from 'react';
import useAreas from '../hooks/useAreas'; // Importar el hook de áreas
import useDebounce from '../hooks/useDebounce'; // Para la búsqueda
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import { FaSearch } from 'react-icons/fa'; // Icono de lupa

// Configurar el elemento raíz para accesibilidad de react-modal
Modal.setAppElement('#root');

const devLog = (...args) => {
  if (import.meta.env.MODE === 'development') {
    console.log('[DEV_LOG_COMPONENT]', ...args);
  }
};

const initialArea = {
  id: null,
  codigo: '',
  nombre: '',
};

const GestionAreasPage = () => {
  const [currentArea, setCurrentArea] = useState(initialArea);
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [areaInDetail, setAreaInDetail] = useState(null);

  const { areas, cargando: cargandoAreas, fetchAreas, createArea, updateArea, deleteArea } = useAreas();

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Carga inicial de áreas y re-carga con búsqueda debounced
  useEffect(() => {
    fetchAreas(debouncedSearchQuery);
  }, [fetchAreas, debouncedSearchQuery]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setCurrentArea((prevArea) => ({
      ...prevArea,
      [name]: value,
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const { codigo, nombre } = currentArea;

    // Validaciones básicas del frontend
    if (!codigo.trim() || !nombre.trim()) {
      toast.error('❌ Código y Nombre son obligatorios.');
      return;
    }

    try {
      const dataToSave = {
        codigo: codigo.trim().toUpperCase(), // Asegurar mayúsculas y sin espacios extra
        nombre: nombre.trim(),
      };

      if (editMode) {
        await updateArea(currentArea.id, dataToSave);
        toast.success('✅ Área actualizada correctamente.');
      } else {
        await createArea(dataToSave);
        toast.success('✅ Área creada correctamente.');
      }
      setCurrentArea(initialArea); // Resetear formulario
      setEditMode(false);
      fetchAreas(debouncedSearchQuery); // Recargar la lista después de la operación
    } catch (err) {
      console.error('Error al guardar área:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error desconocido';
      const errorDetails = err.response?.data?.errores?.join(', ') || '';
      toast.error(`❌ Error al guardar área: ${errorMessage} ${errorDetails ? `(${errorDetails})` : ''}`);
    }
  }, [currentArea, editMode, createArea, updateArea, fetchAreas, debouncedSearchQuery]);

  const handleEdit = useCallback((area) => {
    setCurrentArea({
      ...area,
      codigo: area.codigo, // Mantener el código original para edición
    });
    setEditMode(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (confirm('¿Estás seguro de eliminar esta área? Esta acción no se puede deshacer.')) {
      try {
        await deleteArea(id);
        toast.success('🗑️ Área eliminada correctamente.');
        fetchAreas(debouncedSearchQuery); // Recargar la lista después de eliminar
        if (currentArea.id === id) { // Si el área eliminada es la que se estaba editando
          setCurrentArea(initialArea);
          setEditMode(false);
        }
      } catch (err) {
        console.error('Error al eliminar área:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Error desconocido';
        toast.error(`❌ Error al eliminar área: ${errorMessage}`);
      }
    }
  }, [deleteArea, fetchAreas, currentArea, debouncedSearchQuery]);

  const handleClearForm = useCallback(() => {
    setCurrentArea(initialArea);
    setEditMode(false);
  }, []);

  const handleViewDetails = useCallback((area) => {
    setAreaInDetail(area);
    setModalIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalIsOpen(false);
    setAreaInDetail(null);
  }, []);

  const cargandoGeneral = cargandoAreas; // Solo cargandoAreas para este componente

  devLog('áreas al renderizar:', areas);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-indigo-700 mb-4 text-center">Gestión de Áreas</h1>

      {/* Formulario de Creación/Actualización */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-700 mb-5 pb-3 border-b-2 border-blue-600">
          {editMode ? 'Actualizar Área' : 'Crear Nueva Área'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Campo: Código */}
          <div>
            <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">Código</label>
            <input
              type="text"
              id="codigo"
              name="codigo"
              value={currentArea.codigo}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm uppercase"
              required
              disabled={cargandoGeneral || editMode} // Código no editable en modo edición
            />
            {editMode && <p className="mt-1 text-xs text-gray-500">El código no se puede cambiar en modo edición.</p>}
          </div>
          {/* Campo: Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={currentArea.nombre}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
              disabled={cargandoGeneral}
            />
          </div>

          {/* Botones de acción del formulario */}
          <div className="col-span-2 flex flex-col sm:flex-row gap-4 justify-end mt-4">
            <button
              type="submit"
              disabled={cargandoGeneral}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cargandoGeneral ? 'Guardando...' : editMode ? 'Actualizar Área' : 'Crear Área'}
            </button>
            {editMode && (
              <button
                type="button"
                onClick={handleClearForm}
                disabled={cargandoGeneral}
                className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancelar Edición
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Formulario de Búsqueda */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-700 mb-5 pb-3 border-b-2 border-blue-600">Buscar Áreas</h2>
        <form className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            id="searchArea"
            name="searchArea"
            placeholder="Buscar por código o nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={cargandoGeneral}
          />
          {/* El botón de búsqueda se ha eliminado ya que la funcionalidad es automática con debounce */}
        </form>
      </div>

      {/* Tabla de Áreas Existentes */}
      <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200 overflow-x-auto">
        <h2 className="text-2xl font-bold text-gray-700 mb-5 pb-3 border-b-2 border-blue-600">Listado de Áreas</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Código</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Nombre</th>
              <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cargandoGeneral ? (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500">Cargando datos...</td>
              </tr>
            ) : Array.isArray(areas) && areas.length > 0 ? (
              areas.map((area) => (
                <tr key={area.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{area.codigo}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{area.nombre}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 items-center justify-center">
                      {/* Botón Ver Detalles (solo lupa) */}
                      <button
                        onClick={() => handleViewDetails(area)}
                        className="p-2 bg-green-500 text-white text-xs font-semibold rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Ver Detalles"
                        disabled={cargandoGeneral}
                      >
                        <FaSearch className="w-4 h-4" />
                      </button>
                      {/* Botón Editar */}
                      <button
                        onClick={() => handleEdit(area)}
                        className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Editar Área"
                        disabled={cargandoGeneral}
                      >
                        Editar
                      </button>
                      {/* Botón Eliminar */}
                      <button
                        onClick={() => handleDelete(area.id)}
                        className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Eliminar Área"
                        disabled={cargandoGeneral}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500">No hay áreas registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalles del Área */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Detalles del Área"
        className="relative bg-white rounded-lg shadow-xl p-6 w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3 mx-auto my-10 outline-none"
        overlayClassName="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50"
      >
        {areaInDetail && (
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-indigo-500 pb-2 w-full text-center">
              Detalles de {areaInDetail.nombre}
            </h2>
            <div className="text-left w-full space-y-2 text-gray-700 text-sm md:text-base">
              <p><strong className="font-semibold">ID:</strong> {areaInDetail.id}</p>
              <p><strong className="font-semibold">Código:</strong> {areaInDetail.codigo}</p>
              <p><strong className="font-semibold">Nombre:</strong> {areaInDetail.nombre}</p>
              <p><strong className="font-semibold">Creado:</strong> {new Date(areaInDetail.createdAt).toLocaleDateString()}</p>
              <p><strong className="font-semibold">Última Actualización:</strong> {new Date(areaInDetail.updatedAt).toLocaleDateString()}</p>
            </div>
            <button
              onClick={closeModal}
              className="mt-6 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out"
            >
              Cerrar
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GestionAreasPage;