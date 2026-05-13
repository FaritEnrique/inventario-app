import { describe, expect, it } from "vitest";
import { buildSolicitudCotizacionDocumentContract } from "./solicitudCotizacionDocumentContract.js";
import { LOCAL_TAX_NOTICE } from "../features/solicitud-cotizacion/solicitudCotizacionCatalog.js";

describe("solicitudCotizacionDocumentContract", () => {
  it("muestra el flujo local sin mezclarlo con importacion", () => {
    const contract = buildSolicitudCotizacionDocumentContract({
      codigo: "SC-001",
      tipoCompra: "LOCAL",
      alcanceCompraLocal: "NACIONAL",
      lugarEntregaLocalTipo: "ALMACEN_COMPRADOR",
      lugarEntregaLocalDetalle: "Almacen central",
      transporteAsumidoPor: "PROVEEDOR",
      cargaDescargaAsumidaPor: "COMPRADOR",
      permiteEntregasParciales: true,
      condicionesLogisticasLocales: "Coordinar cita",
      condicionPagoLocal: "CREDITO",
      diasCreditoLocal: 45,
      moneda: "PEN",
      incluyeIgv: true,
      medioRecepcion: "SISTEMA",
      fechaLimiteRecepcion: "2026-05-06T10:30:00.000Z",
      items: [],
    });

    expect(contract.condiciones.condicionPagoLocal).toBe("CREDITO");
    expect(contract.condiciones.tipoCompraLabel).toBe("Compra local");
    expect(contract.condiciones.alcanceCompraLocalLabel).toBe("Nacional");
    expect(contract.condiciones.lugarEntregaLocalTipoLabel).toBe(
      "Almacen del comprador",
    );
    expect(contract.condiciones.transporteAsumidoPorLabel).toBe("Proveedor");
    expect(contract.condiciones.cargaDescargaAsumidaPorLabel).toBe("Comprador");
    expect(contract.condiciones.permiteEntregasParcialesLabel).toBe("Sí");
    expect(contract.condiciones.condicionPagoLocalLabel).toBe("Crédito");
    expect(contract.condiciones.formaPagoLocalLabel).toBe("Crédito: 45 días");
    expect(contract.condiciones.diasCreditoLocal).toBe(45);
    expect(contract.condiciones.diasCreditoLocalLabel).toBe("45 días");
    expect(contract.condiciones.tratamientoTributarioLocal).toBe(
      LOCAL_TAX_NOTICE,
    );
    expect(contract.condiciones.estructuraPagoImportacion).toBeNull();
  });

  it("muestra la semántica de IMPORTACION con estructura, instrumento y gatillo", () => {
    const contract = buildSolicitudCotizacionDocumentContract({
      codigo: "SC-002",
      tipoCompra: "IMPORTACION",
      estructuraPagoImportacion: "CONTRA_DOCUMENTOS",
      instrumentoPagoImportacion: "COBRANZA_DOCUMENTARIA",
      gatilloPagoImportacion: "CONTRA_DOCUMENTOS_EMBARQUE",
      incoterm: "FAS",
      incotermVersion: "2020",
      incotermPuntoLogistico: "Muelle de origen",
      moneda: "USD",
      incluyeIgv: false,
      medioRecepcion: "CORREO",
      fechaLimiteRecepcion: "2026-05-06T10:30:00.000Z",
      items: [],
    });

    expect(contract.condiciones.estructuraPagoImportacionLabel).toBe(
      "Contra documentos",
    );
    expect(contract.condiciones.instrumentoPagoImportacionLabel).toBe(
      "Cobranza documentaria",
    );
    expect(contract.condiciones.gatilloPagoImportacionLabel).toBe(
      "Contra documentos de embarque",
    );
    expect(contract.condiciones.incoterm).toBe("FAS");
    expect(contract.condiciones.incotermTransportModeLabel).toBe(
      "Exclusivo marítimo / fluvial",
    );
    expect(contract.condiciones.condicionPagoLocal).toBeNull();
    expect(contract.condiciones.tratamientoTributarioLocal).toBeNull();
  });

  it("muestra moneda OTRA con codigo libre y medio fisico", () => {
    const contract = buildSolicitudCotizacionDocumentContract({
      codigo: "SC-004",
      tipoCompra: "IMPORTACION",
      moneda: "OTRA",
      codigoMonedaOtra: "JPY",
      medioRecepcion: "FISICO",
      fechaLimiteRecepcion: "2026-05-06T10:30:00.000Z",
      items: [],
    });

    expect(contract.condiciones.monedaLabel).toBe("Otra moneda");
    expect(contract.condiciones.codigoMonedaOtra).toBe("JPY");
    expect(contract.recepcion.medioRecepcionLabel).toBe("Fisico");
  });

  it("respeta etiquetas documentales provistas por backend", () => {
    const contract = buildSolicitudCotizacionDocumentContract({
      documento: {
        codigo: "SC-003",
        condiciones: {
          tipoCompra: "IMPORTACION",
          estructuraPagoImportacion: "CREDITO_PLAZO",
          estructuraPagoImportacionLabel: "Crédito a plazo",
          instrumentoPagoImportacion: "CUENTA_ABIERTA",
          instrumentoPagoImportacionLabel: "Cuenta abierta",
          diasCreditoImportacion: 60,
          diasCreditoImportacionLabel: "60 días",
          referenciaPlazoImportacion: "BL",
          referenciaPlazoImportacionLabel: "BL",
        },
        recepcion: {
          medioRecepcion: "CORREO",
          medioRecepcionLabel: "Correo",
          fechaLimiteRecepcion: "2026-05-06T10:30:00.000Z",
        },
        items: [],
      },
    });

    expect(contract.condiciones.estructuraPagoImportacion).toBe(
      "CREDITO_PLAZO",
    );
    expect(contract.condiciones.estructuraPagoImportacionLabel).toBe(
      "Crédito a plazo",
    );
    expect(contract.condiciones.instrumentoPagoImportacionLabel).toBe(
      "Cuenta abierta",
    );
    expect(contract.condiciones.diasCreditoImportacionLabel).toBe("60 días");
  });
});
