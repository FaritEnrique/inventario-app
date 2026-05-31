import { describe, expect, it } from "vitest";
import { buildComparativoFlujoViewModel } from "./comparativoFlujoViewModel";

describe("buildComparativoFlujoViewModel", () => {
  it("conserva proveedor parcial y NO_COTIZA sin hacerlo adjudicable", () => {
    const vm = buildComparativoFlujoViewModel({
      flujoCotizacion: { id: 1, tipoCompra: "LOCAL", estado: "CERRADO" },
      itemsRequeridos: [
        { id: 10, descripcionVisible: "Laptop", cantidadRequerida: 1 },
        { id: 11, descripcionVisible: "Mouse", cantidadRequerida: 2 },
      ],
      cotizacionesComparables: [
        {
          flujoCotizacionId: 1,
          tipoCompra: "LOCAL",
          solicitudCotizacionId: 9,
          solicitudCodigo: "SOL-1",
          cotizacionId: 20,
          cotizacionCodigo: "COT-1",
          codigo: "COT-1",
          proveedorId: 5,
          proveedor: { id: 5, razonSocial: "Proveedor A" },
          moneda: "PEN",
          totalOferta: 100,
          items: [
            {
              itemCotizacionId: 30,
              flujoCotizacionId: 1,
              tipoCompra: "LOCAL",
              solicitudCotizacionId: 9,
              solicitudCodigo: "SOL-1",
              cotizacionId: 20,
              cotizacionCodigo: "COT-1",
              proveedorId: 5,
              itemRequerimientoId: 10,
              estadoRespuesta: "COTIZADO",
              precioUnidad: 100,
              precioTotal: 100,
              moneda: "PEN",
            },
            {
              itemCotizacionId: 31,
              itemRequerimientoId: 11,
              estadoRespuesta: "NO_COTIZA",
            },
          ],
        },
      ],
    });

    expect(vm.cotizacionesComparables).toHaveLength(1);
    expect(vm.cotizacionesComparables[0].matrizPorItem["10"]).toMatchObject({
      flujoCotizacionId: 1,
      tipoCompra: "LOCAL",
      solicitudCotizacionId: 9,
      solicitudCodigo: "SOL-1",
      cotizacionId: 20,
      cotizacionCodigo: "COT-1",
      proveedorId: 5,
      itemRequerimientoId: 10,
      itemCotizacionId: 30,
      estado: "COTIZADO",
      cotizado: true,
      precioUnidad: 100,
      precioTotal: 100,
      moneda: "PEN",
    });
    expect(vm.cotizacionesComparables[0].matrizPorItem["11"]).toMatchObject({
      estado: "NO_COTIZA",
      cotizado: false,
    });
    expect(
      vm.cotizacionesComparables[0].matrizPorItem["10"],
    ).not.toHaveProperty("adjudicable");
  });

  it("normaliza proveedores sin cotizacion valida con motivo legible", () => {
    const vm = buildComparativoFlujoViewModel({
      proveedoresSinCotizacionValida: [
        {
          solicitudId: 1,
          proveedor: { razonSocial: "Proveedor B" },
          motivo: "SIN_COTIZACION_REGISTRADA",
        },
      ],
    });

    expect(vm.proveedoresSinCotizacionValida[0].motivoLabel).toBe(
      "No respondio",
    );
  });
});
