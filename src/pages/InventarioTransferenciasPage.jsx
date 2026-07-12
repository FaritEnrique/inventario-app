import { useCallback, useEffect, useMemo, useState } from "react";
import { FileDown, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  canAdjustInventoryEffective,
  canOperateInventoryEffective,
} from "../accessRules";
import { useAuth } from "../context/authContext";
import useAlmacenes from "../hooks/useAlmacenes";
import useInventario from "../hooks/useInventario";
import { esProductoControlIndividual } from "../utils/productoControlInventario";
import { getBienInventarioLabel } from "../utils/bienesInventarioDespacho";
import { normalizeBienInventarioListResponse } from "../utils/bienInventarioTrazabilidad";
import {
  buildTransferPayloadItems,
  getEstadoTransferenciaLabel,
  normalizeStockRows,
  TIPO_SUSTENTO_TRANSFERENCIA_OPTIONS,
  validateTransferDraft,
} from "../utils/transferenciasInventario";

const openBlob = ({ blob }) => {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

const todayInput = () => new Date().toISOString().slice(0, 10);

const InventarioTransferenciasPage = () => {
  const { user } = useAuth();
  const puedeOperar = canOperateInventoryEffective(user);
  const puedeAprobar = canAdjustInventoryEffective(user);
  const { almacenes, obtenerAlmacenes } = useAlmacenes();
  const {
    loading,
    obtenerStock,
    obtenerBienesInventario,
    crearNotaTransferenciaInventario,
    listarNotasTransferenciaInventario,
    obtenerNotaTransferenciaInventario,
    decidirNotaTransferenciaInventario,
    prepararDespachoTransferencia,
    decidirDespachoTransferencia,
    prepararRecepcionTransferencia,
    decidirRecepcionTransferencia,
    obtenerNotaTransferenciaPdfBlob,
    obtenerSustentoNotaTransferenciaBlob,
  } = useInventario();

  const [almacenOrigenId, setAlmacenOrigenId] = useState("");
  const [almacenDestinoId, setAlmacenDestinoId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [tipoSustento, setTipoSustento] = useState("");
  const [sustentoOtro, setSustentoOtro] = useState("");
  const [numeroDocumentoSustento, setNumeroDocumentoSustento] = useState("");
  const [fechaDocumentoSustento, setFechaDocumentoSustento] = useState(todayInput());
  const [documentoSustento, setDocumentoSustento] = useState(null);
  const [observaciones, setObservaciones] = useState("");
  const [stockRows, setStockRows] = useState([]);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [items, setItems] = useState([]);
  const [transferencias, setTransferencias] = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [despachoItems, setDespachoItems] = useState([]);

  const cargarTransferencias = useCallback(async () => {
    try {
      const response = await listarNotasTransferenciaInventario({ page: 1, limit: 50 });
      setTransferencias(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      toast.error(error.message || "No se pudieron cargar las transferencias.");
    }
  }, [listarNotasTransferenciaInventario]);

  const cargarSeleccionada = useCallback(
    async (id) => {
      try {
        const data = await obtenerNotaTransferenciaInventario(id);
        setSeleccionada(data);
        setDespachoItems(
          (data?.detalles || []).map((detalle) => ({
            productoId: detalle.productoId,
            producto: detalle.producto,
            cantidad: Number(detalle.cantidadSolicitada || 0),
            bienInventarioIds: [],
            unidades: [],
            loading: false,
          })),
        );
      } catch (error) {
        toast.error(error.message || "No se pudo cargar la transferencia.");
      }
    },
    [obtenerNotaTransferenciaInventario],
  );

  useEffect(() => {
    obtenerAlmacenes({ estado: "activos" }).catch(() => {});
    cargarTransferencias();
  }, [cargarTransferencias, obtenerAlmacenes]);

  useEffect(() => {
    setItems([]);
    setProductoId("");
    setCantidad("");
    if (!almacenOrigenId) {
      setStockRows([]);
      return;
    }
    obtenerStock({
      almacenId: almacenOrigenId,
      soloConStock: true,
    })
      .then((response) => setStockRows(normalizeStockRows(response)))
      .catch((error) => {
        setStockRows([]);
        toast.error(error.message || "No se pudo consultar el stock del almacén origen.");
      });
  }, [almacenOrigenId, obtenerStock]);

  const productosDisponibles = useMemo(
    () =>
      stockRows
        .map((row) => {
          const almacen = (row.almacenes || []).find(
            (entry) => Number(entry.id) === Number(almacenOrigenId),
          );
          return {
            producto: row.producto,
            disponible: Number(almacen?.cantidadDisponible || 0),
          };
        })
        .filter(
          (row) =>
            row.disponible > 0 &&
            !items.some(
              (item) => Number(item.producto.id) === Number(row.producto.id),
            ),
        ),
    [almacenOrigenId, items, stockRows],
  );

  const productoSeleccionado = productosDisponibles.find(
    (row) => Number(row.producto.id) === Number(productoId),
  );

  const agregarProducto = () => {
    if (!productoSeleccionado) {
      toast.info("Selecciona un producto con disponibilidad.");
      return;
    }
    const value = Number(cantidad || 0);
    if (!(value > 0) || value > productoSeleccionado.disponible) {
      toast.error(
        `La cantidad debe estar entre 1 y ${productoSeleccionado.disponible}.`,
      );
      return;
    }
    setItems((current) => [
      ...current,
      {
        producto: productoSeleccionado.producto,
        cantidadSolicitada: value,
        stockDisponible: productoSeleccionado.disponible,
        observaciones: "",
      },
    ]);
    setProductoId("");
    setCantidad("");
  };

  const limpiarFormulario = () => {
    setMotivo("");
    setTipoSustento("");
    setSustentoOtro("");
    setNumeroDocumentoSustento("");
    setDocumentoSustento(null);
    setObservaciones("");
    setItems([]);
  };

  const crearTransferencia = async (event) => {
    event.preventDefault();
    const validation = validateTransferDraft({
      almacenOrigenId,
      almacenDestinoId,
      motivo,
      tipoSustento,
      sustentoOtro,
      items,
    });
    if (validation) {
      toast.error(validation);
      return;
    }
    try {
      const created = await crearNotaTransferenciaInventario({
        almacenOrigenId: Number(almacenOrigenId),
        almacenDestinoId: Number(almacenDestinoId),
        motivo: motivo.trim(),
        tipoSustento: tipoSustento || undefined,
        sustentoOtro: tipoSustento === "OTRO" ? sustentoOtro.trim() : undefined,
        numeroDocumentoSustento: numeroDocumentoSustento.trim() || undefined,
        fechaDocumentoSustento: tipoSustento
          ? fechaDocumentoSustento
          : undefined,
        documentoSustento,
        observaciones: observaciones.trim() || undefined,
        items: buildTransferPayloadItems(items),
      });
      toast.success(
        `${created.codigo} fue elaborada y enviada a aprobación del almacén solicitante.`,
      );
      limpiarFormulario();
      await cargarTransferencias();
      await cargarSeleccionada(created.id);
    } catch (error) {
      toast.error(error.message || "No se pudo crear la Nota de Transferencia.");
    }
  };

  const decidir = async (accion) => {
    if (!seleccionada) return;
    try {
      await decidirNotaTransferenciaInventario(seleccionada.id, { accion });
      toast.success(
        accion === "APROBAR"
          ? "Nota de Transferencia aprobada y stock reservado."
          : "Nota de Transferencia rechazada.",
      );
      await cargarTransferencias();
      await cargarSeleccionada(seleccionada.id);
    } catch (error) {
      toast.error(error.message || "No se pudo registrar la decisión.");
    }
  };

  const cargarUnidades = async (index) => {
    const line = despachoItems[index];
    setDespachoItems((current) =>
      current.map((item, i) => (i === index ? { ...item, loading: true } : item)),
    );
    try {
      const response = await obtenerBienesInventario({
        productoId: line.productoId,
        almacenId: seleccionada.almacenOrigenId,
        estado: "DISPONIBLE",
        page: 1,
        limit: 500,
      });
      const unidades = normalizeBienInventarioListResponse(response).data;
      setDespachoItems((current) =>
        current.map((item, i) =>
          i === index ? { ...item, loading: false, unidades } : item,
        ),
      );
    } catch (error) {
      setDespachoItems((current) =>
        current.map((item, i) =>
          i === index ? { ...item, loading: false, unidades: [] } : item,
        ),
      );
      toast.error(error.message || "No se pudieron cargar las unidades.");
    }
  };

  const toggleUnidad = (index, id) => {
    setDespachoItems((current) =>
      current.map((item, i) => {
        if (i !== index) return item;
        const selected = new Set(item.bienInventarioIds);
        if (selected.has(id)) selected.delete(id);
        else if (selected.size < item.cantidad) selected.add(id);
        return { ...item, bienInventarioIds: [...selected] };
      }),
    );
  };

  const prepararDespacho = async () => {
    for (const item of despachoItems) {
      if (
        esProductoControlIndividual(item.producto) &&
        item.bienInventarioIds.length !== item.cantidad
      ) {
        toast.error(
          `Selecciona exactamente ${item.cantidad} unidad(es) de ${item.producto.nombre}.`,
        );
        return;
      }
    }
    try {
      await prepararDespachoTransferencia(seleccionada.id, {
        items: despachoItems.map((item) => ({
          productoId: item.productoId,
          bienInventarioIds: item.bienInventarioIds,
        })),
      });
      toast.success("Nota de Salida por transferencia preparada.");
      await cargarSeleccionada(seleccionada.id);
    } catch (error) {
      toast.error(error.message || "No se pudo preparar el despacho.");
    }
  };

  const aprobarDespacho = async (accion) => {
    try {
      await decidirDespachoTransferencia(seleccionada.id, { accion });
      toast.success(
        accion === "APROBAR"
          ? "Despacho aprobado; los bienes quedaron en tránsito."
          : "Nota de Salida rechazada.",
      );
      await cargarTransferencias();
      await cargarSeleccionada(seleccionada.id);
    } catch (error) {
      toast.error(error.message || "No se pudo decidir el despacho.");
    }
  };

  const prepararRecepcion = async () => {
    try {
      await prepararRecepcionTransferencia(seleccionada.id, {});
      toast.success("Nota de Ingreso por transferencia preparada.");
      await cargarSeleccionada(seleccionada.id);
    } catch (error) {
      toast.error(error.message || "No se pudo preparar la recepción.");
    }
  };

  const aprobarRecepcion = async () => {
    try {
      await decidirRecepcionTransferencia(seleccionada.id, { accion: "APROBAR" });
      toast.success("Recepción aprobada; el stock ingresó al almacén destino.");
      await cargarTransferencias();
      await cargarSeleccionada(seleccionada.id);
    } catch (error) {
      toast.error(error.message || "No se pudo aprobar la recepción.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900">
          Notas de Transferencia de Inventarios
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          El almacén destino solicita bienes disponibles de un único almacén origen.
          La salida y el ingreso se documentan por separado.
        </p>
      </header>

      {puedeOperar ? (
        <form onSubmit={crearTransferencia} className="space-y-5 rounded-xl bg-white p-5 shadow-sm">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            Solo pueden agregarse productos con stock disponible. Al aprobar la Nota,
            el sistema vuelve a validar y reserva automáticamente toda la cantidad.
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-medium">Almacén origen *</span>
              <select
                value={almacenOrigenId}
                onChange={(event) => setAlmacenOrigenId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Seleccionar</option>
                {almacenes
                  .filter((almacen) => Number(almacen.id) !== Number(almacenDestinoId))
                  .map((almacen) => (
                    <option key={almacen.id} value={almacen.id}>
                      {almacen.codigo} - {almacen.nombre}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium">Almacén solicitante / destino *</span>
              <select
                value={almacenDestinoId}
                onChange={(event) => setAlmacenDestinoId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Seleccionar</option>
                {almacenes
                  .filter((almacen) => Number(almacen.id) !== Number(almacenOrigenId))
                  .map((almacen) => (
                    <option key={almacen.id} value={almacen.id}>
                      {almacen.codigo} - {almacen.nombre}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr,180px,auto] md:items-end">
            <label>
              <span className="mb-1 block text-sm font-medium">Producto disponible</span>
              <select
                value={productoId}
                onChange={(event) => setProductoId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                disabled={!almacenOrigenId}
              >
                <option value="">Seleccionar</option>
                {productosDisponibles.map((row) => (
                  <option key={row.producto.id} value={row.producto.id}>
                    {row.producto.codigo} - {row.producto.nombre} · Disponible {row.disponible}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium">Cantidad</span>
              <input
                type="number"
                min="0.01"
                max={productoSeleccionado?.disponible || undefined}
                step={
                  esProductoControlIndividual(productoSeleccionado?.producto)
                    ? "1"
                    : "0.01"
                }
                value={cantidad}
                onChange={(event) => setCantidad(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right"
              />
            </label>
            <button
              type="button"
              onClick={agregarProducto}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> Agregar
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-right">Disponible</th>
                  <th className="px-4 py-3 text-right">Solicitado</th>
                  <th className="px-4 py-3 text-center">Quitar</th>
                </tr>
              </thead>
              <tbody>
                {items.length ? (
                  items.map((item) => (
                    <tr key={item.producto.id} className="border-t">
                      <td className="px-4 py-3">
                        {item.producto.codigo} - {item.producto.nombre}
                      </td>
                      <td className="px-4 py-3 text-right">{item.stockDisponible}</td>
                      <td className="px-4 py-3 text-right">{item.cantidadSolicitada}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setItems((current) =>
                              current.filter(
                                (entry) => entry.producto.id !== item.producto.id,
                              ),
                            )
                          }
                          className="rounded p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                      No hay productos agregados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Motivo *</span>
            <textarea
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className="mb-1 block text-sm font-medium">Tipo de sustento</span>
              <select
                value={tipoSustento}
                onChange={(event) => setTipoSustento(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {TIPO_SUSTENTO_TRANSFERENCIA_OPTIONS.map(([value, label]) => (
                  <option key={value || "none"} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium">Número del sustento</span>
              <input
                value={numeroDocumentoSustento}
                onChange={(event) => setNumeroDocumentoSustento(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                disabled={!tipoSustento}
              />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium">Fecha del sustento</span>
              <input
                type="date"
                value={fechaDocumentoSustento}
                onChange={(event) => setFechaDocumentoSustento(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                disabled={!tipoSustento}
              />
            </label>
          </div>
          {tipoSustento === "OTRO" ? (
            <input
              value={sustentoOtro}
              onChange={(event) => setSustentoOtro(event.target.value)}
              placeholder="Especifique el sustento"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          ) : null}
          {tipoSustento ? (
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(event) => setDocumentoSustento(event.target.files?.[0] || null)}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          ) : null}
          <textarea
            value={observaciones}
            onChange={(event) => setObservaciones(event.target.value)}
            rows={2}
            placeholder="Observaciones"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Elaborar Nota de Transferencia
            </button>
          </div>
        </form>
      ) : null}

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Expedientes de transferencia</h2>
            <p className="text-sm text-slate-600">
              Solicitud, salida, tránsito y recepción en un único expediente.
            </p>
          </div>
          <button
            type="button"
            onClick={cargarTransferencias}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" /> Actualizar
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Documento</th>
                <th className="px-4 py-3 text-left">Origen</th>
                <th className="px-4 py-3 text-left">Destino</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Acción</th>
              </tr>
            </thead>
            <tbody>
              {transferencias.length ? (
                transferencias.map((transferencia) => (
                  <tr key={transferencia.id} className="border-t">
                    <td className="px-4 py-3 font-semibold">{transferencia.codigo}</td>
                    <td className="px-4 py-3">{transferencia.almacenOrigen?.nombre}</td>
                    <td className="px-4 py-3">{transferencia.almacenDestino?.nombre}</td>
                    <td className="px-4 py-3">{getEstadoTransferenciaLabel(transferencia.estado)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => cargarSeleccionada(transferencia.id)}
                        className="font-medium text-indigo-700"
                      >
                        Ver expediente
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">Sin transferencias.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {seleccionada ? (
        <section className="space-y-5 rounded-xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{seleccionada.codigo}</h2>
              <p className="text-sm text-slate-600">
                {seleccionada.almacenOrigen?.nombre} → {seleccionada.almacenDestino?.nombre}
              </p>
              <p className="mt-1 text-sm font-medium text-indigo-700">
                {getEstadoTransferenciaLabel(seleccionada.estado)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["EMITIDA", "DESPACHADA", "RECIBIDA"].includes(seleccionada.estado) ? (
                <button
                  type="button"
                  onClick={async () => openBlob(await obtenerNotaTransferenciaPdfBlob(seleccionada.id))}
                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 px-3 py-2 text-sm text-indigo-700"
                >
                  <FileDown className="h-4 w-4" /> PDF
                </button>
              ) : null}
              {seleccionada.urlSustento ? (
                <button
                  type="button"
                  onClick={async () => openBlob(await obtenerSustentoNotaTransferenciaBlob(seleccionada.id))}
                  className="rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-700"
                >
                  Sustento
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(seleccionada.detalles || []).map((detalle) => (
              <div key={detalle.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-semibold">{detalle.producto?.nombre}</p>
                <p>Solicitado: {detalle.cantidadSolicitada}</p>
                <p className="text-slate-500">Disponible al elaborar: {detalle.stockDisponibleSnapshot}</p>
              </div>
            ))}
          </div>

          {seleccionada.estado === "PENDIENTE_APROBACION" && puedeAprobar ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => decidir("APROBAR")} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Aprobar y reservar</button>
              <button type="button" onClick={() => decidir("RECHAZAR")} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Rechazar</button>
            </div>
          ) : null}

          {seleccionada.estado === "EMITIDA" && !seleccionada.notaSalida ? (
            <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-semibold text-amber-950">Preparar Nota de Salida por transferencia</h3>
              {despachoItems.map((item, index) => (
                <div key={item.productoId} className="rounded-lg bg-white p-3">
                  <p className="font-semibold">{item.producto?.nombre} · {item.cantidad}</p>
                  {esProductoControlIndividual(item.producto) ? (
                    <>
                      <button type="button" onClick={() => cargarUnidades(index)} className="mt-2 rounded border border-indigo-300 px-3 py-1 text-sm text-indigo-700">
                        {item.loading ? "Cargando..." : "Seleccionar unidades"}
                      </button>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {item.unidades.map((bien) => (
                          <label key={bien.id} className="flex gap-2 rounded border border-slate-200 p-2 text-sm">
                            <input type="checkbox" checked={item.bienInventarioIds.includes(bien.id)} onChange={() => toggleUnidad(index, bien.id)} />
                            {getBienInventarioLabel(bien)}
                          </label>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              ))}
              <button type="button" onClick={prepararDespacho} className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white">Preparar Nota de Salida</button>
            </div>
          ) : null}

          {seleccionada.estado === "EMITIDA" && seleccionada.notaSalida && puedeAprobar ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => aprobarDespacho("APROBAR")} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Aprobar despacho</button>
              <button type="button" onClick={() => aprobarDespacho("RECHAZAR")} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Rechazar Nota de Salida</button>
            </div>
          ) : null}

          {seleccionada.estado === "DESPACHADA" && !seleccionada.notaIngreso ? (
            <button type="button" onClick={prepararRecepcion} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Preparar Nota de Ingreso por transferencia</button>
          ) : null}

          {seleccionada.estado === "DESPACHADA" && seleccionada.notaIngreso && puedeAprobar ? (
            <button type="button" onClick={aprobarRecepcion} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Aprobar recepción e ingresar stock</button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
};

export default InventarioTransferenciasPage;
