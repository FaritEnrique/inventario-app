import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Boxes, PackageSearch, Search, Warehouse, X } from "lucide-react";
import inventarioApi from "../../../api/inventarioApi";
import DashboardDetalleHeader from "../../../components/almacen/dashboard/DashboardDetalleHeader";
import DashboardEmptyState from "../../../components/almacen/dashboard/DashboardEmptyState";
import DashboardMetricCard from "../../../components/almacen/dashboard/DashboardMetricCard";
import DashboardPagination from "../../../components/almacen/dashboard/DashboardPagination";
import DashboardReportActions from "../../../components/almacen/dashboard/DashboardReportActions";
import {
  PAGE_SIZE,
  buildSearchParams,
  formatDateTime,
  formatNumber,
  normalizeText,
  paginateRows,
} from "./dashboardDetalleUtils";

const getAlmacenLabel = (item) =>
  [item.codigo, item.nombre].filter(Boolean).join(" - ") ||
  "Almacén #" + item.id;

const almacenesStockReportColumns = [
  {
    header: "Almacén",
    value: (row) => row.almacen || "-",
    width: 38,
  },
  {
    header: "Productos",
    value: (row) => row.productos,
    align: "right",
    headerAlign: "center",
    width: 16,
  },
  {
    header: "Con stock",
    value: (row) => row.productosConStock,
    align: "right",
    headerAlign: "center",
    width: 16,
  },
  {
    header: "Actual",
    value: (row) => row.cantidadActual,
    align: "right",
    headerAlign: "center",
    width: 16,
  },
  {
    header: "Reservada",
    value: (row) => row.cantidadReservada,
    align: "right",
    headerAlign: "center",
    width: 16,
  },
  {
    header: "Disponible",
    value: (row) => row.cantidadDisponible,
    align: "right",
    headerAlign: "center",
    width: 16,
  },
  {
    header: "Actualizado",
    value: (row) => row.actualizado || "-",
    align: "center",
    headerAlign: "center",
    width: 24,
  },
];

const DashboardAlmacenesStockPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stockRows, setStockRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [almacen, setAlmacen] = useState(searchParams.get("almacen") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const cargarStock = useCallback(async () => {
    setLoading(true);

    try {
      const response = await inventarioApi.obtenerStock();

      setStockRows(Array.isArray(response) ? response : []);
    } catch (error) {
      toast.error(error.message || "No se pudo cargar el stock por almacén.");
      setStockRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarStock();
  }, [cargarStock]);

  const almacenes = useMemo(() => {
    const map = new Map();

    stockRows.forEach((row) => {
      (row.almacenes || []).forEach((item) => {
        if (!item?.id) return;

        const current = map.get(item.id) || {
          id: item.id,
          codigo: item.codigo,
          nombre: item.nombre,
          productos: 0,
          productosConStock: 0,
          cantidadActual: 0,
          cantidadReservada: 0,
          cantidadDisponible: 0,
          updatedAt: item.updatedAt,
        };

        current.productos += 1;
        current.productosConStock +=
          Number(item.cantidadDisponible || 0) > 0 ? 1 : 0;
        current.cantidadActual += Number(item.cantidadActual || 0);
        current.cantidadReservada += Number(item.cantidadReservada || 0);
        current.cantidadDisponible += Number(item.cantidadDisponible || 0);

        if (Date.parse(item.updatedAt) > Date.parse(current.updatedAt || 0)) {
          current.updatedAt = item.updatedAt;
        }

        map.set(item.id, current);
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"),
    );
  }, [stockRows]);

  const filteredRows = useMemo(() => {
    const filter = normalizeText(almacen);

    return almacenes.filter((item) => {
      if (!filter) return true;

      return normalizeText(
        [item.codigo || "", item.nombre || ""].join(" "),
      ).includes(filter);
    });
  }, [almacen, almacenes]);

  const reportRows = useMemo(
    () =>
      filteredRows.map((item) => ({
        almacen: getAlmacenLabel(item),
        productos: item.productos,
        productosConStock: item.productosConStock,
        cantidadActual: item.cantidadActual,
        cantidadReservada: item.cantidadReservada,
        cantidadDisponible: item.cantidadDisponible,
        actualizado: formatDateTime(item.updatedAt),
      })),
    [filteredRows],
  );

  const resumen = useMemo(
    () => ({
      almacenes: filteredRows.length,
      productosConStock: filteredRows.reduce(
        (acc, item) => acc + item.productosConStock,
        0,
      ),
      cantidadDisponible: filteredRows.reduce(
        (acc, item) => acc + item.cantidadDisponible,
        0,
      ),
    }),
    [filteredRows],
  );

  const {
    rows: paginatedRows,
    totalPages,
    currentPage,
  } = paginateRows(filteredRows, page, PAGE_SIZE);

  const syncParams = (nextPage = 1) => {
    setSearchParams(
      buildSearchParams({
        almacen: almacen.trim(),
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
    setAlmacen("");
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
        title="Almacenes con stock"
        description="Consulta agrupada por almacén para revisar cantidad de productos, unidades reservadas y disponibilidad total."
        icon={Warehouse}
        loading={loading}
        onRefresh={cargarStock}
      >
        <DashboardReportActions
          title="Almacenes con stock"
          subtitle={
            "Stock agrupado por almacén. Registros: " + reportRows.length
          }
          rows={reportRows}
          columns={almacenesStockReportColumns}
          fileName="dashboard-almacenes-stock"
          sheetName="Almacenes con stock"
          disabled={loading}
        />
      </DashboardDetalleHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardMetricCard
          title="Almacenes filtrados"
          value={formatNumber(resumen.almacenes)}
          description="Almacenes encontrados con stock registrado."
          icon={Warehouse}
          tone="indigo"
        />

        <DashboardMetricCard
          title="Productos con stock"
          value={formatNumber(resumen.productosConStock)}
          description="Productos con disponibilidad mayor a cero por almacén."
          icon={PackageSearch}
          tone="emerald"
        />

        <DashboardMetricCard
          title="Unidades disponibles"
          value={formatNumber(resumen.cantidadDisponible)}
          description="Suma referencial de unidades disponibles."
          icon={Boxes}
          tone="sky"
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto]"
      >
        <input
          value={almacen}
          onChange={(event) => setAlmacen(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          placeholder="Buscar por código o nombre de almacén"
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
          title="Sin almacenes"
          description="No hay almacenes que coincidan con los filtros aplicados."
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
                  <th className="px-4 py-3 text-center">Almacén</th>
                  <th className="px-4 py-3 text-center">Productos</th>
                  <th className="px-4 py-3 text-center">Con stock</th>
                  <th className="px-4 py-3 text-center">Actual</th>
                  <th className="px-4 py-3 text-center">Reservada</th>
                  <th className="px-4 py-3 text-center">Disponible</th>
                  <th className="px-4 py-3 text-center">Actualizado</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-black text-slate-800">
                      {getAlmacenLabel(item)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {formatNumber(item.productos)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {formatNumber(item.productosConStock)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {formatNumber(item.cantidadActual)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {formatNumber(item.cantidadReservada)}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      {formatNumber(item.cantidadDisponible)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {formatDateTime(item.updatedAt)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <Link
                        to={
                          "/modulo-almacen/dashboard/stock-disponible?almacenId=" +
                          item.id
                        }
                        className="font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        Ver productos
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

export default DashboardAlmacenesStockPage;
