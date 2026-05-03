import { describe, expect, it } from "vitest";
import {
  buildSolicitudCotizacionPayload,
  buildImportPaymentInstrumentFormState,
  buildImportPaymentStructureFormState,
  buildLocalPaymentConditionFormState,
  buildTipoCompraFormState,
  calculateSolicitudTotals,
  formatSolicitudMoney,
} from "./solicitudCotizacionFormModel.js";
import { INCOTERM_GROUPS } from "../features/solicitud-cotizacion/solicitudCotizacionCatalog.js";

describe("solicitudCotizacionFormModel", () => {
  it("expone Incoterms 2020 completos e impide DAT", () => {
    const incoterms = INCOTERM_GROUPS.flatMap((group) =>
      group.options.map((option) => option.value),
    );

    expect(incoterms).toEqual([
      "EXW",
      "FCA",
      "CPT",
      "CIP",
      "DAP",
      "DPU",
      "DDP",
      "FAS",
      "FOB",
      "CFR",
      "CIF",
    ]);
    expect(incoterms).toContain("FAS");
    expect(incoterms).toContain("DPU");
    expect(incoterms).not.toContain("DAT");
  });

  it("limpia residuos de LOCAL al cambiar a IMPORTACION", () => {
    const nextState = buildTipoCompraFormState(
      {
        tipoCompra: "LOCAL",
        condicionPagoLocal: "MIXTO",
        porcentajeAnticipoLocal: "35",
        porcentajeSaldoLocal: "65",
        estructuraPagoImportacion: "CONTRA_DOCUMENTOS",
        instrumentoPagoImportacion: "CARTA_CREDITO",
        gatilloPagoImportacion: "CONTRA_DOCUMENTOS_EMBARQUE",
        incoterm: "FOB",
        incotermVersion: "2020",
        incotermPuntoLogistico: "Callao",
      },
      "IMPORTACION",
    );

    expect(nextState.tipoCompra).toBe("IMPORTACION");
    expect(nextState).not.toHaveProperty("formaPago");
    expect(nextState).not.toHaveProperty("diasCredito");
    expect(nextState.condicionPagoLocal).toBe("");
    expect(nextState.porcentajeAnticipoLocal).toBe("");
    expect(nextState.porcentajeSaldoLocal).toBe("");
  });

  it("limpia residuos de IMPORTACION al cambiar a LOCAL", () => {
    const nextState = buildTipoCompraFormState(
      {
        tipoCompra: "IMPORTACION",
        estructuraPagoImportacion: "CREDITO_PLAZO",
        instrumentoPagoImportacion: "CARTA_CREDITO",
        diasCreditoImportacion: "15",
        referenciaPlazoImportacion: "BL",
        gastosBancariosPor: "COMPARTIDO",
        incoterm: "CIF",
        incotermVersion: "2020",
        incotermPuntoLogistico: "Callao",
      },
      "LOCAL",
    );

    expect(nextState.tipoCompra).toBe("LOCAL");
    expect(nextState).not.toHaveProperty("formaPago");
    expect(nextState.estructuraPagoImportacion).toBe("");
    expect(nextState.instrumentoPagoImportacion).toBe("");
    expect(nextState.diasCreditoImportacion).toBe("");
    expect(nextState.referenciaPlazoImportacion).toBe("");
    expect(nextState.gastosBancariosPor).toBe("");
    expect(nextState.incoterm).toBe("");
    expect(nextState.incotermVersion).toBe("2020");
    expect(nextState.incotermPuntoLogistico).toBe("");
  });

  it("limpia campos de importacion cuando cambia la estructura", () => {
    const nextState = buildImportPaymentStructureFormState(
      {
        estructuraPagoImportacion: "CREDITO_PLAZO",
        gatilloPagoImportacion: "CONTRA_BL_ORIGINAL",
        porcentajeAnticipoImportacion: "30",
        porcentajeSaldoImportacion: "70",
        diasCreditoImportacion: "45",
        referenciaPlazoImportacion: "BL",
      },
      "CONTRA_DOCUMENTOS",
    );

    expect(nextState.estructuraPagoImportacion).toBe("CONTRA_DOCUMENTOS");
    expect(nextState.gatilloPagoImportacion).toBe("CONTRA_BL_ORIGINAL");
    expect(nextState.porcentajeAnticipoImportacion).toBe("");
    expect(nextState.porcentajeSaldoImportacion).toBe("");
    expect(nextState.diasCreditoImportacion).toBe("");
    expect(nextState.referenciaPlazoImportacion).toBe("");
  });

  it("limpia gastos bancarios cuando el instrumento deja de ser carta de crédito", () => {
    const nextState = buildImportPaymentInstrumentFormState(
      {
        instrumentoPagoImportacion: "CARTA_CREDITO",
        gastosBancariosPor: "COMPARTIDO",
      },
      "TRANSFERENCIA_TT",
    );

    expect(nextState.instrumentoPagoImportacion).toBe("TRANSFERENCIA_TT");
    expect(nextState.gastosBancariosPor).toBe("");
  });

  it("construye payload LOCAL con flujo propio configurable", () => {
    const payload = buildSolicitudCotizacionPayload(
      {
        proveedorId: "3",
        requerimientoId: "2",
        cuerpoSolicitud: "  Solicitud local  ",
        estado: "Creada",
        moneda: "PEN",
        incluyeIgv: "true",
        vigenciaOfertaDias: "15",
        tiempoEntregaDias: "7",
        lugarEntrega: "  Almacén central  ",
        alcanceCompraLocal: "NACIONAL",
        lugarEntregaLocalTipo: "ALMACEN_COMPRADOR",
        lugarEntregaLocalDetalle: "  Almacen central Lima  ",
        transporteAsumidoPor: "PROVEEDOR",
        cargaDescargaAsumidaPor: "COMPRADOR",
        permiteEntregasParciales: "true",
        condicionesLogisticasLocales: "  Coordinar cita  ",
        condicionPagoLocal: "CREDITO",
        diasCreditoLocal: "30",
        garantia: " 12 meses ",
        fechaLimiteRecepcion: "2026-05-05T10:30",
        medioRecepcion: "SISTEMA",
        tipoCompra: "LOCAL",
        incoterm: "FOB",
        incotermVersion: "2020",
        incotermPuntoLogistico: "Callao",
        itemIds: ["2", "3"],
      },
      "dias",
    );

    expect(payload.tipoCompra).toBe("LOCAL");
    expect(payload.moneda).toBe("PEN");
    expect(payload.incluyeIgv).toBe(true);
    expect(payload.condicionPagoLocal).toBe("CREDITO");
    expect(payload.alcanceCompraLocal).toBe("NACIONAL");
    expect(payload.lugarEntregaLocalTipo).toBe("ALMACEN_COMPRADOR");
    expect(payload.lugarEntregaLocalDetalle).toBe("Almacen central Lima");
    expect(payload.transporteAsumidoPor).toBe("PROVEEDOR");
    expect(payload.cargaDescargaAsumidaPor).toBe("COMPRADOR");
    expect(payload.permiteEntregasParciales).toBe(true);
    expect(payload.condicionesLogisticasLocales).toBe("Coordinar cita");
    expect(payload.diasCreditoLocal).toBe(30);
    expect(payload.fechaLimiteRecepcion).toBe("2026-05-05T15:30:00.000Z");
    expect(payload.medioRecepcion).toBe("SISTEMA");
    expect(payload).not.toHaveProperty("estructuraPagoImportacion");
    expect(payload).not.toHaveProperty("incoterm");
    expect(payload).not.toHaveProperty("incotermVersion");
    expect(payload).not.toHaveProperty("incotermPuntoLogistico");
  });

  it("construye payload IMPORTACION con estructura, instrumento y gatillo", () => {
    const payload = buildSolicitudCotizacionPayload(
      {
        proveedorId: "1",
        requerimientoId: "2",
        cuerpoSolicitud: "Solicitud importación",
        estado: "Creada",
        moneda: "USD",
        incluyeIgv: "false",
        vigenciaOfertaDias: "20",
        tiempoEntregaDias: "30",
        lugarEntrega: "Puerto del Callao",
        estructuraPagoImportacion: "CONTRA_DOCUMENTOS",
        instrumentoPagoImportacion: "CARTA_CREDITO",
        gatilloPagoImportacion: "CONTRA_DOCUMENTOS_EMBARQUE",
        gastosBancariosPor: "COMPARTIDO",
        garantia: "según fabricante",
        fechaLimiteRecepcion: "2026-05-06T10:30",
        medioRecepcion: "CORREO",
        tipoCompra: "IMPORTACION",
        incoterm: "FOB",
        incotermVersion: "2020",
        incotermPuntoLogistico: "Callao",
        itemIds: ["4"],
      },
      "dias",
    );

    expect(payload.tipoCompra).toBe("IMPORTACION");
    expect(payload.moneda).toBe("USD");
    expect(payload.incluyeIgv).toBe(false);
    expect(payload.estructuraPagoImportacion).toBe("CONTRA_DOCUMENTOS");
    expect(payload.instrumentoPagoImportacion).toBe("CARTA_CREDITO");
    expect(payload.gatilloPagoImportacion).toBe("CONTRA_DOCUMENTOS_EMBARQUE");
    expect(payload.gastosBancariosPor).toBe("COMPARTIDO");
    expect(payload.fechaLimiteRecepcion).toBe("2026-05-06T15:30:00.000Z");
    expect(payload.medioRecepcion).toBe("CORREO");
    expect(payload).not.toHaveProperty("condicionPagoLocal");
    expect(payload).not.toHaveProperty("alcanceCompraLocal");
    expect(payload.incoterm).toBe("FOB");
    expect(payload.incotermVersion).toBe("2020");
    expect(payload.incotermPuntoLogistico).toBe("Callao");
  });

  it("limpia subcampos locales al cambiar de condición", () => {
    const nextState = buildLocalPaymentConditionFormState(
      {
        condicionPagoLocal: "MIXTO",
        hitoPagoLocal: "CONTRA_ENTREGA",
        porcentajeAnticipoLocal: "35",
        porcentajeSaldoLocal: "65",
        diasCreditoLocal: "30",
      },
      "CONTADO",
    );

    expect(nextState.condicionPagoLocal).toBe("CONTADO");
    expect(nextState.hitoPagoLocal).toBe("CONTRA_ENTREGA");
    expect(nextState.porcentajeAnticipoLocal).toBe("");
    expect(nextState.porcentajeSaldoLocal).toBe("");
    expect(nextState.diasCreditoLocal).toBe("");
  });
  it("construye payload con moneda OTRA y codigo libre", () => {
    const payload = buildSolicitudCotizacionPayload(
      {
        proveedorId: "1",
        requerimientoId: "2",
        cuerpoSolicitud: "",
        estado: "Creada",
        moneda: "OTRA",
        codigoMonedaOtra: " jpy ",
        incluyeIgv: "false",
        vigenciaOfertaDias: "",
        tiempoEntregaDias: "0",
        lugarEntrega: "",
        garantia: "",
        fechaLimiteRecepcion: "2026-05-06T10:30",
        medioRecepcion: "FISICO",
        tipoCompra: "IMPORTACION",
        estructuraPagoImportacion: "ANTICIPADO_TOTAL",
        instrumentoPagoImportacion: "TRANSFERENCIA_TT",
        incoterm: "FAS",
        incotermVersion: "2020",
        incotermPuntoLogistico: "Muelle de origen",
        itemIds: ["4"],
      },
      "inmediata",
    );

    expect(payload.moneda).toBe("OTRA");
    expect(payload.codigoMonedaOtra).toBe("JPY");
    expect(payload.tiempoEntregaDias).toBe(0);
    expect(payload.medioRecepcion).toBe("FISICO");
  });

  it("calcula totales con exoneracion Amazonia y formatea moneda libre", () => {
    const totals = calculateSolicitudTotals({
      items: [
        { cantidad: 2, precioUnitario: 10 },
        { cantidad: 3, precioUnitario: 5.555 },
      ],
      incluyeIgv: true,
      esExoneradoAmazonia: true,
    });

    expect(totals).toEqual({
      subtotal: 36.67,
      igv: 0,
      total: 36.67,
    });
    expect(
      formatSolicitudMoney(totals.total, {
        moneda: "OTRA",
        codigoMonedaOtra: "JPY",
      }),
    ).toContain("JPY");
  });
});
