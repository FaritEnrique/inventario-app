import { describe, expect, it } from "vitest";
import {
  buildLetterheadDocumentData,
  buildInstitutionalLetterheadPrintHtml,
} from "./configuracionEmpresaLetterhead";
import {
  buildRequerimientoPrintHtml,
  buildRequerimientoPrintModel,
} from "./requerimientoPrintDocument";

const buildRequerimiento = () => ({
  codigo: "REQ-0001-2026",
  fechaCreacion: "2026-04-18T10:00:00.000Z",
  areaNombreSnapshot: "Logistica",
  solicitante: { nombre: "Farit Demo" },
  usoFinalidad: "Reposicion",
  ubicacionUso: "Almacen central",
  observacionesGenerales: "Documento de prueba",
  totalReferencial: 1234.5,
  items: Array.from({ length: 3 }, (_, index) => ({
    id: index + 1,
    descripcionVisible: `Item ${index + 1}`,
    cantidadRequerida: 2 + index,
    unidadMedida: "UND",
    valorReferencialUnitario: 10,
    subtotalReferencial: 20 + index,
    activo: true,
    esTemporal: false,
    producto: {
      nombre: `Producto ${index + 1}`,
      descripcion: `Descripcion ${index + 1}`,
      marca: { nombre: "Marca demo" },
    },
  })),
});

describe("requerimiento print document", () => {
  it("degrada a formato base cuando no hay membrete institucional", () => {
    const documentData = buildLetterheadDocumentData(
      {},
      "",
      { usePlaceholderIdentity: false },
    );
    const html = buildInstitutionalLetterheadPrintHtml({
      documentData,
      title: "Documento base",
      bodyMarkup: '<section class="document-body">contenido</section>',
    });

    expect(documentData.hasInstitutionalBranding).toBe(false);
    expect(html).toContain("sheet--plain");
    expect(html).not.toContain("Logo institucional");
    expect(html).not.toContain('<div class="header ');
    expect(html).not.toContain('<div class="footer">');
    expect(html).toContain("contenido");
  });

  it("inyecta reglas de paginacion y encabezado repetible para requerimientos largos", () => {
    const html = buildRequerimientoPrintHtml({
      documentData: buildLetterheadDocumentData({}, "", {
        usePlaceholderIdentity: false,
      }),
      requerimiento: buildRequerimiento(),
      signatures: [],
      applicableApprovalLevels: [
        "JEFATURA",
        "GERENCIA_AREA",
        "GERENCIA_ADMINISTRACION",
        "GERENCIA_GENERAL",
      ],
    });

    expect(html).toContain("display: table-header-group;");
    expect(html).toContain("display: table-footer-group;");
    expect(html).toContain("break-inside: avoid-page;");
    expect(html).toContain('class="items-table print-table"');
    expect(html).toContain(".items-table tbody tr");
  });

  it("mantiene el pie institucional dentro del flujo del requerimiento impreso", () => {
    const html = buildRequerimientoPrintHtml({
      documentData: buildLetterheadDocumentData(
        {
          razonSocial: "Logistica App SAC",
          ruc: "20123456789",
          direccion: "Av. Demo 123",
          correo: "demo@empresa.pe",
          telefono: "999999999",
          pieInstitucional: "Pie institucional de prueba",
        },
        "http://localhost:3000/uploads/logo.png",
        { usePlaceholderIdentity: false },
      ),
      requerimiento: buildRequerimiento(),
      signatures: [],
      applicableApprovalLevels: ["JEFATURA"],
    });

    expect(html).toContain('<div class="footer">');
    expect(html).toContain("Pie institucional de prueba");
    expect(html).not.toContain('class="document-body body-space');
    expect(html).toContain("margin-top: auto;");
  });

  it("usa una sola fuente de verdad para niveles de aprobacion del documento", () => {
    const model = buildRequerimientoPrintModel({
      requerimiento: buildRequerimiento(),
      signatures: [],
      applicableApprovalLevels: [
        "JEFATURA",
        "GERENCIA_AREA",
        "GERENCIA_ADMINISTRACION",
        "GERENCIA_GENERAL",
      ],
    });

    expect(model.approvalLevels).toEqual([
      "JEFATURA",
      "GERENCIA_AREA",
      "GERENCIA_ADMINISTRACION",
      "GERENCIA_GENERAL",
    ]);
    expect(model.signatureGridColumns).toBe(2);
  });
});
