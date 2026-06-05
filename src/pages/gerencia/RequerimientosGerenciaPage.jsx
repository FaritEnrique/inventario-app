// src/pages/gerencia/RequerimientosGerenciaPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, FileText, Eye, FolderSearch } from "lucide-react";
import gerenciaApi from "../../api/gerenciaApi";
import RequerimientoEstadoBadge from "../../components/RequerimientoEstadoBadge";

const normalizeListResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.requerimientos)) return response.requerimientos;
  return [];
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";

const formatText = (value, fallback = "-") =>
  String(value ?? "").trim() || fallback;

const initialFilters = {
  search: "",
  estadoDocumento: "",
  prioridad: "",
  fechaInicio: "",
  fechaFin: "",
};

const RequerimientosGerenciaPage = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [requerimientos, setRequerimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarRequerimientos = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await gerenciaApi.listarRequerimientos(appliedFilters);
      setRequerimientos(normalizeListResponse(response));
    } catch (err) {
      setError(
        err?.message ||
          "No se pudo cargar la consulta gerencial de requerimientos.",
      );
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    cargarRequerimientos();
  }, [cargarRequerimientos]);

  const total = useMemo(() => requerimientos.length, [requerimientos]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const limpiarFiltros = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Módulo Gerencia
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Consulta de Requerimientos
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Consulta requerimientos por código, estado, prioridad y periodo. Esta
          vista es solo de lectura y no permite crear ni editar requerimientos.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-4 lg:grid-cols-12">
          <label className="min-w-0 lg:col-span-5">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Código o texto
            </span>
            <input
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="REQ-..., finalidad, área..."
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </label>

          <label className="min-w-0 lg:col-span-3">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Estado
            </span>
            <select
              name="estadoDocumento"
              value={filters.estadoDocumento}
              onChange={handleChange}
              className="mt-1 h-10 w-full min-w-0 rounded-lg border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todos</option>
              <option value="GENERADO">Generado</option>
              <option value="PENDIENTE_APROBACION">
                Pendiente de aprobación
              </option>
              <option value="APROBADO_SIN_MODIFICACIONES">Aprobado</option>
              <option value="APROBADO_CON_MODIFICACIONES">
                Aprobado con modificaciones
              </option>
              <option value="ANULADO">Anulado</option>
            </select>
          </label>

          <label className="min-w-0 lg:col-span-2">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Prioridad
            </span>
            <select
              name="prioridad"
              value={filters.prioridad}
              onChange={handleChange}
              className="mt-1 h-10 w-full min-w-0 rounded-lg border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todas</option>
              <option value="NORMAL">Normal</option>
              <option value="URGENTE">Urgente</option>
              <option value="EMERGENCIA">Emergencia</option>
            </select>
          </label>

          <div className="flex flex-col gap-2 sm:flex-row lg:col-span-2 lg:items-end">
            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 sm:w-auto lg:flex-1"
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>

            <button
              type="button"
              onClick={limpiarFiltros}
              className="h-10 w-full rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto lg:flex-1"
            >
              Limpiar
            </button>
          </div>

          <label className="min-w-0 lg:col-span-6">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Desde
            </span>
            <input
              type="date"
              name="fechaInicio"
              value={filters.fechaInicio}
              onChange={handleChange}
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </label>

          <label className="min-w-0 lg:col-span-6">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Hasta
            </span>
            <input
              type="date"
              name="fechaFin"
              value={filters.fechaFin}
              onChange={handleChange}
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </label>
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Resultados</h2>
            <p className="text-sm text-slate-500">
              {loading
                ? "Cargando..."
                : `${total} requerimiento(s) encontrado(s).`}
            </p>
          </div>
          <FileText className="h-5 w-5 text-indigo-600" />
        </div>

        {error ? (
          <p className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3 text-left">Código</th>
                <th className="px-3 py-3 text-left">Área</th>
                <th className="px-3 py-3 text-left">Solicitante</th>
                <th className="px-3 py-3 text-center">Fecha</th>
                <th className="px-3 py-3 text-center">Prioridad</th>
                <th className="px-3 py-3 text-center">Estado</th>
                <th className="px-3 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-3 py-8 text-center text-slate-500"
                  >
                    Cargando requerimientos...
                  </td>
                </tr>
              ) : requerimientos.length > 0 ? (
                requerimientos.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {formatText(item.codigo)}
                    </td>
                    <td className="px-3 py-3">
                      {formatText(item.area?.nombre || item.areaNombreSnapshot)}
                    </td>
                    <td className="px-3 py-3">
                      {formatText(
                        item.solicitante?.nombre || item.solicitanteNombre,
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {formatDate(item.fechaCreacion)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {formatText(item.prioridad)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <RequerimientoEstadoBadge
                        estadoFlujo={item.estadoFlujo}
                        estadoDocumento={item.estadoDocumento}
                        nivelPendiente={item.nivelPendiente}
                        compact
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap justify-center gap-2">
                        <Link
                          to={`/requerimientos/${item.id}`}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver
                        </Link>
                        <Link
                          to={`/modulo-gerencia/expedientes/${item.id}`}
                          className="inline-flex items-center gap-1 rounded border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                        >
                          <FolderSearch className="h-3.5 w-3.5" />
                          Expediente
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-3 py-8 text-center text-slate-500"
                  >
                    No hay requerimientos para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default RequerimientosGerenciaPage;