import PedidoInternoEstadoBadge from "./PedidoInternoEstadoBadge";

import { Link } from "react-router-dom";

const formatDate = (value) =>
  value ? new Date(value).toLocaleString() : "-";

const formatNumber = (value) => Number(value || 0);

const PedidoInternoDetallePanel = ({ pedido }) => {
  if (!pedido) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">
              {pedido.codigo}
            </h2>
            <PedidoInternoEstadoBadge
              estadoFlujo={pedido.estadoFlujo}
              estadoDocumento={pedido.estadoDocumento}
              showDocument
            />
            {pedido.estadoFlujo === "PENDIENTE_APROBACION" && (
              <p className="text-sm text-amber-700">
                Esta nota aun no reserva stock. La reserva nace cuando la nota queda aprobada.
              </p>
            )}
            <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
              <p>
                <span className="font-medium text-slate-800">Fecha:</span>{" "}
                {formatDate(pedido.fechaPedido)}
              </p>
              <p>
                <span className="font-medium text-slate-800">Area:</span>{" "}
                {pedido.areaSolicitante?.nombre || "-"}
              </p>
              <p>
                <span className="font-medium text-slate-800">Solicitante:</span>{" "}
                {pedido.solicitante?.nombre || "-"}
              </p>
              <p>
                <span className="font-medium text-slate-800">Aprobador:</span>{" "}
                {pedido.aprobador?.nombre || "-"}
              </p>
              <p>
                <span className="font-medium text-slate-800">Almacen:</span>{" "}
                {pedido.almacen
                  ? `${pedido.almacen.codigo} - ${pedido.almacen.nombre}`
                  : "-"}
              </p>
              <p>
                <span className="font-medium text-slate-800">
                  Requiere aprobacion:
                </span>{" "}
                {pedido.requiereAprobacion ? "Si" : "No"}
              </p>
            </div>
          </div>

          <div className="grid min-w-[240px] grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-slate-50 p-3">
              <span className="block text-slate-500">Solicitado</span>
              <strong className="text-slate-900">
                {formatNumber(pedido.resumen?.totalSolicitado)}
              </strong>
            </div>
            <div className="rounded-md bg-emerald-50 p-3">
              <span className="block text-emerald-700">Atendido</span>
              <strong className="text-emerald-900">
                {formatNumber(pedido.resumen?.totalAtendido)}
              </strong>
            </div>
            <div className="rounded-md bg-amber-50 p-3">
              <span className="block text-amber-700">Pendiente</span>
              <strong className="text-amber-900">
                {formatNumber(pedido.resumen?.totalPendiente)}
              </strong>
            </div>
            <div className="rounded-md bg-blue-50 p-3">
              <span className="block text-blue-700">Reservas vigentes</span>
              <strong className="text-blue-900">
                {Array.isArray(pedido.reservas) ? pedido.reservas.length : 0}
              </strong>
            </div>
          </div>
        </div>

        {pedido.observaciones && (
          <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Observaciones:</span>{" "}
            {pedido.observaciones}
          </div>
        )}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-slate-900">
          Lineas solicitadas
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2 text-left">Solicitada</th>
                <th className="px-3 py-2 text-left">Atendida</th>
                <th className="px-3 py-2 text-left">Pendiente</th>
                <th className="px-3 py-2 text-left">Disponible al pedir</th>
                <th className="px-3 py-2 text-left">Reserva activa</th>
              </tr>
            </thead>
            <tbody>
              {(pedido.detalles || []).map((detalle) => (
                <tr key={detalle.id} className="border-t border-slate-200">
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-900">
                      {detalle.producto?.nombre}
                    </div>
                    <div className="text-xs text-slate-500">
                      {detalle.producto?.codigo}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {formatNumber(detalle.cantidadSolicitada)}
                  </td>
                  <td className="px-3 py-2">
                    {formatNumber(detalle.cantidadAtendida)}
                  </td>
                  <td className="px-3 py-2">
                    {formatNumber(detalle.cantidadPendiente)}
                  </td>
                  <td className="px-3 py-2">
                    {formatNumber(detalle.stockDisponibleAlSolicitar)}
                  </td>
                  <td className="px-3 py-2">
                    {(detalle.reservasActivas || []).length === 0 ? (
                      <span className="text-slate-500">Sin reserva</span>
                    ) : (
                      <div className="space-y-1">
                        {detalle.reservasActivas.map((reserva) => (
                          <div
                            key={reserva.id}
                            className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-900"
                          >
                            {reserva.cantidadPendiente} reservadas hasta {formatDate(reserva.expiresAt)}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">
            Reservas asociadas
          </h3>
          {(pedido.reservas || []).length === 0 ? (
            <p className="text-sm text-slate-500">
              Esta nota de pedido no tiene reservas activas registradas.
            </p>
          ) : (
            <div className="space-y-3">
              {pedido.reservas.map((reserva) => (
                <div
                  key={reserva.id}
                  className="rounded-md border border-slate-200 p-3 text-sm"
                >
                  <Link
                    to={`/inventario-reservas/${reserva.id}`}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    {reserva.producto?.nombre || `Reserva #${reserva.id}`}
                  </Link>
                  <div className="mt-1 grid gap-1 text-slate-600">
                    <p>Cantidad reservada vigente: {formatNumber(reserva.cantidadPendiente)}</p>
                    <p>Estado de reserva: {reserva.estado}</p>
                    <p>Vence: {formatDate(reserva.expiresAt)}</p>
                    <p>Area reservante: {reserva.area?.nombre || "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">
            Notas de salida generadas
          </h3>
          {(pedido.notasSalida || []).length === 0 ? (
            <p className="text-sm text-slate-500">
              Aun no hay notas de salida generadas para esta nota de pedido.
            </p>
          ) : (
            <div className="space-y-3">
              {pedido.notasSalida.map((nota) => (
                <div
                  key={nota.id}
                  className="rounded-md border border-slate-200 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      to={`/inventario-notas-salida/${nota.id}`}
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      {nota.codigo}
                    </Link>
                    <span className="text-xs text-slate-500">
                      {formatDate(nota.fechaSalida)}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1 text-slate-600">
                    <p>Responsable de almacen: {nota.responsable?.nombre || "-"}</p>
                    <p>Receptor: {nota.receptor?.nombre || "-"}</p>
                    <p>Area destino: {nota.areaDestino?.nombre || "-"}</p>
                  </div>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-2 py-1 text-left">Producto</th>
                          <th className="px-2 py-1 text-left">Entregada</th>
                          <th className="px-2 py-1 text-left">Pendiente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(nota.detalles || []).map((detalle) => (
                          <tr key={detalle.id} className="border-t border-slate-200">
                            <td className="px-2 py-1">
                              {detalle.producto?.codigo} - {detalle.producto?.nombre}
                            </td>
                            <td className="px-2 py-1">
                              {formatNumber(detalle.cantidadEntregada)}
                            </td>
                            <td className="px-2 py-1">
                              {formatNumber(detalle.cantidadPendiente)}
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
      </section>
    </div>
  );
};

export default PedidoInternoDetallePanel;
