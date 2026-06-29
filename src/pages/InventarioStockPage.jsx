import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  canApprovePedidoInternoEffective,
  canCreatePedidoInternoEffective,
  canViewWarehouseTrayEffective,
} from "../accessRules";
import SkeletonSection from "../components/ui/skeletons/SkeletonSection";
import SkeletonTable from "../components/ui/skeletons/SkeletonTable";
import { useAuth } from "../context/authContext";
import useAlmacenes from "../hooks/useAlmacenes";
import useInventario from "../hooks/useInventario";

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
  timeStyle: "medium",
});

const formatDisplayDateTime = (value) => {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? dateTimeFormatter.format(timestamp) : "-";
};

const getBuscarFromSearchParams = (searchParams) =>
  searchParams.get("buscar") ||
  searchParams.get("producto") ||
  searchParams.get("codigo") ||
  "";

const getAlmacenIdFromSearchParams = (searchParams) =>
  searchParams.get("almacenId") || "";

const getBooleanFromSearchParams = (searchParams, key) =>
  ["1", "true", "si", "sí"].includes(
    String(searchParams.get(key) || "").trim().toLowerCase(),
  );

const InventarioStockPage = () => {
  const { user } = useAuth();
  const { loading, obtenerStock } = useInventario();
  const {
    almacenes,
    loading: loadingAlmacenes,
    obtenerAlmacenes,
  } = useAlmacenes();
  const [searchParams] = useSearchParams();
  const [buscar, setBuscar] = useState(() =>
    getBuscarFromSearchParams(searchParams),
  );
  const [almacenId, setAlmacenId] = useState(() =>
    getAlmacenIdFromSearchParams(searchParams),
  );
  const [incluirCeros, setIncluirCeros] = useState(() =>
    getBooleanFromSearchParams(searchParams, "incluirCeros"),
  );
  const [soloConStock, setSoloConStock] = useState(() =>
    getBooleanFromSearchParams(searchParams, "soloConStock"),
  );
  const [rows, setRows] = useState([]);

  const canCreate = canCreatePedidoInternoEffective(user);
  const canApprove = canApprovePedidoInternoEffective(user);
  const canUseWarehouseTray = canViewWarehouseTrayEffective(user);
  const isInitialLoading = loading && rows.length === 0;

  const cargarStock = useCallback(
    async (filters = {}) => {
      try {
        const data = await obtenerStock(filters);
        setRows(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(error.message || "No se pudo obtener el stock.");
        setRows([]);
      }
    },
    [obtenerStock],
  );

  useEffect(() => {
    obtenerAlmacenes({ estado: "activos" }).catch(() => {});
  }, [obtenerAlmacenes]);

  useEffect(() => {
    const nextBuscar = getBuscarFromSearchParams(searchParams);
    const nextAlmacenId = getAlmacenIdFromSearchParams(searchParams);
    const nextIncluirCeros = getBooleanFromSearchParams(
      searchParams,
      "incluirCeros",
    );
    const nextSoloConStock = getBooleanFromSearchParams(
      searchParams,
      "soloConStock",
    );

    setBuscar(nextBuscar);
    setAlmacenId(nextAlmacenId);
    setIncluirCeros(nextIncluirCeros);
    setSoloConStock(nextSoloConStock);
    cargarStock({
      buscar: nextBuscar.trim() || undefined,
      almacenId: nextAlmacenId || undefined,
      incluirCeros: nextIncluirCeros || undefined,
      soloConStock: nextSoloConStock || undefined,
    });
  }, [cargarStock, searchParams]);

  const resumenGeneral = useMemo(
    () =>
      rows.reduce(
        (acumulado, row) => ({
          productos: acumulado.productos + 1,
          totalActual: acumulado.totalActual + Number(row.totalActual || 0),
          totalReservada:
            acumulado.totalReservada + Number(row.totalReservada || 0),
          totalDisponible:
            acumulado.totalDisponible + Number(row.totalDisponible || 0),
        }),
        {
          productos: 0,
          totalActual: 0,
          totalReservada: 0,
          totalDisponible: 0,
        },
      ),
    [rows],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    await cargarStock({
      buscar: buscar.trim() || undefined,
      almacenId: almacenId || undefined,
      incluirCeros: incluirCeros || undefined,
      soloConStock: soloConStock || undefined,
    });
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Stock de inventario
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Consulta stock actual, reservado y disponible por producto, almacén
            y vista consolidada institucional.
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
              Bandeja almacén
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
        El stock disponible ya descuenta las reservas activas de notas de pedido
        aprobadas. La reserva solo es garantía temporal de atención; la salida
        real ocurre cuando almacén atiende la nota de pedido y genera la nota de
        salida.
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid gap-4 rounded-lg bg-white p-4 shadow md:grid-cols-4"
      >
        <div>
          <label
            htmlFor="inventario-stock-buscar"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Buscar producto
          </label>
          <input
            id="inventario-stock-buscar"
            type="text"
            value={buscar}
            name="inventario-stock-page-input-126"
            onChange={(event) => setBuscar(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Nombre o código"
          />
        </div>
        <div>
          <label
            htmlFor="inventario-stock-almacen"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Filtrar por almacén
          </label>
          <select
            id="inventario-stock-almacen"
            value={almacenId}
            name="inventario-stock-page-select-138"
            onChange={(event) => setAlmacenId(event.target.value)}
            disabled={loadingAlmacenes}
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Todos los almacenes</option>
            {almacenes.map((almacen) => (
              <option key={almacen.id} value={almacen.id}>
                {almacen.codigo} - {almacen.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={incluirCeros}
              onChange={(event) => setIncluirCeros(event.target.checked)}
              className="mt-1"
            />
            <span>Mostrar almacenes activos sin stock para el producto.</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={soloConStock}
              onChange={(event) => setSoloConStock(event.target.checked)}
              className="mt-1"
            />
            <span>Mostrar solo registros con stock o reserva.</span>
          </label>
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

      {rows.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Productos consultados
            </p>
            <strong className="mt-1 block text-2xl text-slate-900">
              {resumenGeneral.productos}
            </strong>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Stock actual consolidado
            </p>
            <strong className="mt-1 block text-2xl text-slate-900">
              {resumenGeneral.totalActual}
            </strong>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Reservado vigente
            </p>
            <strong className="mt-1 block text-2xl text-slate-900">
              {resumenGeneral.totalReservada}
            </strong>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Disponible consolidado
            </p>
            <strong className="mt-1 block text-2xl text-slate-900">
              {resumenGeneral.totalDisponible}
            </strong>
          </div>
        </div>
      )}

      {isInitialLoading ? (
        <div className="space-y-4">
          <SkeletonSection rows={3} />
          <SkeletonTable columns={7} rows={5} className="rounded-lg" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-600">
            No hay stock registrado con los filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.producto.id} className="rounded-lg bg-white shadow">
              <div className="border-b p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {row.producto.nombre}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {row.producto.codigo} · {row.producto.unidadMedida}
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
                        <div>
                          Área reservante: {reserva.area?.nombre || "-"}
                        </div>
                        <div>
                          Cantidad reservada: {reserva.cantidadReservada}
                        </div>
                        <div>
                          Vence: {formatDisplayDateTime(reserva.expiresAt)}
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
                      <th className="px-4 py-3 text-left">Almacén</th>
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
                        <td className="px-4 py-3">
                          {almacen.cantidadReservada}
                        </td>
                        <td className="px-4 py-3">
                          {almacen.cantidadDisponible}
                        </td>
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
                                    {reserva.pedidoInterno?.codigo ||
                                      "Sin pedido"}{" "}
                                    ·{" "}
                                    {reserva.area?.abreviatura ||
                                      reserva.area?.nombre ||
                                      "-"}
                                  </div>
                                  <div>
                                    {reserva.cantidadReservada} reservadas ·
                                    vence{" "}
                                    {formatDisplayDateTime(reserva.expiresAt)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {formatDisplayDateTime(almacen.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/modulo-almacen/kardex?productoId=${row.producto.id}&almacenId=${almacen.id}`}
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
