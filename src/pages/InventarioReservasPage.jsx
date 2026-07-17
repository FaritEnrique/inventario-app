import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import ProductoSearchField from "../components/ProductoSearchField";
import ReservaEstadoBadge from "../components/ReservaEstadoBadge";
import SkeletonTable from "../components/ui/skeletons/SkeletonTable";
import useAreas from "../hooks/useAreas";
import useInventario from "../hooks/useInventario";

const buildInitialProducto = (searchParams) =>
  searchParams.get("productoId")
    ? {
        id: Number(searchParams.get("productoId")),
        nombre: "Producto seleccionado",
        codigo: `ID ${searchParams.get("productoId")}`,
      }
    : null;

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "-";

const InventarioReservasPage = () => {
  const { loading, obtenerReservas, obtenerStock } = useInventario();
  const { areas } = useAreas();
  const [searchParams] = useSearchParams();
  const initialProductoRef = useRef(buildInitialProducto(searchParams));
  const initialFiltersRef = useRef({
    search: searchParams.get("search") || "",
    estado: searchParams.get("estado") || "",
    almacenId: searchParams.get("almacenId") || "",
    areaId: searchParams.get("areaId") || "",
    soloVigentes: searchParams.get("soloVigentes") || "",
    vencenEnHoras: searchParams.get("vencenEnHoras") || "",
    pedidoInternoId: searchParams.get("pedidoInternoId") || "",
    fechaDesde: searchParams.get("fechaDesde") || "",
    fechaHasta: searchParams.get("fechaHasta") || "",
    page: 1,
    limit: 12,
  });
  const [producto, setProducto] = useState(initialProductoRef.current);
  const [filters, setFilters] = useState(initialFiltersRef.current);
  const [stockRows, setStockRows] = useState([]);
  const [result, setResult] = useState({
    data: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.estado ||
      filters.almacenId ||
      filters.areaId ||
      filters.soloVigentes ||
      filters.vencenEnHoras ||
      filters.pedidoInternoId ||
      filters.fechaDesde ||
      filters.fechaHasta ||
      producto?.id
  );
  const isInitialLoading = loading && result.data.length === 0;

  const almacenes = useMemo(() => {
    const map = new Map();
    stockRows.forEach((row) => {
      (row.almacenes || []).forEach((almacen) => {
        map.set(String(almacen.id), almacen);
      });
    });
    return Array.from(map.values());
  }, [stockRows]);

  const cargarReservas = useCallback(async (params, selectedProducto) => {
    try {
      const response = await obtenerReservas({
        ...params,
        productoId: selectedProducto?.id || undefined,
      });
      setResult(
        response || {
          data: [],
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
        }
      );
    } catch (error) {
      toast.error(error.message || "No se pudieron obtener las reservas.");
      setResult({
        data: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
      });
    }
  }, [obtenerReservas]);

  useEffect(() => {
    cargarReservas(
      {
        ...initialFiltersRef.current,
        page: 1,
      },
      initialProductoRef.current,
    );

    obtenerStock()
      .then((data) => setStockRows(Array.isArray(data) ? data : []))
      .catch(() => setStockRows([]));
  }, [cargarReservas, obtenerStock]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextFilters = { ...filters, page: 1 };
    setFilters(nextFilters);
    await cargarReservas(nextFilters, producto);
  };

  const handlePage = async (page) => {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    await cargarReservas(nextFilters, producto);
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Reservas de stock</h1>
          <p className="mt-1 text-sm text-slate-600">
            Seguimiento operativo de reservas activas, parciales, liberadas o consumidas.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/inventario-operaciones"
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Operaciones
          </Link>
          <Link
            to="/dashboard"
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid gap-4 rounded-lg bg-white p-4 shadow sm:grid-cols-2 xl:grid-cols-4"
      >
        <input
          type="text"
          value={filters.search}
          name="inventario-reservas-search"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, search: event.target.value }))
          }
          className="w-full rounded border border-slate-300 px-3 py-2 sm:col-span-2"
          placeholder="Buscar por ID, referencia, pedido o producto"
        />
        <select
          aria-label="Almacén de la reserva"
          value={filters.almacenId}
          name="inventario-reservas-almacen"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, almacenId: event.target.value }))
          }
          className="w-full rounded border border-slate-300 px-3 py-2"
        >
          <option value="">Todos los almacenes</option>
          {almacenes.map((almacen) => (
            <option key={almacen.id} value={almacen.id}>
              {almacen.codigo ? `${almacen.codigo} - ` : ""}
              {almacen.nombre}
            </option>
          ))}
        </select>
        <select
          aria-label="Área solicitante"
          value={filters.areaId}
          name="inventario-reservas-area"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, areaId: event.target.value }))
          }
          className="w-full rounded border border-slate-300 px-3 py-2"
        >
          <option value="">Todas las areas</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.nombre}
            </option>
          ))}
        </select>
        <select
          aria-label="Vigencia de la reserva"
          value={filters.soloVigentes}
          name="inventario-reservas-vigentes"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, soloVigentes: event.target.value }))
          }
          className="w-full rounded border border-slate-300 px-3 py-2"
        >
          <option value="">Todas las reservas</option>
          <option value="true">Solo vigentes</option>
        </select>
        <select
          aria-label="Próximo vencimiento de la reserva"
          value={filters.vencenEnHoras}
          name="inventario-reservas-vencimiento"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, vencenEnHoras: event.target.value }))
          }
          className="w-full rounded border border-slate-300 px-3 py-2"
        >
          <option value="">Cualquier vencimiento</option>
          <option value="4">Vencen en 4 horas</option>
          <option value="8">Vencen en 8 horas</option>
          <option value="24">Vencen en 24 horas</option>
          <option value="48">Vencen en 48 horas</option>
        </select>
        <select
          aria-label="Estado de la reserva"
          value={filters.estado}
          name="inventario-reservas-estado"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, estado: event.target.value }))
          }
          className="w-full rounded border border-slate-300 px-3 py-2"
          disabled={filters.soloVigentes === "true"}
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVA">Activa</option>
          <option value="PARCIAL">Parcial</option>
          <option value="CONSUMIDA">Consumida</option>
          <option value="LIBERADA">Liberada</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
        <input
          type="number"
          min="1"
          value={filters.pedidoInternoId}
          name="inventario-reservas-pedido-id"
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              pedidoInternoId: event.target.value,
            }))
          }
          className="w-full rounded border border-slate-300 px-3 py-2"
          placeholder="Pedido interno ID"
        />
        <div className="sm:col-span-2">
          <ProductoSearchField
            selectedProduct={producto}
            onSelect={setProducto}
            label="Producto"
          />
        </div>
        <input
          type="date"
          aria-label="Fecha de reserva desde"
          value={filters.fechaDesde}
          name="inventario-reservas-fecha-desde"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, fechaDesde: event.target.value }))
          }
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        <input
          type="date"
          aria-label="Fecha de reserva hasta"
          value={filters.fechaHasta}
          name="inventario-reservas-fecha-hasta"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, fechaHasta: event.target.value }))
          }
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row xl:col-span-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Consultando…" : "Filtrar"}
          </button>
          <button
            type="button"
            onClick={async () => {
              const resetFilters = {
                search: "",
                estado: "",
                almacenId: "",
                areaId: "",
                soloVigentes: "",
                vencenEnHoras: "",
                pedidoInternoId: "",
                fechaDesde: "",
                fechaHasta: "",
                page: 1,
                limit: 12,
              };
              setProducto(null);
              setFilters(resetFilters);
              await cargarReservas(resetFilters, null);
            }}
            className="rounded border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            Limpiar
          </button>
        </div>
      </form>

      {loading && result.data.length > 0 ? <Loader size="sm" /> : null}

      {isInitialLoading ? (
        <SkeletonTable columns={7} rows={6} className="rounded-lg" />
      ) : (
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-[1060px] text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left">Reserva</th>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Almacen</th>
              <th className="px-4 py-3 text-left">Origen</th>
              <th className="px-4 py-3 text-left">Cantidades</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                  {hasActiveFilters
                    ? "No hay reservas para los filtros aplicados."
                    : "No hay reservas registradas por el momento."}
                </td>
              </tr>
            ) : (
              result.data.map((reserva) => (
                <tr key={reserva.id} className="border-t border-slate-200 align-top">
                  <td className="px-4 py-3 text-slate-700">
                    <div className="font-medium text-slate-900">Reserva #{reserva.id}</div>
                    <div className="text-xs text-slate-500">
                      {formatDateTime(reserva.createdAt)}
                    </div>
                    <div className="text-xs text-slate-500">
                      Vence: {formatDateTime(reserva.expiresAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="font-medium text-slate-900">
                      {reserva.producto?.nombre || "-"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {reserva.producto?.codigo || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ReservaEstadoBadge estado={reserva.estado} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="font-medium text-slate-900">
                      {reserva.almacen?.nombre || "-"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {reserva.almacen?.codigo || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {reserva.pedidoInterno ? (
                      <div className="space-y-1">
                        <Link
                          to={`/notas-pedido/${reserva.pedidoInterno.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {reserva.pedidoInterno.codigo}
                        </Link>
                        <div className="text-xs text-slate-500">
                          {reserva.pedidoInterno.areaSolicitante?.nombre || "Sin area"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500">
                        {reserva.referenciaCodigo || reserva.referenciaTipo || "Manual"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div>Reservada: {reserva.cantidadReservada}</div>
                    <div>Consumida: {reserva.cantidadConsumida}</div>
                    <div>Liberada: {reserva.cantidadLiberada}</div>
                    <div>Pendiente: {reserva.cantidadPendiente}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/inventario-reservas/${reserva.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        Ver detalle
                      </Link>
                      {reserva.salidasDocumentadas?.[0] ? (
                        <Link
                          to={`/inventario-notas-salida/${reserva.salidasDocumentadas[0].id}`}
                          className="font-medium text-slate-600 hover:text-slate-700"
                        >
                          Ver salida
                        </Link>
                      ) : null}
                    </div>
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
          disabled={loading || result.currentPage <= 1}
          onClick={() => handlePage(result.currentPage - 1)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:bg-blue-300"
        >
          Anterior
        </button>
        <span className="text-sm text-slate-600">
          Pagina {result.currentPage} de {result.totalPages} - {result.totalItems} registros
        </span>
        <button
          type="button"
          disabled={loading || result.currentPage >= result.totalPages}
          onClick={() => handlePage(result.currentPage + 1)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:bg-blue-300"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default InventarioReservasPage;
