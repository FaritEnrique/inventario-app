import { useCallback, useEffect, useReducer, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { canViewWarehouseTrayEffective } from "../accessRules";
import PedidoInternoEstadoBadge from "../components/PedidoInternoEstadoBadge";
import BienesInventarioDespachoSelector from "../components/inventario/BienesInventarioDespachoSelector";
import SkeletonSection from "../components/ui/skeletons/SkeletonSection";
import { useAuth } from "../context/authContext";
import usePedidosInternos from "../hooks/usePedidosInternos";
import { getModalidadSalidaLabel } from "../utils/prestamosInventario";
import {
  buildAtencionItem,
  buildSeleccionInicialBienesDespacho,
  esProductoControlIndividual,
  getMaximoSeleccionBienesDespacho,
  normalizarLineasBienesDespacho,
  toggleBienDespacho,
} from "../utils/bienesInventarioDespacho";

const initialDraft = {
  pedidoId: null,
  receptorSeleccion: "",
  observaciones: "",
  cantidades: {},
  bienesSeleccionados: {},
};

const reducer = (state, action) => {
  switch (action.type) {
    case "open": {
      const cantidades = {};
      (action.pedido?.detalles || []).forEach((detalle) => {
        cantidades[detalle.id] = detalle.cantidadPendiente || 0;
      });
      Object.entries(action.bienesSeleccionados || {}).forEach(
        ([detalleId, ids]) => {
          cantidades[detalleId] = Array.isArray(ids) ? ids.length : 0;
        },
      );

      return {
        pedidoId: action.pedido?.id || null,
        receptorSeleccion: action.receptorSeleccion || "",
        observaciones: "",
        cantidades,
        bienesSeleccionados: action.bienesSeleccionados || {},
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
    case "setBienes":
      return {
        ...state,
        bienesSeleccionados: {
          ...state.bienesSeleccionados,
          [action.detalleId]: action.value,
        },
        cantidades: {
          ...state.cantidades,
          [action.detalleId]: action.value.length,
        },
      };
    case "reset":
      return initialDraft;
    default:
      return state;
  }
};

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

const BandejaAlmacenNotasPedidoPage = () => {
  const { user } = useAuth();
  const {
    loading,
    obtenerBandejaAlmacen,
    obtenerReceptoresPedido,
    obtenerBienesDespachoPedido,
    atenderPedido,
  } = usePedidosInternos();
  const [pedidos, setPedidos] = useState([]);
  const [receptoresByPedido, setReceptoresByPedido] = useState({});
  const [loadingReceptoresId, setLoadingReceptoresId] = useState(null);
  const [bienesDespachoByPedido, setBienesDespachoByPedido] = useState({});
  const [loadingBienesId, setLoadingBienesId] = useState(null);
  const [draft, dispatch] = useReducer(reducer, initialDraft);
  const [ultimoResultado, setUltimoResultado] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);

  const canUseWarehouseTray = canViewWarehouseTrayEffective(user);
  const isInitialLoading = loading && pedidos.length === 0;

  const cargarBandeja = useCallback(async () => {
    try {
      const response = await obtenerBandejaAlmacen();
      setPedidos(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      toast.error(error.message || "No se pudo cargar la bandeja de almacen.");
      setPedidos([]);
    }
  }, [obtenerBandejaAlmacen]);

  useEffect(() => {
    if (canUseWarehouseTray) {
      cargarBandeja();
    }
  }, [canUseWarehouseTray, cargarBandeja]);

  const handleOpenAtencion = async (pedido) => {
    const receptoresCargados = receptoresByPedido[pedido.id] || null;
    const bienesCargados = bienesDespachoByPedido[pedido.id] || null;

    dispatch({
      type: "open",
      pedido,
      receptorSeleccion:
        receptoresCargados?.length === 1 ? String(receptoresCargados[0].id) : "",
      bienesSeleccionados: bienesCargados
        ? buildSeleccionInicialBienesDespacho(bienesCargados)
        : {},
    });

    if (!receptoresCargados) {
      try {
        setLoadingReceptoresId(pedido.id);
        const response = await obtenerReceptoresPedido(pedido.id);
        const receptores = Array.isArray(response?.data) ? response.data : [];
        setReceptoresByPedido((current) => ({
          ...current,
          [pedido.id]: receptores,
        }));
        if (receptores.length === 1) {
          dispatch({
            type: "setField",
            field: "receptorSeleccion",
            value: String(receptores[0].id),
          });
        }
      } catch (error) {
        toast.error(
          error.message ||
            "No se pudo cargar la lista de receptores del area.",
        );
        setReceptoresByPedido((current) => ({
          ...current,
          [pedido.id]: [],
        }));
      } finally {
        setLoadingReceptoresId(null);
      }
    }

    try {
      setLoadingBienesId(pedido.id);
      const response = await obtenerBienesDespachoPedido(pedido.id);
      const lineas = normalizarLineasBienesDespacho(response);
      setBienesDespachoByPedido((current) => ({
        ...current,
        [pedido.id]: lineas,
      }));
      const seleccionInicial = buildSeleccionInicialBienesDespacho(lineas);
      Object.entries(seleccionInicial).forEach(([detalleId, ids]) => {
        dispatch({ type: "setBienes", detalleId, value: ids });
      });
    } catch (error) {
      toast.error(
        error.message || "No se pudieron cargar las unidades para despacho.",
      );
      setBienesDespachoByPedido((current) => ({
        ...current,
        [pedido.id]: {},
      }));
    } finally {
      setLoadingBienesId(null);
    }
  };

  const handleToggleBien = (detalle, linea, bienId) => {
    const current = draft.bienesSeleccionados[detalle.id] || [];
    const next = toggleBienDespacho({
      seleccion: current,
      bienId,
      maximo: getMaximoSeleccionBienesDespacho({
        linea,
        cantidadPendiente: detalle.cantidadPendiente,
      }),
    });
    dispatch({ type: "setBienes", detalleId: detalle.id, value: next });
  };

  const handleAtender = async (pedido) => {
    const receptorIdValue = draft.receptorSeleccion;

    if (!receptorIdValue) {
      toast.error(
        "Selecciona el receptor del area antes de registrar la salida.",
      );
      return;
    }

    let items;
    try {
      items = (pedido.detalles || [])
        .map((detalle) =>
          buildAtencionItem({
            detalle,
            cantidad: draft.cantidades[detalle.id],
            bienInventarioIds: draft.bienesSeleccionados[detalle.id] || [],
          }),
        )
        .filter(
          (detalle) =>
            Number.isFinite(detalle.cantidadEntregada) &&
            detalle.cantidadEntregada > 0,
        );
    } catch (error) {
      toast.error(error.message);
      return;
    }

    if (items.length === 0) {
      toast.error("Debes indicar al menos una cantidad a entregar.");
      return;
    }

    for (const item of items) {
      const detalle = pedido.detalles.find(
        (linea) => linea.id === item.pedidoInternoDetalleId,
      );
      if (item.cantidadEntregada > Number(detalle?.cantidadPendiente || 0)) {
        toast.error(
          "No puedes entregar mas que el saldo pendiente de una linea.",
        );
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
      setBienesDespachoByPedido((current) => {
        const next = { ...current };
        delete next[pedido.id];
        return next;
      });
      toast.success(
        `La nota de pedido ${pedido.codigo} fue atendida y genero su nota de salida.`,
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
          <h1 className="text-2xl font-semibold text-emerald-900">
            Bandeja de almacen no disponible
          </h1>
          <p className="mt-2 text-sm text-emerald-800">
            Esta vista esta reservada para usuarios de almacen o inventario.
            Desde aqui se registran las entregas reales y se genera la nota de
            salida.
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
          <h1 className="text-3xl font-semibold text-slate-900">
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

      {isInitialLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonSection key={index} rows={5} />
          ))}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-slate-500">
            No hay notas aprobadas pendientes de atencion.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => {
            const abierta = draft.pedidoId === pedido.id;
            const receptorCandidates = receptoresByPedido[pedido.id] || [];
            const receptoresCargando = loadingReceptoresId === pedido.id;
            const bienesCargando = loadingBienesId === pedido.id;
            const bienesLineas = bienesDespachoByPedido[pedido.id] || {};
            const tieneReservaVigente =
              Boolean(pedido.resumen?.tieneReservaVigente) ||
              (pedido.detalles || []).some(
                (detalle) => (detalle.reservasActivas || []).length > 0,
              );

            return (
              <div key={pedido.id} className="rounded-lg bg-white p-4 shadow">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-slate-900">
                        {pedido.codigo}
                      </h2>
                      <PedidoInternoEstadoBadge
                        estadoFlujo={pedido.estadoFlujo}
                      />
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        pedido.modalidadSalida === "TEMPORAL"
                          ? "bg-violet-100 text-violet-800"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {getModalidadSalidaLabel(pedido.modalidadSalida)}
                      </span>
                    </div>
                    <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                      <p>
                        <span className="font-medium text-slate-800">
                          Area:
                        </span>{" "}
                        {pedido.areaSolicitante?.nombre || "-"}
                      </p>
                      <p>
                        <span className="font-medium text-slate-800">
                          Solicitante:
                        </span>{" "}
                        {pedido.solicitante?.nombre || "-"}
                      </p>
                      <p>
                        <span className="font-medium text-slate-800">
                          Fecha:
                        </span>{" "}
                        {formatDate(pedido.fechaPedido)}
                      </p>
                      <p>
                        <span className="font-medium text-slate-800">
                          Almacen:
                        </span>{" "}
                        {pedido.almacen?.codigo || "-"}
                      </p>
                      {pedido.modalidadSalida === "TEMPORAL" ? (
                        <p className="md:col-span-2 rounded bg-violet-50 px-3 py-2 text-violet-800">
                          <strong>Préstamo temporal.</strong> Devolución prevista: {formatDate(pedido.fechaPrevistaDevolucion)}. {pedido.finalidadPrestamo || ""}
                        </p>
                      ) : null}
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
                      onClick={() => {
                        if (abierta) {
                          dispatch({ type: "reset" });
                          return;
                        }
                        handleOpenAtencion(pedido);
                      }}
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
                        <th className="px-3 py-2 text-left">Reserva vigente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(pedido.detalles || []).map((detalle) => (
                        <tr
                          key={detalle.id}
                          className="border-t border-slate-200"
                        >
                          <td className="px-3 py-2">
                            {detalle.producto?.codigo} -{" "}
                            {detalle.producto?.nombre}
                          </td>
                          <td className="px-3 py-2">
                            {detalle.cantidadSolicitada}
                          </td>
                          <td className="px-3 py-2">
                            {detalle.cantidadAtendida}
                          </td>
                          <td className="px-3 py-2">
                            {detalle.cantidadPendiente}
                          </td>
                          <td className="px-3 py-2">
                            {(detalle.reservasActivas || []).length === 0 ? (
                              <span className="text-slate-500">
                                Sin reserva vigente
                              </span>
                            ) : (
                              <div className="space-y-1 text-xs">
                                {detalle.reservasActivas.map((reserva) => (
                                  <div
                                    key={reserva.id}
                                    className="rounded bg-blue-50 px-2 py-1 text-blue-900"
                                  >
                                    Reservado: {reserva.cantidadPendiente} ·
                                    vence {formatDate(reserva.expiresAt)}
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
                    <div
                      className={`rounded border px-3 py-2 text-sm ${
                        tieneReservaVigente
                          ? "border-blue-200 bg-blue-50 text-blue-900"
                          : "border-amber-200 bg-amber-50 text-amber-900"
                      }`}
                    >
                      {tieneReservaVigente
                        ? "La salida real se registrara solo por las cantidades entregadas ahora. La reserva vigente se consumira con esta atencion."
                        : "Esta nota no tiene reserva vigente. Puede atenderse si el stock disponible actual alcanza para la entrega."}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`pedido-receptor-${pedido.id}`}
                          className="mb-1 block text-sm font-medium text-slate-700"
                        >
                          Receptor del area solicitante
                        </label>
                        <select
                          id={`pedido-receptor-${pedido.id}`}
                          value={draft.receptorSeleccion}
                          name="bandeja-almacen-notas-pedido-page-select-374"
                          disabled={receptoresCargando || receptorCandidates.length === 0}
                          onChange={(event) =>
                            dispatch({
                              type: "setField",
                              field: "receptorSeleccion",
                              value: event.target.value,
                            })
                          }
                          className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                        >
                          <option value="">
                            {receptoresCargando
                              ? "Cargando receptores..."
                              : receptorCandidates.length === 0
                                ? "Sin receptores activos en el area"
                                : "Selecciona quien recepcionara"}
                          </option>
                          {receptorCandidates.map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>
                              {candidate.nombre}
                              {candidate.cargo ? ` · ${candidate.cargo}` : ""}
                              {candidate.email ? ` · ${candidate.email}` : ""}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-slate-500">
                          Se listan usuarios activos del area solicitante. Esta
                          persona quedara como receptor en la nota de salida.
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor={`pedido-observaciones-entrega-${pedido.id}`}
                          className="mb-1 block text-sm font-medium text-slate-700"
                        >
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

                    <div className="overflow-x-auto rounded-lg bg-white">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-3 py-2 text-left">Producto</th>
                            <th className="px-3 py-2 text-left">Pendiente</th>
                            <th className="px-3 py-2 text-left">
                              Entregar ahora
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(pedido.detalles || []).map((detalle) => (
                            <tr
                              key={detalle.id}
                              className="border-t border-slate-200"
                            >
                              <td className="px-3 py-2">
                                {detalle.producto?.codigo} -{" "}
                                {detalle.producto?.nombre}
                              </td>
                              <td className="px-3 py-2">
                                {detalle.cantidadPendiente}
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={detalle.cantidadPendiente}
                                  step={
                                    esProductoControlIndividual(detalle.producto)
                                      ? "1"
                                      : "0.01"
                                  }
                                  value={draft.cantidades[detalle.id] ?? ""}
                                  name="bandeja-almacen-notas-pedido-page-input-469"
                                  readOnly={
                                    esProductoControlIndividual(detalle.producto)
                                  }
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

                    {(pedido.detalles || [])
                      .filter((detalle) =>
                        esProductoControlIndividual(detalle.producto),
                      )
                      .map((detalle) => (
                        <div
                          key={`bienes-${detalle.id}`}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <h3 className="font-semibold text-slate-900">
                            Unidades a entregar · {detalle.producto?.codigo} -{" "}
                            {detalle.producto?.nombre}
                          </h3>
                          <p className="mb-3 mt-1 text-xs text-slate-600">
                            Selecciona las unidades físicas que Almacén entregará.
                            La reserva solo cubre cantidad y nunca preasigna una
                            serie.
                          </p>
                          {bienesCargando ? (
                            <p className="text-sm text-slate-500">
                              Cargando unidades...
                            </p>
                          ) : (
                            <BienesInventarioDespachoSelector
                              linea={bienesLineas[detalle.id]}
                              seleccion={
                                draft.bienesSeleccionados[detalle.id] || []
                              }
                              maximo={getMaximoSeleccionBienesDespacho({
                                linea: bienesLineas[detalle.id],
                                cantidadPendiente: detalle.cantidadPendiente,
                              })}
                              onToggle={(bienId) =>
                                handleToggleBien(
                                  detalle,
                                  bienesLineas[detalle.id],
                                  bienId,
                                )
                              }
                              disabled={submittingId === pedido.id}
                            />
                          )}
                        </div>
                      ))}

                    <button
                      type="button"
                      disabled={
                        loading ||
                        submittingId === pedido.id ||
                        receptoresCargando ||
                        receptorCandidates.length === 0 ||
                        bienesCargando
                      }
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
                      {(detalle.bienesInventario || []).length > 0 ? (
                        <div className="mt-1 space-y-1 text-xs text-slate-500">
                          {detalle.bienesInventario.map((bien) => (
                            <div key={bien.id}>
                              {bien.numeroSerie || "Sin serie"} ·{" "}
                              {bien.codigoPatrimonial || "Sin patrimonial"}
                            </div>
                          ))}
                        </div>
                      ) : null}
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
