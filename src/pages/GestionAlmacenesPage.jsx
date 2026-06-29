// src/pages/GestionAlmacenesPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Edit, PackageSearch, Plus, Power, RefreshCw, Save, Warehouse } from "lucide-react";
import { toast } from "react-toastify";
import useAlmacenes from "../hooks/useAlmacenes";
import useAreas from "../hooks/useAreas";

const createEmptyForm = () => ({
  codigo: "",
  nombre: "",
  descripcion: "",
  areaResponsableId: "",
  activo: true,
});

const estadoOptions = [
  { value: "activos", label: "Activos" },
  { value: "todos", label: "Todos" },
  { value: "inactivos", label: "Inactivos" },
];

const normalizeCodigoInput = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 20);

const formatArea = (area) => {
  if (!area) return "Sin área responsable";
  const codigo = area.codigo || area.abreviatura || "";
  return codigo ? `${codigo} - ${area.nombre}` : area.nombre;
};

const getCount = (almacen, key) => Number(almacen?._count?.[key] || 0);

const GestionAlmacenesPage = () => {
  const {
    almacenes,
    loading,
    obtenerAlmacenes,
    crearAlmacen,
    actualizarAlmacen,
    activarAlmacen,
    desactivarAlmacen,
  } = useAlmacenes();
  const { areas, fetchAreas } = useAreas({ enabled: false });

  const [filters, setFilters] = useState({ search: "", estado: "activos" });
  const [formData, setFormData] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState(null);

  const loadAlmacenes = useCallback(
    async (nextFilters = filters) => {
      await obtenerAlmacenes({
        search: nextFilters.search.trim() || undefined,
        estado: nextFilters.estado || "activos",
      });
    },
    [filters, obtenerAlmacenes],
  );

  useEffect(() => {
    loadAlmacenes().catch(() => {});
  }, [loadAlmacenes]);

  useEffect(() => {
    fetchAreas("").catch(() => {});
  }, [fetchAreas]);

  const areasAlmacen = useMemo(
    () =>
      (areas || [])
        .filter((area) => area.activo !== false && area.esAreaAlmacen === true)
        .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre))),
    [areas],
  );

  const resetForm = () => {
    setFormData(createEmptyForm());
    setEditingId(null);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = async (event) => {
    event.preventDefault();
    await loadAlmacenes(filters);
  };

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "codigo"
          ? normalizeCodigoInput(value)
          : type === "checkbox"
            ? checked
            : value,
    }));
  };

  const handleEdit = (almacen) => {
    setEditingId(almacen.id);
    setFormData({
      codigo: almacen.codigo || "",
      nombre: almacen.nombre || "",
      descripcion: almacen.descripcion || "",
      areaResponsableId: almacen.areaResponsableId
        ? String(almacen.areaResponsableId)
        : "",
      activo: almacen.activo !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildPayload = () => ({
    codigo: formData.codigo.trim(),
    nombre: formData.nombre.trim(),
    descripcion: formData.descripcion.trim() || null,
    areaResponsableId: formData.areaResponsableId
      ? Number(formData.areaResponsableId)
      : null,
    activo: formData.activo,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = buildPayload();
    if (!payload.codigo || !payload.nombre) {
      toast.error("Código y nombre del almacén son obligatorios.");
      return;
    }

    if (editingId) {
      await actualizarAlmacen(editingId, payload);
    } else {
      await crearAlmacen(payload);
    }

    resetForm();
    await loadAlmacenes(filters);
  };

  const handleToggleEstado = async (almacen) => {
    const action = almacen.activo ? desactivarAlmacen : activarAlmacen;
    await action(almacen.id);
    await loadAlmacenes({ ...filters, estado: "todos" });
    setFilters((prev) => ({ ...prev, estado: "todos" }));
  };

  const totalActivos = almacenes.filter((almacen) => almacen.activo).length;
  const totalInactivos = almacenes.length - totalActivos;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-50 p-3 text-blue-700">
              <Warehouse size={24} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Gestión de almacenes
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Administra los espacios físicos de inventario. Cada almacén emite
                sus propias notas de ingreso, salida y movimientos.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            to="/modulo-almacen/stock"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50"
          >
            <PackageSearch size={16} />
            Ver stock
          </Link>
          <button
            type="button"
            onClick={() => loadAlmacenes(filters)}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total listado
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {almacenes.length}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Activos
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-900">
            {totalActivos}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Inactivos
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-800">
            {totalInactivos}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-slate-900">
          <Plus size={18} />
          <h2 className="text-lg font-semibold">
            {editingId ? "Editar almacén" : "Nuevo almacén"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="almacen-codigo">
              Código
            </label>
            <input
              id="almacen-codigo"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="ALM-A"
              maxLength={20}
            />
          </div>

          <div className="lg:col-span-3">
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="almacen-nombre">
              Nombre
            </label>
            <input
              id="almacen-nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Almacén central"
            />
          </div>

          <div className="lg:col-span-3">
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="almacen-area">
              Área responsable
            </label>
            <select
              id="almacen-area"
              name="areaResponsableId"
              value={formData.areaResponsableId}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Sin asignar</option>
              {areasAlmacen.map((area) => (
                <option key={area.id} value={area.id}>
                  {formatArea(area)}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="almacen-descripcion">
              Descripción
            </label>
            <input
              id="almacen-descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Ubicación, uso o alcance"
            />
          </div>

          <div className="flex items-end gap-3 lg:col-span-1">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Activo
            </label>
          </div>

          <div className="flex flex-wrap gap-3 lg:col-span-12">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              <Save size={16} />
              {editingId ? "Guardar cambios" : "Crear almacén"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={handleFilterSubmit}
          className="mb-5 grid gap-4 md:grid-cols-[1fr_220px_auto]"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="almacen-search">
              Buscar
            </label>
            <input
              id="almacen-search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Código, nombre o área responsable"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="almacen-estado">
              Estado
            </label>
            <select
              id="almacen-estado"
              name="estado"
              value={filters.estado}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {estadoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400 md:w-auto"
            >
              Filtrar
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Almacén</th>
                <th className="px-4 py-3">Área responsable</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Documentos</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {almacenes.map((almacen) => (
                <tr key={almacen.id} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <span className="rounded-full bg-slate-100 p-2 text-slate-600">
                        <Building2 size={16} />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {almacen.codigo} - {almacen.nombre}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {almacen.descripcion || "Sin descripción"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatArea(almacen.areaResponsable)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        almacen.activo
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {almacen.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-slate-600">
                    <div>Stock: {getCount(almacen, "stock")}</div>
                    <div>
                      N/I: {getCount(almacen, "notasIngreso")} · N/S:{" "}
                      {getCount(almacen, "notasSalida")}
                    </div>
                    <div>Pedidos: {getCount(almacen, "pedidosInternos")}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(almacen)}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        <Edit size={14} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleEstado(almacen)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                          almacen.activo
                            ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        <Power size={14} />
                        {almacen.activo ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {almacenes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    No hay almacenes para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default GestionAlmacenesPage;
