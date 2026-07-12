import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import useInventario from "../hooks/useInventario";
import { getEstadoPrestamoLabel } from "../utils/prestamosInventario";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";

const estados = [
  ["", "Todos"],
  ["PENDIENTE_DEVOLUCION", "Pendientes"],
  ["PARCIALMENTE_DEVUELTO", "Parcialmente devueltos"],
  ["PARCIALMENTE_REGULARIZADO", "Parcialmente regularizados"],
  ["CERRADO_CON_INCIDENCIA", "Cerrados con incidencia"],
  ["VENCIDO", "Vencidos"],
  ["DEVUELTO", "Devueltos"],
];

const InventarioPrestamosPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { obtenerPrestamos } = useInventario();
  const [response, setResponse] = useState({ data: [], totalPages: 1, currentPage: 1 });
  const [loading, setLoading] = useState(true);
  const search = searchParams.get("search") || "";
  const estado = searchParams.get("estado") || "";
  const page = Number(searchParams.get("page") || 1);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obtenerPrestamos({ search, estado, page, limit: 10 });
      setResponse(data || { data: [], totalPages: 1, currentPage: 1 });
    } catch (error) {
      toast.error(error.message || "No se pudo cargar la bandeja de préstamos.");
      setResponse({ data: [], totalPages: 1, currentPage: 1 });
    } finally {
      setLoading(false);
    }
  }, [estado, obtenerPrestamos, page, search]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Préstamos y devoluciones
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Control consolidado de Notas de Salida temporales, devoluciones físicas y Actas de Regularización.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-[1fr,260px]">
        <input
          value={search}
          onChange={(event) => updateParams({ search: event.target.value, page: "" })}
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Buscar por Nota de Salida, Nota de Pedido o receptor"
        />
        <select
          value={estado}
          onChange={(event) => updateParams({ estado: event.target.value, page: "" })}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          {estados.map(([value, label]) => (
            <option key={value || "all"} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Nota de Salida</th>
                <th className="px-4 py-3 text-left">Nota de Pedido</th>
                <th className="px-4 py-3 text-left">Destino / receptor</th>
                <th className="px-4 py-3 text-left">Fecha prevista</th>
                <th className="px-4 py-3 text-right">Entregado</th>
                <th className="px-4 py-3 text-right">Devuelto</th>
                <th className="px-4 py-3 text-right">Regularizado</th>
                <th className="px-4 py-3 text-right">Pendiente</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" className="px-4 py-8 text-center text-slate-500">Cargando…</td></tr>
              ) : (response.data || []).length === 0 ? (
                <tr><td colSpan="10" className="px-4 py-8 text-center text-slate-500">No hay préstamos para los filtros seleccionados.</td></tr>
              ) : (
                response.data.map((row) => (
                  <tr key={row.id} className="border-t border-slate-200 align-top">
                    <td className="px-4 py-3">
                      <Link to={`/inventario-notas-salida/${row.id}`} className="font-semibold text-blue-700">
                        {row.codigo}
                      </Link>
                      <div className="text-xs text-slate-500">{formatDate(row.fechaSalida)}</div>
                    </td>
                    <td className="px-4 py-3">
                      {row.pedidoInterno?.codigo || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div>{row.areaDestino?.nombre || "-"}</div>
                      <div className="text-xs text-slate-500">{row.receptor?.nombre || "-"}</div>
                    </td>
                    <td className="px-4 py-3">{formatDate(row.fechaPrevistaDevolucion)}</td>
                    <td className="px-4 py-3 text-right">{row.totalEntregado}</td>
                    <td className="px-4 py-3 text-right">{row.totalDevuelto}</td>
                    <td className="px-4 py-3 text-right">{row.totalRegularizado}</td>
                    <td className="px-4 py-3 text-right font-semibold">{row.totalPendienteDevolucion}</td>
                    <td className="px-4 py-3">{getEstadoPrestamoLabel(row.estadoPrestamo)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Link to={`/modulo-almacen/notas-salida/${row.id}/reporte-atencion`} className="font-medium text-violet-700">
                          Ver reporte
                        </Link>
                        <Link to={`/inventario-notas-salida/${row.id}`} className="font-medium text-emerald-700">
                          Gestionar devolución o Acta
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => updateParams({ page: String(page - 1) })}
          className="rounded border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-sm text-slate-600">
          Página {response.currentPage || page} de {response.totalPages || 1}
        </span>
        <button
          type="button"
          disabled={page >= Number(response.totalPages || 1)}
          onClick={() => updateParams({ page: String(page + 1) })}
          className="rounded border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default InventarioPrestamosPage;
