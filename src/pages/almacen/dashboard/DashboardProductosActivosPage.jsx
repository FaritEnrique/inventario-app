import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { PackageCheck, PackageSearch, Search, X } from "lucide-react";
import productosApi from "../../../api/productosApi";
import DashboardDetalleHeader from "../../../components/almacen/dashboard/DashboardDetalleHeader";
import DashboardEmptyState from "../../../components/almacen/dashboard/DashboardEmptyState";
import DashboardMetricCard from "../../../components/almacen/dashboard/DashboardMetricCard";
import DashboardPagination from "../../../components/almacen/dashboard/DashboardPagination";
import {
  PAGE_SIZE,
  buildSearchParams,
  formatNumber,
  normalizeText,
  paginateRows,
} from "./dashboardDetalleUtils";

const buildProductosOperativoTo = (buscar = "") => {
  const params = buildSearchParams({
    buscar: String(buscar || "").trim(),
    estado: "activos",
  });
  const query = params.toString();

  return `/modulo-almacen/productos${query ? `?${query}` : ""}`;
};

const DashboardProductosActivosPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [codigo, setCodigo] = useState(searchParams.get("codigo") || "");
  const [producto, setProducto] = useState(searchParams.get("producto") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const cargarProductos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productosApi.getTodos("", 1, 500, "activos");
      setRows(Array.isArray(response?.productos) ? response.productos : []);
    } catch (error) {
      toast.error(error.message || "No se pudo cargar el catálogo activo.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const filteredRows = useMemo(() => {
    const codigoFilter = normalizeText(codigo);
    const productoFilter = normalizeText(producto);

    return rows.filter((row) => {
      if (codigoFilter && !normalizeText(row.codigo).includes(codigoFilter)) {
        return false;
      }
      if (
        productoFilter &&
        !normalizeText(row.nombre).includes(productoFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [codigo, producto, rows]);

  const {
    rows: paginatedRows,
    totalPages,
    currentPage,
  } = paginateRows(filteredRows, page, PAGE_SIZE);

  const syncParams = (nextPage = 1) => {
    setSearchParams(
      buildSearchParams({
        codigo: codigo.trim(),
        producto: producto.trim(),
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
    setCodigo("");
    setProducto("");
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
        title="Productos activos"
        description="Consulta propia del dashboard para revisar el catálogo activo sin entrar a la página operativa de administración."
        icon={PackageCheck}
        loading={loading}
        onRefresh={cargarProductos}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardMetricCard
          title="Productos activos"
          value={formatNumber(rows.length)}
          description="Total del catálogo activo cargado para consulta."
          icon={PackageCheck}
          tone="indigo"
        />
        <DashboardMetricCard
          title="Productos filtrados"
          value={formatNumber(filteredRows.length)}
          description="Resultado según código o nombre ingresado."
          icon={PackageSearch}
          tone="sky"
        />
        <DashboardMetricCard
          title="Vista operativa"
          value="→"
          description="Acceso a la administración completa del catálogo."
          icon={PackageCheck}
          tone="emerald"
          to={buildProductosOperativoTo(producto || codigo)}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_1.2fr_auto]"
      >
        <input
          type="text"
          value={codigo}
          onChange={(event) => setCodigo(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          placeholder="Buscar por código"
        />
        <input
          type="text"
          value={producto}
          onChange={(event) => setProducto(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          placeholder="Buscar por nombre"
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
            aria-label="Limpiar filtros"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </form>

      {filteredRows.length === 0 ? (
        <DashboardEmptyState
          title="Sin productos"
          description="No hay productos activos que coincidan con la búsqueda."
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
                  <th className="px-4 py-3 text-left">Código</th>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Unidad</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Marca</th>
                  <th className="px-4 py-3 text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((productoItem) => (
                  <tr
                    key={productoItem.id}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-3 font-black text-slate-800">
                      {productoItem.codigo || "-"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {productoItem.nombre || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {productoItem.unidadMedida || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {productoItem.tipoProducto?.nombre ||
                        productoItem.tipo?.nombre ||
                        "-"}
                    </td>
                    <td className="px-4 py-3">
                      {productoItem.marca?.nombre || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={buildProductosOperativoTo(
                          productoItem.codigo || productoItem.nombre || "",
                        )}
                        className="font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        Ver operativo
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
};

export default DashboardProductosActivosPage;
