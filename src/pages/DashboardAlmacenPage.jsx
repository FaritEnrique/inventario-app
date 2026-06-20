// src/pages/DashboardAlmacenPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import {
  canAdjustInventoryEffective,
  canCreatePedidoInternoEffective,
  canManageCatalogMasterEffective,
  canOperateInventoryEffective,
  canViewWarehouseTrayEffective,
} from "../accessRules";
import inventarioApi from "../api/inventarioApi";
import ordenesCompraApi from "../api/ordenesCompraApi";
import pedidosInternosApi from "../api/pedidosInternosApi";
import productosApi from "../api/productosApi";
import DashboardEmptyState from "../components/almacen/dashboard/DashboardEmptyState";
import DashboardMetricCard from "../components/almacen/dashboard/DashboardMetricCard";
import { useAuth } from "../context/authContext";
import {
  formatDateTime,
  formatNumber,
  getProductoLabel,
  normalizePagedResponse,
} from "./almacen/dashboard/dashboardDetalleUtils";

const getSettledValue = (result) =>
  result?.status === "fulfilled" ? result.value : null;

const emptyDashboardData = {
  productosTotal: 0,
  stockRows: [],
  movimientos: { data: [], totalItems: 0, totalPages: 1, currentPage: 1 },
  notasIngreso: { data: [], totalItems: 0, totalPages: 1, currentPage: 1 },
  notasSalida: { data: [], totalItems: 0, totalPages: 1, currentPage: 1 },
  reservasActivas: { data: [], totalItems: 0, totalPages: 1, currentPage: 1 },
  reservasParciales: { data: [], totalItems: 0, totalPages: 1, currentPage: 1 },
  ordenesPendientesRecepcion: {
    data: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
  },
  ordenesParcialesRecepcion: {
    data: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
  },
  bandejaAlmacen: { data: [], totalItems: 0, totalPages: 1, currentPage: 1 },
};

const QuickActionCard = ({ title, description, to, icon: Icon }) => {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};

const SectionCard = ({
  title,
  description,
  actionTo,
  actionLabel,
  children,
}) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {description}
          </p>
        </div>

        {actionTo && actionLabel && (
          <Link
            to={actionTo}
            className="inline-flex items-center justify-center rounded-xl border border-indigo-200 px-3 py-2 text-xs font-bold uppercase tracking-wide text-indigo-700 transition hover:bg-indigo-50"
          >
            {actionLabel}
          </Link>
        )}
      </div>

      {children}
    </section>
  );
};

const DashboardAlmacenPage = () => {
  const { user, activeContext } = useAuth();
  const [dashboardData, setDashboardData] = useState(emptyDashboardData);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState("");
  const [failedKeys, setFailedKeys] = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const puedeOperarInventario = canOperateInventoryEffective(user);
  const puedeAjustarInventario = canAdjustInventoryEffective(user);
  const puedeGestionarCatalogos = canManageCatalogMasterEffective(user);
  const puedeVerBandejaAlmacen = canViewWarehouseTrayEffective(user);
  const puedeCrearNotaPedido = canCreatePedidoInternoEffective(user);

  const cargarDashboard = useCallback(async () => {
    setLoading(true);
    setWarning("");
    setFailedKeys([]);

    const ejecutarSi = (enabled, operation) =>
      enabled ? operation() : Promise.resolve(null);

    const operations = [
      {
        key: "productos",
        promise: ejecutarSi(
          puedeGestionarCatalogos || puedeOperarInventario,
          () => productosApi.getTodos("", 1, 1, "activos"),
        ),
      },
      {
        key: "stock",
        promise: ejecutarSi(puedeOperarInventario, () =>
          inventarioApi.obtenerStock(),
        ),
      },
      {
        key: "movimientos",
        promise: ejecutarSi(puedeOperarInventario, () =>
          inventarioApi.obtenerMovimientos({ page: 1, limit: 6 }),
        ),
      },
      {
        key: "notasIngreso",
        promise: ejecutarSi(puedeOperarInventario, () =>
          inventarioApi.obtenerNotasIngreso({ page: 1, limit: 5 }),
        ),
      },
      {
        key: "notasSalida",
        promise: ejecutarSi(puedeOperarInventario, () =>
          inventarioApi.obtenerNotasSalida({ page: 1, limit: 5 }),
        ),
      },
      {
        key: "reservasActivas",
        promise: ejecutarSi(puedeOperarInventario, () =>
          inventarioApi.obtenerReservas({
            estado: "ACTIVA",
            page: 1,
            limit: 5,
          }),
        ),
      },
      {
        key: "reservasParciales",
        promise: ejecutarSi(puedeOperarInventario, () =>
          inventarioApi.obtenerReservas({
            estado: "PARCIAL",
            page: 1,
            limit: 5,
          }),
        ),
      },
      {
        key: "ordenesPendientes",
        promise: ejecutarSi(puedeOperarInventario, () =>
          ordenesCompraApi.obtenerOrdenesCompra({
            estadoAprobacion: "APROBADA",
            estadoRecepcion: "PENDIENTE_RECEPCION",
            page: 1,
            limit: 5,
          }),
        ),
      },
      {
        key: "ordenesParciales",
        promise: ejecutarSi(puedeOperarInventario, () =>
          ordenesCompraApi.obtenerOrdenesCompra({
            estadoAprobacion: "APROBADA",
            estadoRecepcion: "PARCIALMENTE_RECIBIDA",
            page: 1,
            limit: 5,
          }),
        ),
      },
      {
        key: "bandejaAlmacen",
        promise: ejecutarSi(puedeVerBandejaAlmacen, () =>
          pedidosInternosApi.obtenerBandejaAlmacen({ page: 1, limit: 5 }),
        ),
      },
    ];

    const results = await Promise.allSettled(
      operations.map((operation) => operation.promise),
    );

    const failed = results
      .map((result, index) =>
        result.status === "rejected" ? operations[index].key : null,
      )
      .filter(Boolean);

    const [
      productosResult,
      stockResult,
      movimientosResult,
      notasIngresoResult,
      notasSalidaResult,
      reservasActivasResult,
      reservasParcialesResult,
      ordenesPendientesResult,
      ordenesParcialesResult,
      bandejaAlmacenResult,
    ] = results;

    const productosResponse = getSettledValue(productosResult);
    const stockRows = Array.isArray(getSettledValue(stockResult))
      ? getSettledValue(stockResult)
      : [];

    setDashboardData({
      productosTotal: Number(
        productosResponse?.total ??
          productosResponse?.totalItems ??
          productosResponse?.productos?.length ??
          0,
      ),
      stockRows,
      movimientos: normalizePagedResponse(getSettledValue(movimientosResult)),
      notasIngreso: normalizePagedResponse(getSettledValue(notasIngresoResult)),
      notasSalida: normalizePagedResponse(getSettledValue(notasSalidaResult)),
      reservasActivas: normalizePagedResponse(
        getSettledValue(reservasActivasResult),
      ),
      reservasParciales: normalizePagedResponse(
        getSettledValue(reservasParcialesResult),
      ),
      ordenesPendientesRecepcion: normalizePagedResponse(
        getSettledValue(ordenesPendientesResult),
      ),
      ordenesParcialesRecepcion: normalizePagedResponse(
        getSettledValue(ordenesParcialesResult),
      ),
      bandejaAlmacen: normalizePagedResponse(
        getSettledValue(bandejaAlmacenResult),
      ),
    });

    if (failed.length > 0) {
      setFailedKeys(failed);
      setWarning(
        `Algunos indicadores no pudieron cargarse. Se muestran solo los datos disponibles (${failed.length} consulta${
          failed.length === 1 ? "" : "s"
        } sin respuesta).`,
      );
    }

    setLastUpdatedAt(new Date());
    setLoading(false);
  }, [puedeGestionarCatalogos, puedeOperarInventario, puedeVerBandejaAlmacen]);

  useEffect(() => {
    cargarDashboard();
  }, [cargarDashboard]);

  const resumen = useMemo(() => {
    const stockRows = dashboardData.stockRows;

    const unidadesReservadas = stockRows.reduce(
      (acc, row) => acc + Number(row.totalReservada || 0),
      0,
    );

    const unidadesDisponibles = stockRows.reduce(
      (acc, row) => acc + Number(row.totalDisponible || 0),
      0,
    );

    const productosConStockDisponible = stockRows.filter(
      (row) => Number(row.totalDisponible || 0) > 0,
    ).length;

    const almacenes = new Set();
    stockRows.forEach((row) => {
      (row.almacenes || []).forEach((almacen) => {
        if (almacen?.id) almacenes.add(almacen.id);
      });
    });

    const productosCriticos = stockRows.filter(
      (row) => Number(row.totalDisponible || 0) <= 0,
    );

    const productosBajoStock = stockRows
      .filter((row) => {
        const disponible = Number(row.totalDisponible || 0);
        return disponible > 0 && disponible <= 5;
      })
      .sort(
        (a, b) =>
          Number(a.totalDisponible || 0) - Number(b.totalDisponible || 0),
      );

    const productosMasReservados = [...stockRows]
      .filter((row) => Number(row.totalReservada || 0) > 0)
      .sort(
        (a, b) => Number(b.totalReservada || 0) - Number(a.totalReservada || 0),
      )
      .slice(0, 5);

    const reservasPendientes =
      Number(dashboardData.reservasActivas.totalItems || 0) +
      Number(dashboardData.reservasParciales.totalItems || 0);

    const recepcionesPendientes =
      Number(dashboardData.ordenesPendientesRecepcion.totalItems || 0) +
      Number(dashboardData.ordenesParcialesRecepcion.totalItems || 0);

    return {
      unidadesReservadas,
      unidadesDisponibles,
      productosConStockDisponible,
      almacenesCount: almacenes.size,
      productosCriticos,
      productosBajoStock,
      productosMasReservados,
      reservasPendientes,
      recepcionesPendientes,
      notasPedidoPendientes: Number(
        dashboardData.bandejaAlmacen.totalItems || 0,
      ),
    };
  }, [dashboardData]);

  const hasFailed = (key) => failedKeys.includes(key);
  const metricValue = (key, value) => {
    if (loading) return "...";
    if (hasFailed(key)) return "—";
    return formatNumber(value);
  };

  const estadoOperativo = useMemo(() => {
    if (!puedeOperarInventario) {
      return {
        title: "Acceso limitado al módulo",
        description:
          "Tu contexto actual tiene acceso parcial al módulo. Las métricas operativas se muestran solo para contextos con operación de inventario.",
        icon: ShieldCheck,
        className: "border-slate-200 bg-slate-50 text-slate-700",
      };
    }

    if (resumen.productosCriticos.length > 0) {
      return {
        title: "Atención requerida",
        description:
          "Existen productos sin disponibilidad. Revisa el stock antes de atender salidas o reservas.",
        icon: AlertTriangle,
        className: "border-rose-200 bg-rose-50 text-rose-800",
      };
    }

    if (
      resumen.recepcionesPendientes > 0 ||
      resumen.notasPedidoPendientes > 0
    ) {
      return {
        title: "Operación activa",
        description:
          "Hay recepciones o notas de pedido pendientes de atención. Prioriza la actualización documental y física del almacén.",
        icon: Activity,
        className: "border-amber-200 bg-amber-50 text-amber-800",
      };
    }

    return {
      title: "Operación estable",
      description:
        "No se detectan alertas críticas con los datos disponibles del tablero.",
      icon: CheckCircle2,
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }, [
    puedeOperarInventario,
    resumen.notasPedidoPendientes,
    resumen.productosCriticos.length,
    resumen.recepcionesPendientes,
  ]);

  const quickActions = useMemo(
    () =>
      [
        {
          title: "Consulta de Stock",
          description:
            "Detalle propio del dashboard por producto, código y almacén.",
          to: "/modulo-almacen/dashboard/stock-disponible?soloConStock=1",
          icon: Boxes,
          visible: puedeOperarInventario,
        },
        {
          title: "Recepciones pendientes",
          description: "O/C aprobadas pendientes o parciales de recepción.",
          to: "/modulo-almacen/dashboard/recepciones-pendientes",
          icon: FileCheck,
          visible: puedeOperarInventario,
        },
        {
          title: "Reservas pendientes",
          description: "Reservas activas o parciales para seguimiento.",
          to: "/modulo-almacen/dashboard/reservas-pendientes",
          icon: ClipboardList,
          visible: puedeOperarInventario,
        },
        {
          title: "Nueva Nota de Pedido",
          description: "Genera una solicitud interna de bienes.",
          to: "/notas-pedido/nueva",
          icon: ShoppingCart,
          visible: puedeCrearNotaPedido,
        },
        {
          title: "Operación de inventario",
          description: "Ajustes, transferencias y cargas iniciales.",
          to: "/modulo-almacen/operaciones",
          icon: Warehouse,
          visible: puedeAjustarInventario,
        },
        {
          title: "Catálogo de Productos",
          description: "Administra productos, tipos, marcas y validaciones.",
          to: "/modulo-almacen/productos",
          icon: PackageCheck,
          visible: puedeGestionarCatalogos,
        },
      ].filter((item) => item.visible),
    [
      puedeAjustarInventario,
      puedeCrearNotaPedido,
      puedeGestionarCatalogos,
      puedeOperarInventario,
    ],
  );

  const EstadoIcon = estadoOperativo.icon;

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-indigo-950 p-6 text-white shadow-xl">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-400 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-sky-300 blur-3xl" />
        </div>

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-100">
              <Sparkles className="h-4 w-4" />
              Panel operativo de almacén
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Control de stock, recepciones y salidas
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-indigo-100 sm:text-base">
              Monitorea disponibilidad por producto, reservas, documentos de
              ingreso/salida, recepción de Ordenes de Compra y movimientos
              recientes desde un solo punto de control.
            </p>

            <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-indigo-100">
              <span className="rounded-full bg-white/10 px-3 py-1">
                Área:{" "}
                {activeContext?.area?.nombre || user?.areaNombre || "Almacén"}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">
                Rol:{" "}
                {activeContext?.rolOperativo ||
                  activeContext?.role ||
                  user?.rol ||
                  "Operativo"}
              </span>
              {lastUpdatedAt && (
                <span className="rounded-full bg-white/10 px-3 py-1">
                  Actualizado: {formatDateTime(lastUpdatedAt)}
                </span>
              )}
            </div>
          </div>

          <div
            className={`rounded-3xl border p-5 ${estadoOperativo.className}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70">
                <EstadoIcon className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide opacity-80">
                  Estado operativo
                </p>
                <h2 className="mt-1 text-xl font-black">
                  {estadoOperativo.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed">
                  {estadoOperativo.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={cargarDashboard}
              disabled={loading}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Actualizando..." : "Actualizar tablero"}
            </button>
          </div>
        </div>
      </div>

      {warning && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {warning}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Productos activos"
          value={metricValue("productos", dashboardData.productosTotal)}
          description="Catálogo activo disponible para operaciones de almacén."
          icon={PackageCheck}
          tone="indigo"
          to="/modulo-almacen/dashboard/productos-activos"
        />
        <DashboardMetricCard
          title="Productos con stock disponible"
          value={metricValue("stock", resumen.productosConStockDisponible)}
          description={`Unidades disponibles: ${formatNumber(resumen.unidadesDisponibles)} · reservadas: ${formatNumber(resumen.unidadesReservadas)}.`}
          icon={Boxes}
          tone="emerald"
          to="/modulo-almacen/dashboard/stock-disponible?soloConStock=1"
        />
        <DashboardMetricCard
          title="Recepciones pendientes"
          value={metricValue(
            "ordenesPendientes",
            resumen.recepcionesPendientes,
          )}
          description="Ordenes de Compra aprobadas pendientes o parciales de recepción."
          icon={ArrowDownCircle}
          tone="amber"
          to="/modulo-almacen/dashboard/recepciones-pendientes"
        />
        <DashboardMetricCard
          title="Reservas pendientes"
          value={metricValue("reservasActivas", resumen.reservasPendientes)}
          description="Reservas activas o parciales pendientes de despacho/liberación."
          icon={ClipboardList}
          tone="sky"
          to="/modulo-almacen/dashboard/reservas-pendientes"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardMetricCard
          title="Notas de ingreso"
          value={metricValue(
            "notasIngreso",
            dashboardData.notasIngreso.totalItems,
          )}
          description="Documentos de ingreso registrados por recepción o regularización."
          icon={ArrowDownCircle}
          tone="emerald"
          to="/modulo-almacen/dashboard/notas-ingreso"
        />
        <DashboardMetricCard
          title="Notas de salida"
          value={metricValue(
            "notasSalida",
            dashboardData.notasSalida.totalItems,
          )}
          description="Documentos de salida emitidos por atención o despacho."
          icon={ArrowUpCircle}
          tone="rose"
          to="/modulo-almacen/dashboard/notas-salida"
        />
        <DashboardMetricCard
          title="Almacenes con stock"
          value={metricValue("stock", resumen.almacenesCount)}
          description="Cantidad de almacenes encontrados en el resumen actual."
          icon={Warehouse}
          tone="slate"
          to="/modulo-almacen/dashboard/almacenes-stock"
        />
      </div>

      <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-indigo-600">
              Accesos rápidos
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              Operación diaria del almacén
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
            Acciones principales según el contexto activo y los permisos del
            usuario.
          </p>
        </div>

        {quickActions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <QuickActionCard key={action.to} {...action} />
            ))}
          </div>
        ) : (
          <DashboardEmptyState
            title="Sin accesos operativos"
            description="No tienes accesos disponibles para el contexto activo."
          />
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Alertas de disponibilidad"
          description="Productos con baja disponibilidad para priorizar revisión física o reposición."
          actionTo="/modulo-almacen/dashboard/stock-disponible?soloSinDisponibilidad=1"
          actionLabel="Ver consulta"
        >
          {resumen.productosCriticos.length === 0 &&
          resumen.productosBajoStock.length === 0 ? (
            <DashboardEmptyState
              title="Sin alertas críticas"
              description="No se detectan productos críticos con el stock actual."
            />
          ) : (
            <div className="space-y-3">
              {[...resumen.productosCriticos, ...resumen.productosBajoStock]
                .slice(0, 6)
                .map((row) => {
                  const disponible = Number(row.totalDisponible || 0);
                  const critical = disponible <= 0;

                  return (
                    <article
                      key={row.producto?.id || row.producto?.codigo}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          {getProductoLabel(row.producto)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Actual: {formatNumber(row.totalActual)} ·
                          Reservado: {formatNumber(row.totalReservada)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${
                          critical
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        Disponible: {formatNumber(disponible)}
                      </span>
                    </article>
                  );
                })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Productos más reservados"
          description="Resumen de presión operativa por reservas activas en almacén."
          actionTo="/modulo-almacen/dashboard/reservas-pendientes"
          actionLabel="Ver reservas"
        >
          {resumen.productosMasReservados.length === 0 ? (
            <DashboardEmptyState
              title="Sin reservas activas"
              description="No hay productos con reservas activas o parciales."
            />
          ) : (
            <div className="space-y-3">
              {resumen.productosMasReservados.map((row) => (
                <article
                  key={row.producto?.id || row.producto?.codigo}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900">
                        {getProductoLabel(row.producto)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Disponible: {formatNumber(row.totalDisponible)}
                      </p>
                    </div>

                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">
                      Reservado: {formatNumber(row.totalReservada)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Resumen documental
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Vista rápida de documentos de ingreso, salida y reservas para
              seguimiento operativo.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
            <Link
              to="/modulo-almacen/dashboard/notas-ingreso"
              className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 transition hover:border-emerald-300"
            >
              <ArrowDownCircle className="h-5 w-5 text-emerald-700" />
              <p className="mt-2 text-2xl font-black text-emerald-900">
                {metricValue(
                  "notasIngreso",
                  dashboardData.notasIngreso.totalItems,
                )}
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Ingresos
              </p>
            </Link>

            <Link
              to="/modulo-almacen/dashboard/notas-salida"
              className="rounded-2xl border border-rose-100 bg-rose-50 p-4 transition hover:border-rose-300"
            >
              <ArrowUpCircle className="h-5 w-5 text-rose-700" />
              <p className="mt-2 text-2xl font-black text-rose-900">
                {metricValue(
                  "notasSalida",
                  dashboardData.notasSalida.totalItems,
                )}
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                Salidas
              </p>
            </Link>

            <Link
              to="/modulo-almacen/dashboard/reservas-pendientes"
              className="rounded-2xl border border-sky-100 bg-sky-50 p-4 transition hover:border-sky-300"
            >
              <TrendingUp className="h-5 w-5 text-sky-700" />
              <p className="mt-2 text-2xl font-black text-sky-900">
                {metricValue("reservasActivas", resumen.reservasPendientes)}
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                Reservas
              </p>
            </Link>
          </div>
        </div>
      </section>
    </section>
  );
};

export default DashboardAlmacenPage;
