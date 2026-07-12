import {
  buildInstitutionalLetterheadPrintHtml,
  escapeHtml,
} from "./configuracionEmpresaLetterhead";
import { getBienInventarioLabel } from "./bienesInventarioDespacho";
import {
  getEstadoPrestamoLabel,
  getModalidadSalidaLabel,
} from "./prestamosInventario";

const formatDate = (value, withTime = false) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return withTime
    ? parsed.toLocaleString("es-PE")
    : parsed.toLocaleDateString("es-PE");
};

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("es-PE", {
    maximumFractionDigits: 3,
  });

const safe = (value, fallback = "-") =>
  escapeHtml(String(value ?? "").trim() || fallback);

const buildRows = (rows, columns, emptyText) => {
  if (!rows.length) {
    return `<tr><td colspan="${columns.length}" class="align-center muted">${safe(
      emptyText,
    )}</td></tr>`;
  }

  return rows
    .map(
      (row) => `<tr>${columns
        .map(
          (column) =>
            `<td class="${column.align === "right" ? "align-right" : ""}">${safe(
              column.value(row),
            )}</td>`,
        )
        .join("")}</tr>`,
    )
    .join("");
};

const buildTable = ({ columns, rows, emptyText = "Sin registros." }) => `
  <table class="report-table print-table">
    <thead>
      <tr>
        ${columns
          .map(
            (column) =>
              `<th class="${column.align === "right" ? "align-right" : ""}">${safe(
                column.label,
              )}</th>`,
          )
          .join("")}
      </tr>
    </thead>
    <tbody>${buildRows(rows, columns, emptyText)}</tbody>
  </table>
`;

const buildSalidaSection = (salida) => {
  const esTemporal = salida.modalidadSalida === "TEMPORAL";
  const lineColumns = [
    { label: "Producto", value: (linea) => linea.producto?.nombre },
    {
      label: "Entregado",
      value: (linea) => formatNumber(linea.cantidadEntregada),
      align: "right",
    },
  ];

  if (esTemporal) {
    lineColumns.push(
      {
        label: "Devuelto",
        value: (linea) => formatNumber(linea.cantidadDevuelta),
        align: "right",
      },
      {
        label: "Regularizado",
        value: (linea) => formatNumber(linea.cantidadRegularizada),
        align: "right",
      },
      {
        label: "Pendiente",
        value: (linea) => formatNumber(linea.cantidadPendienteDevolucion),
        align: "right",
      },
    );
  }

  const returnNotes = (salida.notasIngresoDevolucion || []).map((nota) => ({
    codigo: nota.codigo,
    fecha: formatDate(nota.fechaRecepcion, true),
    almacen: nota.almacen?.nombre,
    estado: nota.inventarioPosteadoAt ? "Posteada" : "Pendiente de posteo",
  }));

  const regularizationActs = (salida.actasRegularizacion || []).map((acta) => ({
    codigo: acta.codigo,
    fecha: formatDate(acta.fechaEmision, true),
    motivo: acta.motivoOtro || acta.motivo,
    cantidad: formatNumber(acta.totalRegularizado),
  }));

  const individualRows = (salida.lineas || []).flatMap((linea) =>
    (linea.bienesSalida || []).map((bien) => {
      const returned = (linea.bienesDevueltos || []).some(
        (item) => Number(item.id) === Number(bien.id),
      );
      const regularized = (linea.bienesRegularizados || []).some(
        (item) => Number(item.id) === Number(bien.id),
      );
      return {
        producto: linea.producto?.nombre,
        unidad: getBienInventarioLabel(bien),
        situacion: returned
          ? "Devuelto"
          : regularized
            ? "Regularizado no devuelto"
            : "Pendiente de devolución",
      };
    }),
  );

  return `
    <section class="report-block print-avoid-break">
      <div class="section-heading split-heading">
        <div>
          <strong>${safe(salida.codigo)}</strong>
          <span>${safe(salida.almacen?.nombre)} · ${safe(
            formatDate(salida.fechaSalida, true),
          )}</span>
        </div>
        <div class="align-right">
          <strong>${safe(getModalidadSalidaLabel(salida.modalidadSalida))}</strong>
          ${
            esTemporal
              ? `<span>${safe(getEstadoPrestamoLabel(salida.estadoPrestamo))}</span>`
              : ""
          }
        </div>
      </div>
      ${buildTable({
        columns: lineColumns,
        rows: salida.lineas || [],
        emptyText: "La Nota de Salida no tiene líneas.",
      })}
      ${
        esTemporal && returnNotes.length
          ? `<h4>Notas de Ingreso por devolución</h4>${buildTable({
              columns: [
                { label: "Nota de Ingreso", value: (row) => row.codigo },
                { label: "Fecha", value: (row) => row.fecha },
                { label: "Almacén receptor", value: (row) => row.almacen },
                { label: "Estado", value: (row) => row.estado },
              ],
              rows: returnNotes,
            })}`
          : ""
      }
      ${
        esTemporal && regularizationActs.length
          ? `<h4>Actas de Regularización de Salida Temporal</h4>${buildTable({
              columns: [
                { label: "Acta", value: (row) => row.codigo },
                { label: "Fecha", value: (row) => row.fecha },
                { label: "Motivo", value: (row) => row.motivo },
                {
                  label: "Cantidad regularizada",
                  value: (row) => row.cantidad,
                  align: "right",
                },
              ],
              rows: regularizationActs,
            })}`
          : ""
      }
      ${
        individualRows.length
          ? `<h4>Unidades individualizadas</h4>${buildTable({
              columns: [
                { label: "Producto", value: (row) => row.producto },
                { label: "Serie / identificación", value: (row) => row.unidad },
                { label: "Situación", value: (row) => row.situacion },
              ],
              rows: individualRows,
            })}`
          : ""
      }
    </section>
  `;
};

export const buildPrestamoReportePrintHtml = ({
  documentData,
  reporte,
  alcance = "PEDIDO_INTERNO",
}) => {
  const pedido = reporte?.pedidoInterno || {};
  const salidas = Array.isArray(reporte?.salidas) ? reporte.salidas : [];
  const salidaPrincipal = salidas[0] || null;
  const modalidad =
    alcance === "NOTA_SALIDA"
      ? salidaPrincipal?.modalidadSalida || pedido.modalidadSalida
      : pedido.modalidadSalida;
  const fechaPrevista =
    alcance === "NOTA_SALIDA"
      ? salidaPrincipal?.fechaPrevistaDevolucion ||
        pedido.fechaPrevistaDevolucion
      : pedido.fechaPrevistaDevolucion;
  const finalidad =
    alcance === "NOTA_SALIDA"
      ? salidaPrincipal?.finalidadPrestamo || pedido.finalidadPrestamo
      : pedido.finalidadPrestamo;
  const esTemporal = modalidad === "TEMPORAL";

  const attentionColumns = [
    { label: "Producto", value: (linea) => linea.producto?.nombre },
    {
      label: "Solicitado",
      value: (linea) => formatNumber(linea.cantidadSolicitada),
      align: "right",
    },
    {
      label: "Entregado",
      value: (linea) => formatNumber(linea.cantidadEntregada),
      align: "right",
    },
    {
      label: "Pendiente de atención",
      value: (linea) => formatNumber(linea.cantidadPendienteAtencion),
      align: "right",
    },
  ];

  if (esTemporal) {
    attentionColumns.push(
      {
        label: "Devuelto",
        value: (linea) => formatNumber(linea.cantidadDevuelta),
        align: "right",
      },
      {
        label: "Regularizado",
        value: (linea) => formatNumber(linea.cantidadRegularizada),
        align: "right",
      },
      {
        label: "Pendiente de devolución",
        value: (linea) => formatNumber(linea.cantidadPendienteDevolucion),
        align: "right",
      },
    );
  }

  const bodyMarkup = `
    <div class="loan-report print-document">
      <section class="document-title print-avoid-break">
        <h1>REPORTE DE ATENCIÓN DE NOTA DE PEDIDO</h1>
        <p>Emitido por ${
          alcance === "NOTA_SALIDA" ? "Nota de Salida" : "Nota de Pedido"
        }</p>
      </section>

      <section class="metadata-grid print-avoid-break">
        <div><span>Nota de Pedido</span><strong>${safe(pedido.codigo)}</strong></div>
        <div><span>Fecha</span><strong>${safe(
          formatDate(pedido.fechaPedido, true),
        )}</strong></div>
        <div><span>Área solicitante</span><strong>${safe(
          pedido.areaSolicitante?.nombre,
        )}</strong></div>
        <div><span>Solicitante</span><strong>${safe(
          pedido.solicitante?.nombre,
        )}</strong></div>
        <div><span>Modalidad</span><strong>${safe(
          getModalidadSalidaLabel(modalidad),
        )}</strong></div>
        <div><span>Devolución prevista</span><strong>${safe(
          esTemporal ? formatDate(fechaPrevista) : "No aplica",
        )}</strong></div>
      </section>

      ${
        esTemporal && finalidad
          ? `<section class="purpose print-avoid-break"><strong>Finalidad del préstamo:</strong> ${safe(
              finalidad,
            )}</section>`
          : ""
      }

      <section class="report-block">
        <h3>Atención de la solicitud</h3>
        ${buildTable({
          columns: attentionColumns,
          rows: reporte?.lineas || [],
          emptyText: "La Nota de Pedido no tiene líneas para mostrar.",
        })}
      </section>

      <section class="report-block">
        <h3>Notas de Salida vinculadas</h3>
        ${
          salidas.length
            ? salidas.map(buildSalidaSection).join("")
            : '<p class="empty-state">La Nota de Pedido todavía no tiene salidas registradas.</p>'
        }
      </section>
    </div>
  `;

  const extraStyles = `
    .loan-report { padding-top: 3mm; font-family: "Segoe UI", Arial, sans-serif; }
    .document-title { text-align: center; border-top: .3mm solid #0f172a; border-bottom: .3mm solid #0f172a; padding: 3mm 0; }
    .document-title h1 { margin: 0; font-size: 14pt; letter-spacing: .06em; }
    .document-title p { margin: 1.5mm 0 0; font-size: 8pt; color: #475569; }
    .metadata-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5mm; margin-top: 5mm; }
    .metadata-grid div { border: .25mm solid #cbd5e1; padding: 2.5mm; min-height: 14mm; }
    .metadata-grid span { display: block; color: #64748b; font-size: 7pt; text-transform: uppercase; font-weight: 700; }
    .metadata-grid strong { display: block; margin-top: 1mm; font-size: 8.5pt; }
    .purpose { margin-top: 3mm; border: .25mm solid #f59e0b; background: #fffbeb; padding: 2.5mm; font-size: 8pt; }
    .report-block { margin-top: 5mm; }
    .report-block h3 { margin: 0 0 2mm; font-size: 10pt; text-transform: uppercase; }
    .report-block h4 { margin: 3mm 0 1.5mm; font-size: 8.5pt; }
    .report-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
    .report-table th { background: #0f172a; color: #fff; text-align: left; padding: 1.8mm; border: .2mm solid #0f172a; }
    .report-table td { padding: 1.8mm; border: .2mm solid #cbd5e1; vertical-align: top; }
    .align-right { text-align: right !important; }
    .align-center { text-align: center !important; }
    .muted { color: #64748b; }
    .section-heading { margin-top: 3mm; padding: 2.5mm; border: .25mm solid #cbd5e1; background: #f8fafc; }
    .split-heading { display: flex; justify-content: space-between; gap: 4mm; }
    .split-heading strong, .split-heading span { display: block; }
    .split-heading span { margin-top: .8mm; font-size: 7.5pt; color: #475569; }
    .empty-state { border: .25mm dashed #94a3b8; padding: 3mm; color: #64748b; font-size: 8pt; }
    @media print { .report-block { break-inside: auto; } }
  `;

  return buildInstitutionalLetterheadPrintHtml({
    documentData,
    title: `Reporte de atención ${pedido.codigo || ""}`.trim(),
    bodyMarkup,
    extraStyles,
    repeatHeaderFooterPerPage: true,
  });
};
