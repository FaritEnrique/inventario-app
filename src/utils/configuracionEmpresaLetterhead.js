import { institutionalLetterheadMetrics } from "./documentBrandingMetrics";

export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeText = (value) => String(value ?? "").trim();

export const buildUploadsBaseUrl = () => {
  const rawApiUrl =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === "development" ? "http://localhost:3000" : "");

  return String(rawApiUrl || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
};

export const resolveInstitutionalAssetUrl = (assetUrl) => {
  if (!assetUrl) return "";

  if (
    assetUrl.startsWith("blob:") ||
    assetUrl.startsWith("data:") ||
    assetUrl.startsWith("http://") ||
    assetUrl.startsWith("https://")
  ) {
    return assetUrl;
  }

  const uploadsBaseUrl = buildUploadsBaseUrl();
  if (!uploadsBaseUrl) {
    return assetUrl;
  }

  return `${uploadsBaseUrl}${assetUrl.startsWith("/") ? "" : "/"}${assetUrl}`;
};

export const buildLetterheadDocumentData = (
  formData = {},
  logoSrc = "",
  { usePlaceholderIdentity = true } = {},
) => {
  const razonSocial =
    normalizeText(formData.razonSocial) ||
    (usePlaceholderIdentity ? "Empresa emisora" : "");
  const ruc =
    normalizeText(formData.ruc) || (usePlaceholderIdentity ? "Sin RUC" : "");
  const frase = normalizeText(formData.fraseEncabezado);
  const comentario = normalizeText(formData.pieInstitucional);
  const direccion = normalizeText(formData.direccion);
  const correo = normalizeText(formData.correo);
  const telefono = normalizeText(formData.telefono);
  const hasInstitutionalBranding = Boolean(
    normalizeText(formData.razonSocial) ||
    normalizeText(formData.ruc) ||
    frase ||
    comentario ||
    direccion ||
    correo ||
    telefono ||
    logoSrc,
  );

  return {
    razonSocial,
    ruc,
    frase,
    comentario,
    logoSrc: logoSrc || "",
    hasPhrase: Boolean(frase),
    hasComentario: Boolean(comentario),
    hasInstitutionalBranding,
    contacts: {
      direccion,
      correo,
      telefono,
    },
  };
};

export const buildSharedPrintDocumentStyles = () => `
  @page { size: A4; margin: 0; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: "Segoe UI", Arial, sans-serif;
    background: #ffffff;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  * { box-sizing: border-box; }
  img {
    max-width: 100%;
  }
  .print-document,
  .print-sheet {
    color: #0f172a;
  }
  .print-document table,
  .print-table,
  .items-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .print-document thead,
  .print-table thead,
  .items-table thead {
    display: table-header-group;
  }
  .print-document tfoot,
  .print-table tfoot,
  .items-table tfoot {
    display: table-footer-group;
  }
  .print-document tr,
  .print-document td,
  .print-document th,
  .print-table tr,
  .print-table td,
  .print-table th,
  .items-table tr,
  .items-table td,
  .items-table th,
  .print-avoid-break {
    break-inside: avoid-page;
    page-break-inside: avoid;
  }
  .print-page-break {
    break-before: page;
    page-break-before: always;
  }
`;

const buildLetterheadIconSvg = (type) => {
  const common =
    'width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

  if (type === "direccion") {
    return `<svg ${common}><path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z"></path><circle cx="12" cy="11" r="2.5"></circle></svg>`;
  }

  if (type === "correo") {
    return `<svg ${common}><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"></path></svg>`;
  }

  if (type === "telefono") {
    return `<span class="icon-stack"><svg ${common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.46-1.29a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92Z"></path></svg><svg ${common} class="whatsapp-icon"><path d="M20 12a8 8 0 0 1-11.87 7l-3.13 1 1.03-3.03A8 8 0 1 1 20 12Z"></path><path d="M9.6 8.9c-.2-.45-.42-.46-.62-.47h-.53c-.18 0-.47.07-.71.33-.24.27-.93.9-.93 2.2s.95 2.55 1.08 2.73c.13.18 1.83 2.93 4.52 3.99 2.24.88 2.69.71 3.17.66.49-.04 1.57-.64 1.8-1.26.22-.62.22-1.16.16-1.26-.07-.11-.24-.18-.49-.31s-1.57-.77-1.81-.86c-.24-.09-.42-.13-.6.13-.18.27-.68.86-.84 1.04-.16.18-.31.2-.58.07-.27-.13-1.12-.41-2.13-1.31-.79-.7-1.33-1.57-1.49-1.84-.16-.27-.02-.41.12-.54.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.14-.61-1.53-.85-2.04Z"></path></svg></span>`;
  }

  return "";
};

export const buildInstitutionalLetterheadPrintHtml = ({
  documentData,
  title = "Documento institucional",
  bodyMarkup = '<div class="body-space"></div>',
  extraStyles = "",
  repeatHeaderFooterPerPage = false,
}) => {
  const metrics = institutionalLetterheadMetrics.print;
  const {
    razonSocial,
    ruc,
    frase,
    comentario,
    hasPhrase,
    hasComentario,
    logoSrc,
    contacts,
  } = documentData;
  const shouldRenderInstitutionalBranding =
    documentData?.hasInstitutionalBranding !== false;

  const logoMarkup = logoSrc
    ? `<img class="brand-logo" src="${escapeHtml(logoSrc)}" alt="Logo institucional" />`
    : `<div class="brand-fallback">LOGO</div>`;

  const footerContactsMarkup = [
    ["direccion", contacts.direccion],
    ["correo", contacts.correo],
    ["telefono", contacts.telefono],
  ]
    .map(([type, value]) =>
      value
        ? `
          <div class="footer-contact-item">
            <span class="footer-contact-icon">${buildLetterheadIconSvg(type)}</span>
            <span class="footer-contact-value">${escapeHtml(value)}</span>
          </div>
        `
        : "",
    )
    .filter(Boolean)
    .join("");

  const headerMarkup = shouldRenderInstitutionalBranding
    ? `<div class="header ${hasPhrase ? "" : "header--no-phrase"}">
        <div class="brand-column">
          <div class="brand-row">
            ${logoMarkup}
            <div class="brand-copy">
              <div class="brand-company">${escapeHtml(razonSocial)}</div>
              <div class="brand-tax-id">
                <strong>RUC</strong>
                <span>${escapeHtml(ruc)}</span>
              </div>
            </div>
          </div>
        </div>
        ${
          hasPhrase
            ? `<div class="phrase-column">
                <div class="phrase-box">${escapeHtml(frase)}</div>
              </div>`
            : ""
        }
      </div>`
    : "";

  const footerMarkup = shouldRenderInstitutionalBranding
    ? `<div class="footer">
        ${footerContactsMarkup ? `<div class="footer-contacts">${footerContactsMarkup}</div>` : ""}
        ${hasComentario ? `<div class="footer-copy">${escapeHtml(comentario)}</div>` : ""}
      </div>`
    : "";

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          ${buildSharedPrintDocumentStyles()}
          .sheet {
            width: 210mm;
            min-height: 297mm;
            padding: ${metrics.sheetPadding};
            display: flex;
            flex-direction: column;
            background: #ffffff;
          }
          .sheet--plain {
            padding: 14mm;
          }
          .letterhead-multipage {
            width: 210mm;
            min-height: 297mm;
            background: #ffffff;
          }
          .letterhead-fixed-header {
            position: fixed;
            top: ${metrics.pageTopPadding};
            left: ${metrics.pageHorizontalPadding};
            right: ${metrics.pageHorizontalPadding};
            z-index: 2;
          }
          .letterhead-fixed-footer {
            position: fixed;
            bottom: ${metrics.pageBottomPadding};
            left: ${metrics.pageHorizontalPadding};
            right: ${metrics.pageHorizontalPadding};
            z-index: 2;
          }
          .letterhead-page-table {
            width: 210mm;
            min-height: 297mm;
            border-collapse: collapse;
            table-layout: fixed;
            background: #ffffff;
          }
          .letterhead-page-table > thead {
            display: table-header-group;
          }
          .letterhead-page-table > tfoot {
            display: table-footer-group;
          }
          .letterhead-page-table > tbody {
            display: table-row-group;
          }
          .letterhead-page-table td {
            padding: 0;
            vertical-align: top;
          }
          .letterhead-page-table td.letterhead-page-body {
            padding: 0 ${metrics.pageHorizontalPadding};
          }
          .letterhead-page-header-spacer {
            height: ${metrics.multipageHeaderSpacerHeight};
          }
          .letterhead-page-footer-spacer {
            height: ${metrics.multipageFooterSpacerHeight};
          }
          .header {
            display: grid;
            grid-template-columns: ${metrics.headerColumns};
            gap: ${metrics.headerGap};
            align-items: start;
            padding-bottom: ${metrics.headerPaddingBottom};
            border-bottom: ${metrics.headerBorderWidth} solid #0f172a;
          }
          .header--no-phrase {
            grid-template-columns: minmax(0, 1fr);
          }
          .brand-column {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0;
            min-width: 0;
          }
          .brand-row {
            display: grid;
            grid-template-columns: ${metrics.brandRowColumns};
            gap: ${metrics.brandRowGap};
            align-items: center;
            width: 100%;
            min-width: 0;
          }
          .brand-copy {
            display: flex;
            min-width: 0;
            flex-direction: column;
            align-items: flex-start;
            gap: ${metrics.brandCopyGap};
          }
          .brand-logo, .brand-fallback {
            width: ${metrics.logoWidth};
            height: ${metrics.logoHeight};
            border-radius: ${metrics.logoRadius};
            object-fit: contain;
            object-position: left center;
            border: ${metrics.logoBorderWidth} solid #dbe3ef;
            background: #ffffff;
          }
          .brand-fallback {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            background: #f8fafc;
            color: #64748b;
            font-weight: 700;
            letter-spacing: 0.12em;
            font-size: 8pt;
            padding-left: 3mm;
          }
          .brand-company {
            font-size: ${metrics.brandCompanyFontSize};
            line-height: ${metrics.brandCompanyLineHeight};
            font-weight: 700;
            max-width: none;
            word-break: break-word;
          }
          .brand-tax-id {
            display: inline-flex;
            align-items: center;
            gap: ${metrics.taxIdGap};
            border-radius: 999px;
            border: ${metrics.logoBorderWidth} solid #cbd5e1;
            background: #f8fafc;
            padding: ${metrics.taxIdPadding};
            font-size: ${metrics.taxIdFontSize};
            font-weight: 600;
            white-space: nowrap;
          }
          .phrase-column {
            min-height: ${metrics.phraseColumnMinHeight};
            display: flex;
            align-items: center;
            justify-content: stretch;
            text-align: left;
          }
          .phrase-box {
            width: 100%;
            min-height: ${metrics.phraseMinHeight};
            border-radius: ${metrics.logoRadius};
            background: transparent;
            padding: ${metrics.phrasePadding};
            color: #1e3a8a;
            font-size: ${metrics.phraseFontSize};
            line-height: ${metrics.phraseLineHeight};
            font-weight: 700;
            font-style: italic;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .body-space { flex: 1; }
          .footer {
            margin-top: auto;
            padding-top: ${metrics.footerPaddingTop};
            border-top: ${metrics.logoBorderWidth} solid #dbe3ef;
          }
          .footer-contacts {
            display: grid;
            grid-template-columns: ${metrics.footerColumns};
            gap: ${metrics.footerGap};
            align-items: start;
          }
          .footer-contact-item {
            min-width: 0;
            padding: ${metrics.footerContactPadding};
            display: flex;
            align-items: center;
            gap: 2.8mm;
          }
          .footer-contact-icon {
            color: #0f172a;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            width: ${metrics.footerIconSize};
            height: ${metrics.footerIconSize};
            border-radius: 999px;
            background: #f8fafc;
          }
          .footer-contact-value {
            display: block;
            min-width: 0;
            font-size: ${metrics.footerValueFontSize};
            line-height: ${metrics.footerValueLineHeight};
            color: #0f172a;
            font-weight: 600;
            word-break: break-word;
            text-align: left;
          }
          .footer-copy {
            margin-top: ${metrics.footerCopyMarginTop};
            text-align: center;
            font-size: ${metrics.footerCopyFontSize};
            line-height: ${metrics.footerCopyLineHeight};
            color: #475569;
            white-space: pre-wrap;
          }
          .icon-stack {
            display: inline-flex;
            align-items: center;
            gap: 1.5mm;
          }
          .whatsapp-icon {
            color: #16a34a;
          }
          ${extraStyles}
        </style>
      </head>
      <body>
        ${
          shouldRenderInstitutionalBranding && repeatHeaderFooterPerPage
            ? `<div class="letterhead-multipage print-document">
                <div class="letterhead-fixed-header">${headerMarkup}</div>
                <div class="letterhead-fixed-footer">${footerMarkup}</div>
                <table class="letterhead-page-table">
                  <thead>
                    <tr>
                      <td><div class="letterhead-page-header-spacer"></div></td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="letterhead-page-body">${bodyMarkup}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><div class="letterhead-page-footer-spacer"></div></td>
                    </tr>
                  </tfoot>
                </table>
              </div>`
            : `<div class="sheet print-sheet print-document ${shouldRenderInstitutionalBranding ? "" : "sheet--plain"}">
                ${headerMarkup}
                ${bodyMarkup}
                ${footerMarkup}
              </div>`
        }
      </body>
    </html>
  `;
};

export const buildBlankLetterheadPrintHtml = (documentData) =>
  buildInstitutionalLetterheadPrintHtml({
    documentData,
    title: "Membrete institucional",
    bodyMarkup: '<div class="body-space"></div>',
  });
