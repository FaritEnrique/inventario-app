import { describe, expect, it } from "vitest";
import { buildComparativoProcesoViewModel } from "./comparativoProcesoViewModel";

const buildDetalle = (overrides = {}) => ({
  solicitudes: [
    {
      id: 1,
      codigo: "SOL-001",
      tipoCompra: "LOCAL",
      moneda: "PEN",
      proveedor: {
        id: 10,
        razonSocial: "Proveedor Parcial",
        ruc: "20111111111",
      },
    },
    {
      id: 2,
      codigo: "SOL-002",
      tipoCompra: "LOCAL",
      moneda: "PEN",
      proveedor: {
        id: 20,
        razonSocial: "Proveedor Sin Items",
        ruc: "20222222222",
      },
    },
  ],
  requerimiento: {
    items: [
      {
        id: 100,
        descripcionVisible: "Laptop corporativa",
        cantidadRequerida: 2,
        unidadMedida: "UND",
      },
      {
        id: 200,
        productoTemporal: {
          descripcion: "Monitor 27 pulgadas",
          unidadMedida: "UND",
        },
        cantidadRequerida: 3,
      },
    ],
  },
  cotizaciones: [
    {
      id: 1000,
      estado: "RESPONDIDA",
      activo: true,
      solicitudId: 1,
      solicitudCodigo: "SOL-001",
      moneda: "PEN",
      proveedor: {
        id: 10,
        razonSocial: "Proveedor Parcial",
        ruc: "20111111111",
      },
      items: [
        {
          id: 1,
          itemRequerimientoId: 100,
          estadoRespuesta: "COTIZADO",
          descripcionTecnicaOfertada: "Laptop i7",
          cantidadOfrecida: 2,
          precioUnitario: 2500,
          precioTotal: 5000,
        },
        {
          id: 2,
          itemRequerimientoId: 200,
          estadoRespuesta: "NO_COTIZA",
        },
      ],
    },
    {
      id: 2000,
      estado: "RESPONDIDA",
      activo: true,
      solicitudId: 2,
      solicitudCodigo: "SOL-002",
      moneda: "PEN",
      proveedor: {
        id: 20,
        razonSocial: "Proveedor Sin Items",
        ruc: "20222222222",
      },
      items: [
        {
          id: 3,
          itemRequerimientoId: 100,
          estadoRespuesta: "NO_COTIZA",
        },
        {
          id: 4,
          itemRequerimientoId: 200,
          estadoRespuesta: "NO_COTIZA",
        },
      ],
    },
  ],
  ...overrides,
});

describe("buildComparativoProcesoViewModel", () => {
  it("incluye proveedores que cotizaron parcialmente", () => {
    const vm = buildComparativoProcesoViewModel({ detalleGlobal: buildDetalle() });

    expect(vm.cotizacionesComparables).toHaveLength(1);
    expect(vm.cotizacionesComparables[0].proveedor.razonSocial).toBe(
      "Proveedor Parcial",
    );
  });

  it("excluye proveedores sin ningun item cotizado valido", () => {
    const vm = buildComparativoProcesoViewModel({ detalleGlobal: buildDetalle() });

    expect(vm.cotizacionesComparables.map((cotizacion) => cotizacion.id)).not.toContain(
      2000,
    );
    expect(vm.proveedoresSinCotizacionValida[0].motivo).toBe(
      "SIN_ITEMS_COTIZADOS_VALIDOS",
    );
  });

  it("conserva NO_COTIZA en la matriz", () => {
    const vm = buildComparativoProcesoViewModel({ detalleGlobal: buildDetalle() });
    const cell = vm.cotizacionesComparables[0].matrizPorItem[200];

    expect(cell.estado).toBe("NO_COTIZA");
    expect(cell.adjudicable).toBe(false);
  });

  it("marca como adjudicable solo COTIZADO", () => {
    const vm = buildComparativoProcesoViewModel({ detalleGlobal: buildDetalle() });

    expect(vm.cotizacionesComparables[0].matrizPorItem[100].adjudicable).toBe(true);
    expect(vm.cotizacionesComparables[0].matrizPorItem[200].adjudicable).toBe(false);
  });

  it("construye descripcion solicitada desde descripcionVisible", () => {
    const vm = buildComparativoProcesoViewModel({ detalleGlobal: buildDetalle() });

    expect(vm.itemsRequeridos[0].descripcionSolicitada).toBe("Laptop corporativa");
  });

  it("usa fallback desde productoTemporal.descripcion", () => {
    const vm = buildComparativoProcesoViewModel({ detalleGlobal: buildDetalle() });

    expect(vm.itemsRequeridos[1].descripcionSolicitada).toBe("Monitor 27 pulgadas");
  });

  it("lee tipoCompra LOCAL desde la solicitud", () => {
    const vm = buildComparativoProcesoViewModel({ detalleGlobal: buildDetalle() });

    expect(vm.tipoCompra).toBe("LOCAL");
  });

  it("lee tipoCompra IMPORTACION desde snapshot", () => {
    const vm = buildComparativoProcesoViewModel({
      detalleGlobal: buildDetalle(),
      comparativo: {
        cotizacionesConsideradasSnapshot: {
          tipoCompra: "IMPORTACION",
          condicionesSolicitadas: { tipoCompra: "IMPORTACION" },
          itemsRequeridos: buildDetalle().requerimiento.items,
          cotizaciones: buildDetalle().cotizaciones,
        },
      },
    });

    expect(vm.tipoCompra).toBe("IMPORTACION");
  });

  it("arma adjudicaciones iniciales desde adjudicacionesPorItem", () => {
    const vm = buildComparativoProcesoViewModel({
      detalleGlobal: buildDetalle(),
      comparativo: {
        criterioAdjudicacionSnapshot: {
          adjudicacionesPorItem: [
            { itemRequerimientoId: 100, cotizacionId: 1000 },
          ],
        },
      },
    });

    expect(vm.adjudicacionesIniciales).toEqual({ 100: 1000 });
  });

  it("arma sustento inicial por proveedor adjudicado", () => {
    const vm = buildComparativoProcesoViewModel({
      detalleGlobal: buildDetalle(),
      comparativo: {
        criterioAdjudicacionSnapshot: {
          sustentoPorProveedor: [
            {
              proveedorId: 10,
              cotizacionId: 1000,
              itemRequerimientoIds: [100],
              justificacion: "Mejor condicion economica.",
            },
          ],
        },
      },
    });

    expect(vm.sustentoInicialPorProveedor["10:1000"]).toBe(
      "Mejor condicion economica.",
    );
  });
});

