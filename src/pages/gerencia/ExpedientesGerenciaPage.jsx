import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderSearch, Search } from "lucide-react";
import gerenciaApi from "../../api/gerenciaApi";

const normalizeListResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.expedientes)) return response.expedientes;
  return [];
};

const formatText = (value, fallback = "-") =>
  String(value ?? "").trim() || fallback;

const estadoToLabel = (value) =>
  formatText(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());

const initialFilters = {
  search: "",
  estadoLogistica: "",
  modalidadFlujoLogistico: "",
};

const ExpedientesGerenciaPage = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarExpedientes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await gerenciaApi.listarExpedientesLogisticos(
        appliedFilters,
      );
      setExpedientes(normalizeListResponse(response));
    } catch (err) {
      setError(
        err?.message || "No se pudo cargar la consulta gerencial de expedientes.",
      );
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    cargarExpedientes();
  }, [cargarExpedientes]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Módulo Gerencia
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Expedientes Logísticos
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Consulta expedientes logísticos sin acciones operativas. El acceso al
          detalle abre la vista gerencial de solo lectura.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="sm:col-span-2">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Buscar
            </span>
            <input
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="Código, área, solicitante..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </label>

          <label>
            <span className="text-xs font-semibold uppercase text-slate-500">
              Estado logístico
            </span>
            <select
              name="estadoLogistica"
              value={filters.estadoLogistica}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todos</option>
              <option value="PENDIENTE_PROCESO">Pendiente</option>
              <option value="ASIGNADO">Asignado</option>
              <option value="EN_PROCESO">En proceso</option>
              <option value="LISTO_PARA_ADJUDICACION">Listo adjudicación</option>
              <option value="ADJUDICADO">Adjudicado</option>
              <option value="OC_GENERADA">O/C generada</option>
            </select>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase text-slate-500">
              Modalidad
            </span>
            <select
              name="modalidadFlujoLogistico"
              value={filters.modalidadFlujoLogistico}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todas</option>
              <option value="REGULAR">Regular</option>
              <option value="EXCEPCIONAL">Excepcional</option>
            </select>
          </label>
        </div>

        <div className="mt-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Search className="h-4 w-4" />
            Buscar expedientes
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Expedientes
            </h2>
            <p className="text-sm text-slate-500">
              {loading ? "Cargando..." : `${expedientes.length} expediente(s).`}
            </p>
          </div>
          <FolderSearch className="h-5 w-5 text-indigo-600" />
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
                <th className="px-3 py-3 text-center">Estado</th>
                <th className="px-3 py-3 text-center">Modalidad</th>
                <th className="px-3 py-3 text-left">Responsable</th>
                <th className="px-3 py-3 text-center">Alertas</th>
                <th className="px-3 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-3 py-8 text-center text-slate-500">
                    Cargando expedientes...
                  </td>
                </tr>
              ) : expedientes.length > 0 ? (
                expedientes.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {formatText(item.codigo)}
                    </td>
                    <td className="px-3 py-3">
                      {formatText(item.area?.nombre || item.areaNombreSnapshot)}
                    </td>
                    <td className="px-3 py-3">
                      {formatText(item.solicitante?.nombre)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {estadoToLabel(item.estadoLogistica)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {estadoToLabel(item.modalidadFlujoLogistico)}
                    </td>
                    <td className="px-3 py-3">
                      {formatText(item.responsableLogistica?.nombre)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {item.alertasSeguimiento?.tieneAlertas ? "Sí" : "No"}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Link
                        to={`/modulo-gerencia/expedientes/${item.id}`}
                        className="inline-flex items-center gap-1 rounded border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        <FolderSearch className="h-3.5 w-3.5" />
                        Ver expediente
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-3 py-8 text-center text-slate-500">
                    No hay expedientes para los filtros seleccionados.
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

export default ExpedientesGerenciaPage;