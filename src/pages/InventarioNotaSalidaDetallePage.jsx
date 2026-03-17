import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import DocumentoAlmacenEstadoBadge from "../components/DocumentoAlmacenEstadoBadge";
import Loader from "../components/Loader";
import useInventario from "../hooks/useInventario";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "-";

const InventarioNotaSalidaDetallePage = () => {
  const { id } = useParams();
  const { loading, error, obtenerNotaSalidaPorId } = useInventario();
  const [nota, setNota] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerNotaSalidaPorId(id);
        setNota(data);
      } catch (loadError) {
        toast.error(loadError.message || "No se pudo cargar la nota de salida.");
        setNota(null);
      }
    };

    cargar();
  }, [id, obtenerNotaSalidaPorId]);

  if (loading && !nota) return <Loader />;

  if (!nota) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "No se pudo cargar la nota de salida."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Detalle de nota de salida
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {nota.codigo} - {nota.almacen?.nombre || "Sin almacen"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/inventario-notas-salida"
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Listado
          </Link>
          <Link
            to="/notas-pedido/almacen"
            className="rounded border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Bandeja de almacen
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
            <DocumentoAlmacenEstadoBadge estado={nota.estado} />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Fecha de salida
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatDateTime(nota.fechaSalida)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total entregado
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {nota.resumen?.totalEntregado || 0}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total pendiente
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {nota.resumen?.totalPendiente || 0}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Cabecera documental
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Almacen
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {nota.almacen?.codigo || "-"} - {nota.almacen?.nombre || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Responsable
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {nota.responsable?.nombre || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Receptor
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {nota.receptor?.nombre || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Area destino
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {nota.areaDestino?.nombre || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Referencia tipo
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {nota.referenciaTipo || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Referencia codigo
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {nota.referenciaCodigo || "-"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Observaciones
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {nota.observaciones || "Sin observaciones registradas."}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Trazabilidad
            </h2>
            <Link
              to={`/inventario-movimientos?notaSalidaId=${nota.id}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Ver movimientos
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pedido interno origen
              </p>
              {nota.pedidoInterno ? (
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  <Link
                    to={`/notas-pedido/${nota.pedidoInterno.id}`}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    {nota.pedidoInterno.codigo}
                  </Link>
                  <p>{nota.pedidoInterno.areaSolicitante?.nombre || "Sin area"}</p>
                  <p>Estado flujo: {nota.pedidoInterno.estadoFlujo}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  No hay un pedido interno vinculado directamente.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Flujo origen
              </p>
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                <p>
                  Tipo: {nota.referenciaTipo || "-"} - Codigo:{" "}
                  {nota.referenciaCodigo || "-"}
                </p>
                <Link
                  to="/notas-pedido/almacen"
                  className="font-medium text-emerald-700 hover:text-emerald-800"
                >
                  Volver al flujo de almacen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Lineas entregadas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-left">Cantidades</th>
                <th className="px-4 py-3 text-left">Area / pedido</th>
                <th className="px-4 py-3 text-left">Trazabilidad</th>
              </tr>
            </thead>
            <tbody>
              {(nota.detalles || []).length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                    Esta nota no tiene lineas visibles.
                  </td>
                </tr>
              ) : (
                nota.detalles.map((detalle) => (
                  <tr key={detalle.id} className="border-t border-slate-200 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {detalle.producto?.nombre || "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {detalle.producto?.codigo || "-"} ?{" "}
                        {detalle.producto?.unidadMedida || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>Solicitada: {detalle.cantidadSolicitada}</div>
                      <div>Entregada: {detalle.cantidadEntregada}</div>
                      <div>Pendiente: {detalle.cantidadPendiente}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{nota.areaDestino?.nombre || "-"}</div>
                      <div className="text-xs text-slate-500">
                        Pedido detalle: {detalle.pedidoInternoDetalleId || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="space-y-1">
                        {detalle.producto?.id ? (
                          <Link
                            to={`/inventario-kardex?productoId=${detalle.producto.id}`}
                            className="font-medium text-blue-600 hover:text-blue-700"
                          >
                            Ver kardex del producto
                          </Link>
                        ) : null}
                        {nota.pedidoInterno ? (
                          <Link
                            to={`/notas-pedido/${nota.pedidoInterno.id}`}
                            className="font-medium text-slate-600 hover:text-slate-700"
                          >
                            Ver pedido interno
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
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Movimientos relacionados
          </h2>
          <Link
            to={`/inventario-movimientos?notaSalidaId=${nota.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Abrir pagina de movimientos
          </Link>
        </div>
        {(nota.movimientos || []).length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No hay movimientos visibles vinculados a esta nota.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Cantidad</th>
                  <th className="px-4 py-3 text-left">Operacion</th>
                </tr>
              </thead>
              <tbody>
                {nota.movimientos.map((movimiento) => (
                  <tr key={movimiento.id} className="border-t border-slate-200">
                    <td className="px-4 py-3">{formatDateTime(movimiento.fechaMovimiento)}</td>
                    <td className="px-4 py-3">
                      {movimiento.producto?.codigo} - {movimiento.producto?.nombre}
                    </td>
                    <td className="px-4 py-3">
                      {movimiento.tipoMovimiento}
                      {movimiento.subtipoMovimiento
                        ? ` / ${movimiento.subtipoMovimiento}`
                        : ""}
                    </td>
                    <td className="px-4 py-3">{movimiento.cantidad}</td>
                    <td className="px-4 py-3">{movimiento.numeroOperacion || "-"}</td>
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

export default InventarioNotaSalidaDetallePage;


