import {
  buildInstitutionalLetterheadPrintHtml,
  escapeHtml,
} from "./configuracionEmpresaLetterhead";

export const approvalLabels = {
  JEFATURA: "Aprobación Jefatura",
  GERENCIA_AREA: "Aprobación Gerencia",
  GERENCIA_ADMINISTRACION: "Aprobación Gerencia Adm.",
  GERENCIA_GENERAL: "Aprobación Gerencia General",
};

export const defaultApprovalLevels = [
  "JEFATURA",
  "GERENCIA_AREA",
  "GERENCIA_ADMINISTRACION",
];

const normalizeText = (value) => {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const formatPrintDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("es-PE");
};

const formatMoney = (value) =>
  new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const joinUniqueSegments = (segments) => {
  const seen = new Set();
  return segments
    .map(normalizeText)
    .filter((segment) => {
      if (!segment) return false;
      const key = segment.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(" - ");
};

export const buildPrintedItemDescription = (item) => {
  if (!item) return "-";

  if (!item.esTemporal && item.producto) {
    const base =
      normalizeText(item.producto.nombre) ||
      normalizeText(item.descripcionVisible);
    const description = normalizeText(item.producto.descripcion);
    const brand = normalizeText(item.producto.marca?.nombre)
      ? `Marca: ${normalizeText(item.producto.marca?.nombre)}`
      : null;

    return joinUniqueSegments([base, description, brand]) || "-";
  }

  const temporal = item.productoTemporal || {};
  const base =
    normalizeText(temporal.nombre) ||
    normalizeText(item.descripcionVisible) ||
    "Producto temporal";
  const description = normalizeText(temporal.descripcion);

  return joinUniqueSegments([base, description]) || "Producto temporal";
};

const renderText = (value, fallback = "-") => normalizeText(value) || fallback;

export const buildRequerimientoPrintModel = ({
  requerimiento,
  signatures = [],
  applicableApprovalLevels = [],
}) => {
  const activeItems = Array.isArray(requerimiento?.items)
    ? requerimiento.items.filter((item) => item?.activo !== false)
    : [];

  const approvalLevels =
    Array.isArray(applicableApprovalLevels) && applicableApprovalLevels.length
      ? applicableApprovalLevels
      : defaultApprovalLevels;
  const signatureGridColumns =
    approvalLevels.length >= 4
      ? 2
      : Math.max(1, Math.min(approvalLevels.length, 3));
  const approvalMap = new Map(
    (Array.isArray(signatures) ? signatures : []).map((signature) => [
      signature.level,
      signature.approval || null,
    ]),
  );

  return {
    activeItems,
    approvalLevels,
    approvalMap,
    signatureGridColumns,
    observaciones: renderText(
      requerimiento?.observacionesGenerales || requerimiento?.descripcion,
    ),
  };
};

const buildItemRowsMarkup = (items) => {
  if (!items.length) {
    return `
      <tr>
        <td colspan="5" class="items-table__empty">
          Sin items registrados.
        </td>
      </tr>
    `;
  }

  return items
    .map(
      (item, index) => `
        <tr>
          <td class="items-table__cell items-table__cell--center">${index + 1}</td>
          <td class="items-table__cell">
            <div class="item-description">${escapeHtml(buildPrintedItemDescription(item))}</div>
          </td>
          <td class="items-table__cell items-table__cell--center">
            ${escapeHtml(`${item.cantidadRequerida} ${normalizeText(item.unidadMedida) || ""}`.trim())}
          </td>
          <td class="items-table__cell items-table__cell--right">
            ${escapeHtml(formatMoney(item.valorReferencialUnitario))}
          </td>
          <td class="items-table__cell items-table__cell--right">
            ${escapeHtml(formatMoney(item.subtotalReferencial))}
          </td>
        </tr>
      `,
    )
    .join("");
};

const buildSignatureMarkup = (levels, signatures) => {
  const approvalMap = new Map(
    (Array.isArray(signatures) ? signatures : []).map((signature) => [
      signature.level,
      signature.approval || null,
    ]),
  );

  return levels
    .map((level) => {
      const approval = approvalMap.get(level);
      const fallbackLabel = "Pendiente";
      const approverName =
        normalizeText(approval?.aprobador?.nombre) || fallbackLabel;
      const approvalDate = approval
        ? formatPrintDate(approval.fechaAccion)
        : fallbackLabel;

      return `
        <div class="signature-box">
          <p class="signature-box__title">${escapeHtml(
            approvalLabels[level] || level,
          )}</p>
          <div class="signature-box__content">
            <p><span>Nombre:</span> ${escapeHtml(approverName)}</p>
            <p><span>Fecha:</span> ${escapeHtml(approvalDate)}</p>
          </div>
        </div>
      `;
    })
    .join("");
};

export const buildRequerimientoPrintHtml = ({
  documentData,
  requerimiento,
  signatures = [],
  applicableApprovalLevels = [],
}) => {
  const { activeItems, approvalLevels, signatureGridColumns, observaciones } =
    buildRequerimientoPrintModel({
      requerimiento,
      signatures,
      applicableApprovalLevels,
    });

  const bodyMarkup = `
    <div class="document-body print-document">
      <section class="document-heading print-avoid-break">
        <h1>REQUERIMIENTO</h1>
      </section>

      <section class="document-summary print-avoid-break">
        <div class="summary-grid">
          <div><span>Código:</span> ${escapeHtml(renderText(requerimiento?.codigo))}</div>
          <div><span>Fecha:</span> ${escapeHtml(formatPrintDate(requerimiento?.fechaCreacion))}</div>
          <div><span>Área:</span> ${escapeHtml(renderText(requerimiento?.areaNombreSnapshot))}</div>
          <div><span>Solicitante:</span> ${escapeHtml(renderText(requerimiento?.solicitante?.nombre))}</div>
          <div class="summary-grid__full"><span>Uso:</span> ${escapeHtml(renderText(requerimiento?.usoFinalidad))}</div>
          <div class="summary-grid__full"><span>Ubicación:</span> ${escapeHtml(renderText(requerimiento?.ubicacionUso))}</div>
          <div class="summary-grid__full"><span>Observaciones:</span> ${escapeHtml(observaciones)}</div>
        </div>
      </section>

      <section class="items-section">
        <table class="items-table print-table">
          <thead>
            <tr>
              <th class="items-table__head items-table__head--center">Item</th>
              <th class="items-table__head">Descripción</th>
              <th class="items-table__head items-table__head--center">Cant.</th>
              <th class="items-table__head items-table__head--right">Valor ref. unitario</th>
              <th class="items-table__head items-table__head--right">Total referencial</th>
            </tr>
          </thead>
          <tbody>
            ${buildItemRowsMarkup(activeItems)}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="items-table__total-label">Total general</td>
              <td class="items-table__total-value">${escapeHtml(
                formatMoney(requerimiento?.totalReferencial),
              )}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section class="signatures-grid signatures-grid--cols-${signatureGridColumns}">
        ${buildSignatureMarkup(approvalLevels, signatures)}
      </section>
    </div>
  `;

  const extraStyles = `
    .document-body {
      display: flex;
      flex-direction: column;
      padding-top: 5mm;
      color: #0f172a;
    }
    .document-heading {
      border: 0.35mm solid #0f172a;
      border-left: 0;
      border-right: 0;
      padding: 3.2mm 0;
      text-align: center;
    }
    .document-heading h1 {
      margin: 0;
      font-size: 14pt;
      letter-spacing: 0.26em;
      font-weight: 800;
    }
    .document-summary {
      margin-top: 3.8mm;
      border: 0.35mm solid #0f172a;
      padding: 3.2mm 3.6mm;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 2.4mm 5mm;
      font-size: 9pt;
      line-height: 1.45;
    }
    .summary-grid span {
      font-weight: 700;
    }
    .summary-grid__full {
      grid-column: 1 / -1;
    }
    .items-section {
      margin-top: 4.2mm;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 8.7pt;
      color: #0f172a;
    }
    .items-table__head,
    .items-table__cell,
    .items-table__total-label,
    .items-table__total-value,
    .items-table__empty {
      border: 0.35mm solid #0f172a;
      padding: 2.3mm 2.4mm;
      vertical-align: top;
    }
    .items-table__head {
      background: #f8fafc;
      font-weight: 700;
      text-align: left;
    }
    .items-table__head--center,
    .items-table__cell--center {
      text-align: center;
    }
    .items-table__head--right,
    .items-table__cell--right,
    .items-table__total-label,
    .items-table__total-value {
      text-align: right;
    }
    .items-table__head:nth-child(1) { width: 8%; }
    .items-table__head:nth-child(2) { width: 46%; }
    .items-table__head:nth-child(3) { width: 12%; }
    .items-table__head:nth-child(4) { width: 17%; }
    .items-table__head:nth-child(5) { width: 17%; }
    .items-table tbody tr {
      break-inside: avoid-page;
      page-break-inside: avoid;
    }
    .items-table__total-label,
    .items-table__total-value {
      font-weight: 700;
      text-transform: uppercase;
    }
    .items-table__empty {
      text-align: center;
      color: #475569;
    }
    .item-description {
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.4;
    }
    .signatures-grid {
      margin-top: 4mm;
      display: grid;
      gap: 2.4mm;
    }
    .signatures-grid--cols-1 {
      grid-template-columns: minmax(0, 1fr);
    }
    .signatures-grid--cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .signatures-grid--cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .signature-box {
      min-height: 24mm;
      border: 0.35mm solid #0f172a;
      padding: 2.2mm 2.6mm;
      box-sizing: border-box;
      break-inside: avoid-page;
      page-break-inside: avoid;
    }
    .signature-box__title {
      margin: 0;
      padding-bottom: 1.2mm;
      border-bottom: 0.2mm solid #cbd5e1;
      font-size: 7.7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .signature-box__content {
      margin-top: 1.8mm;
      font-size: 7.8pt;
      line-height: 1.35;
    }
    .signature-box__content p {
      margin: 0 0 1mm;
    }
    .signature-box__content span {
      font-weight: 700;
    }
  `;

  return buildInstitutionalLetterheadPrintHtml({
    documentData,
    title: `Requerimiento ${renderText(requerimiento?.codigo, "sin-codigo")}`,
    bodyMarkup,
    extraStyles,
  });
};
