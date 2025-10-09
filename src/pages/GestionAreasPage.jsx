// src/pages/GestionAreasPage.jsx
import { useEffect, useState } from "react";
import useAreas from "../hooks/useAreas";
import { ToastContainer, toast } from "react-toastify";
import ConfirmDeleteToast2 from "../components/ConfirmDeleteToast2";
import "react-toastify/dist/ReactToastify.css";

// 🚀 Importación de iconos de REACT-ICONS (Font Awesome)
import { FaSun, FaMoon } from "react-icons/fa";

const GestionAreasPage = () => {
  const { areas, fetchAreas, createArea, updateArea, deleteArea, cargando } =
    useAreas();
  const [formData, setFormData] = useState({
    nombre: "",
    branchDescription: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  // LÓGICA DE MODO CLARO/OSCURO LOCAL
  const [isDarkModeLocal, setIsDarkModeLocal] = useState(() => {
    // 1. Inicializa el estado leyendo de localStorage para persistencia
    const localTheme = localStorage.getItem("area-theme");
    return localTheme === "dark";
  });

  // 2. Guarda el tema local cada vez que cambia
  useEffect(() => {
    localStorage.setItem("area-theme", isDarkModeLocal ? "dark" : "light");
  }, [isDarkModeLocal]);

  // Función de toggle
  const toggleThemeLocal = () => {
    setIsDarkModeLocal((prev) => !prev);
  };
  // FIN LÓGICA DE MODO CLARO/OSCURO LOCAL

  // Cargar áreas activas al inicio y al cambiar la búsqueda
  useEffect(() => {
    fetchAreas(search);
  }, [fetchAreas, search]);

  // Filtrar solo áreas activas en frontend
  const areasActivas = areas.filter((area) => area.activo);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateArea(editingId, formData);
      } else {
        await createArea(formData);
      }
      setFormData({ nombre: "", branchDescription: "" });
      setEditingId(null);
      fetchAreas(search);
      toast.success(
        editingId
          ? "✅ Área actualizada correctamente."
          : "✅ Área creada correctamente."
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message || "❌ Error al guardar el área."
      );
    }
  };

  const handleEdit = (area) => {
    setFormData({
      nombre: area.nombre,
      branchDescription: area.branchDescription || "",
    });
    setEditingId(area.id);
  };

  const handleDelete = (id, nombre) => {
    toast(
      ({ closeToast }) => (
        <ConfirmDeleteToast2
          closeToast={closeToast}
          message={`¿Seguro que deseas eliminar el área "${nombre}"? Esta acción la marcará como inactiva.`}
          onConfirm={async () => {
            try {
              await deleteArea(id);
              toast.success("🗑️ Área desactivada correctamente.");
              fetchAreas(search);
            } catch (err) {
              const message =
                err.response?.data?.message ||
                err.message ||
                "❌ Error al eliminar el área.";
              toast.error(message);
            }
          }}
        />
      ),
      { autoClose: false }
    );
  };

  return (
    // CONTENEDOR PRINCIPAL: Ahora aplica la clase 'dark' condicionalmente
    <div
      className={`max-w-6xl p-6 mx-auto mt-10 shadow-xl bg-gray-400 dark:bg-gray-800 rounded-xl transition-colors duration-300 ${
        isDarkModeLocal ? "dark" : ""
      }`}
    >
      {/* SECCIÓN MEJORADA: TÍTULO y BOTÓN DE MODO */}
      <div className="flex items-center justify-between pb-3 mb-8 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-extrabold text-blue-600 dark:text-blue-500">
          Gestión de Áreas
        </h1>

        {/* BOTÓN DE INTERRUPTOR DE MODO LOCAL */}
        <button
          onClick={toggleThemeLocal}
          className="p-2 transition-colors duration-200 bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={
            isDarkModeLocal ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
          }
        >
          {/* USO DE ICONOS DE REACT-ICONS */}
          {isDarkModeLocal ? (
            <FaSun className="w-6 h-6 text-yellow-300" /> // Sol para Modo Claro
          ) : (
            <FaMoon className="w-6 h-6 text-white" /> // Luna para Modo Oscuro
          )}
        </button>
      </div>

      {/* ------------------------------------- */}
      {/* Formulario de Creación/Edición */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3"
      >
        <input
          type="text"
          placeholder="Nombre del área (Nivel Gerencia)"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="p-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 dark:placeholder-gray-400"
          required
        />
        <input
          type="text"
          placeholder="Subdivisión (opcional, ej: Logística)"
          value={formData.branchDescription}
          onChange={(e) =>
            setFormData({ ...formData, branchDescription: e.target.value })
          }
          className="p-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 dark:placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={cargando}
          className={`py-3 font-bold text-white transition rounded-lg shadow-md ${
            editingId
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-blue-600 hover:bg-blue-700"
          } disabled:opacity-50`}
        >
          {cargando
            ? "Guardando..."
            : editingId
            ? "Actualizar Área"
            : "Crear Área"}
        </button>
      </form>

      {/* ------------------------------------- */}
      {/* Barra de Búsqueda */}
      <input
        type="text"
        placeholder="🔍 Buscar área por código o nombre..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 mb-6 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 dark:placeholder-gray-400"
      />

      {/* ------------------------------------- */}
      {/* Tabla de Áreas */}
      <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-200">
        Áreas Activas ({areasActivas.length})
      </h2>
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase border-r border-gray-200 dark:text-gray-400 dark:border-gray-700">
                Código
              </th>
              <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase border-r border-gray-200 dark:text-gray-400 dark:border-gray-700">
                Nombre
              </th>
              <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase dark:text-gray-400">
                Subdivisión / Jefatura
              </th>
              <th className="px-6 py-3 text-xs font-bold tracking-wider text-center text-gray-600 uppercase dark:text-gray-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
            {areasActivas.length > 0 ? (
              areasActivas.map((area) => (
                <tr
                  key={area.id}
                  className="transition-colors duration-150 hover:bg-blue-50 dark:hover:bg-gray-800"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200 whitespace-nowrap dark:text-gray-100 dark:border-gray-700">
                    {area.codigo}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800 border-r border-gray-200 whitespace-nowrap dark:text-gray-200 dark:border-gray-700">
                    {area.nombre}
                  </td>
                  <td className="px-6 py-4 text-sm italic text-gray-500 whitespace-nowrap dark:text-gray-400">
                    {area.branchDescription || (
                      <span className="text-gray-400 dark:text-gray-500">
                        (No aplica)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 space-x-3 text-sm font-medium text-center whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(area)}
                      className="font-bold text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      aria-label={`Editar ${area.nombre}`}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(area.id, area.nombre)}
                      className="font-bold text-red-600 transition-colors hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      aria-label={`Eliminar ${area.nombre}`}
                    >
                      ❌ Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="py-10 text-lg text-center text-gray-500 dark:text-gray-400"
                >
                  {cargando
                    ? "Cargando áreas..."
                    : "No se encontraron áreas activas."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default GestionAreasPage;
