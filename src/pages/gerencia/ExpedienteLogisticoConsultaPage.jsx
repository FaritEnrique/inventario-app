import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  FileText,
  ListChecks,
  ShoppingCart,
} from "lucide-react";
import gerenciaApi from "../../api/gerenciaApi";
import CotizacionEstadoBadge from "../../components/CotizacionEstadoBadge";
import OrdenCompraEstadoBadge from "../../components/OrdenCompraEstadoBadge";
import { AlertasSeguimientoExpediente } from "../../components/AlertasSeguimientoLogistico";
import {
  getAlertasSeguimientoSource,
  hasAlertasSeguimiento,
} from "../../utils/logisticaAlertasUi";
import {
  formatCurrency,
  formatInteger,
  formatQuantity,
} from "../../utils/numberFormatters";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("es-PE") : "-";

const formatText = (value, fallback = "-") =>
  String(value ?? "").trim() || fallback;

const estadoToLabel = (value) =>
  formatText(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());

const formatMoney = (value, currency = "PEN") => {
  const normalizedCurrency = String(currency || "PEN").toUpperCase();

  if (normalizedCurrency === "PEN") {
    return formatCurrency(value);
  }

  const number = Number(value);
  if (!Number.isFinite(number)) return "-";

  const prefix = normalizedCurrency === "USD" ? "US$" : normalizedCurrency;

  return `${prefix} ${number.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getActiveList = (value) =>
  Array.isArray(value) ? value.filter((item) => item?.activo !== false) : [];

const getProveedorNombre = (value = {}) =>
  value?.proveedor?.razonSocial ||
  value?.proveedor?.nombre ||
  value?.proveedorRazonSocial ||
  value?.proveedorNombre ||
  "-";

const getProveedorRuc = (value = {}) =>
  value?.proveedor?.ruc || value?.proveedorRuc || null;

const getOrdenesCompra = (detalle) =>
  Array.isArray(detalle?.ordenesCompra)
    ? detalle.ordenesCompra
    : detalle?.ordenCompra
      ? [detalle.ordenCompra]
      : [];

const InfoItem = ({ label, value }) => (
  <div className="rounded-lg bg-slate-50 p-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </p>
    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

const SummaryCard = ({ title, value, icon: Icon, description }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      </div>
      {Icon ? (
        <div className="rounded-full bg-indigo-50 p-2 text-indigo-700">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
    </div>
    {description ? (
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        {description}
      </p>
    ) : null}
  </div>
);

const Section = ({ title, description, children }) => (
  <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 p-4">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          {description}
        </p>
      ) : null}
    </div>
    <div className="p-4">{children}</div>
  </section>
);

const EmptyState = ({ children }) => (
  <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
    {children}
  </p>
);

const ExpedienteLogisticoConsultaPage = () => {
  const { id } = useParams();
  const [detalle, setDetalle] = useState(null);
  const [buenasPro, setBuenasPro] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarExpediente = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const data = await gerenciaApi.obtenerExpedienteLogistico(id);
      setDetalle(data);
      setBuenasPro(getActiveList(data?.buenasPro));
    } catch (err) {
      setError(
        err?.message ||
          "No se pudo cargar el expediente logístico de consulta.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargarExpediente();
  }, [cargarExpediente]);

  const items = useMemo(() => getActiveList(detalle?.items), [detalle]);
  const solicitudes = useMemo(
    () => getActiveList(detalle?.solicitudes),
    [detalle],
  );
  const cotizaciones = useMemo(
    () => getActiveList(detalle?.cotizaciones),
    [detalle],
  );
  const flujosCotizacion = useMemo(
    () => getActiveList(detalle?.flujosCotizacion),
    [detalle],
  );
  const ordenesCompra = useMemo(() => getOrdenesCompra(detalle), [detalle]);
  const alertas = getAlertasSeguimientoSource(detalle);
  const hasAlertas = hasAlertasSeguimiento(alertas);

  const resumenComparativo = detalle?.resumenComparativo || {};
  const totalOrdenesCompra = ordenesCompra.length;
  const totalMontoOrdenes = ordenesCompra.reduce(
    (total, orden) => total + Number(orden?.montoTotal || 0),
    0,
  );

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-8 w-80 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-full max-w-3xl animate-pulse rounded bg-slate-200" />
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <Link
          to="/modulo-gerencia"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al módulo gerencia
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h1 className="text-lg font-bold">
                No se pudo cargar el expediente
              </h1>
              <p className="mt-1 text-sm">{error}</p>
              <p className="mt-3 text-xs leading-relaxed">
                Si el usuario pertenece a Gerencia de Administración o Gerencia
                General y recibe este mensaje, el siguiente ajuste debe hacerse
                en backend para permitir consulta gerencial de solo lectura.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Consulta gerencial
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Expediente Logístico {detalle?.codigo || `#${id}`}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              Vista de solo lectura del expediente. Desde aquí se revisa el
              requerimiento, solicitudes, cotizaciones, flujo, Buena Pro y
              Órdenes de Compra sin habilitar acciones operativas.
            </p>
          </div>

          <Link
            to="/modulo-gerencia"
            className="inline-flex w-fit items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Módulo gerencia
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoItem
            label="Estado documento"
            value={estadoToLabel(detalle?.estadoDocumento)}
          />
          <InfoItem
            label="Estado logístico"
            value={estadoToLabel(detalle?.estadoLogistica)}
          />
          <InfoItem
            label="Modalidad"
            value={estadoToLabel(detalle?.modalidadFlujoLogistico)}
          />
          <InfoItem
            label="Responsable logístico"
            value={formatText(detalle?.responsableLogistica?.nombre)}
          />
          <InfoItem
            label="Área solicitante"
            value={formatText(detalle?.area?.nombre || detalle?.areaNombre)}
          />
          <InfoItem
            label="Solicitante"
            value={formatText(detalle?.solicitante?.nombre)}
          />
          <InfoItem
            label="Fecha emisión"
            value={formatDate(detalle?.fechaCreacion)}
          />
          <InfoItem
            label="Fecha habilitación logística"
            value={formatDate(detalle?.fechaHabilitacionLogistica)}
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Ítems"
          value={formatInteger(items.length)}
          icon={ListChecks}
          description="Ítems requeridos en el expediente."
        />
        <SummaryCard
          title="Solicitudes"
          value={formatInteger(solicitudes.length)}
          icon={FileText}
          description="Solicitudes emitidas a proveedores."
        />
        <SummaryCard
          title="Cotizaciones"
          value={formatInteger(cotizaciones.length)}
          icon={Award}
          description="Respuestas registradas en el expediente."
        />
        <SummaryCard
          title="Órdenes de Compra"
          value={formatInteger(totalOrdenesCompra)}
          icon={ShoppingCart}
          description="O/C generadas desde Buena Pro."
        />
        <SummaryCard
          title="Monto O/C"
          value={formatMoney(totalMontoOrdenes)}
          icon={ShoppingCart}
          description="Monto total referencial de órdenes activas."
        />
      </div>

      <Section
        title="Requerimiento"
        description="Detalle documental del requerimiento que originó el expediente logístico."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <InfoItem
            label="Uso / finalidad"
            value={formatText(detalle?.usoFinalidad)}
          />
          <InfoItem
            label="Ubicación de uso"
            value={formatText(detalle?.ubicacionUso)}
          />
          <InfoItem
            label="Total referencial"
            value={formatMoney(detalle?.totalReferencial)}
          />
          <InfoItem
            label="Observaciones"
            value={formatText(detalle?.observacionesGenerales)}
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 text-center">#</th>
                <th className="px-3 py-2 text-left">Descripción</th>
                <th className="px-3 py-2 text-center">Unidad</th>
                <th className="px-3 py-2 text-right">Cantidad</th>
                <th className="px-3 py-2 text-right">P. referencial</th>
                <th className="px-3 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="px-3 py-2 text-center">
                      {formatInteger(index + 1)}
                    </td>
                    <td className="px-3 py-2">
                      {formatText(
                        item.descripcionVisible ||
                          item.descripcion ||
                          item.producto?.nombre,
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {formatText(item.unidadMedida)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatQuantity(item.cantidadRequerida)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatMoney(item.valorReferencialUnitario)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatMoney(item.subtotalReferencial)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-3 py-6 text-center">
                    No hay ítems registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Solicitudes de Cotización"
        description="Solicitudes emitidas dentro del expediente."
      >
        {solicitudes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Código</th>
                  <th className="px-3 py-2 text-left">Proveedor</th>
                  <th className="px-3 py-2 text-center">Tipo compra</th>
                  <th className="px-3 py-2 text-center">Estado</th>
                  <th className="px-3 py-2 text-center">Fecha límite</th>
                  <th className="px-3 py-2 text-center">Cotizaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.id}>
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      {formatText(solicitud.codigo)}
                    </td>
                    <td className="px-3 py-2">
                      <p>{getProveedorNombre(solicitud)}</p>
                      {getProveedorRuc(solicitud) ? (
                        <p className="text-xs text-slate-500">
                          RUC {getProveedorRuc(solicitud)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {formatText(solicitud.tipoCompra)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <CotizacionEstadoBadge
                        estado={solicitud.estado}
                        tipo="solicitud"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      {formatDate(solicitud.fechaLimite)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {formatInteger(solicitud.cotizaciones?.length || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No hay solicitudes de cotización registradas.</EmptyState>
        )}
      </Section>

      <Section
        title="Cotizaciones"
        description="Respuestas de proveedores registradas para el expediente."
      >
        {cotizaciones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Código</th>
                  <th className="px-3 py-2 text-left">Proveedor</th>
                  <th className="px-3 py-2 text-center">Solicitud</th>
                  <th className="px-3 py-2 text-center">Estado</th>
                  <th className="px-3 py-2 text-right">Total oferta</th>
                  <th className="px-3 py-2 text-center">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cotizaciones.map((cotizacion) => (
                  <tr key={cotizacion.id || cotizacion.cotizacionId}>
                    <td className="px-3 py-2 font-semibold">
                      {formatText(cotizacion.codigo)}
                    </td>
                    <td className="px-3 py-2">
                      {getProveedorNombre(cotizacion)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {formatText(cotizacion.solicitudCodigo)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <CotizacionEstadoBadge estado={cotizacion.estado} />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {formatMoney(cotizacion.totalOferta, cotizacion.moneda)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {formatDate(
                        cotizacion.fechaRespuesta || cotizacion.createdAt,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No hay cotizaciones registradas.</EmptyState>
        )}
      </Section>

      <Section
        title="Flujos, Comparativo y Buena Pro"
        description="Estado formal de los flujos de cotización y decisión de Buena Pro."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {flujosCotizacion.length > 0 ? (
            flujosCotizacion.map((flujo) => {
              const buenaPro = buenasPro.find(
                (entry) =>
                  Number(entry?.flujoCotizacionId || entry?.flujo?.id || 0) ===
                    Number(flujo.id) || Number(entry?.flujoId || 0) === Number(flujo.id),
              );

              return (
                <div
                  key={flujo.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Flujo {formatText(flujo.tipoCompra)}
                      </p>
                      <h3 className="text-lg font-bold text-slate-900">
                        {estadoToLabel(flujo.estado)}
                      </h3>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      Solicitudes:{" "}
                      {formatInteger(flujo.conteos?.solicitudesActivas || 0)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                    <InfoItem
                      label="Cotizaciones"
                      value={formatInteger(
                        flujo.conteos?.cotizacionesActivas || 0,
                      )}
                    />
                    <InfoItem
                      label="Fecha cierre"
                      value={formatDate(flujo.fechaCierreCotizaciones)}
                    />
                    <InfoItem
                      label="Motivo cierre"
                      value={formatText(flujo.motivoCierre)}
                    />
                    <InfoItem
                      label="Buena Pro"
                      value={
                        buenaPro
                          ? `${formatText(buenaPro.codigo, "Registrada")} · ${estadoToLabel(
                              buenaPro.estado,
                            )}`
                          : "No registrada"
                      }
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="lg:col-span-2">
              <EmptyState>No hay flujos de cotización registrados.</EmptyState>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
          <p className="font-semibold">Resumen comparativo</p>
          <p className="mt-1">
            Solicitudes:{" "}
            {formatInteger(resumenComparativo.totalSolicitudes || 0)} ·
            Cotizaciones válidas:{" "}
            {formatInteger(resumenComparativo.totalCotizaciones || 0)} ·
            Cobertura mínima por ítem:{" "}
            {formatInteger(resumenComparativo.coberturaMinimaPorItem || 0)}
          </p>
        </div>
      </Section>

      <Section
        title="Órdenes de Compra"
        description="Órdenes generadas desde Buena Pro para este expediente."
      >
        {ordenesCompra.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Código</th>
                  <th className="px-3 py-2 text-left">Proveedor</th>
                  <th className="px-3 py-2 text-center">Emisión</th>
                  <th className="px-3 py-2 text-right">Monto</th>
                  <th className="px-3 py-2 text-center">Aprobación</th>
                  <th className="px-3 py-2 text-center">Recepción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ordenesCompra.map((orden) => (
                  <tr key={orden.id || orden.codigo}>
                    <td className="px-3 py-2 font-semibold">
                      {formatText(orden.codigo)}
                    </td>
                    <td className="px-3 py-2">
                      <p>{getProveedorNombre(orden)}</p>
                      {getProveedorRuc(orden) ? (
                        <p className="text-xs text-slate-500">
                          RUC {getProveedorRuc(orden)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {formatDate(orden.fechaEmision)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {formatMoney(orden.montoTotal, orden.moneda)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <OrdenCompraEstadoBadge
                        estado={orden.estadoAprobacion}
                        tipo="aprobacion"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <OrdenCompraEstadoBadge
                        estado={orden.estadoRecepcion}
                        tipo="recepcion"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No hay Órdenes de Compra registradas.</EmptyState>
        )}
      </Section>

      <Section
        title="Alertas del expediente"
        description="Pendientes detectados en solicitudes, cotizaciones, Buena Pro y Órdenes de Compra."
      >
        {hasAlertas ? (
          <AlertasSeguimientoExpediente
            alertas={alertas}
            expediente={detalle}
          />
        ) : (
          <EmptyState>No hay alertas pendientes para este expediente.</EmptyState>
        )}
      </Section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-bold text-slate-900">Vista de solo lectura</p>
        <p className="mt-1 leading-relaxed">
          Esta página no permite definir modalidad, emitir solicitudes,
          registrar cotizaciones, cerrar flujos, otorgar Buena Pro, generar
          Órdenes de Compra ni recepcionar. Es una vista gerencial de consulta
          documental.
        </p>
      </div>
    </section>
  );
};

export default ExpedienteLogisticoConsultaPage;