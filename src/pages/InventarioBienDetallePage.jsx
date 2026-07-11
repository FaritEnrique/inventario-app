import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileInput,
  FileOutput,
  PackageCheck,
  RotateCcw,
  ShieldAlert,
  UserRound,
  Warehouse,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  canAdjustInventoryEffective,
  canOperateInventoryEffective,
} from "../accessRules";
import BienInventarioNovedadModal from "../components/inventario/BienInventarioNovedadModal";
import InventarioDocumentoDetalleSkeleton from "../components/ui/skeletons/InventarioDocumentoDetalleSkeleton";
import { useAuth } from "../context/authContext";
import useAlmacenes from "../hooks/useAlmacenes";
import useInventario from "../hooks/useInventario";
import {
  BIEN_INVENTARIO_NOVEDAD_TIPOS,
  CAUSALES_BAJA_BIEN,
  getBienInventarioAccionesDisponibles,
} from "../utils/bienInventarioNovedades";
import {
  getBienInventarioDocumentPath,
  getBienInventarioEstadoMeta,
  getBienInventarioIdentificador,
} from "../utils/bienInventarioTrazabilidad";

const dateTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatDateTime = (value) => {
  if (!value) return "-";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? dateTimeFormatter.format(timestamp)
    : "-";
};

const getCausalBajaLabel = (value) =>
  CAUSALES_BAJA_BIEN.find((item) => item.value === value)?.label || value || "-";

const DetailItem = ({ label, value, children }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
      {label}
    </dt>
    <dd className="mt-1 text-sm font-medium text-gray-900">
      {children || value || "-"}
    </dd>
  </div>
);

const SectionCard = ({ title, icon: Icon, children }) => {
  const iconNode = Icon ? <Icon className="h-5 w-5 text-indigo-600" /> : null;

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
        {iconNode}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
};

const ActionButton = ({ icon: Icon, label, className, onClick }) => {
  const iconNode = Icon ? <Icon className="h-4 w-4" /> : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition ${className}`}
    >
      {iconNode}
      {label}
    </button>
  );
};

const getUbicacionActualLabel = (bien) => {
  const ubicacion = bien?.ubicacionActual;
  if (ubicacion?.tipo === "AREA") {
    return ubicacion.area?.nombre || "Área usuaria";
  }
  if (ubicacion?.tipo === "BAJA") {
    return "Fuera del ciclo operativo";
  }
  return ubicacion?.almacen?.nombre || bien?.almacen?.nombre || "-";
};

const getEventoUbicacion = (evento) => {
  if (evento.tipo === "TRANSFERENCIA") {
    return `${evento.almacenOrigen?.nombre || "Almacén origen"} → ${
      evento.almacenDestino?.nombre || "Almacén destino"
    }`;
  }
  if (evento.tipo === "DEVOLUCION") {
    return `${evento.areaOrigen?.nombre || "Área usuaria"} → ${
      evento.almacenDestino?.nombre || "Almacén"
    }`;
  }
  if (evento.tipo === "SALIDA") {
    return `${evento.almacenOrigen?.nombre || "Almacén"} → ${
      evento.areaDestino?.nombre || "Área usuaria"
    }`;
  }
  if (evento.tipo === "INGRESO") {
    return evento.almacenDestino?.nombre || null;
  }
  if (evento.tipo === "BAJA") {
    return evento.areaOrigen?.nombre || evento.almacenOrigen?.nombre || null;
  }
  return null;
};

const InventarioBienDetallePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const {
    loading,
    obtenerBienInventarioPorId,
    registrarBajaBienInventario,
    registrarDevolucionBienInventario,
    registrarTransferenciaBienInventario,
  } = useInventario();
  const { almacenes, obtenerAlmacenes } = useAlmacenes();
  const [bien, setBien] = useState(null);
  const [novedadTipo, setNovedadTipo] = useState(null);

  const cargarDetalle = useCallback(async () => {
    try {
      const data = await obtenerBienInventarioPorId(id);
      setBien(data);
      return data;
    } catch (error) {
      toast.error(
        error.message || "No se pudo obtener la trazabilidad del bien.",
      );
      setBien(null);
      return null;
    }
  }, [id, obtenerBienInventarioPorId]);

  useEffect(() => {
    cargarDetalle();
    obtenerAlmacenes({ estado: "activos" }).catch(() => {});
  }, [cargarDetalle, obtenerAlmacenes]);

  const accionesDisponibles = useMemo(
    () =>
      getBienInventarioAccionesDisponibles({
        estado: bien?.estado,
        puedeOperar: canOperateInventoryEffective(user),
        puedeDarBaja: canAdjustInventoryEffective(user),
      }),
    [bien?.estado, user],
  );

  const handleRegistrarNovedad = async (tipo, payload) => {
    const operations = {
      [BIEN_INVENTARIO_NOVEDAD_TIPOS.DEVOLUCION]: {
        execute: registrarDevolucionBienInventario,
        success: "Devolución registrada. La unidad vuelve a estar disponible.",
      },
      [BIEN_INVENTARIO_NOVEDAD_TIPOS.TRANSFERENCIA]: {
        execute: registrarTransferenciaBienInventario,
        success: "Transferencia registrada correctamente.",
      },
      [BIEN_INVENTARIO_NOVEDAD_TIPOS.BAJA]: {
        execute: registrarBajaBienInventario,
        success: "Baja registrada. La unidad salió del ciclo operativo.",
      },
    };
    const operation = operations[tipo];

    if (!operation) {
      throw new Error("La novedad seleccionada no es válida.");
    }

    try {
      await operation.execute(id, payload);
      setNovedadTipo(null);
      toast.success(operation.success);
      await cargarDetalle();
    } catch (error) {
      toast.error(error.message || "No se pudo registrar la novedad.");
      throw error;
    }
  };

  if (loading && !bien) {
    return <InventarioDocumentoDetalleSkeleton />;
  }

  if (!bien) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <h1 className="text-xl font-semibold text-amber-900">
            Bien individualizado no disponible
          </h1>
          <p className="mt-2 text-sm text-amber-800">
            No se pudo encontrar la unidad solicitada o no tienes acceso a ella.
          </p>
          <Link
            to="/modulo-almacen/bienes-individualizados"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a la consulta
          </Link>
        </div>
      </div>
    );
  }

  const estadoMeta = getBienInventarioEstadoMeta(bien.estado);
  const notaSalida = bien.notaSalidaDetalle?.notaSalida || bien.notaSalida;
  const pedido = notaSalida?.pedidoInterno;
  const trazabilidad = Array.isArray(bien.trazabilidad)
    ? bien.trazabilidad
    : [];

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-6">
        <Link
          to="/modulo-almacen/bienes-individualizados"
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a bienes individualizados
        </Link>

        <div className="mt-4 rounded-2xl bg-gradient-to-r from-indigo-700 to-indigo-900 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
                Unidad física #{bien.id}
              </p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                {getBienInventarioIdentificador(bien)}
              </h1>
              <p className="mt-2 text-sm text-indigo-100">
                {bien.producto?.codigo} - {bien.producto?.nombre}
              </p>
            </div>
            <span
              className={`inline-flex self-start rounded-full border px-3 py-1.5 text-sm font-semibold ${estadoMeta.className}`}
            >
              {estadoMeta.label}
            </span>
          </div>

          {accionesDisponibles.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-indigo-500/40 pt-4">
              {accionesDisponibles.includes("DEVOLUCION") && (
                <ActionButton
                  icon={RotateCcw}
                  label="Registrar devolución"
                  onClick={() => setNovedadTipo("DEVOLUCION")}
                  className="bg-emerald-500 text-white hover:bg-emerald-400"
                />
              )}
              {accionesDisponibles.includes("TRANSFERENCIA") && (
                <ActionButton
                  icon={ArrowLeftRight}
                  label="Transferir almacén"
                  onClick={() => setNovedadTipo("TRANSFERENCIA")}
                  className="bg-white text-indigo-800 hover:bg-indigo-50"
                />
              )}
              {accionesDisponibles.includes("BAJA") && (
                <ActionButton
                  icon={ShieldAlert}
                  label="Registrar baja"
                  onClick={() => setNovedadTipo("BAJA")}
                  className="bg-red-500 text-white hover:bg-red-400"
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Identificación y ubicación" icon={PackageCheck}>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Número de serie" value={bien.numeroSerie} />
            <DetailItem
              label="Código patrimonial"
              value={bien.codigoPatrimonial || "Pendiente de asignación"}
            />
            <DetailItem label="Producto">
              <span>{bien.producto?.codigo} - {bien.producto?.nombre}</span>
            </DetailItem>
            <DetailItem label="Tipo de producto" value={bien.producto?.tipoProducto?.nombre} />
            <DetailItem label="Marca" value={bien.producto?.marca?.nombre} />
            <DetailItem label="Ubicación actual" value={getUbicacionActualLabel(bien)} />
            <DetailItem label="Almacén registrado">
              <span>{bien.almacen?.codigo} - {bien.almacen?.nombre}</span>
            </DetailItem>
            <DetailItem label="Fecha de ingreso" value={formatDateTime(bien.fechaIngreso)} />
          </dl>
          {bien.observaciones && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <strong>Observaciones:</strong> {bien.observaciones}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Origen del bien" icon={FileInput}>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Nota de ingreso">
              {bien.notaIngreso?.id ? (
                <Link to={`/modulo-almacen/notas-ingreso/${bien.notaIngreso.id}`} className="text-indigo-700 hover:underline">
                  {bien.notaIngreso.codigo}
                </Link>
              ) : "-"}
            </DetailItem>
            <DetailItem label="Recepción" value={formatDateTime(bien.notaIngreso?.fechaRecepcion)} />
            <DetailItem label="Orden de compra">
              {bien.notaIngreso?.ordenCompra?.id ? (
                <Link to={`/ordenes-compra/${bien.notaIngreso.ordenCompra.id}`} className="text-indigo-700 hover:underline">
                  {bien.notaIngreso.ordenCompra.codigo}
                </Link>
              ) : "-"}
            </DetailItem>
            <DetailItem label="Proveedor" value={bien.notaIngreso?.ordenCompra?.proveedor?.razonSocial} />
            <DetailItem label="Movimiento de ingreso" value={bien.movimientoIngreso?.numeroOperacion} />
            <DetailItem label="Responsable" value={bien.notaIngreso?.responsable?.nombre} />
          </dl>
        </SectionCard>

        <SectionCard title="Salida y custodia vigente" icon={FileOutput}>
          {notaSalida ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Nota de salida">
                <Link to={`/modulo-almacen/notas-salida/${notaSalida.id}`} className="text-indigo-700 hover:underline">
                  {notaSalida.codigo}
                </Link>
              </DetailItem>
              <DetailItem label="Fecha de salida" value={formatDateTime(notaSalida.fechaSalida)} />
              <DetailItem label="Pedido interno">
                {pedido?.id ? (
                  <Link to={`/notas-pedido/${pedido.id}`} className="text-indigo-700 hover:underline">
                    {pedido.codigo}
                  </Link>
                ) : "-"}
              </DetailItem>
              <DetailItem label="Área de destino" value={notaSalida.areaDestino?.nombre} />
              <DetailItem label="Receptor" value={notaSalida.receptor?.nombre} />
              <DetailItem label="Movimiento de salida" value={bien.movimientoSalida?.numeroOperacion} />
            </dl>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              No existe una salida vigente. Las entregas anteriores, devoluciones y demás novedades permanecen conservadas en la línea de trazabilidad.
            </div>
          )}
        </SectionCard>

        <SectionCard title="Resumen operativo" icon={ClipboardCheck}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex gap-3 rounded-lg bg-gray-50 p-3">
              <Warehouse className="mt-0.5 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Ubicación actual</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{getUbicacionActualLabel(bien)}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg bg-gray-50 p-3">
              <Building2 className="mt-0.5 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Estado de custodia</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{estadoMeta.label}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg bg-gray-50 p-3">
              <UserRound className="mt-0.5 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Último responsable</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{bien.ultimoEvento?.actor?.nombre || notaSalida?.receptor?.nombre || "-"}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg bg-gray-50 p-3">
              <CalendarClock className="mt-0.5 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Último evento</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{formatDateTime(bien.ultimoEvento?.fechaEvento || bien.updatedAt)}</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <section className="mt-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Línea de trazabilidad</h2>
        <p className="mt-1 text-sm text-gray-600">
          Historial inmutable de ingresos, salidas, devoluciones, transferencias y bajas.
        </p>

        <ol className="mt-6 space-y-0">
          {trazabilidad.map((evento, index) => {
            const documentPath = getBienInventarioDocumentPath(evento.documento);
            const isLast = index === trazabilidad.length - 1;
            const ubicacion = getEventoUbicacion(evento);

            return (
              <li key={evento.id || `${evento.tipo}-${evento.fecha}-${index}`} className="relative flex gap-4">
                {!isLast && <span className="absolute left-[13px] top-7 h-full w-px bg-indigo-200" />}
                <span className="relative z-10 mt-1 h-7 w-7 flex-none rounded-full border-4 border-white bg-indigo-600 shadow" />
                <div className="min-w-0 pb-7">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <h3 className="font-semibold text-gray-900">{evento.titulo}</h3>
                    <span className="text-xs text-gray-500">{formatDateTime(evento.fecha)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{evento.descripcion}</p>
                  <div className="mt-2 grid gap-x-6 gap-y-1 text-xs text-gray-600 sm:grid-cols-2">
                    {ubicacion && <span><strong>Ubicación:</strong> {ubicacion}</span>}
                    {evento.actor?.nombre && <span><strong>Registrado por:</strong> {evento.actor.nombre}</span>}
                    {evento.causalBaja && <span><strong>Causal:</strong> {getCausalBajaLabel(evento.causalBaja)}</span>}
                    {evento.referenciaCodigo && <span><strong>Sustento:</strong> {evento.referenciaTipo} {evento.referenciaCodigo}</span>}
                    {evento.observaciones && <span className="sm:col-span-2"><strong>Observaciones:</strong> {evento.observaciones}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {documentPath && (
                      <Link to={documentPath} className="font-semibold text-indigo-700 hover:underline">
                        {evento.documento.codigo}
                      </Link>
                    )}
                    {evento.movimiento?.id && (
                      <Link to={`/modulo-almacen/movimientos?movimientoId=${evento.movimiento.id}`} className="font-semibold text-indigo-700 hover:underline">
                        {evento.movimiento.numeroOperacion}
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-relaxed text-blue-900">
        Las reservas siguen siendo temporales y cuantitativas: nunca asignan una serie. Las novedades de esta pantalla modifican una unidad física únicamente mediante una operación transaccional y trazable.
      </div>

      <BienInventarioNovedadModal
        isOpen={Boolean(novedadTipo)}
        tipo={novedadTipo}
        bien={bien}
        almacenes={almacenes}
        loading={loading}
        onClose={() => setNovedadTipo(null)}
        onSubmit={handleRegistrarNovedad}
      />
    </div>
  );
};

export default InventarioBienDetallePage;
