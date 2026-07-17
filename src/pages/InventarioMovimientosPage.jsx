import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import SkeletonTable from "../components/ui/skeletons/SkeletonTable";
import useInventario from "../hooks/useInventario";

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
  timeStyle: "medium",
});

const formatDisplayDateTime = (value) => {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? dateTimeFormatter.format(timestamp) : "-";
};

const buildInitialFilters = (searchParams) => ({
  productoId: searchParams.get("productoId") || "",
  almacenId: searchParams.get("almacenId") || "",
  tipoMovimiento: searchParams.get("tipoMovimiento") || "",
  referenciaTipo: searchParams.get("referenciaTipo") || "",
  referenciaId: searchParams.get("referenciaId") || "",
  notaIngresoId: searchParams.get("notaIngresoId") || "",
  notaSalidaId: searchParams.get("notaSalidaId") || "",
  reservaStockId: searchParams.get("reservaStockId") || "",
  fechaDesde: searchParams.get("fechaDesde") || "",
  fechaHasta: searchParams.get("fechaHasta") || "",
  page: 1,
  limit: 20,
});

const InventarioMovimientosPage = () => {
  const [searchParams] = useSearchParams();
  const { loading, obtenerMovimientoPorId, obtenerMovimientos } = useInventario();
  const initialFiltersRef = useRef(buildInitialFilters(searchParams));
  const initialMovimientoIdRef = useRef(searchParams.get("movimientoId") || "");
  const [filters, setFilters] = useState(initialFiltersRef.current);
  const [result, setResult] = useState({
    data: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const isInitialLoading = loading && result.data.length === 0;

  const cargarMovimientos = useCallback(async (nextFilters) => {
    try {
      const data = await obtenerMovimientos(nextFilters);
      setResult(
        data || { data: [], totalItems: 0, totalPages: 1, currentPage: 1 }
      );
    } catch (error) {
      toast.error(error.message || "No se pudieron obtener los movimientos.");
      setResult({ data: [], totalItems: 0, totalPages: 1, currentPage: 1 });
    }
  }, [obtenerMovimientos]);

  useEffect(() => {
    const initialFilters = initialFiltersRef.current;
    setFilters(initialFilters);
    cargarMovimientos(initialFilters);
  }, [cargarMovimientos]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextFilters = { ...filters, page: 1 };
    setFilters(nextFilters);
    await cargarMovimientos(nextFilters);
  };

  const handleDetalle = useCallback(async (id) => {
    try {
      const movimiento = await obtenerMovimientoPorId(id);
      setSelectedMovimiento(movimiento);
    } catch (error) {
      toast.error(error.message || "No se pudo cargar el movimiento.");
      setSelectedMovimiento(null);
    }
  }, [obtenerMovimientoPorId]);

  useEffect(() => {
    const movimientoId = initialMovimientoIdRef.current;
    if (!movimientoId) return;
    initialMovimientoIdRef.current = "";
    handleDetalle(movimientoId);
  }, [handleDetalle]);

  const handlePage = async (page) => {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    await cargarMovimientos(nextFilters);
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Movimientos de inventario
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Auditoría operativa de entradas, salidas, ajustes, transferencias y novedades.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Dashboard
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid gap-4 rounded-lg bg-white p-4 shadow sm:grid-cols-2 xl:grid-cols-4"
      >
        <input
          type="number"
          min="1"
          value={filters.productoId}
          name="inventario-movimientos-page-input-97"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, productoId: event.target.value }))
          }
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="Producto ID"
        />
        <input
          type="number"
          min="1"
          value={filters.almacenId}
          name="inventario-movimientos-page-input-107"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, almacenId: event.target.value }))
          }
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="Almacén ID"
        />
        <select
          aria-label="Tipo de movimiento"
          value={filters.tipoMovimiento}
          name="inventario-movimientos-page-select-117"
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              tipoMovimiento: event.target.value,
            }))
          }
          className="w-full rounded border border-gray-300 px-3 py-2"
        >
          <option value="">Todos los tipos</option>
          <option value="ENTRADA">ENTRADA</option>
          <option value="SALIDA">SALIDA</option>
          <option value="AJUSTE">AJUSTE</option>
          <option value="TRANSFERENCIA">TRANSFERENCIA</option>
          <option value="NOVEDAD">NOVEDAD</option>
        </select>
        <input
          type="text"
          value={filters.referenciaTipo}
          name="inventario-movimientos-page-input-133"
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              referenciaTipo: event.target.value,
            }))
          }
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="Referencia tipo"
        />
        <input
          type="number"
          min="1"
          value={filters.referenciaId}
          name="inventario-movimientos-page-input-145"
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              referenciaId: event.target.value,
            }))
          }
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="Referencia ID"
        />
        <input
          type="date"
          aria-label="Fecha desde"
          value={filters.fechaDesde}
          name="inventario-movimientos-page-input-158"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, fechaDesde: event.target.value }))
          }
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <input
          type="date"
          aria-label="Fecha hasta"
          value={filters.fechaHasta}
          name="inventario-movimientos-page-input-166"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, fechaHasta: event.target.value }))
          }
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? "Consultando..." : "Filtrar"}
        </button>
      </form>

      {isInitialLoading ? (
        <SkeletonTable columns={10} rows={8} className="rounded-lg" />
      ) : (
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Subtipo</th>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-left">Cantidad</th>
              <th className="px-4 py-3 text-left">Origen</th>
              <th className="px-4 py-3 text-left">Destino</th>
              <th className="px-4 py-3 text-left">Referencia</th>
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                  No hay movimientos para los filtros aplicados.
                </td>
              </tr>
            ) : (
              result.data.map((movimiento) => (
                <tr key={movimiento.id} className="border-t">
                  <td className="px-4 py-3">
                    {formatDisplayDateTime(movimiento.fechaMovimiento)}
                  </td>
                  <td className="px-4 py-3">{movimiento.tipoMovimiento}</td>
                  <td className="px-4 py-3">
                    {movimiento.subtipoMovimiento || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {movimiento.producto?.codigo} - {movimiento.producto?.nombre}
                  </td>
                  <td className="px-4 py-3">{movimiento.cantidad}</td>
                  <td className="px-4 py-3">
                    {movimiento.almacenOrigen?.codigo || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {movimiento.almacenDestino?.codigo || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {movimiento.referenciaTipo || "-"}{" "}
                    {movimiento.referenciaCodigo
                      ? `(${movimiento.referenciaCodigo})`
                      : ""}
                  </td>
                  <td className="px-4 py-3">{movimiento.usuario?.nombre || "-"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDetalle(movimiento.id)}
                      className="font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={result.currentPage <= 1 || loading}
          onClick={() => handlePage(result.currentPage - 1)}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:bg-blue-300"
        >
          Anterior
        </button>
        <span className="text-sm text-gray-600">
          Página {result.currentPage} de {result.totalPages} · {result.totalItems} movimientos
        </span>
        <button
          type="button"
          disabled={result.currentPage >= result.totalPages || loading}
          onClick={() => handlePage(result.currentPage + 1)}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:bg-blue-300"
        >
          Siguiente
        </button>
      </div>

      {selectedMovimiento && (
        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Detalle del movimiento #{selectedMovimiento.id}
            </h2>
            <button
              type="button"
              onClick={() => setSelectedMovimiento(null)}
              className="text-sm font-medium text-gray-600 hover:text-gray-700"
            >
              Cerrar
            </button>
          </div>
          <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-xs text-gray-700">
            {JSON.stringify(selectedMovimiento, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default InventarioMovimientosPage;
