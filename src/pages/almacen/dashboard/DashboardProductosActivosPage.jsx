import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Boxes,
  PackageCheck,
  PackageSearch,
  Search,
  Warehouse,
  X,
} from "lucide-react";
import inventarioApi from "../../../api/inventarioApi";
import productosApi from "../../../api/productosApi";
import DashboardDetalleHeader from "../../../components/almacen/dashboard/DashboardDetalleHeader";
import DashboardEmptyState from "../../../components/almacen/dashboard/DashboardEmptyState";
import DashboardMetricCard from "../../../components/almacen/dashboard/DashboardMetricCard";
import DashboardPagination from "../../../components/almacen/dashboard/DashboardPagination";
import DashboardReportActions from "../../../components/almacen/dashboard/DashboardReportActions";
import {
  PAGE_SIZE,
  buildSearchParams,
  formatNumber,
  normalizeText,
  paginateRows,
} from "./dashboardDetalleUtils";

const getInitialProductoFilter = (searchParams) =>
  searchParams.get("producto") ||
  searchParams.get("buscar") ||
  searchParams.get("nombre") ||
  "";

const getInitialCodigoFilter = (searchParams) =>
  searchParams.get("codigo") || "";

const getStockDisponibleFromProducto = (productoItem, stockDisponibleMap) => {
  const productoId =
    productoItem?.id === null || productoItem?.id === undefined
      ? ""
      : String(productoItem.id);

  if (productoId && stockDisponibleMap.has(productoId)) {
    return stockDisponibleMap.get(productoId);
  }

  return Number(
    productoItem?.stockDisponible ??
      productoItem?.totalDisponible ??
      productoItem?.stockActual ??
      productoItem?.stock ??
      0,
  );
};

const productosReportColumns = [
  {
    header: "Código",
    value: (row) => row.codigo || "-",
  },
  {
    header: "Producto",
    value: (row) => row.nombre || "-",
  },
  {
    header: "Unidad",
    value: (row) => row.unidadMedida || "-",
  },
  {
    header: "Tipo",
    value: (row) => row.tipoProducto?.nombre || row.tipo?.nombre || "-",
  },
  {
    header: "Marca",
    value: (row) => row.marca?.nombre || "-",
  },
  {
    header: "Stock disponible",
    value: (row) => formatNumber(row.stockDisponibleDashboard || 0),
    align: "center",
    headerAlign: "center",
    width: 18,
  },
];

const DashboardProductosActivosPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [stockRows, setStockRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [codigo, setCodigo] = useState(() =>
    getInitialCodigoFilter(searchParams),
  );
  const [producto, setProducto] = useState(() =>
    getInitialProductoFilter(searchParams),
  );
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const cargarProductos = useCallback(async () => {
    setLoading(true);

    try {
      const response = await productosApi.getTodos("", 1, 500, "activos");
      setRows(Array.isArray(response?.productos) ? response.productos : []);

      try {
        const stockResponse = await inventarioApi.obtenerStock();
        setStockRows(Array.isArray(stockResponse) ? stockResponse : []);
      } catch (stockError) {
        toast.warn(
          stockError.message ||
            "Se cargaron los productos, pero no se pudo consultar el stock disponible.",
        );
        setStockRows([]);
      }
    } catch (error) {
      toast.error(error.message || "No se pudo cargar el catálogo activo.");
      setRows([]);
      setStockRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const stockDisponibleMap = useMemo(() => {
    const map = new Map();

    stockRows.forEach((row) => {
      const productoId =
        row?.producto?.id === null || row?.producto?.id === undefined
          ? ""
          : String(row.producto.id);

      if (!productoId) return;

      map.set(productoId, Number(row.totalDisponible || 0));
    });

    return map;
  }, [stockRows]);

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

  const reportRows = useMemo(
    () =>
      filteredRows.map((row) => ({
        ...row,
        stockDisponibleDashboard: getStockDisponibleFromProducto(
          row,
          stockDisponibleMap,
        ),
      })),
    [filteredRows, stockDisponibleMap],
  );

  const resumen = useMemo(() => {
    const productosConStock = filteredRows.filter(
      (row) => getStockDisponibleFromProducto(row, stockDisponibleMap) > 0,
    ).length;

    const unidadesDisponibles = filteredRows.reduce(
      (acc, row) =>
        acc + getStockDisponibleFromProducto(row, stockDisponibleMap),
      0,
    );

    return {
      productosActivos: rows.length,
      productosFiltrados: filteredRows.length,
      productosConStock,
      unidadesDisponibles,
    };
  }, [filteredRows, rows.length, stockDisponibleMap]);

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
        description="Consulta propia del dashboard para revisar el catálogo activo y su disponibilidad actual sin entrar a la administración de productos."
        icon={PackageCheck}
        loading={loading}
        onRefresh={cargarProductos}
      >
        <DashboardReportActions
          title="Productos activos"
          subtitle={`Catálogo activo filtrado. Registros: ${reportRows.length}`}
          rows={reportRows}
          columns={productosReportColumns}
          fileName="dashboard-productos-activos"
          sheetName="Productos activos"
          disabled={loading}
        />
      </DashboardDetalleHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Productos activos"
          value={formatNumber(resumen.productosActivos)}
          description="Total del catálogo activo cargado para consulta."
          icon={PackageCheck}
          tone="indigo"
        />

        <DashboardMetricCard
          title="Productos filtrados"
          value={formatNumber(resumen.productosFiltrados)}
          description="Resultado según código o nombre ingresado."
          icon={PackageSearch}
          tone="sky"
        />

        <DashboardMetricCard
          title="Con stock disponible"
          value={formatNumber(resumen.productosConStock)}
          description="Productos activos con disponibilidad mayor a cero."
          icon={Boxes}
          tone="emerald"
        />

        <DashboardMetricCard
          title="Unidades disponibles"
          value={formatNumber(resumen.unidadesDisponibles)}
          description="Suma del stock disponible de los productos filtrados."
          icon={Warehouse}
          tone="slate"
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
                  <th className="px-4 py-3 text-center">Código</th>
                  <th className="px-4 py-3 text-center">Producto</th>
                  <th className="px-4 py-3 text-center">Unidad</th>
                  <th className="px-4 py-3 text-center">Tipo</th>
                  <th className="px-4 py-3 text-center">Marca</th>
                  <th className="px-4 py-3 text-center">Stock disponible</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map((productoItem) => {
                  const stockDisponible = getStockDisponibleFromProducto(
                    productoItem,
                    stockDisponibleMap,
                  );

                  return (
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

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex min-w-20 justify-center rounded-full px-3 py-1 text-xs font-black ${
                            stockDisponible > 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {formatNumber(stockDisponible)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default DashboardProductosActivosPage;
