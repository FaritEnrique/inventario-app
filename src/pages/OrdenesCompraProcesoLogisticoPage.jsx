// src/pages/OrdenesCompraProcesoLogisticoPage.jsx
import React, { useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import OrdenCompraEstadoBadge from "../components/OrdenCompraEstadoBadge";
import {
  getAlertasByCategoryCount,
  getAlertasSeguimientoSource,
} from "../utils/logisticaAlertasUi";
import OrdenesCompraProcesoLogisticoSkeleton from "../components/ui/skeletons/OrdenesCompraProcesoLogisticoSkeleton";

const estadosRecepcionFinal = new Set([
  "CANCELADA",
  "CERRADA",
  "COMPLETAMENTE_RECIBIDA",
]);

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";

const formatMoney = (value, currency = "PEN") => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";

  const normalizedCurrency = String(currency || "PEN").toUpperCase();
  const prefix =
    normalizedCurrency === "USD"
      ? "US$"
      : normalizedCurrency === "PEN"
        ? "S/"
        : normalizedCurrency;

  return `${prefix} ${number.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatText = (value, fallback = "-") =>
  String(value ?? "").trim() || fallback;

const estadoToLabel = (value) =>
  formatText(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());

const getOrdenesCompra = (detalleGlobal) =>
  Array.isArray(detalleGlobal?.ordenesCompra)
    ? detalleGlobal.ordenesCompra
    : detalleGlobal?.ordenCompra
      ? [detalleGlobal.ordenCompra]
      : [];

const isPendienteAprobacion = (orden) =>
  String(orden?.estadoAprobacion || "").toUpperCase() ===
  "PENDIENTE_APROBACION";

const isAprobada = (orden) =>
  String(orden?.estadoAprobacion || "").toUpperCase() === "APROBADA";

const isPendienteRecepcion = (orden) => {
  const estadoRecepcion = String(orden?.estadoRecepcion || "").toUpperCase();

  return isAprobada(orden) && !estadosRecepcionFinal.has(estadoRecepcion);
};

const getAlertasOrdenCompra = (alertas) => {
  const source = getAlertasSeguimientoSource(alertas);
  const detalle = source?.detalle || {};

  return [
    ...(detalle.buenasProSinOrdenCompra || []).map((item) => ({
      tipo: "BUENA_PRO_SIN_OC",
      label: "Buena Pro sin Orden de Compra",
      message:
        item?.mensaje ||
        "Existe una Buena Pro activa sin Orden de Compra generada.",
    })),
    ...(detalle.ordenesCompraPendientesAprobacion || []).map((item) => ({
      tipo: "OC_PENDIENTE_APROBACION",
      label: "O/C pendiente de aprobación",
      message:
        item?.mensaje ||
        "Existe una Orden de Compra pendiente de aprobación.",
    })),
    ...(detalle.ordenesCompraAprobadasPendientesRecepcion || []).map(
      (item) => ({
        tipo: "OC_APROBADA_PENDIENTE_RECEPCION",
        label: "O/C aprobada pendiente de recepción",
        message:
          item?.mensaje ||
          "Existe una Orden de Compra aprobada pendiente de recepción.",
      }),
    ),
  ];
};

const buildResumen = (ordenesCompra) => {
  const totalOrdenes = ordenesCompra.length;
  const pendientesAprobacion = ordenesCompra.filter(
    isPendienteAprobacion,
  ).length;
  const aprobadas = ordenesCompra.filter(isAprobada).length;
  const aprobadasPendientesRecepcion = ordenesCompra.filter(
    isPendienteRecepcion,
  ).length;
  const finalizadasRecepcion = ordenesCompra.filter((orden) =>
    estadosRecepcionFinal.has(
      String(orden?.estadoRecepcion || "").toUpperCase(),
    ),
  ).length;
  const montoTotal = ordenesCompra.reduce(
    (total, orden) => total + Number(orden?.montoTotal || 0),
    0,
  );

  return {
    totalOrdenes,
    pendientesAprobacion,
    aprobadas,
    aprobadasPendientesRecepcion,
    finalizadasRecepcion,
    montoTotal,
  };
};

const SummaryCard = ({ label, value, hint }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </p>
    <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
  </div>
);

const OrdenesCompraProcesoLogisticoPage = () => {
  const { id, detalleGlobal, loading } = useOutletContext();

  const ordenesCompra = useMemo(
    () => getOrdenesCompra(detalleGlobal),
    [detalleGlobal],
  );

  const resumen = useMemo(
    () => buildResumen(ordenesCompra),
    [ordenesCompra],
  );

  const alertas = getAlertasSeguimientoSource(detalleGlobal);
  const alertasOrdenCompra = useMemo(
    () => getAlertasOrdenCompra(alertas),
    [alertas],
  );
  const totalAlertasOrdenCompra = getAlertasByCategoryCount(
    alertas,
    "ordenesCompra",
  );

  const codigoRequerimiento = detalleGlobal?.codigo || `#${id}`;
  const modalidad = detalleGlobal?.modalidadFlujoLogistico || "No definida";
  const responsable =
    detalleGlobal?.responsableLogistica?.nombre || "No asignado";
  const estadoLogistica = detalleGlobal?.estadoLogistica || "-";

  if (loading && !detalleGlobal) {
    return <OrdenesCompraProcesoLogisticoSkeleton />;
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Expediente {codigoRequerimiento}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Órdenes de Compra del Expediente
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              Consulta las Órdenes de Compra generadas desde Buena Pro, su ruta
              de aprobación, el estado de recepción y los accesos operativos
              relacionados.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/cotizaciones/proceso/${id}/comparativos`}
              className="inline-flex items-center justify-center rounded-lg border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Ver Comparativo / Buena Pro
            </Link>
            <Link
              to="/ordenes-compra"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ir a O/C globales
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="font-semibold text-slate-700">Modalidad</p>
            <p className="text-slate-900">{estadoToLabel(modalidad)}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">
              Responsable logístico
            </p>
            <p className="text-slate-900">{responsable}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Estado logístico</p>
            <p className="text-slate-900">{estadoToLabel(estadoLogistica)}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">
              Alertas de O/C
            </p>
            <p className="text-slate-900">{totalAlertasOrdenCompra}</p>
          </div>
        </div>
      </div>

      {alertasOrdenCompra.length > 0 ? (
        <div className="space-y-2">
          {alertasOrdenCompra.map((alerta) => (
            <div
              key={`${alerta.tipo}-${alerta.label}-${alerta.message}`}
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
              <p className="font-semibold">{alerta.label}</p>
              <p className="mt-1">{alerta.message}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Total O/C"
          value={resumen.totalOrdenes}
          hint="Órdenes generadas en este expediente"
        />
        <SummaryCard
          label="Pendientes"
          value={resumen.pendientesAprobacion}
          hint="En ruta de aprobación"
        />
        <SummaryCard
          label="Aprobadas"
          value={resumen.aprobadas}
          hint="Listas para recepción si tienen saldo"
        />
        <SummaryCard
          label="Pendientes recepción"
          value={resumen.aprobadasPendientesRecepcion}
          hint="Aprobadas sin recepción final"
        />
        <SummaryCard
          label="Monto total"
          value={formatMoney(resumen.montoTotal)}
          hint="Suma referencial de O/C"
        />
      </div>

      {ordenesCompra.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Aún no existen Órdenes de Compra
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Para generar Órdenes de Compra, primero debe existir una Buena Pro
            activa. La generación debe realizarse desde la pestaña Comparativo /
            Buena Pro, porque allí se conserva la decisión formal del expediente.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row sm:flex-wrap">
            <Link
              to={`/cotizaciones/proceso/${id}/comparativos`}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Ir a Comparativo / Buena Pro
            </Link>
            <Link
              to={`/cotizaciones/proceso/${id}/alertas`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ver alertas del expediente
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Órdenes generadas
              </h2>
              <p className="text-sm text-slate-600">
                Cada Orden de Compra conserva su propio estado de aprobación y
                recepción.
              </p>
            </div>
            <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {ordenesCompra.length}{" "}
              {ordenesCompra.length === 1 ? "orden" : "órdenes"}
            </span>
          </div>

          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3 text-left">Código</th>
                  <th className="px-3 py-3 text-left">Proveedor</th>
                  <th className="px-3 py-3 text-center">Emisión</th>
                  <th className="px-3 py-3 text-right">Monto</th>
                  <th className="px-3 py-3 text-center">Aprobación</th>
                  <th className="px-3 py-3 text-center">Recepción</th>
                  <th className="px-3 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ordenesCompra.map((orden, index) => {
                  const estadoAprobacion = String(
                    orden?.estadoAprobacion || "",
                  ).toUpperCase();
                  const estadoRecepcion = String(
                    orden?.estadoRecepcion || "",
                  ).toUpperCase();
                  const puedeRecepcionar =
                    estadoAprobacion === "APROBADA" &&
                    !estadosRecepcionFinal.has(estadoRecepcion);
                  const proveedor = orden?.proveedor || {};

                  return (
                    <tr key={orden.id || `${orden.codigo}-${index}`}>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-slate-900">
                          {formatText(orden.codigo, "O/C sin código")}
                        </p>
                        {orden.nivelPendienteActual ? (
                          <p className="mt-1 text-xs text-amber-700">
                            Nivel pendiente:{" "}
                            {estadoToLabel(orden.nivelPendienteActual)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-800">
                          {formatText(
                            proveedor.razonSocial ||
                              proveedor.nombre ||
                              orden.proveedorRazonSocial,
                          )}
                        </p>
                        {proveedor.ruc || orden.proveedorRuc ? (
                          <p className="mt-1 text-xs text-slate-500">
                            RUC {proveedor.ruc || orden.proveedorRuc}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-700">
                        {formatDate(
                          orden.fechaEmision || orden.fechaGeneracion,
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                        {formatMoney(orden.montoTotal, orden.moneda)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <OrdenCompraEstadoBadge
                          estado={orden.estadoAprobacion}
                          tipo="aprobacion"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <OrdenCompraEstadoBadge
                          estado={orden.estadoRecepcion}
                          tipo="recepcion"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap justify-center gap-2">
                          {orden.id ? (
                            <Link
                              to={`/ordenes-compra/${orden.id}`}
                              className="inline-flex items-center justify-center rounded border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                            >
                              Ver detalle / aprobar
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-500">
                              Sin detalle
                            </span>
                          )}

                          {puedeRecepcionar ? (
                            <Link
                              to="/modulo-almacen/recepcion-oc"
                              state={{
                                ordenCompraId: orden.id || null,
                                ordenCompraCodigo: orden.codigo || null,
                              }}
                              className="inline-flex items-center justify-center rounded border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                            >
                              Recepcionar
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <h3 className="font-bold text-slate-900">Trazabilidad documental</h3>
        <p className="mt-1 leading-relaxed">
          Esta pestaña muestra el resultado formal posterior a la Buena Pro. La
          aprobación operativa de cada Orden de Compra se realiza desde su
          detalle, respetando la ruta snapshot definida al momento de generarla:
          Jefatura Logística, Gerencia de Administración y, cuando corresponda,
          Gerencia General.
        </p>
      </div>
    </section>
  );
};

export default OrdenesCompraProcesoLogisticoPage;