import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  canApprovePedidoInternoEffective,
  canCreatePedidoInternoEffective,
  canViewWarehouseTrayEffective,
} from "../accessRules";
import { useAuth } from "../context/authContext";
import useInventario from "../hooks/useInventario";

const InventarioStockPage = () => {
  const { user } = useAuth();
  const { loading, obtenerStock } = useInventario();
  const [buscar, setBuscar] = useState("");
  const [almacenId, setAlmacenId] = useState("");
  const [rows, setRows] = useState([]);

  const canCreate = canCreatePedidoInternoEffective(user);
  const canApprove = canApprovePedidoInternoEffective(user);
  const canUseWarehouseTray = canViewWarehouseTrayEffective(user);

  const cargarStock = async (filters = {}) => {
    try {
      const data = await obtenerStock(filters);
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || "No se pudo obtener el stock.");
      setRows([]);
    }
  };

  useEffect(() => {
    cargarStock();
  }, []);

  const almacenesDisponibles = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      (row.almacenes || []).forEach((almacen) => {
        map.set(almacen.id, almacen);
      });
    });
    return Array.from(map.values());
  }, [rows]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await cargarStock({
      buscar: buscar.trim() || undefined,
      almacenId: almacenId || undefined,
    });
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Stock de inventario
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Consulta stock actual, reservado y disponible por producto y almacen.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canCreate && (
            <Link
              to="/notas-pedido/nueva"
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Nueva nota de pedido
            </Link>
          )}
          <Link
            to="/notas-pedido"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Ver notas
          </Link>
          {canApprove && (
            <Link
              to="/notas-pedido/aprobaciones"
              className="rounded border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
            >
              Aprobaciones
            </Link>
          )}
          {canUseWarehouseTray && (
            <Link
              to="/notas-pedido/almacen"
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Bandeja almacen
            </Link>
          )}
          {canUseWarehouseTray && (
            <Link
              to="/inventario-operaciones"
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Operaciones
            </Link>
          )}
          <Link
            to="/dashboard"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        El stock disponible ya descuenta las reservas activas de notas de pedido aprobadas. La salida real ocurre solo cuando almacen genera la nota de salida.
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid gap-4 rounded-lg bg-white p-4 shadow md:grid-cols-3"
      >
        <div>
          <label htmlFor="inventario-stock-buscar" className="mb-1 block text-sm font-medium text-gray-700">
            Buscar producto
          </label>
          <input
            id="inventario-stock-buscar"
            type="text"
            value={buscar}
            name="inventario-stock-page-input-126" onChange={(event) => setBuscar(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Nombre o codigo"
          />
        </div>
        <div>
          <label htmlFor="inventario-stock-almacen" className="mb-1 block text-sm font-medium text-gray-700">
            Filtrar por almacen
          </label>
          <select
            id="inventario-stock-almacen"
            value={almacenId}
            name="inventario-stock-page-select-138" onChange={(event) => setAlmacenId(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Todos</option>
            {almacenesDisponibles.map((almacen) => (
              <option key={almacen.id} value={almacen.id}>
                {almacen.codigo} - {almacen.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Consultando..." : "Consultar stock"}
          </button>
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-600">
            No hay stock registrado con los filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.producto.id} className="rounded-lg bg-white shadow">
              <div className="border-b px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {row.producto.nombre}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {row.producto.codigo} � {row.producto.unidadMedida}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                    <div className="rounded bg-gray-50 px-3 py-2">
                      <span className="block text-gray-500">Actual</span>
                      <strong>{row.totalActual}</strong>
                    </div>
                    <div className="rounded bg-yellow-50 px-3 py-2">
                      <span className="block text-gray-500">Reservada</span>
                      <strong>{row.totalReservada}</strong>
                    </div>
                    <div className="rounded bg-green-50 px-3 py-2">
                      <span className="block text-gray-500">Disponible</span>
                      <strong>{row.totalDisponible}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {(row.reservasActivas || []).length > 0 && (
                <div className="border-b bg-blue-50 px-4 py-3">
                  <p className="mb-2 text-sm font-medium text-blue-900">
                    Reservas activas sobre este producto
                  </p>
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {row.reservasActivas.map((reserva) => (
                      <div
                        key={reserva.id}
                        className="rounded border border-blue-200 bg-white px-3 py-2 text-xs text-slate-700"
                      >
                        <div className="font-semibold text-slate-900">
                          Nota de pedido: {reserva.pedidoInterno?.codigo || "-"}
                        </div>
                        <div>Area reservante: {reserva.area?.nombre || "-"}</div>
                        <div>Cantidad reservada: {reserva.cantidadReservada}</div>
                        <div>
                          Vence: {reserva.expiresAt ? new Date(reserva.expiresAt).toLocaleString() : "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Almacen</th>
                      <th className="px-4 py-3 text-left">Actual</th>
                      <th className="px-4 py-3 text-left">Reservada</th>
                      <th className="px-4 py-3 text-left">Disponible</th>
                      <th className="px-4 py-3 text-left">Reservas activas</th>
                      <th className="px-4 py-3 text-left">Actualizado</th>
                      <th className="px-4 py-3 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(row.almacenes || []).map((almacen) => (
                      <tr key={almacen.id} className="border-t">
                        <td className="px-4 py-3">
                          {almacen.codigo} - {almacen.nombre}
                        </td>
                        <td className="px-4 py-3">{almacen.cantidadActual}</td>
                        <td className="px-4 py-3">{almacen.cantidadReservada}</td>
                        <td className="px-4 py-3">{almacen.cantidadDisponible}</td>
                        <td className="px-4 py-3">
                          {(almacen.reservasActivas || []).length === 0 ? (
                            <span className="text-gray-500">Sin reservas</span>
                          ) : (
                            <div className="space-y-1 text-xs">
                              {almacen.reservasActivas.map((reserva) => (
                                <div
                                  key={reserva.id}
                                  className="rounded bg-blue-50 px-2 py-1 text-blue-900"
                                >
                                  <div>
                                    {reserva.pedidoInterno?.codigo || "Sin pedido"} � {reserva.area?.abreviatura || reserva.area?.nombre || "-"}
                                  </div>
                                  <div>
                                    {reserva.cantidadReservada} reservadas � vence {reserva.expiresAt ? new Date(reserva.expiresAt).toLocaleString() : "-"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {almacen.updatedAt
                            ? new Date(almacen.updatedAt).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/inventario-kardex?productoId=${row.producto.id}&almacenId=${almacen.id}`}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                          >
                            Ver kardex
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventarioStockPage;


