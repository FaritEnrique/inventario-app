import { useEffect, useReducer, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import PedidoInternoEstadoBadge from "../components/PedidoInternoEstadoBadge";
import { useAuth } from "../context/authContext";
import usePedidosInternos from "../hooks/usePedidosInternos";
import { canViewWarehouseTray } from "../utils/inventarioPermissions";

const MANUAL_RECEPTOR_OPTION = "__manual__";

const buildReceptorCandidates = (pedido = {}) => {
  const areaId = pedido.areaSolicitante?.id ?? pedido.areaSolicitanteId ?? null;
  const candidates = new Map();

  const addCandidate = (user, sourceLabel) => {
    if (!user?.id) return;

    const userAreaId = user.areaId ?? user.area?.id ?? null;
    if (areaId && userAreaId && String(areaId) !== String(userAreaId)) {
      return;
    }

    const key = String(user.id);
    if (candidates.has(key)) return;

    candidates.set(key, {
      id: user.id,
      nombre: user.nombre || user.name || `Usuario ${user.id}`,
      cargo: user.cargo || user.rol || null,
      sourceLabel,
    });
  };

  addCandidate(pedido.solicitante, "Solicitante");
  addCandidate(pedido.aprobador, "Aprobador");
  addCandidate(pedido.areaSolicitante?.jefe, "Jefe del area");

  (pedido.notasSalida || []).forEach((nota) => {
    addCandidate(nota.receptor, "Receptor previo");
  });

  return Array.from(candidates.values());
};

const getInitialReceptorSelection = (pedido) => {
  const candidatos = buildReceptorCandidates(pedido);
  if (candidatos.length === 1) {
    return String(candidatos[0].id);
  }
  if (candidatos.length === 0) {
    return MANUAL_RECEPTOR_OPTION;
  }
  return "";
};

const initialDraft = {
  pedidoId: null,
  receptorSeleccion: "",
  receptorManualId: "",
  observaciones: "",
  cantidades: {},
};

const reducer = (state, action) => {
  switch (action.type) {
    case "open": {
      const cantidades = {};
      (action.pedido?.detalles || []).forEach((detalle) => {
        cantidades[detalle.id] = detalle.cantidadPendiente || 0;
      });

      return {
        pedidoId: action.pedido?.id || null,
        receptorSeleccion: action.receptorSeleccion || "",
        receptorManualId: "",
        observaciones: "",
        cantidades,
      };
    }
    case "setField":
      return { ...state, [action.field]: action.value };
    case "setCantidad":
      return {
        ...state,
        cantidades: {
          ...state.cantidades,
          [action.detalleId]: action.value,
        },
      };
    case "reset":
      return initialDraft;
    default:
      return state;
  }
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleString() : "-";

const BandejaAlmacenNotasPedidoPage = () => {
  const { user } = useAuth();
  const { loading, obtenerBandejaAlmacen, atenderPedido } = usePedidosInternos();
  const [pedidos, setPedidos] = useState([]);
  const [draft, dispatch] = useReducer(reducer, initialDraft);
  const [ultimoResultado, setUltimoResultado] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);

  const canUseWarehouseTray = canViewWarehouseTray(user);

  const cargarBandeja = async () => {
    try {
      const response = await obtenerBandejaAlmacen();
      setPedidos(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      toast.error(error.message || "No se pudo cargar la bandeja de almacen.");
      setPedidos([]);
    }
  };

  useEffect(() => {
    if (canUseWarehouseTray) {
      cargarBandeja();
    }
  }, [canUseWarehouseTray]);

  const handleOpenAtencion = (pedido) => {
    dispatch({
      type: "open",
      pedido,
      receptorSeleccion: getInitialReceptorSelection(pedido),
    });
  };

  const handleAtender = async (pedido) => {
    const receptorIdValue =
      draft.receptorSeleccion === MANUAL_RECEPTOR_OPTION
        ? draft.receptorManualId
        : draft.receptorSeleccion;

    if (!receptorIdValue) {
      toast.error("Selecciona el receptor del area antes de registrar la salida.");
      return;
    }

    const items = (pedido.detalles || [])
      .map((detalle) => ({
        pedidoInternoDetalleId: detalle.id,
        cantidadEntregada: Number(draft.cantidades[detalle.id] || 0),
      }))
      .filter(
        (detalle) =>
          Number.isFinite(detalle.cantidadEntregada) && detalle.cantidadEntregada > 0
      );

    if (items.length === 0) {
      toast.error("Debes indicar al menos una cantidad a entregar.");
      return;
    }

    for (const item of items) {
      const detalle = pedido.detalles.find(
        (linea) => linea.id === item.pedidoInternoDetalleId
      );
      if (item.cantidadEntregada > Number(detalle?.cantidadPendiente || 0)) {
        toast.error("No puedes entregar mas que el saldo pendiente de una linea.");
        return;
      }
    }

    try {
      setSubmittingId(pedido.id);
      const response = await atenderPedido(pedido.id, {
        receptorId: Number(receptorIdValue),
        observaciones: draft.observaciones || undefined,
        items,
      });
      setUltimoResultado(response);
      toast.success(
        `La nota de pedido ${pedido.codigo} fue atendida y genero su nota de salida.`
      );
      dispatch({ type: "reset" });
      await cargarBandeja();
    } catch (error) {
      toast.error(error.message || "No se pudo atender la nota de pedido.");
    } finally {
      setSubmittingId(null);
    }
  };

  if (!canUseWarehouseTray) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
          <h1 className="text-2xl font-bold text-emerald-900">
            Bandeja de almacen no disponible
          </h1>
          <p className="mt-2 text-sm text-emerald-800">
            Esta vista esta reservada para usuarios de almacen o inventario.
            Desde aqui se registran las entregas reales y se genera la nota de salida.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/notas-pedido"
              className="rounded border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
            >
              Ver notas de pedido
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
            Bandeja de almacen
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Atiende notas aprobadas, valida el receptor del area y genera la
            nota de salida solo por lo efectivamente entregado.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/inventario-stock"
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver stock
          </Link>
          <Link
            to="/notas-pedido"
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver notas
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
            No hay notas aprobadas pendientes de atencion.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => {
            const abierta = draft.pedidoId === pedido.id;
            const receptorCandidates = buildReceptorCandidates(pedido);
            const usarIngresoManual =
              draft.receptorSeleccion === MANUAL_RECEPTOR_OPTION ||
              receptorCandidates.length === 0;

            return (
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
                        <span className="font-medium text-slate-800">Almacen:</span>{" "}
                        {pedido.almacen?.codigo || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={`/notas-pedido/${pedido.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Ver detalle
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        abierta ? dispatch({ type: "reset" }) : handleOpenAtencion(pedido)
                      }
                      className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {abierta ? "Cerrar atencion" : "Atender"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Producto</th>
                        <th className="px-3 py-2 text-left">Solicitada</th>
                        <th className="px-3 py-2 text-left">Atendida</th>
                        <th className="px-3 py-2 text-left">Pendiente</th>
                        <th className="px-3 py-2 text-left">Reserva activa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(pedido.detalles || []).map((detalle) => (
                        <tr key={detalle.id} className="border-t border-slate-200">
                          <td className="px-3 py-2">
                            {detalle.producto?.codigo} - {detalle.producto?.nombre}
                          </td>
                          <td className="px-3 py-2">{detalle.cantidadSolicitada}</td>
                          <td className="px-3 py-2">{detalle.cantidadAtendida}</td>
                          <td className="px-3 py-2">{detalle.cantidadPendiente}</td>
                          <td className="px-3 py-2">
                            {(detalle.reservasActivas || []).length === 0 ? (
                              <span className="text-slate-500">Sin reserva visible</span>
                            ) : (
                              <div className="space-y-1 text-xs">
                                {detalle.reservasActivas.map((reserva) => (
                                  <div
                                    key={reserva.id}
                                    className="rounded bg-blue-50 px-2 py-1 text-blue-900"
                                  >
                                    Reservado: {reserva.cantidadPendiente} � vence {formatDate(reserva.expiresAt)}
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

                {abierta && (
                  <div className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                      La salida real se registrara solo por las cantidades entregadas ahora. La reserva vigente se consumira con esta atencion.
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor={`pedido-receptor-${pedido.id}`} className="mb-1 block text-sm font-medium text-slate-700">
                          Receptor del area solicitante
                        </label>
                        <select
                          id={`pedido-receptor-${pedido.id}`}
                          value={draft.receptorSeleccion}
                          name="bandeja-almacen-notas-pedido-page-select-374"
                          onChange={(event) =>
                            dispatch({
                              type: "setField",
                              field: "receptorSeleccion",
                              value: event.target.value,
                            })
                          }
                          className="w-full rounded border border-slate-300 px-3 py-2"
                        >
                          {receptorCandidates.length > 0 && (
                            <option value="">Selecciona un receptor sugerido</option>
                          )}
                          {receptorCandidates.map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>
                              {candidate.nombre}
                              {candidate.cargo ? ` � ${candidate.cargo}` : ""}
                              {candidate.sourceLabel ? ` � ${candidate.sourceLabel}` : ""}
                            </option>
                          ))}
                          <option value={MANUAL_RECEPTOR_OPTION}>
                            Ingresar otro receptor manualmente
                          </option>
                        </select>
                        <p className="mt-1 text-xs text-slate-500">
                          Se sugieren usuarios ya visibles en el documento y pertenecientes al area solicitante.
                        </p>
                      </div>

                      <div>
                        <label htmlFor={`pedido-observaciones-entrega-${pedido.id}`} className="mb-1 block text-sm font-medium text-slate-700">
                          Observaciones de la entrega
                        </label>
                        <input
                          id={`pedido-observaciones-entrega-${pedido.id}`}
                          type="text"
                          value={draft.observaciones}
                          name="bandeja-almacen-notas-pedido-page-input-408"
                          onChange={(event) =>
                            dispatch({
                              type: "setField",
                              field: "observaciones",
                              value: event.target.value,
                            })
                          }
                          className="w-full rounded border border-slate-300 px-3 py-2"
                          placeholder="Observaciones de la entrega"
                        />
                      </div>
                    </div>

                    {usarIngresoManual && (
                      <div>
                        <label htmlFor={`pedido-receptor-manual-${pedido.id}`} className="mb-1 block text-sm font-medium text-slate-700">
                          ID manual del receptor
                        </label>
                        <input
                          id={`pedido-receptor-manual-${pedido.id}`}
                          type="number"
                          min="1"
                          value={draft.receptorManualId}
                          name="bandeja-almacen-notas-pedido-page-input-429"
                          onChange={(event) =>
                            dispatch({
                              type: "setField",
                              field: "receptorManualId",
                              value: event.target.value,
                            })
                          }
                          className="w-full rounded border border-slate-300 px-3 py-2 md:w-64"
                          placeholder="ID del receptor"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          Usa este campo solo si el receptor no aparece en las sugerencias. El backend validara que pertenezca al area solicitante.
                        </p>
                      </div>
                    )}

                    <div className="overflow-x-auto rounded-lg bg-white">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-3 py-2 text-left">Producto</th>
                            <th className="px-3 py-2 text-left">Pendiente</th>
                            <th className="px-3 py-2 text-left">Entregar ahora</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(pedido.detalles || []).map((detalle) => (
                            <tr
                              key={detalle.id}
                              className="border-t border-slate-200"
                            >
                              <td className="px-3 py-2">
                                {detalle.producto?.codigo} - {detalle.producto?.nombre}
                              </td>
                              <td className="px-3 py-2">{detalle.cantidadPendiente}</td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={detalle.cantidadPendiente}
                                  step="0.01"
                                  value={draft.cantidades[detalle.id] ?? ""}
                                  name="bandeja-almacen-notas-pedido-page-input-469"
                                  onChange={(event) =>
                                    dispatch({
                                      type: "setCantidad",
                                      detalleId: detalle.id,
                                      value: event.target.value,
                                    })
                                  }
                                  className="w-32 rounded border border-slate-300 px-3 py-2"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      disabled={loading || submittingId === pedido.id}
                      onClick={() => handleAtender(pedido)}
                      className="rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:bg-emerald-300"
                    >
                      {submittingId === pedido.id
                        ? "Registrando..."
                        : "Atender y generar nota de salida"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {ultimoResultado?.notaSalida && (
        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Ultima nota de salida generada
            </h2>
            {ultimoResultado.pedidoInterno?.id && (
              <Link
                to={`/notas-pedido/${ultimoResultado.pedidoInterno.id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Ver detalle de la nota
              </Link>
            )}
          </div>
          <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            <p>
              <span className="font-medium text-slate-900">Codigo:</span>{" "}
              {ultimoResultado.notaSalida.codigo}
            </p>
            <p>
              <span className="font-medium text-slate-900">Fecha:</span>{" "}
              {formatDate(ultimoResultado.notaSalida.fechaSalida)}
            </p>
            <p>
              <span className="font-medium text-slate-900">Responsable:</span>{" "}
              {ultimoResultado.notaSalida.responsable?.nombre || "-"}
            </p>
            <p>
              <span className="font-medium text-slate-900">Receptor:</span>{" "}
              {ultimoResultado.notaSalida.receptor?.nombre || "-"}
            </p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">Producto</th>
                  <th className="px-3 py-2 text-left">Entregada</th>
                  <th className="px-3 py-2 text-left">Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {(ultimoResultado.notaSalida.detalles || []).map((detalle) => (
                  <tr key={detalle.id} className="border-t border-slate-200">
                    <td className="px-3 py-2">
                      {detalle.producto?.codigo} - {detalle.producto?.nombre}
                    </td>
                    <td className="px-3 py-2">{detalle.cantidadEntregada}</td>
                    <td className="px-3 py-2">{detalle.cantidadPendiente}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BandejaAlmacenNotasPedidoPage;
