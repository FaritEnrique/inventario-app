import { describe, expect, it } from "vitest";
import { buildFlujoTipoCompraWarning } from "./flujoCotizacionUi";

const flujo = (tipoCompra, estado = "ABIERTO") => ({
  id: `${tipoCompra}-${estado}`,
  tipoCompra,
  estado,
  activo: true,
});

describe("buildFlujoTipoCompraWarning", () => {
  it("no advierte cuando no existen flujos", () => {
    const result = buildFlujoTipoCompraWarning({
      flujosCotizacion: [],
      nextTipoCompra: "LOCAL",
    });

    expect(result.blocked).toBe(false);
    expect(result.shouldConfirm).toBe(false);
  });

  it("no advierte cuando existe flujo LOCAL abierto y se elige LOCAL", () => {
    const result = buildFlujoTipoCompraWarning({
      flujosCotizacion: [flujo("LOCAL")],
      nextTipoCompra: "LOCAL",
    });

    expect(result.blocked).toBe(false);
    expect(result.shouldConfirm).toBe(false);
  });

  it("advierte cuando existe flujo LOCAL abierto y se elige IMPORTACION", () => {
    const result = buildFlujoTipoCompraWarning({
      flujosCotizacion: [flujo("LOCAL")],
      nextTipoCompra: "IMPORTACION",
    });

    expect(result.blocked).toBe(false);
    expect(result.shouldConfirm).toBe(true);
    expect(result.existingTipoCompra).toBe("LOCAL");
    expect(result.nextTipoCompra).toBe("IMPORTACION");
  });

  it("advierte cuando existe flujo IMPORTACION abierto y se elige LOCAL", () => {
    const result = buildFlujoTipoCompraWarning({
      flujosCotizacion: [flujo("IMPORTACION")],
      nextTipoCompra: "LOCAL",
    });

    expect(result.blocked).toBe(false);
    expect(result.shouldConfirm).toBe(true);
    expect(result.existingTipoCompra).toBe("IMPORTACION");
    expect(result.nextTipoCompra).toBe("LOCAL");
  });

  it("bloquea cuando existe flujo LOCAL cerrado y se elige LOCAL", () => {
    const result = buildFlujoTipoCompraWarning({
      flujosCotizacion: [flujo("LOCAL", "CERRADO")],
      nextTipoCompra: "LOCAL",
    });

    expect(result.blocked).toBe(true);
    expect(result.shouldConfirm).toBe(false);
  });

  it("no advierte cuando ambos flujos estan abiertos y se elige LOCAL", () => {
    const result = buildFlujoTipoCompraWarning({
      flujosCotizacion: [flujo("LOCAL"), flujo("IMPORTACION")],
      nextTipoCompra: "LOCAL",
    });

    expect(result.blocked).toBe(false);
    expect(result.shouldConfirm).toBe(false);
  });

  it("no advierte cuando ambos flujos estan abiertos y se elige IMPORTACION", () => {
    const result = buildFlujoTipoCompraWarning({
      flujosCotizacion: [flujo("LOCAL"), flujo("IMPORTACION")],
      nextTipoCompra: "IMPORTACION",
    });

    expect(result.blocked).toBe(false);
    expect(result.shouldConfirm).toBe(false);
  });

  it("bloquea cuando ambos flujos existen y el elegido esta cerrado", () => {
    const result = buildFlujoTipoCompraWarning({
      flujosCotizacion: [flujo("LOCAL"), flujo("IMPORTACION", "CERRADO")],
      nextTipoCompra: "IMPORTACION",
    });

    expect(result.blocked).toBe(true);
    expect(result.shouldConfirm).toBe(false);
  });
});
