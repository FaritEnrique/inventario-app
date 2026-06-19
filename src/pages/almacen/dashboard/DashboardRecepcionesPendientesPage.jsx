import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowDownCircle,
  FileCheck,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import ordenesCompraApi from "../../../api/ordenesCompraApi";
import DashboardDetalleHeader from "../../../components/almacen/dashboard/DashboardDetalleHeader";
import DashboardEmptyState from "../../../components/almacen/dashboard/DashboardEmptyState";
import DashboardMetricCard from "../../../components/almacen/dashboard/DashboardMetricCard";
import DashboardPagination from "../../../components/almacen/dashboard/DashboardPagination";
import {
  PAGE_SIZE,
  buildSearchParams,
  formatDate,
  formatNumber,
  getProveedorLabel,
  normalizePagedResponse,
  normalizeText,
  paginateRows,
} from "./dashboardDetalleUtils";

const ESTADOS_RECEPCION = ["PENDIENTE_RECEPCION", "PARCIALMENTE_RECIBIDA"];

const DashboardRecepcionesPendientesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [codigo, setCodigo] = useState(searchParams.get("codigo") || "");
  const [proveedor, setProveedor] = useState(
    searchParams.get("proveedor") || "",
  );
  const [estadoRecepcion, setEstadoRecepcion] = useState(
    searchParams.get("estadoRecepcion") || "",
  );
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const cargarOrdenes = useCallback(async () => {
    setLoading(true);
    try {
      const responses = await Promise.all(
        ESTADOS_RECEPCION.map((estado) =>
          ordenesCompraApi.obtenerOrdenesCompra({
            estadoAprobacion: "APROBADA",
            estadoRecepcion: estado,
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
        error.message || "No se pudieron cargar las recepciones pendientes.",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarOrdenes();
  }, [cargarOrdenes]);

  const filteredRows = useMemo(() => {
    const codigoFilter = normalizeText(codigo);
    const proveedorFilter = normalizeText(proveedor);

    return rows.filter((row) => {
      const codigoOrden = normalizeText(row.codigo);
      const proveedorLabel = normalizeText(getProveedorLabel(row.proveedor));

      if (codigoFilter && !codigoOrden.includes(codigoFilter)) return false;
      if (proveedorFilter && !proveedorLabel.includes(proveedorFilter))
        return false;
      if (estadoRecepcion && row.estadoRecepcion !== estadoRecepcion)
        return false;

      return true;
    });
  }, [codigo, estadoRecepcion, proveedor, rows]);

  const resumen = useMemo(
    () => ({
      pendientes: filteredRows.filter(
        (row) => row.estadoRecepcion === "PENDIENTE_RECEPCION",
      ).length,
      parciales: filteredRows.filter(
        (row) => row.estadoRecepcion === "PARCIALMENTE_RECIBIDA",
      ).length,
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
        codigo: codigo.trim(),
        proveedor: proveedor.trim(),
        estadoRecepcion,
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
    setProveedor("");
    setEstadoRecepcion("");
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
        title="Recepciones pendientes"
        description="Consulta propia del dashboard para revisar Órdenes de Compra aprobadas pendientes o parcialmente recibidas antes de entrar a la recepción operativa."
        icon={FileCheck}
        loading={loading}
        onRefresh={cargarOrdenes}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardMetricCard
          title="Total filtrado"
          value={formatNumber(filteredRows.length)}
          description="O/C aprobadas pendientes o parciales."
          icon={ShoppingCart}
          tone="indigo"
        />
        <DashboardMetricCard
          title="Pendientes"
          value={formatNumber(resumen.pendientes)}
          description="Sin recepción registrada o pendiente total."
          icon={ArrowDownCircle}
          tone="amber"
        />
        <DashboardMetricCard
          title="Parciales"
          value={formatNumber(resumen.parciales)}
          description="Con recepción parcial pendiente de completar."
          icon={FileCheck}
          tone="sky"
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_1.2fr_1fr_auto]"
      >
        <input
          value={codigo}
          onChange={(event) => setCodigo(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          placeholder="Código O/C"
        />
        <input
          value={proveedor}
          onChange={(event) => setProveedor(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          placeholder="Proveedor o RUC"
        />
        <select
          value={estadoRecepcion}
          onChange={(event) => setEstadoRecepcion(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE_RECEPCION">Pendiente</option>
          <option value="PARCIALMENTE_RECIBIDA">Parcial</option>
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
          title="Sin recepciones pendientes"
          description="No hay Órdenes de Compra pendientes con los filtros aplicados."
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
                  <th className="px-4 py-3 text-left">O/C</th>
                  <th className="px-4 py-3 text-left">Proveedor</th>
                  <th className="px-4 py-3 text-left">Emisión</th>
                  <th className="px-4 py-3 text-left">Estado recepción</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((orden) => (
                  <tr key={orden.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-black text-slate-800">
                      {orden.codigo || `OC-${orden.id}`}
                    </td>
                    <td className="px-4 py-3">
                      {getProveedorLabel(orden.proveedor)}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(orden.fechaEmision || orden.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                        {orden.estadoRecepcion || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatNumber(
                        orden.total || orden.montoTotal || orden.totalGeneral,
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/ordenes-compra/${orden.id}`}
                          className="font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          Ver O/C
                        </Link>
                        <Link
                          to={`/modulo-almacen/recepcion-oc?ordenCompraId=${orden.id}`}
                          className="font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          Recepcionar
                        </Link>
                      </div>
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

export default DashboardRecepcionesPendientesPage;
