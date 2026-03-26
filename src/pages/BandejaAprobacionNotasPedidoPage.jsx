import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { canApprovePedidoInternoEffective } from "../accessRules";
import PedidoInternoEstadoBadge from "../components/PedidoInternoEstadoBadge";
import { useAuth } from "../context/authContext";
import usePedidosInternos from "../hooks/usePedidosInternos";

const formatDate = (value) =>
  value ? new Date(value).toLocaleString() : "-";

const BandejaAprobacionNotasPedidoPage = () => {
  const { user } = useAuth();
  const { loading, obtenerBandejaAprobacion, aprobarPedido } =
    usePedidosInternos();
  const [pedidos, setPedidos] = useState([]);
  const [comentarios, setComentarios] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  const canApprove = canApprovePedidoInternoEffective(user);

  const cargarBandeja = async () => {
    try {
      const response = await obtenerBandejaAprobacion();
      setPedidos(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      toast.error(error.message || "No se pudo cargar la bandeja de aprobacion.");
      setPedidos([]);
    }
  };

  useEffect(() => {
    if (canApprove) {
      cargarBandeja();
    }
  }, [canApprove]);

  const procesar = async (pedidoId, accion) => {
    try {
      setSubmittingId(pedidoId);
      await aprobarPedido(pedidoId, {
        accion,
        comentario: comentarios[pedidoId] || undefined,
      });
      toast.success(
        accion === "APROBAR"
          ? "La nota de pedido fue aprobada y ya puede reservar stock." 
          : "La nota de pedido fue rechazada correctamente."
      );
      await cargarBandeja();
    } catch (error) {
      toast.error(error.message || "No se pudo procesar la aprobacion.");
    } finally {
      setSubmittingId(null);
    }
  };

  if (!canApprove) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-2xl font-bold text-amber-900">
            Bandeja de aprobacion no disponible
          </h1>
          <p className="mt-2 text-sm text-amber-800">
            Esta vista esta pensada para jefes de area o perfiles administrativos
            autorizados. Si solo generas notas, puedes seguir el estado desde el
            listado de notas de pedido.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/notas-pedido"
              className="rounded border border-amber-300 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              Ir a notas de pedido
            </Link>
            <Link
              to="/dashboard"
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Volver al dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Bandeja de aprobacion
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Revisa notas de pedido de operadores. Solo las aprobadas pasan a
            reserva y luego a atencion de almacen.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/notas-pedido"
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver todas
          </Link>
          <button
            type="button"
            onClick={cargarBandeja}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Actualizar
          </button>
        </div>
      </div>

      {pedidos.length === 0 ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-slate-500">
            No hay notas de pedido pendientes de aprobacion.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="rounded-lg bg-white p-4 shadow">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {pedido.codigo}
                    </h2>
                    <PedidoInternoEstadoBadge estadoFlujo={pedido.estadoFlujo} />
                  </div>
                  <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <p>
                      <span className="font-medium text-slate-800">Area:</span>{" "}
                      {pedido.areaSolicitante?.nombre || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-800">
                        Solicitante:
                      </span>{" "}
                      {pedido.solicitante?.nombre || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-800">Fecha:</span>{" "}
                      {formatDate(pedido.fechaPedido)}
                    </p>
                    <p>
                      <span className="font-medium text-slate-800">Lineas:</span>{" "}
                      {pedido.detalles?.length || 0}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/notas-pedido/${pedido.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Ver detalle
                </Link>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Producto</th>
                      <th className="px-3 py-2 text-left">Solicitada</th>
                      <th className="px-3 py-2 text-left">Disponible al pedir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(pedido.detalles || []).map((detalle) => (
                      <tr key={detalle.id} className="border-t border-slate-200">
                        <td className="px-3 py-2">
                          {detalle.producto?.codigo} - {detalle.producto?.nombre}
                        </td>
                        <td className="px-3 py-2">{detalle.cantidadSolicitada}</td>
                        <td className="px-3 py-2">
                          {detalle.stockDisponibleAlSolicitar ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div>
                  <label htmlFor={`pedido-comentario-${pedido.id}`} className="mb-1 block text-sm font-medium text-slate-700">
                    Comentario de aprobacion o rechazo
                  </label>
                  <textarea
                    id={`pedido-comentario-${pedido.id}`}
                    value={comentarios[pedido.id] || ""}
                    name="bandeja-aprobacion-notas-pedido-page-textarea-196"
                    onChange={(event) =>
                      setComentarios((prev) => ({
                        ...prev,
                        [pedido.id]: event.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    placeholder="Motivo, observacion o criterio de aprobacion"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={loading || submittingId === pedido.id}
                    onClick={() => procesar(pedido.id, "RECHAZAR")}
                    className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-red-300"
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    disabled={loading || submittingId === pedido.id}
                    onClick={() => procesar(pedido.id, "APROBAR")}
                    className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-emerald-300"
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BandejaAprobacionNotasPedidoPage;
