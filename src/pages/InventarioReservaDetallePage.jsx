import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import ReservaEstadoBadge from "../components/ReservaEstadoBadge";
import InventarioReservaDetalleSkeleton from "../components/ui/skeletons/InventarioReservaDetalleSkeleton";
import useInventario from "../hooks/useInventario";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "-";

const InventarioReservaDetallePage = () => {
  const { id } = useParams();
  const { loading, error, obtenerReservaPorId } = useInventario();
  const [reserva, setReserva] = useState(null);

  const cargarReserva = useCallback(async () => {
    const data = await obtenerReservaPorId(id);
    setReserva(data);
  }, [id, obtenerReservaPorId]);

  useEffect(() => {
    cargarReserva().catch((loadError) => {
      toast.error(loadError.message || "No se pudo cargar la reserva.");
      setReserva(null);
    });
  }, [cargarReserva]);


  if (loading && !reserva) return <InventarioReservaDetalleSkeleton />;

  if (!reserva) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "No se pudo cargar la reserva."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Detalle de reserva de stock
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Reserva #{reserva.id} - {reserva.producto?.nombre || "Sin producto"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/inventario-reservas"
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Listado
          </Link>
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

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estado
          </p>
          <div className="mt-3">
            <ReservaEstadoBadge estado={reserva.estado} />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cantidad pendiente
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {reserva.cantidadPendiente}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Creada
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatDateTime(reserva.createdAt)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Vence
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatDateTime(reserva.expiresAt)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Cabecera operativa
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Producto
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {reserva.producto?.codigo || "-"} - {reserva.producto?.nombre || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Almacen
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {reserva.almacen?.codigo || "-"} - {reserva.almacen?.nombre || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Usuario origen
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {reserva.usuario?.nombre || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Area
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {reserva.area?.nombre || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Referencia tipo
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {reserva.referenciaTipo || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Referencia codigo
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {reserva.referenciaCodigo || "-"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Observaciones
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {reserva.observaciones || "Sin observaciones registradas."}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <span className="block text-slate-500">Reservada</span>
              <strong>{reserva.cantidadReservada}</strong>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 text-sm">
              <span className="block text-emerald-700">Consumida</span>
              <strong>{reserva.cantidadConsumida}</strong>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-sm">
              <span className="block text-amber-700">Liberada</span>
              <strong>{reserva.cantidadLiberada}</strong>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-sm">
              <span className="block text-blue-700">Pendiente</span>
              <strong>{reserva.cantidadPendiente}</strong>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-blue-950">
            Gestión automática de la reserva
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-blue-900">
            La reserva fue generada por el documento de origen. El sistema la
            consume al aprobar la Nota de Salida y libera automáticamente el
            saldo por vencimiento, rechazo o cancelación. No corresponde una
            liberación manual desde esta ficha.
          </p>
          <div className="mt-4 rounded-lg bg-white/80 p-4 text-sm text-blue-950">
            <p>
              <strong>Saldo pendiente:</strong> {reserva.cantidadPendiente}
            </p>
            <p className="mt-1">
              <strong>Vencimiento:</strong> {formatDateTime(reserva.expiresAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Origen documental
          </h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pedido interno vinculado
              </p>
              {reserva.pedidoInterno ? (
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  <Link
                    to={`/notas-pedido/${reserva.pedidoInterno.id}`}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    {reserva.pedidoInterno.codigo}
                  </Link>
                  <p>{reserva.pedidoInterno.areaSolicitante?.nombre || "Sin area"}</p>
                  <p>Estado flujo: {reserva.pedidoInterno.estadoFlujo}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  La reserva no esta ligada a un pedido interno. Revisa su origen operativo
                  antes de mantenerla activa.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Navegacion relacionada
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                {reserva.pedidoInterno ? (
                  <Link
                    to={`/inventario-notas-salida?pedidoInternoId=${reserva.pedidoInterno.id}`}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Ver salidas del pedido
                  </Link>
                ) : null}
                {reserva.producto?.id ? (
                  <Link
                    to={`/inventario-kardex?productoId=${reserva.producto.id}`}
                    className="font-medium text-slate-600 hover:text-slate-700"
                  >
                    Ver kardex del producto
                  </Link>
                ) : null}
                <Link
                  to={`/inventario-movimientos?reservaStockId=${reserva.id}`}
                  className="font-medium text-slate-600 hover:text-slate-700"
                >
                  Ver movimientos de la reserva
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Notas de salida relacionadas
          </h2>
          {(reserva.salidasDocumentadas || []).length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Aun no hay notas de salida documentadas para esta reserva.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {reserva.salidasDocumentadas.map((salida) => (
                <div
                  key={salida.id}
                  className="rounded-lg border border-slate-200 p-4 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      to={`/inventario-notas-salida/${salida.id}`}
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      {salida.codigo}
                    </Link>
                    <span className="text-slate-500">
                      {formatDateTime(salida.fechaSalida)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-slate-600">Estado: {salida.estado}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Movimientos relacionados
          </h2>
          <Link
            to={`/inventario-movimientos?reservaStockId=${reserva.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Abrir pagina de movimientos
          </Link>
        </div>
        {(reserva.movimientos || []).length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No hay movimientos visibles vinculados a esta reserva.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Cantidad</th>
                  <th className="px-4 py-3 text-left">Nota salida</th>
                </tr>
              </thead>
              <tbody>
                {reserva.movimientos.map((movimiento) => (
                  <tr key={movimiento.id} className="border-t border-slate-200">
                    <td className="px-4 py-3">{formatDateTime(movimiento.fechaMovimiento)}</td>
                    <td className="px-4 py-3">
                      {movimiento.tipoMovimiento}
                      {movimiento.subtipoMovimiento
                        ? ` / ${movimiento.subtipoMovimiento}`
                        : ""}
                    </td>
                    <td className="px-4 py-3">
                      {movimiento.producto?.codigo} - {movimiento.producto?.nombre}
                    </td>
                    <td className="px-4 py-3">{movimiento.cantidad}</td>
                    <td className="px-4 py-3">
                      {movimiento.notaSalida?.id ? (
                        <Link
                          to={`/inventario-notas-salida/${movimiento.notaSalida.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {movimiento.notaSalida.codigo}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventarioReservaDetallePage;
