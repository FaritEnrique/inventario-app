import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import ProductoSearchField from "../components/ProductoSearchField";
import ReservaEstadoBadge from "../components/ReservaEstadoBadge";
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
  const { loading, obtenerReservas } = useInventario();
  const [searchParams] = useSearchParams();
  const [producto, setProducto] = useState(buildInitialProducto(searchParams));
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    estado: searchParams.get("estado") || "",
    pedidoInternoId: searchParams.get("pedidoInternoId") || "",
    fechaDesde: searchParams.get("fechaDesde") || "",
    fechaHasta: searchParams.get("fechaHasta") || "",
    page: 1,
    limit: 12,
  });
  const [result, setResult] = useState({
    data: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.estado ||
      filters.pedidoInternoId ||
      filters.fechaDesde ||
      filters.fechaHasta ||
      producto?.id
  );

  const cargarReservas = async (params = filters, selectedProducto = producto) => {
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
  };

  useEffect(() => {
    cargarReservas(
      {
        ...filters,
        page: 1,
      },
      producto
    );
  }, []);

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
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reservas de stock</h1>
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
        className="mb-6 grid gap-4 rounded-lg bg-white p-4 shadow md:grid-cols-4"
      >
        <input
          type="text"
          value={filters.search}
          name="inventario-reservas-page-input-126"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, search: event.target.value }))
          }
          className="rounded border border-slate-300 px-3 py-2 md:col-span-2"
          placeholder="Buscar por ID, referencia, pedido o producto"
        />
        <select
          value={filters.estado}
          name="inventario-reservas-page-select-135"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, estado: event.target.value }))
          }
          className="rounded border border-slate-300 px-3 py-2"
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
          name="inventario-reservas-page-input-149"
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              pedidoInternoId: event.target.value,
            }))
          }
          className="rounded border border-slate-300 px-3 py-2"
          placeholder="Pedido interno ID"
        />
        <div className="md:col-span-2">
          <ProductoSearchField
            selectedProduct={producto}
            onSelect={setProducto}
            label="Producto"
          />
        </div>
        <input
          type="date"
          value={filters.fechaDesde}
          name="inventario-reservas-page-input-169"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, fechaDesde: event.target.value }))
          }
          className="rounded border border-slate-300 px-3 py-2"
        />
        <input
          type="date"
          value={filters.fechaHasta}
          name="inventario-reservas-page-input-177"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, fechaHasta: event.target.value }))
          }
          className="rounded border border-slate-300 px-3 py-2"
        />
        <div className="md:col-span-4 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Consultando..." : "Filtrar"}
          </button>
          <button
            type="button"
            onClick={async () => {
              const resetFilters = {
                search: "",
                estado: "",
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

      {loading ? <Loader /> : null}

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left">Reserva</th>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Origen</th>
              <th className="px-4 py-3 text-left">Cantidades</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
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
                      {reserva.producto?.codigo || "-"} ?{" "}
                      {reserva.almacen?.nombre || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ReservaEstadoBadge estado={reserva.estado} />
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

      <div className="mt-4 flex items-center justify-between">
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


