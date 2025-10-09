// src/pages/GestionAreasPage.jsx
import { useEffect, useState } from "react";
import useAreas from "../hooks/useAreas";
import { ToastContainer, toast } from "react-toastify";
import ConfirmDeleteToast2 from "../components/ConfirmDeleteToast2";
import "react-toastify/dist/ReactToastify.css";

const GestionAreasPage = () => {
  const { areas, fetchAreas, createArea, updateArea, deleteArea, cargando } =
    useAreas();
  const [formData, setFormData] = useState({
    nombre: "",
    branchDescription: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

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
    <div className="max-w-4xl p-6 mx-auto mt-10 bg-white shadow-md dark:bg-gray-900 rounded-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        Gestión de Áreas
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 mb-6 md:flex-row"
      >
        <input
          type="text"
          placeholder="Nombre del área"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg md:w-1/3 dark:border-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-800"
          required
        />
        <input
          type="text"
          placeholder="Descripción de sucursal"
          value={formData.branchDescription}
          onChange={(e) =>
            setFormData({ ...formData, branchDescription: e.target.value })
          }
          className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg md:w-1/3 dark:border-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-800"
        />
        <button
          type="submit"
          disabled={cargando}
          className="w-full py-2 font-semibold text-white transition bg-blue-600 rounded-lg md:w-1/3 hover:bg-blue-700"
        >
          {editingId ? "Actualizar" : "Crear"}
        </button>
      </form>

      <input
        type="text"
        placeholder="Buscar área..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 mb-4 text-gray-900 border border-gray-300 rounded-lg dark:border-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-800"
      />

      <div className="overflow-x-auto">
        <table className="min-w-full border border-collapse border-gray-300 rounded-lg dark:border-gray-700">
          <thead className="text-gray-800 bg-gray-100 dark:bg-gray-800 dark:text-gray-100">
            <tr>
              <th className="px-4 py-2 text-left border border-gray-300 dark:border-gray-700">
                Código
              </th>
              <th className="px-4 py-2 text-left border border-gray-300 dark:border-gray-700">
                Nombre
              </th>
              <th className="px-4 py-2 text-left border border-gray-300 dark:border-gray-700">
                Sucursal
              </th>
              <th className="px-4 py-2 text-center border border-gray-300 dark:border-gray-700">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {areasActivas.length > 0 ? (
              areasActivas.map((area) => (
                <tr
                  key={area.id}
                  className="transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-2 border border-gray-300 dark:border-gray-700">
                    {area.codigo}
                  </td>
                  <td className="px-4 py-2 border border-gray-300 dark:border-gray-700">
                    {area.nombre}
                  </td>
                  <td className="px-4 py-2 border border-gray-300 dark:border-gray-700">
                    {area.branchDescription || "-"}
                  </td>
                  <td className="px-4 py-2 space-x-2 text-center border border-gray-300 dark:border-gray-700">
                    <button
                      onClick={() => handleEdit(area)}
                      className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(area.id, area.nombre)}
                      className="font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="py-4 text-center text-gray-500 dark:text-gray-400"
                >
                  No hay áreas activas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default GestionAreasPage;
