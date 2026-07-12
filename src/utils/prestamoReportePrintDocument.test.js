import { describe, expect, it } from "vitest";
import { buildLetterheadDocumentData } from "./configuracionEmpresaLetterhead";
import { buildPrestamoReportePrintHtml } from "./prestamoReportePrintDocument";

const documentData = buildLetterheadDocumentData(
  { razonSocial: "Entidad Demo", ruc: "20123456789" },
  "",
);

const temporalReport = {
  pedidoInterno: {
    id: 1,
    codigo: "NP-001",
    fechaPedido: "2026-07-12T12:00:00.000Z",
    modalidadSalida: "TEMPORAL",
    fechaPrevistaDevolucion: "2026-07-20T12:00:00.000Z",
    finalidadPrestamo: "Evento institucional",
    areaSolicitante: { nombre: "Administración" },
    solicitante: { nombre: "Usuario Área" },
  },
  lineas: [
    {
      pedidoInternoDetalleId: 10,
      producto: { nombre: "Televisor" },
      cantidadSolicitada: 2,
      cantidadEntregada: 2,
      cantidadPendienteAtencion: 0,
      cantidadDevuelta: 1,
      cantidadPendienteDevolucion: 1,
    },
  ],
  salidas: [
    {
      id: 2,
      codigo: "NS-001",
      fechaSalida: "2026-07-13T12:00:00.000Z",
      modalidadSalida: "TEMPORAL",
      estadoPrestamo: "PARCIALMENTE_DEVUELTO",
      almacen: { nombre: "Almacén Central" },
      lineas: [
        {
          notaSalidaDetalleId: 20,
          producto: { nombre: "Televisor" },
          cantidadEntregada: 2,
          cantidadDevuelta: 1,
          cantidadPendienteDevolucion: 1,
          bienesSalida: [{ id: 100, numeroSerie: "TV-001" }],
          bienesDevueltos: [{ id: 100, numeroSerie: "TV-001" }],
        },
      ],
      notasIngresoDevolucion: [
        {
          id: 3,
          codigo: "NI-DEV-001",
          fechaRecepcion: "2026-07-15T12:00:00.000Z",
          inventarioPosteadoAt: "2026-07-15T12:00:00.000Z",
          almacen: { nombre: "Almacén Central" },
        },
      ],
    },
  ],
};

describe("buildPrestamoReportePrintHtml", () => {
  it("consolida pedido, salida, devolución y series en el documento", () => {
    const html = buildPrestamoReportePrintHtml({
      documentData,
      reporte: temporalReport,
      alcance: "PEDIDO_INTERNO",
    });

    expect(html).toContain("NP-001");
    expect(html).toContain("NS-001");
    expect(html).toContain("NI-DEV-001");
    expect(html).toContain("TV-001");
    expect(html).toContain("Pendiente de devolución");
    expect(html).toContain("Entidad Demo");
  });

  it("omite columnas de devolución en una salida definitiva", () => {
    const report = {
      ...temporalReport,
      pedidoInterno: {
        ...temporalReport.pedidoInterno,
        modalidadSalida: "DEFINITIVA",
        fechaPrevistaDevolucion: null,
        finalidadPrestamo: null,
      },
      lineas: temporalReport.lineas.map((linea) => ({
        ...linea,
        cantidadDevuelta: 0,
        cantidadPendienteDevolucion: 0,
      })),
      salidas: temporalReport.salidas.map((salida) => ({
        ...salida,
        modalidadSalida: "DEFINITIVA",
        notasIngresoDevolucion: [],
      })),
    };

    const html = buildPrestamoReportePrintHtml({
      documentData,
      reporte: report,
    });

    expect(html).toContain("Salida definitiva");
    expect(html).not.toContain("Finalidad del préstamo");
    expect(html).not.toContain("Notas de Ingreso por devolución");
  });
});
