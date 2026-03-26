// src/pages/GestionAreasPage.jsx
import { useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { FaMoon, FaSun } from "react-icons/fa";
import ConfirmDeleteToast2 from "../components/ConfirmDeleteToast2";
import useAreas from "../hooks/useAreas";
import areasApi from "../api/areasApi";
import "react-toastify/dist/ReactToastify.css";

const tiposUnidad = [
  { value: "GERENCIA_GENERAL", label: "Gerencia General" },
  {
    value: "GERENCIA_ADMINISTRACION",
    label: "Gerencia de Administracion",
  },
  { value: "GERENCIA_FUNCIONAL", label: "Gerencia Funcional" },
  { value: "JEFATURA", label: "Jefatura" },
];

const tipoUnidadLabel = Object.freeze(
  tiposUnidad.reduce((acc, item) => ({ ...acc, [item.value]: item.label }), {})
);

const allowedParentTypesByUnit = Object.freeze({
  GERENCIA_GENERAL: [],
  GERENCIA_ADMINISTRACION: ["GERENCIA_GENERAL"],
  GERENCIA_FUNCIONAL: ["GERENCIA_GENERAL"],
  JEFATURA: ["GERENCIA_FUNCIONAL", "GERENCIA_ADMINISTRACION"],
});

const estadoUnidadMeta = Object.freeze({
  OPERATIVA: {
    label: "Operativa",
    className:
      "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200",
  },
  INCOMPLETA_SIN_RESPONSABLE: {
    label: "Incompleta sin responsable",
    className: "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200",
  },
  INCOMPLETA_SIN_ADSCRIPCIONES: {
    label: "Incompleta sin adscripciones",
    className: "bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-200",
  },
});

const createEmptyForm = () => ({
  nombre: "",
  branchDescription: "",
  tipoUnidad: "",
  parentAreaId: "",
  responsableId: "",
});

const formatAreaLabel = (area) => {
  if (!area) return "";
  return area.branchDescription
    ? `${area.nombre} - ${area.branchDescription}`
    : area.nombre;
};

const formatUserLabel = (user) => {
  if (!user) return "";
  const mainRole = user.rol ? ` (${user.rol})` : "";
  return `${user.nombre}${mainRole}`;
};

const GestionAreasPage = () => {
  const { areas, fetchAreas, createArea, updateArea, deleteArea, cargando } =
    useAreas();
  const [responsablesDisponibles, setResponsablesDisponibles] = useState([]);
  const [loadingResponsables, setLoadingResponsables] = useState(false);
  const [formData, setFormData] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [isDarkModeLocal, setIsDarkModeLocal] = useState(() => {
    const localTheme = localStorage.getItem("area-theme");
    return localTheme === "dark";
  });

  useEffect(() => {
    localStorage.setItem("area-theme", isDarkModeLocal ? "dark" : "light");
  }, [isDarkModeLocal]);

  useEffect(() => {
    fetchAreas(search);
  }, [fetchAreas, search]);

  useEffect(() => {
    let active = true;

    const loadResponsables = async () => {
      try {
        setLoadingResponsables(true);
        const data = await areasApi.getResponsablesDisponibles();
        if (active) {
          setResponsablesDisponibles(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (active) {
          toast.error("No se pudieron cargar los responsables disponibles.");
        }
      } finally {
        if (active) {
          setLoadingResponsables(false);
        }
      }
    };

    loadResponsables();

    return () => {
      active = false;
    };
  }, []);

  const areasActivas = useMemo(
    () => areas.filter((area) => area.activo),
    [areas]
  );

  const parentCandidates = useMemo(
    () => {
      if (!formData.tipoUnidad) {
        return areasActivas.filter((area) => area.id !== editingId);
      }

      const allowedParentTypes =
        allowedParentTypesByUnit[formData.tipoUnidad] || [];

      return areasActivas.filter(
        (area) =>
          area.id !== editingId &&
          (allowedParentTypes.length === 0 ||
            allowedParentTypes.includes(area.tipoUnidad))
      );
    },
    [areasActivas, editingId, formData.tipoUnidad]
  );

  const responsablesCompatibles = useMemo(() => {
    if (!formData.tipoUnidad) return responsablesDisponibles;
    return responsablesDisponibles.filter((user) =>
      Array.isArray(user.tiposUnidadCompatibles)
        ? user.tiposUnidadCompatibles.includes(formData.tipoUnidad)
        : false
    );
  }, [formData.tipoUnidad, responsablesDisponibles]);

  const resetForm = () => {
    setFormData(createEmptyForm());
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "tipoUnidad"
        ? { parentAreaId: "", responsableId: "" }
        : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      nombre: formData.nombre.trim(),
      branchDescription: formData.branchDescription.trim() || null,
      tipoUnidad: formData.tipoUnidad,
      parentAreaId: formData.parentAreaId ? Number(formData.parentAreaId) : null,
      responsableId: formData.responsableId ? Number(formData.responsableId) : null,
    };

    try {
      if (editingId) {
        await updateArea(editingId, payload);
      } else {
        await createArea(payload);
      }

      resetForm();
      fetchAreas(search);
      toast.success(
        editingId
          ? "Unidad organizacional actualizada correctamente."
          : "Unidad organizacional creada correctamente."
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Error al guardar la unidad organizacional."
      );
    }
  };

  const handleEdit = (area) => {
    setFormData({
      nombre: area.nombre || "",
      branchDescription: area.branchDescription || "",
      tipoUnidad: area.tipoUnidad || "",
      parentAreaId:
        area.parentAreaId !== null && area.parentAreaId !== undefined
          ? String(area.parentAreaId)
          : "",
      responsableId:
        area.responsableId !== null && area.responsableId !== undefined
          ? String(area.responsableId)
          : "",
    });
    setEditingId(area.id);
  };

  const handleDelete = (id, nombre) => {
    toast(
      ({ closeToast }) => (
        <ConfirmDeleteToast2
          closeToast={closeToast}
          message={`Seguro que deseas desactivar la unidad "${nombre}"?`}
          onConfirm={async () => {
            try {
              await deleteArea(id);
              toast.success("Unidad organizacional desactivada correctamente.");
              fetchAreas(search);
              if (editingId === id) {
                resetForm();
              }
            } catch (err) {
              const message =
                err.response?.data?.message ||
                err.message ||
                "Error al desactivar la unidad organizacional.";
              toast.error(message);
            }
          }}
        />
      ),
      { autoClose: false }
    );
  };

  return (
    <div
      className={`mx-auto mt-10 max-w-7xl rounded-xl bg-gray-400 p-6 shadow-xl transition-colors duration-300 dark:bg-gray-800 ${
        isDarkModeLocal ? "dark" : ""
      }`}
    >
      <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-700">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-600 dark:text-blue-500">
            Gestion de Unidades Organizacionales
          </h1>
          <p className="mt-2 text-sm text-gray-800 dark:text-gray-300">
            Esta capa agrega responsable principal, adscritos y estado de
            completitud sin tocar aprobaciones ni documentos.
          </p>
        </div>

        <button
          onClick={() => setIsDarkModeLocal((prev) => !prev)}
          className="rounded-full bg-gray-800 p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={
            isDarkModeLocal ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
          }
        >
          {isDarkModeLocal ? (
            <FaSun className="h-6 w-6 text-yellow-300" />
          ) : (
            <FaMoon className="h-6 w-6 text-white" />
          )}
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-white p-4 shadow md:grid-cols-2 xl:grid-cols-3"
      >
        <input
          type="text"
          placeholder="Nombre de la unidad"
          value={formData.nombre}
          name="nombre"
          onChange={handleChange}
          className="rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
          required
        />

        <input
          type="text"
          placeholder="Descripcion complementaria"
          value={formData.branchDescription}
          name="branchDescription"
          onChange={handleChange}
          className="rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
        />

        <select
          name="tipoUnidad"
          value={formData.tipoUnidad}
          onChange={handleChange}
          className="rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">Selecciona tipo de unidad</option>
          {tiposUnidad.map((tipo) => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
        </select>

        <select
          name="parentAreaId"
          value={formData.parentAreaId}
          onChange={handleChange}
          className="rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          disabled={formData.tipoUnidad === "GERENCIA_GENERAL"}
          required={formData.tipoUnidad && formData.tipoUnidad !== "GERENCIA_GENERAL"}
        >
          <option value="">
            {formData.tipoUnidad === "GERENCIA_GENERAL"
              ? "Sin unidad padre"
              : "Selecciona unidad padre"}
          </option>
          {parentCandidates.map((area) => (
            <option key={area.id} value={area.id}>
              {formatAreaLabel(area)}
            </option>
          ))}
        </select>

        <select
          name="responsableId"
          value={formData.responsableId}
          onChange={handleChange}
          className="rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          disabled={!formData.tipoUnidad || loadingResponsables}
        >
          <option value="">
            {loadingResponsables
              ? "Cargando responsables..."
              : "Selecciona responsable principal"}
          </option>
          {responsablesCompatibles.map((user) => (
            <option key={user.id} value={user.id}>
              {formatUserLabel(user)}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={cargando}
            className={`flex-1 rounded-lg py-3 font-bold text-white shadow-md transition ${
              editingId
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-blue-600 hover:bg-blue-700"
            } disabled:opacity-50`}
          >
            {cargando
              ? "Guardando..."
              : editingId
              ? "Actualizar unidad"
              : "Crear unidad"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700"
            >
              Cancelar
            </button>
          ) : null}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 xl:col-span-3">
          <div className="font-semibold text-slate-900">
            Responsable esperado por tipo
          </div>
          <div className="mt-1">
            {formData.tipoUnidad
              ? `${tipoUnidadLabel[formData.tipoUnidad]}: ${
                  {
                    GERENCIA_GENERAL: "GERENTE_GENERAL",
                    GERENCIA_ADMINISTRACION: "GERENTE_ADMINISTRACION",
                    GERENCIA_FUNCIONAL: "GERENTE_FUNCIONAL",
                    JEFATURA: "JEFE_AREA",
                  }[formData.tipoUnidad]
                }`
              : "Selecciona un tipo de unidad para ver el rol responsable esperado."}
          </div>
          {formData.tipoUnidad && responsablesCompatibles.length === 0 ? (
            <div className="mt-2 font-medium text-amber-700">
              No hay usuarios activos compatibles para este tipo de unidad.
            </div>
          ) : null}
        </div>
      </form>

      <input
        type="text"
        placeholder="Buscar unidad por codigo, nombre o descripcion..."
        value={search}
        name="search"
        onChange={(event) => setSearch(event.target.value)}
        className="mb-6 w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500"
      />

      <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-200">
        Unidades activas ({areasActivas.length})
      </h2>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:text-gray-400">
                Codigo
              </th>
              <th className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:text-gray-400">
                Unidad
              </th>
              <th className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:text-gray-400">
                Responsable
              </th>
              <th className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:text-gray-400">
                Estado
              </th>
              <th className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:text-gray-400">
                Adscritos
              </th>
              <th className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:text-gray-400">
                Estructura
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {areasActivas.length > 0 ? (
              areasActivas.map((area) => {
                const estadoMeta =
                  estadoUnidadMeta[area.estadoConfiguracion] ||
                  estadoUnidadMeta.INCOMPLETA_SIN_RESPONSABLE;

                return (
                  <tr
                    key={area.id}
                    className="transition-colors duration-150 hover:bg-blue-50 dark:hover:bg-gray-800"
                  >
                    <td className="border-r border-gray-200 px-4 py-4 text-sm font-medium text-gray-900 dark:border-gray-700 dark:text-gray-100">
                      {area.codigo}
                    </td>
                    <td className="border-r border-gray-200 px-4 py-4 text-sm text-gray-800 dark:border-gray-700 dark:text-gray-200">
                      <div className="font-semibold">{area.nombre}</div>
                      <div className="text-xs italic text-gray-500 dark:text-gray-400">
                        {area.branchDescription || "Sin descripcion complementaria"}
                      </div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {tipoUnidadLabel[area.tipoUnidad] || "Sin tipo definido"}
                      </div>
                    </td>
                    <td className="border-r border-gray-200 px-4 py-4 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      {area.responsable ? (
                        <>
                          <div className="font-semibold">
                            {area.responsable.nombre}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {area.responsable.rol}
                          </div>
                        </>
                      ) : (
                        <span className="font-medium text-amber-700">
                          Sin responsable
                        </span>
                      )}
                    </td>
                    <td className="border-r border-gray-200 px-4 py-4 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estadoMeta.className}`}
                      >
                        {estadoMeta.label}
                      </span>
                      {!area.tieneAdscripciones ? (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          No hay usuarios adscritos a esta unidad.
                        </div>
                      ) : null}
                    </td>
                    <td className="border-r border-gray-200 px-4 py-4 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      {Array.isArray(area.adscritos) && area.adscritos.length > 0 ? (
                        <div className="space-y-1">
                          {area.adscritos.map((user) => (
                            <div key={user.id}>
                              <span className="font-medium">{user.nombre}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {" "}
                                ({user.rol})
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        "Sin adscritos"
                      )}
                    </td>
                    <td className="border-r border-gray-200 px-4 py-4 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
                      <div>
                        <span className="font-medium">Padre:</span>{" "}
                        {area.parent ? formatAreaLabel(area.parent) : "Sin padre"}
                      </div>
                      <div className="mt-1">
                        <span className="font-medium">Hijos:</span>{" "}
                        {Array.isArray(area.children) && area.children.length > 0
                          ? area.children.map((child) => child.nombre).join(", ")
                          : "Sin hijos"}
                      </div>
                    </td>
                    <td className="space-x-3 px-4 py-4 text-center text-sm font-medium">
                      <button
                        onClick={() => handleEdit(area)}
                        className="font-bold text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        aria-label={`Editar ${area.nombre}`}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(area.id, area.nombre)}
                        className="font-bold text-red-600 transition-colors hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        aria-label={`Desactivar ${area.nombre}`}
                      >
                        Desactivar
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="py-10 text-center text-lg text-gray-500 dark:text-gray-400"
                >
                  {cargando
                    ? "Cargando unidades..."
                    : "No se encontraron unidades activas."}
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
