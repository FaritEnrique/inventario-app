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
          cotizacionId: 20,
          codigo: "COT-1",
          proveedor: { id: 5, razonSocial: "Proveedor A" },
          totalOferta: 100,
          items: [
            {
              itemRequerimientoId: 10,
              estadoRespuesta: "COTIZADO",
              precioUnidad: 100,
              precioTotal: 100,
            },
            {
              itemRequerimientoId: 11,
              estadoRespuesta: "NO_COTIZA",
            },
          ],
        },
      ],
    });

    expect(vm.cotizacionesComparables).toHaveLength(1);
    expect(vm.cotizacionesComparables[0].matrizPorItem["10"]).toMatchObject({
      estado: "COTIZADO",
      adjudicable: false,
      cotizado: true,
    });
    expect(vm.cotizacionesComparables[0].matrizPorItem["11"]).toMatchObject({
      estado: "NO_COTIZA",
      adjudicable: false,
      cotizado: false,
    });
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
