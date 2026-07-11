import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileInput,
  FileOutput,
  PackageCheck,
  UserRound,
  Warehouse,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import InventarioDocumentoDetalleSkeleton from "../components/ui/skeletons/InventarioDocumentoDetalleSkeleton";
import useInventario from "../hooks/useInventario";
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

const InventarioBienDetallePage = () => {
  const { id } = useParams();
  const { loading, obtenerBienInventarioPorId } = useInventario();
  const [bien, setBien] = useState(null);

  const cargarDetalle = useCallback(async () => {
    try {
      const data = await obtenerBienInventarioPorId(id);
      setBien(data);
    } catch (error) {
      toast.error(
        error.message || "No se pudo obtener la trazabilidad del bien.",
      );
      setBien(null);
    }
  }, [id, obtenerBienInventarioPorId]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

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

        <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-indigo-700 to-indigo-900 p-6 text-white shadow-lg sm:flex-row sm:items-start sm:justify-between">
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
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Identificación y ubicación" icon={PackageCheck}>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Número de serie" value={bien.numeroSerie} />
            <DetailItem
              label="Código patrimonial"
              value={bien.codigoPatrimonial}
            />
            <DetailItem label="Producto">
              <span>
                {bien.producto?.codigo} - {bien.producto?.nombre}
              </span>
            </DetailItem>
            <DetailItem
              label="Tipo de producto"
              value={bien.producto?.tipoProducto?.nombre}
            />
            <DetailItem label="Marca" value={bien.producto?.marca?.nombre} />
            <DetailItem label="Almacén registrado">
              <span>
                {bien.almacen?.codigo} - {bien.almacen?.nombre}
              </span>
            </DetailItem>
            <DetailItem
              label="Fecha de ingreso"
              value={formatDateTime(bien.fechaIngreso)}
            />
            <DetailItem
              label="Fecha de salida"
              value={formatDateTime(bien.fechaSalida)}
            />
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
                <Link
                  to={`/modulo-almacen/notas-ingreso/${bien.notaIngreso.id}`}
                  className="text-indigo-700 hover:underline"
                >
                  {bien.notaIngreso.codigo}
                </Link>
              ) : (
                "-"
              )}
            </DetailItem>
            <DetailItem
              label="Recepción"
              value={formatDateTime(bien.notaIngreso?.fechaRecepcion)}
            />
            <DetailItem label="Orden de compra">
              {bien.notaIngreso?.ordenCompra?.id ? (
                <Link
                  to={`/ordenes-compra/${bien.notaIngreso.ordenCompra.id}`}
                  className="text-indigo-700 hover:underline"
                >
                  {bien.notaIngreso.ordenCompra.codigo}
                </Link>
              ) : (
                "-"
              )}
            </DetailItem>
            <DetailItem
              label="Proveedor"
              value={bien.notaIngreso?.ordenCompra?.proveedor?.razonSocial}
            />
            <DetailItem
              label="Movimiento de ingreso"
              value={bien.movimientoIngreso?.numeroOperacion}
            />
            <DetailItem
              label="Responsable"
              value={bien.notaIngreso?.responsable?.nombre}
            />
          </dl>
        </SectionCard>

        <SectionCard title="Salida y destino" icon={FileOutput}>
          {notaSalida ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Nota de salida">
                <Link
                  to={`/modulo-almacen/notas-salida/${notaSalida.id}`}
                  className="text-indigo-700 hover:underline"
                >
                  {notaSalida.codigo}
                </Link>
              </DetailItem>
              <DetailItem
                label="Fecha de salida"
                value={formatDateTime(notaSalida.fechaSalida)}
              />
              <DetailItem label="Pedido interno">
                {pedido?.id ? (
                  <Link
                    to={`/notas-pedido/${pedido.id}`}
                    className="text-indigo-700 hover:underline"
                  >
                    {pedido.codigo}
                  </Link>
                ) : (
                  "-"
                )}
              </DetailItem>
              <DetailItem
                label="Área de destino"
                value={notaSalida.areaDestino?.nombre}
              />
              <DetailItem
                label="Receptor"
                value={notaSalida.receptor?.nombre}
              />
              <DetailItem
                label="Movimiento de salida"
                value={bien.movimientoSalida?.numeroOperacion}
              />
            </dl>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Esta unidad no registra salida. Permanece físicamente en el almacén
              indicado mientras su estado sea disponible.
            </div>
          )}
        </SectionCard>

        <SectionCard title="Resumen operativo" icon={ClipboardCheck}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex gap-3 rounded-lg bg-gray-50 p-3">
              <Warehouse className="mt-0.5 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Almacén
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {bien.almacen?.nombre || "-"}
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg bg-gray-50 p-3">
              <Building2 className="mt-0.5 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Destino
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {notaSalida?.areaDestino?.nombre || "Sin entrega"}
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg bg-gray-50 p-3">
              <UserRound className="mt-0.5 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Receptor
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {notaSalida?.receptor?.nombre || "-"}
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg bg-gray-50 p-3">
              <CalendarClock className="mt-0.5 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Última actualización
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {formatDateTime(bien.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <section className="mt-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Línea de trazabilidad
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Secuencia documental y física de esta unidad individualizada.
        </p>

        <ol className="mt-6 space-y-0">
          {trazabilidad.map((evento, index) => {
            const documentPath = getBienInventarioDocumentPath(evento.documento);
            const isLast = index === trazabilidad.length - 1;

            return (
              <li key={`${evento.tipo}-${evento.fecha}`} className="relative flex gap-4">
                {!isLast && (
                  <span className="absolute left-[13px] top-7 h-full w-px bg-indigo-200" />
                )}
                <span className="relative z-10 mt-1 h-7 w-7 flex-none rounded-full border-4 border-white bg-indigo-600 shadow" />
                <div className="pb-7">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <h3 className="font-semibold text-gray-900">
                      {evento.titulo}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(evento.fecha)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {evento.descripcion}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {documentPath && (
                      <Link
                        to={documentPath}
                        className="font-semibold text-indigo-700 hover:underline"
                      >
                        {evento.documento.codigo}
                      </Link>
                    )}
                    {evento.movimiento?.id && (
                      <Link
                        to={`/modulo-almacen/movimientos?${
                          evento.tipo === "INGRESO"
                            ? `notaIngresoId=${bien.notaIngreso?.id}`
                            : `notaSalidaId=${notaSalida?.id}`
                        }`}
                        className="font-semibold text-indigo-700 hover:underline"
                      >
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
        La reserva del pedido no identifica una serie concreta: es temporal y por
        cantidad. La unidad que aparece en esta trazabilidad fue seleccionada por
        Almacén únicamente al confirmar el despacho.
      </div>
    </div>
  );
};

export default InventarioBienDetallePage;
