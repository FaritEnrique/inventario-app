import { useCallback, useEffect, useState } from "react";
import {
  Edit3,
  PackageSearch,
  Power,
  RefreshCw,
  Save,
  Warehouse,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import useAlmacenes from "../hooks/useAlmacenes";

const estadoOptions = [
  { value: "activos", label: "Activos" },
  { value: "todos", label: "Todos" },
  { value: "inactivos", label: "Inactivos" },
];

const formatArea = (area) => {
  if (!area) return "Sin área vinculada";
  const codigo = area.codigo || area.abreviatura || "";
  return codigo ? `${codigo} - ${area.nombre}` : area.nombre;
};

const GestionAlmacenesPage = () => {
  const {
    almacenes,
    loading,
    obtenerAlmacenes,
    actualizarAlmacen,
    activarAlmacen,
    desactivarAlmacen,
  } = useAlmacenes();
  const [filters, setFilters] = useState({ search: "", estado: "activos" });
  const [editing, setEditing] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [orden, setOrden] = useState("0");

  const loadAlmacenes = useCallback(
    async (nextFilters = filters) => {
      await obtenerAlmacenes({
        search: nextFilters.search.trim() || undefined,
        estado: nextFilters.estado,
      });
    },
    [filters, obtenerAlmacenes],
  );

  useEffect(() => {
    loadAlmacenes().catch(() => {});
  }, [loadAlmacenes]);

  const startEdit = (almacen) => {
    setEditing(almacen);
    setDescripcion(almacen.descripcion || "");
    setOrden(String(almacen.orden ?? 0));
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editing) return;
    try {
      await actualizarAlmacen(editing.id, {
        descripcion: descripcion.trim() || null,
        orden: Number.parseInt(orden, 10) || 0,
      });
      toast.success("Configuración del almacén actualizada.");
      setEditing(null);
      await loadAlmacenes(filters);
    } catch (error) {
      toast.error(error.message || "No se pudo actualizar el almacén.");
    }
  };

  const toggleStatus = async (almacen) => {
    try {
      if (almacen.activo) await desactivarAlmacen(almacen.id);
      else await activarAlmacen(almacen.id);
      toast.success(
        almacen.activo ? "Almacén desactivado." : "Almacén activado.",
      );
      setFilters((current) => ({ ...current, estado: "todos" }));
      await loadAlmacenes({ ...filters, estado: "todos" });
    } catch (error) {
      const details = error?.details;
      const resumen = details
        ? Object.entries(details)
            .filter(([, value]) => Number(value || 0) > 0)
            .map(([key, value]) => `${key}: ${value}`)
            .join(" · ")
        : "";
      toast.error(
        `${error.message || "No se pudo cambiar el estado del almacén."}${
          resumen ? ` ${resumen}` : ""
        }`,
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-50 p-3 text-blue-700">
              <Warehouse className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Gestión de almacenes
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                Cada almacén se crea automáticamente desde Gestión de Áreas al
                marcar una unidad como área de Almacén. Aquí se administra su
                descripción, orden y estado operativo.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/gestion-areas"
              className="rounded-lg border border-blue-300 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              Gestionar áreas
            </Link>
            <Link
              to="/modulo-almacen/stock"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <PackageSearch className="h-4 w-4" /> Ver stock
            </Link>
          </div>
        </div>
      </header>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-relaxed text-blue-900">
        El nombre del almacén se sincroniza con el nombre del área vinculada. La
        desactivación se bloquea mientras existan stock, reservas, pedidos,
        préstamos, transferencias o documentos operativos pendientes.
      </section>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          loadAlmacenes(filters);
        }}
        className="grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-[1fr,220px,auto]"
      >
        <input
          value={filters.search}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              search: event.target.value,
            }))
          }
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Buscar por código, nombre o área"
        />
        <select
          value={filters.estado}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              estado: event.target.value,
            }))
          }
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          {estadoOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" /> Actualizar
        </button>
      </form>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Orden</th>
                <th className="px-4 py-3 text-left">Almacén</th>
                <th className="px-4 py-3 text-left">Área vinculada</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {almacenes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-slate-500">
                    No se encontraron almacenes.
                  </td>
                </tr>
              ) : (
                almacenes.map((almacen) => (
                  <tr key={almacen.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 text-right">{almacen.orden ?? 0}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {almacen.nombre}
                      </p>
                      <p className="text-xs text-slate-500">{almacen.codigo}</p>
                    </td>
                    <td className="px-4 py-3">
                      {formatArea(almacen.areaResponsable)}
                    </td>
                    <td className="max-w-md px-4 py-3 text-slate-600">
                      {almacen.descripcion || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          almacen.activo
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {almacen.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(almacen)}
                          className="rounded p-2 text-blue-700 hover:bg-blue-50"
                          aria-label={`Editar ${almacen.nombre}`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(almacen)}
                          className={`rounded p-2 ${
                            almacen.activo
                              ? "text-rose-700 hover:bg-rose-50"
                              : "text-emerald-700 hover:bg-emerald-50"
                          }`}
                          aria-label={
                            almacen.activo
                              ? `Desactivar ${almacen.nombre}`
                              : `Activar ${almacen.nombre}`
                          }
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <form
            onSubmit={saveEdit}
            className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Configurar {editing.nombre}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{editing.codigo}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Descripción
                </span>
                <textarea
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  rows={4}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Orden de presentación
                </span>
                <input
                  type="number"
                  min="0"
                  value={orden}
                  onChange={(event) => setOrden(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
              >
                <Save className="h-4 w-4" /> Guardar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default GestionAlmacenesPage;
