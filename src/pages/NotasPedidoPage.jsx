import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import PedidoInternoEstadoBadge from "../components/PedidoInternoEstadoBadge";
import { useAuth } from "../context/authContext";
import usePedidosInternos from "../hooks/usePedidosInternos";
import {
  canApprovePedidoInterno,
  canCreatePedidoInterno,
  canViewWarehouseTray,
} from "../utils/inventarioPermissions";

const initialFilters = {
  search: "",
  estadoFlujo: "",
  soloMios: "true",
  page: 1,
  limit: 10,
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleString() : "-";

const NotasPedidoPage = () => {
  const { user } = useAuth();
  const { loading, obtenerPedidos } = usePedidosInternos();
  const [filters, setFilters] = useState(initialFilters);
  const [result, setResult] = useState({
    data: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
  });

  const canCreate = canCreatePedidoInterno(user);
  const canApprove = canApprovePedidoInterno(user);
  const canUseWarehouseTray = canViewWarehouseTray(user);

  const cargarPedidos = async (params = filters) => {
    try {
      const response = await obtenerPedidos(params);
      setResult(
        response || {
          data: [],
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
        }
      );
    } catch (error) {
      toast.error(error.message || "No se pudieron obtener las notas de pedido.");
      setResult({
        data: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
      });
    }
  };

  useEffect(() => {
    cargarPedidos(initialFilters);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextFilters = { ...filters, page: 1 };
    setFilters(nextFilters);
    await cargarPedidos(nextFilters);
  };

  const handlePage = async (page) => {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    await cargarPedidos(nextFilters);
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notas de Pedido</h1>
          <p className="mt-1 text-sm text-slate-600">
            Consulta las solicitudes internas, su estado de aprobacion, las
            reservas vigentes y las notas de salida generadas.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/inventario-stock"
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver stock
          </Link>
          {canApprove && (
            <Link
              to="/notas-pedido/aprobaciones"
              className="rounded border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
            >
              Bandeja de aprobacion
            </Link>
          )}
          {canUseWarehouseTray && (
            <Link
              to="/notas-pedido/almacen"
              className="rounded border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Bandeja de almacen
            </Link>
          )}
          {canCreate && (
            <Link
              to="/notas-pedido/nueva"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Nueva nota de pedido
            </Link>
          )}
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Una nota pendiente de aprobacion aun no reserva stock. La reserva nace
        cuando la nota queda aprobada.
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid gap-4 rounded-lg bg-white p-4 shadow md:grid-cols-4"
      >
        <input
          type="text"
          value={filters.search}
          name="notas-pedido-page-input-131"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, search: event.target.value }))
          }
          className="rounded border border-slate-300 px-3 py-2"
          placeholder="Buscar por codigo, area o solicitante"
        />
        <select
          value={filters.estadoFlujo}
          name="notas-pedido-page-select-140"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, estadoFlujo: event.target.value }))
          }
          className="rounded border border-slate-300 px-3 py-2"
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE_APROBACION">Pendiente de aprobacion</option>
          <option value="APROBADO">Aprobado</option>
          <option value="PARCIALMENTE_ATENDIDO">Parcialmente atendido</option>
          <option value="COMPLETAMENTE_ATENDIDO">Completamente atendido</option>
          <option value="RECHAZADO">Rechazado</option>
        </select>
        <select
          value={filters.soloMios}
          name="notas-pedido-page-select-154"
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, soloMios: event.target.value }))
          }
          className="rounded border border-slate-300 px-3 py-2"
        >
          <option value="true">Solo mis notas</option>
          <option value="false">Todas las visibles</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:bg-slate-400"
        >
          {loading ? "Consultando..." : "Filtrar"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left">Codigo</th>
              <th className="px-4 py-3 text-left">Area</th>
              <th className="px-4 py-3 text-left">Solicitante</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Estado operativo</th>
              <th className="px-4 py-3 text-left">Resumen</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                  No hay notas de pedido para los filtros aplicados.
                </td>
              </tr>
            ) : (
              result.data.map((pedido) => (
                <tr key={pedido.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {pedido.codigo}
                  </td>
                  <td className="px-4 py-3">{pedido.areaSolicitante?.nombre || "-"}</td>
                  <td className="px-4 py-3">{pedido.solicitante?.nombre || "-"}</td>
                  <td className="px-4 py-3">{formatDate(pedido.fechaPedido)}</td>
                  <td className="px-4 py-3">
                    <PedidoInternoEstadoBadge estadoFlujo={pedido.estadoFlujo} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div>Solicitado: {pedido.resumen?.totalSolicitado || 0}</div>
                    <div>Atendido: {pedido.resumen?.totalAtendido || 0}</div>
                    <div>Pendiente: {pedido.resumen?.totalPendiente || 0}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/notas-pedido/${pedido.id}`}
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      Ver detalle
                    </Link>
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
          Pagina {result.currentPage} de {result.totalPages} � {result.totalItems} registros
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

export default NotasPedidoPage;
