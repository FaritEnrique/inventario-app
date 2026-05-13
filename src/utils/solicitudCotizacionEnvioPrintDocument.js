import {
  buildInstitutionalLetterheadPrintHtml,
  escapeHtml,
} from "./configuracionEmpresaLetterhead";

const normalizeText = (value) => String(value ?? "").trim();

const renderText = (value, fallback = "-") => normalizeText(value) || fallback;

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("es-PE");
};

const buildHistoryRows = (historial = []) => {
  if (!historial.length) {
    return `
      <tr>
        <td colspan="8" class="trace-table__empty">
          No hay envios registrados para esta solicitud.
        </td>
      </tr>
    `;
  }

  return historial
    .map(
      (event) => `
        <tr>
          <td class="trace-table__cell">${escapeHtml(formatDateTime(event.fechaHoraEnvio))}</td>
          <td class="trace-table__cell">${escapeHtml(renderText(event.correoDestino))}</td>
          <td class="trace-table__cell">${escapeHtml(renderText(event.asunto))}</td>
          <td class="trace-table__cell">${escapeHtml(renderText(event.enviadoPor?.nombre))}</td>
          <td class="trace-table__cell trace-table__cell--center">${escapeHtml(renderText(event.tipoEnvio))}</td>
          <td class="trace-table__cell trace-table__cell--center">${escapeHtml(renderText(event.resultadoEnvio))}</td>
          <td class="trace-table__cell">${escapeHtml(renderText(event.nombreArchivoAdjunto))}</td>
          <td class="trace-table__cell">${escapeHtml(renderText(event.providerMessageId || event.detalleError))}</td>
        </tr>
      `,
    )
    .join("");
};

export const buildSolicitudCotizacionEnvioTracePrintHtml = ({
  documentData,
  solicitud,
  historial = [],
  printedBy = null,
}) => {
  const chronologicalHistory = [...historial].reverse();

  const bodyMarkup = `
    <div class="trace-document print-document">
      <section class="trace-heading print-avoid-break">
        <h1>Trazabilidad de envio por correo de Solicitud de Cotizacion</h1>
      </section>

      <section class="trace-summary print-avoid-break">
        <div><span>Codigo de solicitud:</span> ${escapeHtml(renderText(solicitud?.codigo))}</div>
        <div><span>Proveedor:</span> ${escapeHtml(renderText(solicitud?.proveedor?.razonSocial))}</div>
        <div><span>Requerimiento asociado:</span> ${escapeHtml(renderText(solicitud?.requerimiento?.codigo))}</div>
        <div><span>Fecha de emision:</span> ${escapeHtml(formatDateTime(solicitud?.fechaEmision))}</div>
        <div><span>Fecha de impresion:</span> ${escapeHtml(formatDateTime(new Date()))}</div>
        <div><span>Usuario que imprime:</span> ${escapeHtml(renderText(printedBy?.nombre))}</div>
      </section>

      <section class="trace-history">
        <table class="trace-table print-table">
          <thead>
            <tr>
              <th class="trace-table__head">Fecha y hora</th>
              <th class="trace-table__head">Destinatario</th>
              <th class="trace-table__head">Asunto</th>
              <th class="trace-table__head">Enviado por</th>
              <th class="trace-table__head trace-table__head--center">Tipo</th>
              <th class="trace-table__head trace-table__head--center">Resultado</th>
              <th class="trace-table__head">Adjunto</th>
              <th class="trace-table__head">Proveedor / error</th>
            </tr>
          </thead>
          <tbody>
            ${buildHistoryRows(chronologicalHistory)}
          </tbody>
        </table>
      </section>
    </div>
  `;

  const extraStyles = `
    .trace-document {
      padding-top: 5mm;
      color: #0f172a;
    }
    .trace-heading {
      border: 0.35mm solid #0f172a;
      border-left: 0;
      border-right: 0;
      padding: 3mm 0;
      text-align: center;
    }
    .trace-heading h1 {
      margin: 0;
      font-size: 12pt;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .trace-summary {
      margin-top: 4mm;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 2mm 6mm;
      border: 0.3mm solid #cbd5e1;
      padding: 3mm 3.4mm;
      font-size: 8.7pt;
      line-height: 1.45;
    }
    .trace-summary span {
      font-weight: 700;
    }
    .trace-history {
      margin-top: 4mm;
    }
    .trace-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 7.4pt;
    }
    .trace-table__head,
    .trace-table__cell,
    .trace-table__empty {
      border: 0.25mm solid #cbd5e1;
      padding: 1.7mm 1.8mm;
      vertical-align: top;
      overflow-wrap: anywhere;
    }
    .trace-table__head {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      text-align: left;
      text-transform: uppercase;
    }
    .trace-table__head--center,
    .trace-table__cell--center {
      text-align: center;
    }
    .trace-table__empty {
      text-align: center;
      color: #475569;
    }
    .trace-table__head:nth-child(1) { width: 15%; }
    .trace-table__head:nth-child(2) { width: 17%; }
    .trace-table__head:nth-child(3) { width: 18%; }
    .trace-table__head:nth-child(4) { width: 13%; }
    .trace-table__head:nth-child(5) { width: 8%; }
    .trace-table__head:nth-child(6) { width: 9%; }
    .trace-table__head:nth-child(7) { width: 11%; }
    .trace-table__head:nth-child(8) { width: 9%; }
  `;

  return buildInstitutionalLetterheadPrintHtml({
    documentData,
    title: `Trazabilidad de envio ${renderText(solicitud?.codigo, "sin-codigo")}`,
    bodyMarkup,
    extraStyles,
    repeatHeaderFooterPerPage: true,
  });
};
