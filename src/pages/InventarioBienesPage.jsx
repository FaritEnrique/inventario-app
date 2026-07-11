import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, PackageSearch, RotateCcw, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import SkeletonTable from "../components/ui/skeletons/SkeletonTable";
import useAlmacenes from "../hooks/useAlmacenes";
import useInventario from "../hooks/useInventario";
import {
  BIEN_INVENTARIO_ESTADOS,
  getBienInventarioEstadoMeta,
  getBienInventarioIdentificador,
  normalizeBienInventarioListResponse,
} from "../utils/bienInventarioTrazabilidad";

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "short",
  timeStyle: "short",
});

const formatDateTime = (value) => {
  if (!value) return "-";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? dateFormatter.format(timestamp) : "-";
};

const buildInitialFilters = (searchParams) => ({
  buscar: searchParams.get("buscar") || "",
  estado: searchParams.get("estado") || "",
  almacenId: searchParams.get("almacenId") || "",
  fechaDesde: searchParams.get("fechaDesde") || "",
  fechaHasta: searchParams.get("fechaHasta") || "",
  page: Number.parseInt(searchParams.get("page"), 10) || 1,
  limit: 20,
});

const buildSearchParams = (filters) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (key === "limit" || value === "" || value === null || value === undefined) {
      return;
    }
    if (key === "page" && Number(value) === 1) return;
    params.set(key, value);
  });

  return params;
};

const InventarioBienesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFiltersRef = useRef(buildInitialFilters(searchParams));
  const [filters, setFilters] = useState(initialFiltersRef.current);
  const [result, setResult] = useState(
    normalizeBienInventarioListResponse(null),
  );
  const { loading, obtenerBienesInventario } = useInventario();
  const { almacenes, obtenerAlmacenes } = useAlmacenes();

  const cargarBienes = useCallback(
    async (nextFilters) => {
      try {
        const response = await obtenerBienesInventario(nextFilters);
        setResult(normalizeBienInventarioListResponse(response));
        setSearchParams(buildSearchParams(nextFilters), { replace: true });
      } catch (error) {
        toast.error(
          error.message || "No se pudieron consultar los bienes individualizados.",
        );
        setResult(normalizeBienInventarioListResponse(null));
      }
    },
    [obtenerBienesInventario, setSearchParams],
  );

  useEffect(() => {
    obtenerAlmacenes({ estado: "activos" }).catch(() => {});
  }, [obtenerAlmacenes]);

  useEffect(() => {
    cargarBienes(initialFiltersRef.current);
  }, [cargarBienes]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextFilters = { ...filters, page: 1 };
    setFilters(nextFilters);
    await cargarBienes(nextFilters);
  };

  const handleReset = async () => {
    const nextFilters = {
      buscar: "",
      estado: "",
      almacenId: "",
      fechaDesde: "",
      fechaHasta: "",
      page: 1,
      limit: 20,
    };
    setFilters(nextFilters);
    await cargarBienes(nextFilters);
  };

  const handlePage = async (page) => {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    await cargarBienes(nextFilters);
  };

  const isInitialLoading = loading && result.data.length === 0;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-2 text-indigo-700">
              <PackageSearch className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">
                Bienes individualizados
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Consulta por serie o código patrimonial y sigue cada unidad desde
                su ingreso hasta su entrega.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          {result.totalItems} unidad(es) encontrada(s)
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-6"
      >
        <label className="sm:col-span-2 xl:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Serie, patrimonio o producto
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="search"
              name="buscar"
              value={filters.buscar}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Ej. PAT-001, SER-001 o televisor"
            />
          </div>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Estado
          </span>
          <select
            name="estado"
            value={filters.estado}
            onChange={handleFilterChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Todos</option>
            {Object.values(BIEN_INVENTARIO_ESTADOS).map((estado) => (
              <option key={estado} value={estado}>
                {getBienInventarioEstadoMeta(estado).label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Almacén
          </span>
          <select
            name="almacenId"
            value={filters.almacenId}
            onChange={handleFilterChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Todos</option>
            {almacenes.map((almacen) => (
              <option key={almacen.id} value={almacen.id}>
                {almacen.codigo} - {almacen.nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Ingreso desde
          </span>
          <input
            type="date"
            name="fechaDesde"
            value={filters.fechaDesde}
            onChange={handleFilterChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Ingreso hasta
          </span>
          <input
            type="date"
            name="fechaHasta"
            value={filters.fechaHasta}
            onChange={handleFilterChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <div className="flex gap-2 sm:col-span-2 xl:col-span-6 xl:justify-end">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Limpiar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            <Search className="h-4 w-4" />
            {loading ? "Consultando..." : "Consultar"}
          </button>
        </div>
      </form>

      {isInitialLoading ? (
        <SkeletonTable columns={8} rows={8} className="rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Identificación</th>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Almacén</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-left">Ingreso</th>
                  <th className="px-4 py-3 text-left">Nota de ingreso</th>
                  <th className="px-4 py-3 text-left">Nota de salida</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.data.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                      No se encontraron bienes individualizados para los filtros
                      aplicados.
                    </td>
                  </tr>
                ) : (
                  result.data.map((bien) => {
                    const estadoMeta = getBienInventarioEstadoMeta(bien.estado);
                    return (
                      <tr key={bien.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">
                            {getBienInventarioIdentificador(bien)}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Unidad #{bien.id}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {bien.producto?.codigo || "-"}
                          </div>
                          <div className="text-gray-600">
                            {bien.producto?.nombre || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">
                            {bien.almacen?.codigo || "-"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {bien.almacen?.nombre || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoMeta.className}`}
                          >
                            {estadoMeta.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                          {formatDateTime(bien.fechaIngreso)}
                        </td>
                        <td className="px-4 py-3">
                          {bien.notaIngreso?.id ? (
                            <Link
                              to={`/modulo-almacen/notas-ingreso/${bien.notaIngreso.id}`}
                              className="font-medium text-indigo-600 hover:text-indigo-800"
                            >
                              {bien.notaIngreso.codigo}
                            </Link>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {bien.notaSalida?.id ? (
                            <Link
                              to={`/modulo-almacen/notas-salida/${bien.notaSalida.id}`}
                              className="font-medium text-indigo-600 hover:text-indigo-800"
                            >
                              {bien.notaSalida.codigo}
                            </Link>
                          ) : (
                            <span className="text-gray-400">Sin salida</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            to={`/modulo-almacen/bienes-individualizados/${bien.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                          >
                            <Eye className="h-4 w-4" />
                            Trazabilidad
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-gray-600">
              Página {result.currentPage} de {result.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePage(result.currentPage - 1)}
                disabled={loading || result.currentPage <= 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => handlePage(result.currentPage + 1)}
                disabled={loading || result.currentPage >= result.totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-gray-500">
        Las reservas continúan siendo temporales y cuantitativas. Esta consulta
        muestra la unidad física seleccionada por Almacén únicamente cuando se
        produce la salida efectiva.
      </p>
    </div>
  );
};

export default InventarioBienesPage;
