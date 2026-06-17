import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowDownCircle, FileText, Search, X } from "lucide-react";
import inventarioApi from "../../../api/inventarioApi";
import DashboardDetalleHeader from "../../../components/almacen/dashboard/DashboardDetalleHeader";
import DashboardEmptyState from "../../../components/almacen/dashboard/DashboardEmptyState";
import DashboardMetricCard from "../../../components/almacen/dashboard/DashboardMetricCard";
import DashboardPagination from "../../../components/almacen/dashboard/DashboardPagination";
import {
  PAGE_SIZE,
  buildSearchParams,
  formatDate,
  formatNumber,
  getProductoLabel,
  normalizePagedResponse,
  normalizeText,
  paginateRows,
} from "./dashboardDetalleUtils";

const buildPreviewProductos = (detalles = []) =>
  detalles
    .slice(0, 2)
    .map((detalle) => getProductoLabel(detalle.producto))
    .join("; ");

function DashboardNotasIngresoPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [fechaDesde, setFechaDesde] = useState(
    searchParams.get("fechaDesde") || "",
  );
  const [fechaHasta, setFechaHasta] = useState(
    searchParams.get("fechaHasta") || "",
  );
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const cargarNotas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await inventarioApi.obtenerNotasIngreso({
        page: 1,
        limit: 100,
      });
      setRows(normalizePagedResponse(response).data);
    } catch (error) {
      toast.error(
        error.message || "No se pudieron cargar las notas de ingreso.",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarNotas();
  }, [cargarNotas]);

  const filteredRows = useMemo(() => {
    const searchFilter = normalizeText(search);
    const desde = fechaDesde ? Date.parse(fechaDesde) : null;
    const hasta = fechaHasta ? Date.parse(fechaHasta) : null;

    return rows.filter((nota) => {
      const fecha = Date.parse(
        nota.fechaMovimiento || nota.fechaDocumento || nota.createdAt,
      );
      const text = normalizeText(
        `${nota.codigo || ""} ${nota.codigoNotaIngreso || ""} ${nota.referenciaCodigo || ""} ${nota.ordenCompra?.codigo || ""} ${buildPreviewProductos(nota.detalles || nota.items || [])}`,
      );

      if (searchFilter && !text.includes(searchFilter)) return false;
      if (desde && Number.isFinite(fecha) && fecha < desde) return false;
      if (hasta && Number.isFinite(fecha) && fecha > hasta + 86_399_999)
        return false;

      return true;
    });
  }, [fechaDesde, fechaHasta, rows, search]);

  const {
    rows: paginatedRows,
    totalPages,
    currentPage,
  } = paginateRows(filteredRows, page, PAGE_SIZE);

  const syncParams = (nextPage = 1) => {
    setSearchParams(
      buildSearchParams({
        search: search.trim(),
        fechaDesde,
        fechaHasta,
        page: nextPage > 1 ? nextPage : "",
      }),
      { replace: true },
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    syncParams(1);
  };

  const handleReset = () => {
    setSearch("");
    setFechaDesde("");
    setFechaHasta("");
    setPage(1);
    setSearchParams({}, { replace: true });
  };

  const handlePageChange = (nextPage) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(safePage);
    syncParams(safePage);
  };

  return (
    <section className="space-y-6">
      <DashboardDetalleHeader
        badge="Detalle del dashboard"
        title="Notas de ingreso"
        description="Consulta propia del dashboard para revisar documentos de ingreso antes de ingresar a la vista operativa o al detalle documental."
        icon={ArrowDownCircle}
        loading={loading}
        onRefresh={cargarNotas}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <DashboardMetricCard
          title="Notas cargadas"
          value={formatNumber(rows.length)}
          description="Total de notas de ingreso consultadas."
          icon={ArrowDownCircle}
          tone="emerald"
        />
        <DashboardMetricCard
          title="Resultado filtrado"
          value={formatNumber(filteredRows.length)}
          description="Registros coincidentes con búsqueda y periodo."
          icon={FileText}
          tone="indigo"
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1.4fr_1fr_1fr_auto]"
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          placeholder="Código, O/C, referencia o producto"
        />
        <input
          type="date"
          value={fechaDesde}
          onChange={(event) => setFechaDesde(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
        />
        <input
          type="date"
          value={fechaHasta}
          onChange={(event) => setFechaHasta(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
          >
            <Search className="h-4 w-4" />
            Buscar
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-slate-300 px-3 text-slate-600 hover:bg-slate-50"
            aria-label="Limpiar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </form>

      {filteredRows.length === 0 ? (
        <DashboardEmptyState
          title="Sin notas de ingreso"
          description="No hay documentos que coincidan con los filtros aplicados."
        />
      ) : (
        <div className="space-y-4">
          <DashboardPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredRows.length}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Nota</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Referencia</th>
                  <th className="px-4 py-3 text-left">Productos</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((nota) => (
                  <tr key={nota.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-black text-slate-800">
                      {nota.codigo ||
                        nota.codigoNotaIngreso ||
                        `Ingreso #${nota.id}`}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(
                        nota.fechaMovimiento ||
                          nota.fechaDocumento ||
                          nota.createdAt,
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {nota.ordenCompra?.codigo || nota.referenciaCodigo || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {buildPreviewProductos(
                        nota.detalles || nota.items || [],
                      ) || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {nota.estado || nota.estadoDocumento || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/modulo-almacen/notas-ingreso/${nota.id}`}
                        className="font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default DashboardNotasIngresoPage;
