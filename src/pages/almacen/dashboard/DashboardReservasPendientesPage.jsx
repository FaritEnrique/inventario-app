// src/pages/almacen/dashboard/DashboardReservasPendientesPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ClipboardList, PackageSearch, Search, X } from "lucide-react";
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
  getAreaLabel,
  getProductoLabel,
  normalizePagedResponse,
  normalizeText,
  paginateRows,
} from "./dashboardDetalleUtils";

const ESTADOS_RESERVA = ["ACTIVA", "PARCIAL"];

const ESTADOS_RESERVA_LABELS = {
  ACTIVA: "Activa",
  PARCIAL: "Parcial",
};

const getEstadoReservaLabel = (estado) =>
  ESTADOS_RESERVA_LABELS[estado] || estado || "-";

const getReservaCodigo = (reserva) =>
  reserva.codigo || reserva.pedidoInterno?.codigo || "Reserva #" + reserva.id;

const reservasReportColumns = [
  {
    header: "Reserva",
    value: (row) => row.codigo || "-",
    width: 20,
  },
  {
    header: "Producto",
    value: (row) => row.producto || "-",
    width: 42,
  },
  {
    header: "Área",
    value: (row) => row.area || "-",
    width: 28,
  },
  {
    header: "Cantidad",
    value: (row) => row.cantidad || "-",
    align: "right",
    headerAlign: "center",
    width: 16,
  },
  {
    header: "Estado",
    value: (row) => row.estado || "-",
    align: "center",
    headerAlign: "center",
    width: 18,
  },
  {
    header: "Vence",
    value: (row) => row.vence || "-",
    align: "center",
    headerAlign: "center",
    width: 22,
  },
];

const DashboardReservasPendientesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [producto, setProducto] = useState(() => searchParams.get("producto") || "");
  const [estado, setEstado] = useState(() => searchParams.get("estado") || "");
  const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);

  const cargarReservas = useCallback(async () => {
    setLoading(true);

    try {
      const responses = await Promise.all(
        ESTADOS_RESERVA.map((estadoReserva) =>
          inventarioApi.obtenerReservas({
            estado: estadoReserva,
            page: 1,
            limit: 100,
          }),
        ),
      );

      const merged = responses.flatMap(
        (response) => normalizePagedResponse(response).data,
      );

      const unique = Array.from(
        new Map(merged.map((row) => [row.id, row])).values(),
      );

      setRows(unique);
    } catch (error) {
      toast.error(
        error.message || "No se pudieron cargar las reservas pendientes.",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarReservas();
  }, [cargarReservas]);

  const filteredRows = useMemo(() => {
    const searchFilter = normalizeText(search);
    const productoFilter = normalizeText(producto);

    return rows.filter((row) => {
      const reservaCodigo = normalizeText(getReservaCodigo(row));
      const productoLabel = normalizeText(getProductoLabel(row.producto));
      const pedido = normalizeText(row.pedidoInterno?.codigo);
      const area = normalizeText(getAreaLabel(row.area));
      const searchText = reservaCodigo + " " + pedido + " " + area;

      if (searchFilter && !searchText.includes(searchFilter)) return false;
      if (productoFilter && !productoLabel.includes(productoFilter)) {
        return false;
      }

      if (estado && row.estado !== estado) return false;

      return true;
    });
  }, [estado, producto, rows, search]);

  const resumen = useMemo(
    () => ({
      activas: filteredRows.filter((row) => row.estado === "ACTIVA").length,
      parciales: filteredRows.filter((row) => row.estado === "PARCIAL").length,
      cantidadReservada: filteredRows.reduce(
        (acc, row) => acc + Number(row.cantidadReservada || 0),
        0,
      ),
    }),
    [filteredRows],
  );

  const reportRows = useMemo(
    () =>
      filteredRows.map((reserva) => ({
        codigo: getReservaCodigo(reserva),
        producto: getProductoLabel(reserva.producto),
        area: getAreaLabel(reserva.area),
        cantidad: formatNumber(reserva.cantidadReservada),
        estado: getEstadoReservaLabel(reserva.estado),
        vence: formatDateTime(reserva.expiresAt || reserva.fechaVencimiento),
      })),
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
        search: search.trim(),
        producto: producto.trim(),
        estado,
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
    setProducto("");
    setEstado("");
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
        title="Reservas pendientes"
        description="Consulta propia del dashboard para revisar reservas activas o parciales antes de derivar a la vista operativa."
        icon={ClipboardList}
        loading={loading}
        onRefresh={cargarReservas}
      >
        <DashboardReportActions
          title="Reservas pendientes"
          subtitle={
            "Reservas activas o parciales filtradas. Registros: " +
            reportRows.length
          }
          rows={reportRows}
          columns={reservasReportColumns}
          fileName="dashboard-reservas-pendientes"
          sheetName="Reservas pendientes"
          disabled={loading}
        />
      </DashboardDetalleHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardMetricCard
          title="Reservas filtradas"
          value={formatNumber(filteredRows.length)}
          description="Reservas activas o parciales según filtros."
          icon={ClipboardList}
          tone="indigo"
        />

        <DashboardMetricCard
          title="Activas"
          value={formatNumber(resumen.activas)}
          description="Reservas pendientes sin despacho parcial."
          icon={ClipboardList}
          tone="sky"
        />

        <DashboardMetricCard
          title="Cantidad reservada"
          value={formatNumber(resumen.cantidadReservada)}
          description="Suma referencial de unidades reservadas."
          icon={PackageSearch}
          tone="amber"
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_1.2fr_1fr_auto]"
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          placeholder="Nota de pedido o área"
        />

        <input
          value={producto}
          onChange={(event) => setProducto(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          placeholder="Producto"
        />

        <select
          value={estado}
          onChange={(event) => setEstado(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVA">Activa</option>
          <option value="PARCIAL">Parcial</option>
        </select>

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
          title="Sin reservas pendientes"
          description="No hay reservas activas o parciales con los filtros aplicados."
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
                  <th className="px-4 py-3 text-center">Reserva</th>
                  <th className="px-4 py-3 text-center">Producto</th>
                  <th className="px-4 py-3 text-center">Área</th>
                  <th className="px-4 py-3 text-center">Cantidad</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Vence</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map((reserva) => (
                  <tr key={reserva.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-black text-slate-800">
                      {getReservaCodigo(reserva)}
                    </td>

                    <td className="px-4 py-3">
                      {getProductoLabel(reserva.producto)}
                    </td>

                    <td className="px-4 py-3">{getAreaLabel(reserva.area)}</td>

                    <td className="px-4 py-3 text-right font-semibold">
                      {formatNumber(reserva.cantidadReservada)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">
                        {getEstadoReservaLabel(reserva.estado)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {formatDateTime(
                        reserva.expiresAt || reserva.fechaVencimiento,
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <Link
                        to={"/modulo-almacen/reservas/" + reserva.id}
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
};

export default DashboardReservasPendientesPage;
