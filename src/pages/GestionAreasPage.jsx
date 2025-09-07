// src/pages/GestionAreas.jsx
import { useEffect, useState, useCallback } from "react";
import useAreas from "../hooks/useAreas";
import useDebounce from "../hooks/useDebounce";
import { toast } from "react-toastify";
import ConfirmDeleteToast from "../components/ConfirmDeleteToast";

const devLog = (...args) => {
  if (import.meta.env.MODE === "development") {
    
  }
};

const initialArea = {
  id: null,
  codigo: "",
  nombre: "",
  hasBranch: false,
  branchDescription: "",
};

const GestionAreasPage = () => {
  const [currentArea, setCurrentArea] = useState(initialArea);
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    areas,
    cargando: cargandoAreas,
    fetchAreas,
    createArea,
    updateArea,
    deleteArea,
  } = useAreas();

  const debouncedSearchQuery = useDebounce(searchQuery, 2000);

  useEffect(() => {
    fetchAreas(debouncedSearchQuery);
  }, [fetchAreas, debouncedSearchQuery]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    if (name === "hasBranch" && !checked) {
      setCurrentArea((prevArea) => ({
        ...prevArea,
        hasBranch: checked,
        branchDescription: "",
      }));
    } else {
      setCurrentArea((prevArea) => ({
        ...prevArea,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const { nombre, hasBranch, branchDescription } = currentArea;

      if (!nombre.trim()) {
        toast.error("❌ El nombre es obligatorio.");
        return;
      }
      if (hasBranch && !branchDescription.trim()) {
        toast.error(
          "❌ La descripción de la sucursal es obligatoria si la opción está marcada."
        );
        return;
      }

      try {
        const dataToSave = {
          nombre: nombre.trim(),
          branchDescription:
            hasBranch && branchDescription.trim()
              ? branchDescription.trim()
              : null,
        };

        if (editMode) {
          await updateArea(currentArea.id, dataToSave);
          toast.success("✅ Área actualizada correctamente.");
        } else {
          await createArea(dataToSave);
          toast.success("✅ Área creada correctamente.");
        }
        setCurrentArea(initialArea);
        setEditMode(false);
        fetchAreas(debouncedSearchQuery);
      } catch (err) {
        console.error("Error al guardar área:", err);
        const errorMessage =
          err.response?.data?.message || err.message || "Error desconocido";
        const errorDetails = err.response?.data?.errores?.join(", ") || "";
        toast.error(
          `❌ Error al guardar área: ${errorMessage} ${
            errorDetails ? `(${errorDetails})` : ""
          }`
        );
      }
    },
    [
      currentArea,
      editMode,
      createArea,
      updateArea,
      fetchAreas,
      debouncedSearchQuery,
    ]
  );

  const handleEdit = useCallback((area) => {
    const hasBranch = !!area.branchDescription;

    setCurrentArea({
      ...area,
      hasBranch,
      branchDescription: area.branchDescription || "",
    });
    setEditMode(true);
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      // ✅ CAMBIO: Usamos un toast personalizado en lugar de `confirm`
      toast.warning(
        ({ closeToast }) => (
          <ConfirmDeleteToast
            closeToast={closeToast}
            message="¿Estás seguro de eliminar esta área? Esta acción no se puede deshacer."
            onConfirm={async () => {
              try {
                await deleteArea(id);
                toast.success("🗑️ Área eliminada correctamente.");
                fetchAreas(debouncedSearchQuery);
                if (currentArea.id === id) {
                  setCurrentArea(initialArea);
                  setEditMode(false);
                }
              } catch (err) {
                console.error("Error al eliminar área:", err);
                const errorMessage =
                  err.response?.data?.message ||
                  err.message ||
                  "Error desconocido";
                toast.error(`❌ Error al eliminar área: ${errorMessage}`);
              }
            }}
          />
        ),
        {
          closeButton: false, // Deshabilitamos el botón de cierre por defecto
          autoClose: false, // El toast no se cerrará automáticamente
          position: "top-center",
          className: "bg-transparent shadow-none",
        }
      );
    },
    [deleteArea, fetchAreas, currentArea, debouncedSearchQuery]
  );

  const handleClearForm = useCallback(() => {
    setCurrentArea(initialArea);
    setEditMode(false);
  }, []);

  const cargandoGeneral = cargandoAreas;

  devLog("áreas al renderizar:", areas);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-indigo-700 mb-4 text-center">
        Gestión de Áreas
      </h1>
      {/* Formulario de Creación/Actualización */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-700 mb-5 pb-3 border-b-2 border-blue-600">
          {editMode ? "Actualizar Área" : "Crear Nueva Área"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
        >
        {/* Campo: Código - Autogenerado y de solo lectura */}
          <div>
            <label
              htmlFor="codigo"
              className="block text-sm font-medium text-gray-700"
            >
              Código
            </label>
            <input
              type="text"
              id="codigo"
              name="codigo"
              value={currentArea.codigo}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 cursor-not-allowed"
              readOnly
              disabled={cargandoGeneral || !editMode}
            />
            {!editMode && (
              <p className="mt-1 text-xs text-gray-500">
                El código se generará automáticamente al crear el área.
              </p>
            )}
          </div>
          {/* Campo: Nombre */}
          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-gray-700"
            >
              Nombre
            </label>
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
          {/* Checkbox para descripción adicional */}
          <div className="col-span-1 md:col-span-2 flex items-center mt-2">
            <input
              id="hasBranch"
              name="hasBranch"
              type="checkbox"
              checked={currentArea.hasBranch}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              disabled={cargandoGeneral}
            />
            <label
              htmlFor="hasBranch"
              className="ml-2 block text-sm text-gray-900"
            >
              ¿Tiene descripción adicional (sucursal/dependencia)?
            </label>
          </div>
          {/* Campo de descripción adicional, visible condicionalmente */}
          {currentArea.hasBranch && (
            <div className="col-span-1 md:col-span-2">
              <label
                htmlFor="branchDescription"
                className="block text-sm font-medium text-gray-700"
              >
                Descripción Adicional (Sucursal/Dependencia)
              </label>
              <input
                type="text"
                id="branchDescription"
                name="branchDescription"
                value={currentArea.branchDescription}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required={currentArea.hasBranch}
                disabled={cargandoGeneral}
                placeholder="Ej: Iquitos, Lima, Sucursal 1"
              />
              <p className="mt-1 text-xs text-gray-500">
                Se añadirá al código (Ej: XX-YYY-Iquitos).
              </p>
            </div>
          )}
          {/* Botones de acción del formulario */}
          <div className="col-span-2 flex flex-col sm:flex-row gap-4 justify-end mt-4">
            <button
              type="submit"
              disabled={cargandoGeneral}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cargandoGeneral
                ? "Guardando..."
                : editMode
                ? "Actualizar Área"
                : "Crear Área"}
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
        <h2 className="text-2xl font-bold text-gray-700 mb-5 pb-3 border-b-2 border-blue-600">
          Buscar Áreas
        </h2>
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
        </form>
      </div>
      {/* Tabla de Áreas Existentes */}
      <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200 overflow-x-auto">
        <h2 className="text-2xl font-bold text-gray-700 mb-5 pb-3 border-b-2 border-blue-600">
          Listado de Áreas
        </h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300"
              >
                Código
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300"
              >
                Nombre
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300"
              >
                Descripción Adicional
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cargandoGeneral ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  Cargando datos...
                </td>
              </tr>
            ) : Array.isArray(areas) && areas.length > 0 ? (
              areas.map((area) => (
                <tr key={area.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {area.codigo}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                    {area.nombre}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                    {area.branchDescription || "N/A"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 items-center justify-center">
                      <button
                        onClick={() => handleEdit(area)}
                        className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Editar Área"
                        disabled={cargandoGeneral}
                      >
                        Editar
                      </button>
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
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  No hay áreas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GestionAreasPage;
