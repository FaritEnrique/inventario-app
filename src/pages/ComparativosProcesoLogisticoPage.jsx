import React, { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import useLogisticaCotizaciones from "../hooks/useLogisticaCotizaciones";
import { buildComparativoFlujoViewModel } from "../utils/comparativoFlujoViewModel";
import { getFlujosActivos, isFlujoCerrado } from "../utils/flujoCotizacionUi";
import { formatInteger, formatQuantity } from "../utils/numberFormatters";

const TIPO_COMPRA_LABELS = {
  LOCAL: "LOCAL",
  IMPORTACION: "IMPORTACION",
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "-";

const formatText = (value, fallback = "-") =>
  String(value ?? "").trim() || fallback;

const formatMoney = (value, currency = "PEN") => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";

  const normalizedCurrency = String(currency || "").toUpperCase();
  const prefix =
    normalizedCurrency === "USD"
      ? "US$"
      : normalizedCurrency === "PEN"
        ? "S/"
        : currency || "";

  return `${prefix} ${number.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const booleanText = (value) => {
  if (value === true) return "Si";
  if (value === false) return "No";
  return "";
};

const buildConditionRows = (condiciones = {}, tipoCompra) => {
  const commonRows = [
    ["Moneda", condiciones.moneda],
    ["Codigo moneda otra", condiciones.codigoMonedaOtra],
    ["Incluye IGV", booleanText(condiciones.incluyeIgv)],
    ["Tiempo de entrega", condiciones.tiempoEntregaDias],
    ["Garantia", condiciones.garantia],
    ["Vigencia de oferta", condiciones.vigenciaOfertaDias],
    ["Lugar de entrega", condiciones.lugarEntrega],
  ];

  const rows =
    tipoCompra === "IMPORTACION"
      ? [
          ["Incoterm", condiciones.incoterm],
          ["Version Incoterm", condiciones.incotermVersion],
          ["Punto logistico", condiciones.incotermPuntoLogistico],
          ["Estructura de pago", condiciones.estructuraPagoImportacion],
          ["Instrumento de pago", condiciones.instrumentoPagoImportacion],
          ["Gatillo de pago", condiciones.gatilloPagoImportacion],
          ["Anticipo", condiciones.porcentajeAnticipoImportacion],
          ["Saldo", condiciones.porcentajeSaldoImportacion],
          ["Dias de credito", condiciones.diasCreditoImportacion],
          ["Referencia de plazo", condiciones.referenciaPlazoImportacion],
          ["Gastos bancarios", condiciones.gastosBancariosPor],
          ...commonRows,
        ]
      : [
          ["Alcance", condiciones.alcanceCompraLocal],
          ["Tipo lugar entrega", condiciones.lugarEntregaLocalTipo],
          ["Detalle lugar entrega", condiciones.lugarEntregaLocalDetalle],
          ["Transporte asumido por", condiciones.transporteAsumidoPor],
          ["Carga/descarga", condiciones.cargaDescargaAsumidaPor],
          [
            "Entregas parciales",
            booleanText(condiciones.permiteEntregasParciales),
          ],
          ["Condiciones logisticas", condiciones.condicionesLogisticasLocales],
          ["Condicion de pago", condiciones.condicionPagoLocal],
          ["Hito de pago", condiciones.hitoPagoLocal],
          ["Anticipo", condiciones.porcentajeAnticipoLocal],
          ["Saldo", condiciones.porcentajeSaldoLocal],
          ["Dias de credito", condiciones.diasCreditoLocal],
          ...commonRows,
        ];

  return rows.filter(([, value]) => hasValue(value));
};

const buildOfferRows = (condiciones = {}, tipoCompra) => {
  const rows = [
    ["Pago propuesto", condiciones.pagoPropuestoResumen],
    ["Plazo de entrega", condiciones.tiempoEntregaDias],
    ["Lugar de entrega", condiciones.lugarEntrega],
    ["Garantia", condiciones.garantia],
    ["Vigencia de oferta", condiciones.vigenciaOfertaDias],
    ["Observaciones", condiciones.observaciones],
  ];

  if (tipoCompra === "IMPORTACION") {
    rows.push(
      ["Estructura de pago", condiciones.estructuraPagoImportacionPropuesta],
      ["Instrumento de pago", condiciones.instrumentoPagoImportacionPropuesta],
      ["Gatillo de pago", condiciones.gatilloPagoImportacionPropuesta],
      ["Anticipo", condiciones.porcentajeAnticipoImportacionPropuesto],
      ["Saldo", condiciones.porcentajeSaldoImportacionPropuesto],
      ["Dias de credito", condiciones.diasCreditoImportacionPropuesto],
      ["Referencia plazo", condiciones.referenciaPlazoImportacionPropuesta],
      ["Gastos bancarios", condiciones.gastosBancariosPorPropuesto],
      ["Documentos", condiciones.documentosPagoImportacionPropuestos],
      ["Observacion pago", condiciones.observacionPagoImportacionPropuesta],
    );
  } else {
    rows.push(
      ["Forma de pago", condiciones.formaPagoLocalPropuesta],
      ["Dias de credito", condiciones.diasCreditoLocalPropuesto],
      ["Anticipo", condiciones.porcentajeAnticipoLocalPropuesto],
      ["Saldo", condiciones.porcentajeSaldoLocalPropuesto],
      ["Observacion pago", condiciones.observacionPagoLocalPropuesta],
    );
  }

  return rows.filter(([, value]) => hasValue(value));
};

const ComparativosProcesoLogisticoPage = () => {
  const { id, detalleGlobal, loading, error } = useOutletContext();
  const { obtenerComparativoPorFlujo } = useLogisticaCotizaciones();
  const flujos = useMemo(
    () => getFlujosActivos(detalleGlobal?.flujosCotizacion),
    [detalleGlobal?.flujosCotizacion],
  );
  const [selectedFlujoId, setSelectedFlujoId] = useState(null);
  const [comparativoFlujo, setComparativoFlujo] = useState(null);
  const [loadingComparativo, setLoadingComparativo] = useState(false);

  useEffect(() => {
    if (!flujos.length) {
      setSelectedFlujoId(null);
      return;
    }

    setSelectedFlujoId((current) =>
      flujos.some((flujo) => Number(flujo.id) === Number(current))
        ? current
        : flujos[0].id,
    );
  }, [flujos]);

  const selectedFlujo = useMemo(
    () =>
      flujos.find((flujo) => Number(flujo.id) === Number(selectedFlujoId)) ||
      null,
    [flujos, selectedFlujoId],
  );
  const selectedFlujoCerrado = isFlujoCerrado(selectedFlujo);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!selectedFlujo?.id || !selectedFlujoCerrado) {
        setComparativoFlujo(null);
        return;
      }

      setLoadingComparativo(true);
      try {
        const data = await obtenerComparativoPorFlujo(selectedFlujo.id);
        if (!cancelled) setComparativoFlujo(data);
      } finally {
        if (!cancelled) setLoadingComparativo(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [obtenerComparativoPorFlujo, selectedFlujo?.id, selectedFlujoCerrado]);

  const viewModel = useMemo(
    () => buildComparativoFlujoViewModel(comparativoFlujo || {}),
    [comparativoFlujo],
  );
  const tipoCompra = selectedFlujo?.tipoCompra || viewModel.tipoCompra;
  const tipoCompraLabel = TIPO_COMPRA_LABELS[tipoCompra] || tipoCompra || "-";
  const condicionesSolicitadasRows = buildConditionRows(
    viewModel.condicionesSolicitadas,
    tipoCompra,
  );
  const matrixMinWidth = `${520 + viewModel.cotizacionesComparables.length * 720}px`;

  if (loading && !detalleGlobal) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold leading-snug text-gray-900 sm:text-2xl">
          Cuadro comparativo de bienes por flujo
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm">
          LOCAL e IMPORTACIÓN se revisan como comparativos derivados separados.
          Esta matriz es informativa y deriva de las cotizaciones cerradas del flujo.
          La decisión formal se registrará en una etapa posterior.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!flujos.length ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Aun no existen flujos de cotizacion. Emita solicitudes para generar
          un flujo LOCAL o de IMPORTACION.
        </section>
      ) : (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {flujos.map((flujo) => {
                const active = Number(flujo.id) === Number(selectedFlujoId);
                const closed = isFlujoCerrado(flujo);
                return (
                  <button
                    key={flujo.id}
                    type="button"
                    onClick={() => setSelectedFlujoId(flujo.id)}
                    className={`rounded border px-4 py-2 text-sm font-semibold ${
                      active
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {TIPO_COMPRA_LABELS[flujo.tipoCompra] || flujo.tipoCompra}
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                        closed
                          ? "bg-slate-100 text-slate-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {closed ? "CERRADO" : "ABIERTO"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {!selectedFlujoCerrado ? (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
              El flujo {tipoCompraLabel} se encuentra abierto. Cierre el flujo
              de cotizacion para generar el cuadro comparativo derivado.
              <div className="mt-3">
                <Link
                  to={`/cotizaciones/proceso/${id}/cotizaciones`}
                  className="inline-flex rounded border border-amber-400 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                >
                  Ir a cierre de cotizaciones
                </Link>
              </div>
            </section>
          ) : loadingComparativo ? (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="h-5 w-52 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-20 animate-pulse rounded-lg bg-slate-100" />
            </section>
          ) : (
            <>
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Comparativo {tipoCompraLabel}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Derivado desde solicitudes y cotizaciones activas del
                      flujo cerrado.
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    DERIVADO
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {[
                    ["Solicitudes", viewModel.resumen.totalSolicitudes],
                    ["Cotizaciones", viewModel.resumen.totalCotizaciones],
                    [
                      "Comparables",
                      viewModel.resumen.totalProveedoresComparables,
                    ],
                    [
                      "Sin cotizacion valida",
                      viewModel.resumen.totalProveedoresSinCotizacionValida,
                    ],
                    ["Items", viewModel.resumen.totalItemsRequeridos],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-slate-200 p-3"
                    >
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        {label}
                      </p>
                      <p className="mt-2 text-right text-xl font-bold tabular-nums text-slate-900">
                        {formatInteger(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">
                  Condiciones solicitadas por la entidad
                </h2>
                {condicionesSolicitadasRows.length ? (
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {condicionesSolicitadasRows.map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <dt className="text-xs font-semibold uppercase text-slate-500">
                          {label}
                        </dt>
                        <dd className="mt-1 text-sm text-slate-800">
                          {formatText(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No registrado</p>
                )}
              </section>

              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-4">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Matriz comparativa de bienes
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Los items NO COTIZA se mantienen visibles como
                    trazabilidad.
                  </p>
                </div>
                {viewModel.cotizacionesComparables.length ? (
                  <div className="overflow-x-auto">
                    <table
                      className="w-full border-collapse text-sm"
                      style={{ minWidth: matrixMinWidth }}
                    >
                      <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                        <tr>
                          <th rowSpan={2} className="w-16 px-3 py-3 text-center">
                            Item
                          </th>
                          <th rowSpan={2} className="w-72 px-3 py-3 text-center">
                            Descripcion requerida
                          </th>
                          <th rowSpan={2} className="w-24 px-3 py-3 text-center">
                            Unidad
                          </th>
                          <th rowSpan={2} className="w-28 px-3 py-3 text-center">
                            Cant. req.
                          </th>
                          {viewModel.cotizacionesComparables.map((cotizacion) => (
                            <th
                              key={cotizacion.cotizacionId}
                              colSpan={5}
                              className="border-l border-slate-200 px-3 py-3 text-center"
                            >
                              <div className="font-semibold text-slate-800">
                                {formatText(cotizacion.proveedor?.razonSocial)}
                              </div>
                              <div className="mt-1 text-[11px] normal-case text-slate-500">
                                RUC {formatText(cotizacion.proveedor?.ruc)} -{" "}
                                {formatText(cotizacion.solicitudCodigo)} -{" "}
                                {formatText(cotizacion.moneda)}
                              </div>
                            </th>
                          ))}
                        </tr>
                        <tr>
                          {viewModel.cotizacionesComparables.map((cotizacion) => (
                            <React.Fragment key={`sub-${cotizacion.cotizacionId}`}>
                              {[
                                "Especificacion ofertada",
                                "Cantidad",
                                "P.U.",
                                "P.T.",
                                "Estado",
                              ].map((label) => (
                                <th
                                  key={`${cotizacion.cotizacionId}-${label}`}
                                  className="border-b border-l border-slate-200 px-3 py-2 text-center"
                                >
                                  {label}
                                </th>
                              ))}
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {viewModel.itemsRequeridos.map((item) => (
                          <tr
                            key={item.itemRequerimientoId}
                            className="border-b border-slate-100 align-top"
                          >
                            <td className="px-3 py-3 text-center font-semibold text-slate-700">
                              {formatInteger(item.numero)}
                            </td>
                            <td className="px-3 py-3 text-slate-900">
                              <p>{item.descripcionSolicitada}</p>
                              {item.observaciones ? (
                                <p className="mt-1 text-xs text-slate-500">
                                  {item.observaciones}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {formatText(item.unidadMedida)}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums">
                              {formatQuantity(item.cantidadRequerida)}
                            </td>
                            {viewModel.cotizacionesComparables.map((cotizacion) => {
                              const cell =
                                cotizacion.matrizPorItem[
                                  String(item.itemRequerimientoId)
                                ];

                              return (
                                <React.Fragment
                                  key={`${item.itemRequerimientoId}-${cotizacion.cotizacionId}`}
                                >
                                  <td className="border-l border-slate-100 px-3 py-3 align-middle">
                                    {cell?.estado === "COTIZADO"
                                      ? formatText(
                                          cell.descripcionTecnicaOfertada,
                                        )
                                      : "-"}
                                  </td>
                                  <td className="px-3 py-3 text-right tabular-nums align-middle">
                                    {cell?.estado === "COTIZADO"
                                      ? formatQuantity(cell.cantidadOfrecida)
                                      : "-"}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums align-middle">
                                    {cell?.estado === "COTIZADO"
                                      ? formatMoney(
                                          cell.precioUnidad,
                                          cotizacion.moneda,
                                        )
                                      : "-"}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums align-middle">
                                    {cell?.estado === "COTIZADO"
                                      ? formatMoney(
                                          cell.precioTotal,
                                          cotizacion.moneda,
                                        )
                                      : "-"}
                                  </td>
                                  <td className="px-3 py-3 text-center align-middle">
                                    <span
                                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                        cell?.estado === "COTIZADO"
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {cell?.estado === "NO_COTIZA"
                                        ? "NO COTIZA"
                                        : cell?.estado || "SIN RESPUESTA"}
                                    </span>
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-sm text-slate-500">
                    No hay cotizaciones comparables en este flujo.
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">
                  Condiciones ofertadas por proveedor
                </h2>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  {viewModel.cotizacionesComparables.map((cotizacion) => {
                    const rows = buildOfferRows(
                      cotizacion.condicionesOfertadas,
                      tipoCompra,
                    );

                    return (
                      <article
                        key={cotizacion.cotizacionId}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {formatText(cotizacion.proveedor?.razonSocial)}
                            </h3>
                            <p className="text-sm text-slate-500">
                              RUC {formatText(cotizacion.proveedor?.ruc)} -{" "}
                              {formatText(cotizacion.solicitudCodigo)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Fecha cotizacion: {formatDate(cotizacion.fechaEmision)}
                            </p>
                          </div>
                          <p className="text-right font-semibold tabular-nums text-slate-900">
                            {formatMoney(cotizacion.totalOferta, cotizacion.moneda)}
                          </p>
                        </div>
                        {rows.length ? (
                          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                            {rows.map(([label, value]) => (
                              <div key={label}>
                                <dt className="text-xs font-semibold uppercase text-slate-500">
                                  {label}
                                </dt>
                                <dd className="mt-1 text-sm text-slate-800">
                                  {formatText(value)}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        ) : (
                          <p className="mt-3 text-sm text-slate-500">
                            No registrado
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">
                  Proveedores invitados sin cotizacion valida
                </h2>
                {viewModel.proveedoresSinCotizacionValida.length ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-center">Proveedor</th>
                          <th className="px-3 py-2 text-center">RUC</th>
                          <th className="px-3 py-2 text-center">Solicitud</th>
                          <th className="px-3 py-2 text-center">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewModel.proveedoresSinCotizacionValida.map((entry) => (
                          <tr
                            key={`${entry.solicitudId}-${entry.proveedor?.id}-${entry.motivo}`}
                            className="border-b border-slate-100"
                          >
                            <td className="px-3 py-3">
                              {formatText(entry.proveedor?.razonSocial)}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {formatText(entry.proveedor?.ruc)}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {formatText(entry.solicitudCodigo)}
                            </td>
                            <td className="px-3 py-3">
                              {formatText(entry.motivoLabel)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    No hay proveedores invitados pendientes de cotizacion
                    valida en este flujo.
                  </p>
                )}
              </section>
            </>
          )}
        </>
      )}
    </section>
  );
};

export default ComparativosProcesoLogisticoPage;
