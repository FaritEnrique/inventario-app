import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Boxes, PackageSearch, Search, Warehouse, X } from "lucide-react";
import inventarioApi from "../../../api/inventarioApi";
import DashboardDetalleHeader from "../../../components/almacen/dashboard/DashboardDetalleHeader";
import DashboardEmptyState from "../../../components/almacen/dashboard/DashboardEmptyState";
import DashboardMetricCard from "../../../components/almacen/dashboard/DashboardMetricCard";
import DashboardPagination from "../../../components/almacen/dashboard/DashboardPagination";
import {
  PAGE_SIZE,
  buildSearchParams,
  formatDateTime,
  formatNumber,
  getProductoLabel,
  normalizeText,
  paginateRows,
} from "./dashboardDetalleUtils";

function DashboardStockDisponiblePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [codigo, setCodigo] = useState(searchParams.get("codigo") || "");
  const [producto, setProducto] = useState(searchParams.get("producto") || "");
  const [almacenId, setAlmacenId] = useState(
    searchParams.get("almacenId") || "",
  );
  const [soloConStock, setSoloConStock] = useState(
    searchParams.get("soloConStock") === "1",
  );
  const [soloSinDisponibilidad, setSoloSinDisponibilidad] = useState(
    searchParams.get("soloSinDisponibilidad") === "1",
  );
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const cargarStock = useCallback(async () => {
    setLoading(true);
    try {
      const response = await inventarioApi.obtenerStock({
        almacenId: almacenId || undefined,
      });
      setRows(Array.isArray(response) ? response : []);
    } catch (error) {
      toast.error(error.message || "No se pudo cargar la consulta de stock.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [almacenId]);

  useEffect(() => {
    cargarStock();
  }, [cargarStock]);

  const almacenes = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      (row.almacenes || []).forEach((almacen) => {
        if (almacen?.id) map.set(String(almacen.id), almacen);
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"),
    );
  }, [rows]);

  const filteredRows = useMemo(() => {
    const codigoFilter = normalizeText(codigo);
    const productoFilter = normalizeText(producto);

    return rows.filter((row) => {
      const codigoProducto = normalizeText(row.producto?.codigo);
      const nombreProducto = normalizeText(row.producto?.nombre);
      const disponible = Number(row.totalDisponible || 0);

      if (codigoFilter && !codigoProducto.includes(codigoFilter)) return false;
      if (productoFilter && !nombreProducto.includes(productoFilter))
        return false;
      if (soloConStock && disponible <= 0) return false;
      if (soloSinDisponibilidad && disponible > 0) return false;

      return true;
    });
  }, [codigo, producto, rows, soloConStock, soloSinDisponibilidad]);

  const resumen = useMemo(() => {
    const productosConStock = filteredRows.filter(
      (row) => Number(row.totalDisponible || 0) > 0,
    ).length;
    const productosSinDisponibilidad = filteredRows.filter(
      (row) => Number(row.totalDisponible || 0) <= 0,
    ).length;
    const unidadesDisponibles = filteredRows.reduce(
      (acc, row) => acc + Number(row.totalDisponible || 0),
      0,
    );
    const unidadesReservadas = filteredRows.reduce(
      (acc, row) => acc + Number(row.totalReservada || 0),
      0,
    );

    return {
      productosTotal: filteredRows.length,
      productosConStock,
      productosSinDisponibilidad,
      unidadesDisponibles,
      unidadesReservadas,
    };
  }, [filteredRows]);

  const {
    rows: paginatedRows,
    totalPages,
    currentPage,
  } = paginateRows(filteredRows, page, PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const syncParams = (nextPage = 1) => {
    setSearchParams(
      buildSearchParams({
        codigo: codigo.trim(),
        producto: producto.trim(),
        almacenId,
        soloConStock: soloConStock ? "1" : "",
        soloSinDisponibilidad: soloSinDisponibilidad ? "1" : "",
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

  const handlePageChange = (nextPage) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(safePage);
    syncParams(safePage);
  };

  const handleReset = () => {
    setCodigo("");
    setProducto("");
    setAlmacenId("");
    setSoloConStock(false);
    setSoloSinDisponibilidad(false);
    setPage(1);
    setSearchParams({}, { replace: true });
  };

  return (
    <section className="space-y-6">
      <DashboardDetalleHeader
        badge="Detalle del dashboard"
        title="Productos con stock disponible"
        description="Consulta propia del dashboard para revisar disponibilidad por producto, código y almacén. Esta pantalla es de lectura y deriva al Kardex o a la vista operativa solo cuando corresponde."
        icon={Boxes}
        loading={loading}
        onRefresh={cargarStock}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Productos filtrados"
          value={formatNumber(resumen.productosTotal)}
          description="Productos encontrados con los criterios actuales."
          icon={PackageSearch}
          tone="indigo"
        />
        <DashboardMetricCard
          title="Con stock disponible"
          value={formatNumber(resumen.productosConStock)}
          description="Productos con disponibilidad mayor a cero."
          icon={Boxes}
          tone="emerald"
        />
        <DashboardMetricCard
          title="Sin disponibilidad"
          value={formatNumber(resumen.productosSinDisponibilidad)}
          description="Productos sin cantidad disponible para atención."
          icon={X}
          tone="rose"
        />
        <DashboardMetricCard
          title="Unidades disponibles"
          value={formatNumber(resumen.unidadesDisponibles)}
          description={`Unidades reservadas: ${formatNumber(resumen.unidadesReservadas)}.`}
          icon={Warehouse}
          tone="sky"
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:grid-cols-[1fr_1.2fr_1fr_auto]"
      >
        <div>
          <label
            htmlFor="dashboard-stock-codigo"
            className="mb-1 block text-sm font-bold text-slate-700"
          >
            Código
          </label>
          <input
            id="dashboard-stock-codigo"
            type="text"
            value={codigo}
            onChange={(event) => setCodigo(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            placeholder="Ej. OF-0001"
          />
        </div>

        <div>
          <label
            htmlFor="dashboard-stock-producto"
            className="mb-1 block text-sm font-bold text-slate-700"
          >
            Producto
          </label>
          <input
            id="dashboard-stock-producto"
            type="text"
            value={producto}
            onChange={(event) => setProducto(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            placeholder="Nombre o parte del nombre"
          />
        </div>

        <div>
          <label
            htmlFor="dashboard-stock-almacen"
            className="mb-1 block text-sm font-bold text-slate-700"
          >
            Almacén
          </label>
          <select
            id="dashboard-stock-almacen"
            value={almacenId}
            onChange={(event) => {
              setAlmacenId(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          >
            <option value="">Todos</option>
            {almacenes.map((almacen) => (
              <option key={almacen.id} value={almacen.id}>
                {almacen.codigo} - {almacen.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 xl:flex-none"
          >
            <Search className="h-4 w-4" />
            Buscar
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 px-3 text-slate-600 transition hover:bg-slate-50"
            aria-label="Limpiar filtros"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3 xl:col-span-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={soloConStock}
                onChange={(event) => {
                  setSoloConStock(event.target.checked);
                  if (event.target.checked) setSoloSinDisponibilidad(false);
                }}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Solo productos con stock
            </label>

            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={soloSinDisponibilidad}
                onChange={(event) => {
                  setSoloSinDisponibilidad(event.target.checked);
                  if (event.target.checked) setSoloConStock(false);
                }}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Solo sin disponibilidad
            </label>
          </div>
        </div>
      </form>

      {filteredRows.length === 0 ? (
        <DashboardEmptyState
          title="Sin stock encontrado"
          description="No hay productos que coincidan con los filtros aplicados."
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

          {paginatedRows.map((row) => (
            <article
              key={row.producto?.id || row.producto?.codigo}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">
                      {row.producto?.nombre || "Producto sin nombre"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {row.producto?.codigo || "-"} ·{" "}
                      {row.producto?.unidadMedida || "-"}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                      <span className="block text-xs font-bold uppercase text-slate-500">
                        Actual
                      </span>
                      <strong className="text-lg text-slate-900">
                        {formatNumber(row.totalActual)}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-amber-50 px-3 py-2 text-center">
                      <span className="block text-xs font-bold uppercase text-amber-700">
                        Reservada
                      </span>
                      <strong className="text-lg text-amber-900">
                        {formatNumber(row.totalReservada)}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center">
                      <span className="block text-xs font-bold uppercase text-emerald-700">
                        Disponible
                      </span>
                      <strong className="text-lg text-emerald-900">
                        {formatNumber(row.totalDisponible)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Almacén</th>
                      <th className="px-4 py-3 text-right">Actual</th>
                      <th className="px-4 py-3 text-right">Reservada</th>
                      <th className="px-4 py-3 text-right">Disponible</th>
                      <th className="px-4 py-3 text-left">Actualizado</th>
                      <th className="px-4 py-3 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(row.almacenes || []).map((almacen) => (
                      <tr
                        key={almacen.id}
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {almacen.codigo} - {almacen.nombre}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(almacen.cantidadActual)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(almacen.cantidadReservada)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700">
                          {formatNumber(almacen.cantidadDisponible)}
                        </td>
                        <td className="px-4 py-3">
                          {formatDateTime(almacen.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/modulo-almacen/kardex?productoId=${row.producto.id}&almacenId=${almacen.id}`}
                            className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                          >
                            Ver kardex
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default DashboardStockDisponiblePage;
