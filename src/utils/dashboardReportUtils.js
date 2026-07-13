// src/utils/dashboardReportUtils.js
import {
  buildInstitutionalLetterheadPrintHtml,
  escapeHtml as escapeInstitutionalHtml,
} from "./configuracionEmpresaLetterhead";
import { printHtmlInNewWindow } from "./printWindow";

const normalizeReportValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : "-";
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "-" : value.toLocaleString("es-PE");
  }

  return String(value).replace(/\s+/g, " ").trim() || "-";
};

const buildFileName = (fileName = "reporte", extension = "xlsx") => {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${fileName}-${stamp}.${extension}`;
};

const getColumnValue = (column, row) =>
  typeof column.value === "function" ? column.value(row) : row[column.key];

const getAlignClass = (align) => {
  if (align === "center") return "align-center";
  if (align === "right") return "align-right";

  return "align-left";
};

const buildSafeDocumentData = (documentData) =>
  documentData || {
    hasInstitutionalBranding: false,
    razonSocial: "",
    ruc: "",
    frase: "",
    comentario: "",
    logoSrc: "",
    hasPhrase: false,
    hasComentario: false,
    contacts: {
      direccion: "",
      correo: "",
      telefono: "",
    },
  };

const escapeXml = (value) =>
  String(normalizeReportValue(value))
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const textEncoder = new TextEncoder();

const toBytes = (value) => textEncoder.encode(value);

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index;

  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }

  return crc >>> 0;
});

const getCrc32 = (bytes) => {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
};

const writeUint16 = (view, offset, value) => {
  view.setUint16(offset, value, true);
};

const writeUint32 = (view, offset, value) => {
  view.setUint32(offset, value, true);
};

const concatBytes = (parts) => {
  const totalLength = parts.reduce((acc, part) => acc + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });

  return output;
};

const createZipBlob = (files) => {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach(({ name, content }) => {
    const nameBytes = toBytes(name);
    const dataBytes = toBytes(content);
    const crc32 = getCrc32(dataBytes);

    const localHeader = new Uint8Array(30);
    const localView = new DataView(localHeader.buffer);

    writeUint32(localView, 0, 0x04034b50);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 6, 0);
    writeUint16(localView, 8, 0);
    writeUint16(localView, 10, 0);
    writeUint16(localView, 12, 0);
    writeUint32(localView, 14, crc32);
    writeUint32(localView, 18, dataBytes.length);
    writeUint32(localView, 22, dataBytes.length);
    writeUint16(localView, 26, nameBytes.length);
    writeUint16(localView, 28, 0);

    localParts.push(localHeader, nameBytes, dataBytes);

    const centralHeader = new Uint8Array(46);
    const centralView = new DataView(centralHeader.buffer);

    writeUint32(centralView, 0, 0x02014b50);
    writeUint16(centralView, 4, 20);
    writeUint16(centralView, 6, 20);
    writeUint16(centralView, 8, 0);
    writeUint16(centralView, 10, 0);
    writeUint16(centralView, 12, 0);
    writeUint16(centralView, 14, 0);
    writeUint32(centralView, 16, crc32);
    writeUint32(centralView, 20, dataBytes.length);
    writeUint32(centralView, 24, dataBytes.length);
    writeUint16(centralView, 28, nameBytes.length);
    writeUint16(centralView, 30, 0);
    writeUint16(centralView, 32, 0);
    writeUint16(centralView, 34, 0);
    writeUint16(centralView, 36, 0);
    writeUint32(centralView, 38, 0);
    writeUint32(centralView, 42, offset);

    centralParts.push(centralHeader, nameBytes);

    offset += localHeader.length + nameBytes.length + dataBytes.length;
  });

  const centralDirectory = concatBytes(centralParts);
  const localDirectory = concatBytes(localParts);

  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);

  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 4, 0);
  writeUint16(endView, 6, 0);
  writeUint16(endView, 8, files.length);
  writeUint16(endView, 10, files.length);
  writeUint32(endView, 12, centralDirectory.length);
  writeUint32(endView, 16, localDirectory.length);
  writeUint16(endView, 20, 0);

  return new Blob([localDirectory, centralDirectory, endRecord], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

const getExcelColumnName = (index) => {
  let columnName = "";
  let currentIndex = index;

  while (currentIndex > 0) {
    const remainder = (currentIndex - 1) % 26;
    columnName = String.fromCharCode(65 + remainder) + columnName;
    currentIndex = Math.floor((currentIndex - 1) / 26);
  }

  return columnName;
};

const getExcelStyleIndex = (align) => {
  if (align === "center") return 3;
  if (align === "right") return 4;

  return 2;
};

const buildExcelCell = ({ reference, value, styleIndex }) => {
  const normalizedValue = normalizeReportValue(value);

  if (typeof normalizedValue === "number") {
    return `<c r="${reference}" s="${styleIndex}"><v>${normalizedValue}</v></c>`;
  }

  return `<c r="${reference}" s="${styleIndex}" t="inlineStr"><is><t>${escapeXml(
    normalizedValue,
  )}</t></is></c>`;
};

export const downloadExcelReport = ({
  rows = [],
  columns = [],
  fileName = "reporte",
  sheetName = "Reporte",
}) => {
  const safeSheetName = String(sheetName || "Reporte")
    .replace(/[\\/?*[\]:]/g, " ")
    .slice(0, 31);

  const effectiveRows =
    rows.length > 0
      ? rows
      : [
          columns.reduce(
            (acc, column, index) => ({
              ...acc,
              [`empty_${index}`]:
                index === 0 ? "Sin registros para mostrar." : "",
              [column.key]: index === 0 ? "Sin registros para mostrar." : "",
            }),
            {},
          ),
        ];

  const lastColumnName = getExcelColumnName(columns.length);
  const lastRowNumber = effectiveRows.length + 1;

  const columnWidths = columns
    .map((column, index) => {
      const columnNumber = index + 1;
      const width =
        column.width || Math.max(String(column.header || "").length + 4, 14);

      return `<col min="${columnNumber}" max="${columnNumber}" width="${width}" customWidth="1"/>`;
    })
    .join("");

  const headerCells = columns
    .map((column, index) => {
      const reference = `${getExcelColumnName(index + 1)}1`;

      return buildExcelCell({
        reference,
        value: column.header,
        styleIndex: 1,
      });
    })
    .join("");

  const bodyRows = effectiveRows
    .map((row, rowIndex) => {
      const excelRowNumber = rowIndex + 2;

      const cells = columns
        .map((column, columnIndex) => {
          const reference = `${getExcelColumnName(
            columnIndex + 1,
          )}${excelRowNumber}`;
          const value =
            rows.length > 0
              ? getColumnValue(column, row)
              : columnIndex === 0
                ? "Sin registros para mostrar."
                : "";

          return buildExcelCell({
            reference,
            value,
            styleIndex: getExcelStyleIndex(column.align),
          });
        })
        .join("");

      return `<row r="${excelRowNumber}">${cells}</row>`;
    })
    .join("");

  const worksheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumnName}${lastRowNumber}"/>
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <cols>${columnWidths}</cols>
  <sheetData>
    <row r="1">${headerCells}</row>
    ${bodyRows}
  </sheetData>
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
</worksheet>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(safeSheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FF312E81"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEEF2FF"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFE2E8F0"/></left>
      <right style="thin"><color rgb="FFE2E8F0"/></right>
      <top style="thin"><color rgb="FFE2E8F0"/></top>
      <bottom style="thin"><color rgb="FFE2E8F0"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="5">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="49" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const blob = createZipBlob([
    {
      name: "[Content_Types].xml",
      content: contentTypesXml,
    },
    {
      name: "_rels/.rels",
      content: relsXml,
    },
    {
      name: "xl/workbook.xml",
      content: workbookXml,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: workbookRelsXml,
    },
    {
      name: "xl/styles.xml",
      content: stylesXml,
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: worksheetXml,
    },
  ]);

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = buildFileName(fileName, "xlsx");
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};

export const printTableReport = ({
  title = "Reporte",
  subtitle = "",
  rows = [],
  columns = [],
  documentData = null,
}) => {

  const headerHtml = columns
    .map(
      (column) =>
        `<th class="${getAlignClass(
          column.headerAlign || "center",
        )}">${escapeInstitutionalHtml(column.header)}</th>`,
    )
    .join("");

  const rowsHtml = rows
    .map((row) => {
      const cells = columns
        .map((column) => {
          const value = getColumnValue(column, row);

          return `<td class="${getAlignClass(column.align)}">${escapeInstitutionalHtml(
            normalizeReportValue(value),
          )}</td>`;
        })
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");

  const generatedAt = new Date().toLocaleString("es-PE");

  const bodyMarkup = `
    <div class="dashboard-report print-document">
      <section class="dashboard-report-heading print-avoid-break">
        <h1>${escapeInstitutionalHtml(title)}</h1>
        ${
          subtitle
            ? `<p class="dashboard-report-subtitle">${escapeInstitutionalHtml(
                subtitle,
              )}</p>`
            : ""
        }
        <p class="dashboard-report-meta">
          Generado: ${escapeInstitutionalHtml(generatedAt)} | Registros: ${
            rows.length
          }
        </p>
      </section>

      <section class="dashboard-report-table-section">
        <table class="dashboard-report-table print-table">
          <thead>
            <tr>${headerHtml}</tr>
          </thead>
          <tbody>
            ${
              rows.length > 0
                ? rowsHtml
                : `<tr><td class="align-center" colspan="${columns.length}">Sin registros para mostrar.</td></tr>`
            }
          </tbody>
        </table>
      </section>
    </div>
  `;

  const extraStyles = `
    .dashboard-report {
      color: #0f172a;
      padding-top: 4mm;
      font-family: "Segoe UI", Arial, sans-serif;
    }

    .dashboard-report-heading {
      border: 0.3mm solid #0f172a;
      border-left: 0;
      border-right: 0;
      padding: 3mm 0;
      text-align: center;
      margin-bottom: 5mm;
    }

    .dashboard-report-heading h1 {
      margin: 0;
      font-size: 14pt;
      line-height: 1.2;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .dashboard-report-subtitle {
      margin: 2mm 0 0;
      color: #475569;
      font-size: 8.5pt;
      line-height: 1.35;
      font-weight: 600;
    }

    .dashboard-report-meta {
      margin: 2mm 0 0;
      color: #64748b;
      font-size: 7.8pt;
      line-height: 1.3;
    }

    .dashboard-report-table-section {
      width: 100%;
    }

    .dashboard-report-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 7.7pt;
    }

    .dashboard-report-table th {
      text-align: center;
      background: #eef2ff;
      color: #312e81;
      border: 0.25mm solid #c7d2fe;
      padding: 2mm;
      vertical-align: middle;
      font-weight: 800;
    }

    .dashboard-report-table td {
      border: 0.25mm solid #e2e8f0;
      padding: 1.8mm 2mm;
      vertical-align: middle;
      color: #0f172a;
      word-break: break-word;
    }

    .dashboard-report-table tr:nth-child(even) td {
      background: #f8fafc;
    }

    .align-left {
      text-align: left;
    }

    .align-center {
      text-align: center;
    }

    .align-right {
      text-align: right;
    }
  `;

  const html = buildInstitutionalLetterheadPrintHtml({
    documentData: buildSafeDocumentData(documentData),
    title,
    bodyMarkup,
    extraStyles,
    repeatHeaderFooterPerPage: true,
  });

  return printHtmlInNewWindow(html, {
    features: "width=1100,height=750",
  }).catch(() => null);
};
