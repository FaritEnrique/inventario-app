import { describe, expect, it } from "vitest";
import {
  canAccessCotizacionesEffective,
  canAdjustInventoryEffective,
  canManageCatalogMasterEffective,
  canManageOrdenCompraLifecycleEffective,
  canManageSunatEffective,
  canOperateInventoryEffective,
  canApproveOrdenCompraStageEffective,
  canViewWarehouseTrayEffective,
  canViewAllCotizacionesLogisticaEffective,
  canViewOrdenCompraApprovalTrayEffective,
  canViewOrdenCompraListEffective,
  canViewOrdenesCompraEffective,
  isLogisticaContext,
  isLogisticaJefaturaContext,
  isLogisticaOperadorContext,
  isLogisticaOperadorEffective,
} from "./accessRules.js";

const buildUser = (role, areaOverrides = {}) => ({
  id: 1,
  activo: true,
  activeContext: {
    role,
    areaId: 5,
    area: { id: 5, nombre: "Compras y Abastecimiento", ...areaOverrides },
  },
});

describe("isLogisticaContext - rama booleana estable", () => {
  it("reconoce contexto logistico cuando esAreaLogistica === true aunque el nombre no coincida", () => {
    expect(
      isLogisticaContext({
        area: { esAreaLogistica: true, nombre: "Compras y Abastecimiento" },
      }),
    ).toBe(true);
  });

  it("rechaza contexto cuando esAreaLogistica === false y el nombre tampoco coincide", () => {
    expect(
      isLogisticaContext({
        area: { esAreaLogistica: false, nombre: "Compras y Abastecimiento" },
      }),
    ).toBe(false);
  });

  it("esAreaLogistica === true tiene precedencia sobre strings vacios", () => {
    expect(
      isLogisticaContext({ area: { esAreaLogistica: true, nombre: null } }),
    ).toBe(true);
  });

  it("rechaza contexto cuando solo el nombre o codigo del area parece logistica", () => {
    expect(isLogisticaContext({ area: { nombre: "Logistica" } })).toBe(false);
    expect(
      isLogisticaContext({
        area: { abreviatura: "LOG", codigo: "LOG-01" },
      }),
    ).toBe(false);
  });
});

describe("isLogisticaJefaturaContext / isLogisticaOperadorContext con esAreaLogistica", () => {
  it("isLogisticaJefaturaContext acepta JEFE_AREA con esAreaLogistica === true", () => {
    expect(
      isLogisticaJefaturaContext({
        role: "JEFE_AREA",
        area: { esAreaLogistica: true, nombre: "Compras" },
      }),
    ).toBe(true);
  });

  it("isLogisticaJefaturaContext rechaza OPERADOR aunque esAreaLogistica === true", () => {
    expect(
      isLogisticaJefaturaContext({
        role: "OPERADOR",
        area: { esAreaLogistica: true, nombre: "Compras" },
      }),
    ).toBe(false);
  });

  it("isLogisticaOperadorContext acepta OPERADOR con esAreaLogistica === true", () => {
    expect(
      isLogisticaOperadorContext({
        role: "OPERADOR",
        area: { esAreaLogistica: true, nombre: "Compras" },
      }),
    ).toBe(true);
  });

  it("isLogisticaOperadorContext rechaza JEFE_AREA aunque esAreaLogistica === true", () => {
    expect(
      isLogisticaOperadorContext({
        role: "JEFE_AREA",
        area: { esAreaLogistica: true, nombre: "Compras" },
      }),
    ).toBe(false);
  });
});

describe("effective functions con usuario que tiene esAreaLogistica === true", () => {
  it("canViewAllCotizacionesLogisticaEffective acepta JEFE_AREA con esAreaLogistica === true", () => {
    expect(
      canViewAllCotizacionesLogisticaEffective(
        buildUser("JEFE_AREA", { esAreaLogistica: true }),
      ),
    ).toBe(true);
  });

  it("canViewAllCotizacionesLogisticaEffective rechaza JEFE_AREA con esAreaLogistica === false y nombre no logistico", () => {
    expect(
      canViewAllCotizacionesLogisticaEffective(
        buildUser("JEFE_AREA", { esAreaLogistica: false }),
      ),
    ).toBe(false);
  });

  it("canViewAllCotizacionesLogisticaEffective rechaza OPERADOR aunque este en area logistica", () => {
    expect(
      canViewAllCotizacionesLogisticaEffective(
        buildUser("OPERADOR", { esAreaLogistica: true }),
      ),
    ).toBe(false);
  });

  it("mantiene el override de ADMINISTRADOR_SISTEMA aunque el contexto activo sea operativo", () => {
    expect(
      canViewAllCotizacionesLogisticaEffective({
        ...buildUser("JEFE_AREA", { esAreaLogistica: true }),
        identityRoles: ["ADMINISTRADOR_SISTEMA", "JEFE_AREA"],
      }),
    ).toBe(true);
  });

  it("isLogisticaOperadorEffective acepta OPERADOR con esAreaLogistica === true", () => {
    expect(
      isLogisticaOperadorEffective(
        buildUser("OPERADOR", { esAreaLogistica: true }),
      ),
    ).toBe(true);
  });

  it("isLogisticaOperadorEffective rechaza OPERADOR con esAreaLogistica === false y nombre no logistico", () => {
    expect(
      isLogisticaOperadorEffective(
        buildUser("OPERADOR", { esAreaLogistica: false }),
      ),
    ).toBe(false);
  });
});

describe("esAreaAlmacen - canOperateInventoryEffective rama booleana", () => {
  it("acepta JEFE_AREA con esAreaAlmacen === true aunque el nombre no coincida", () => {
    expect(
      canOperateInventoryEffective(
        buildUser("JEFE_AREA", {
          esAreaAlmacen: true,
          nombre: "Compras y Abastecimiento",
        }),
      ),
    ).toBe(true);
  });

  it("acepta OPERADOR con esAreaAlmacen === true aunque el nombre no coincida", () => {
    expect(
      canOperateInventoryEffective(
        buildUser("OPERADOR", {
          esAreaAlmacen: true,
          nombre: "Recursos Humanos",
        }),
      ),
    ).toBe(true);
  });

  it("rechaza JEFE_AREA con esAreaAlmacen === false y nombre no almacen", () => {
    expect(
      canOperateInventoryEffective(
        buildUser("JEFE_AREA", {
          esAreaAlmacen: false,
          nombre: "Compras y Abastecimiento",
        }),
      ),
    ).toBe(false);
  });

  it("rechaza acceso cuando solo el nombre o codigo del area parece almacen", () => {
    expect(
      canOperateInventoryEffective(
        buildUser("JEFE_AREA", { nombre: "Almacen Central" }),
      ),
    ).toBe(false);
    expect(
      canOperateInventoryEffective(
        buildUser("JEFE_AREA", { abreviatura: "ALM", codigo: "ALM-01" }),
      ),
    ).toBe(false);
  });

  it("rechaza acceso cuando GERENTE_FUNCIONAL solo parece pertenecer a Operaciones por texto", () => {
    expect(
      canOperateInventoryEffective(
        buildUser("GERENTE_FUNCIONAL", {
          nombre: "Operaciones",
          abreviatura: "OPE",
          codigo: "OPE-01",
          esAreaAlmacen: false,
        }),
      ),
    ).toBe(false);
  });

  it("rechaza GERENTE_ADMINISTRACION por rol puro aunque tenga contexto operativo activo", () => {
    expect(
      canOperateInventoryEffective(
        buildUser("GERENTE_ADMINISTRACION", {
          tipoUnidad: "GERENCIA_ADMINISTRACION",
          nombre: "Control Presupuestal",
        }),
      ),
    ).toBe(false);
  });

  it("rechaza GERENTE_GENERAL por rol puro", () => {
    expect(
      canOperateInventoryEffective(
        buildUser("GERENTE_GENERAL", {
          nombre: "Gerencia General",
          esAreaAlmacen: false,
        }),
      ),
    ).toBe(false);
  });

  it("mantiene override explicito para ADMINISTRADOR_SISTEMA", () => {
    expect(
      canOperateInventoryEffective(
        buildUser("ADMINISTRADOR_SISTEMA", {
          nombre: "Sistemas",
          esAreaAlmacen: false,
        }),
      ),
    ).toBe(true);
  });
});

describe("esAreaAlmacen - canAdjustInventoryEffective rama booleana", () => {
  it("acepta JEFE_AREA con esAreaAlmacen === true", () => {
    expect(
      canAdjustInventoryEffective(
        buildUser("JEFE_AREA", { esAreaAlmacen: true, nombre: "Depositos" }),
      ),
    ).toBe(true);
  });

  it("rechaza OPERADOR aunque esAreaAlmacen === true", () => {
    expect(
      canAdjustInventoryEffective(
        buildUser("OPERADOR", { esAreaAlmacen: true, nombre: "Depositos" }),
      ),
    ).toBe(false);
  });

  it("mantiene override explicito para ADMINISTRADOR_SISTEMA", () => {
    expect(
      canAdjustInventoryEffective(
        buildUser("ADMINISTRADOR_SISTEMA", {
          esAreaAlmacen: false,
          nombre: "Sistemas",
        }),
      ),
    ).toBe(true);
  });
});

describe("esAreaAlmacen - canViewWarehouseTrayEffective rama booleana", () => {
  it("acepta OPERADOR con esAreaAlmacen === true", () => {
    expect(
      canViewWarehouseTrayEffective(
        buildUser("OPERADOR", { esAreaAlmacen: true, nombre: "Depositos" }),
      ),
    ).toBe(true);
  });

  it("rechaza acceso cuando solo el nombre parece almacen", () => {
    expect(
      canViewWarehouseTrayEffective(
        buildUser("OPERADOR", { nombre: "Almacen Central" }),
      ),
    ).toBe(false);
  });
});

describe("esAreaAlmacen - canManageCatalogMasterEffective rama booleana", () => {
  it("acepta JEFE_AREA con esAreaAlmacen === true aunque el nombre no coincida", () => {
    expect(
      canManageCatalogMasterEffective(
        buildUser("JEFE_AREA", { esAreaAlmacen: true, nombre: "Compras" }),
      ),
    ).toBe(true);
  });

  it("rechaza JEFE_AREA con esAreaAlmacen === false y nombre no almacen", () => {
    expect(
      canManageCatalogMasterEffective(
        buildUser("JEFE_AREA", { esAreaAlmacen: false, nombre: "Compras" }),
      ),
    ).toBe(false);
  });

  it("rechaza GERENTE_ADMINISTRACION por rol puro aunque el area sea administrativa", () => {
    expect(
      canManageCatalogMasterEffective(
        buildUser("GERENTE_ADMINISTRACION", {
          tipoUnidad: "GERENCIA_ADMINISTRACION",
          nombre: "Control Presupuestal",
        }),
      ),
    ).toBe(false);
  });

  it("mantiene override explicito para ADMINISTRADOR_SISTEMA", () => {
    expect(
      canManageCatalogMasterEffective(
        buildUser("ADMINISTRADOR_SISTEMA", {
          esAreaAlmacen: false,
          nombre: "Sistemas",
        }),
      ),
    ).toBe(true);
  });
});

describe("ordenes de compra - criterio administrativo estructural", () => {
  it("permite ver listado OC a JEFE_AREA logistico porque participa en el tramo de compra", () => {
    expect(
      canViewOrdenCompraListEffective(
        buildUser("JEFE_AREA", {
          esAreaLogistica: true,
          nombre: "Compras",
        }),
      ),
    ).toBe(true);
  });

  it("permite ver listado OC a OPERADOR con contexto administrativo estructurado", () => {
    expect(
      canViewOrdenCompraListEffective(
        buildUser("OPERADOR", {
          tipoUnidad: "GERENCIA_ADMINISTRACION",
          nombre: "Control Presupuestal",
          abreviatura: "CPP",
        }),
      ),
    ).toBe(true);
  });

  it("permite lifecycle solo a JEFE_AREA con contexto activo administrativo", () => {
    expect(
      canManageOrdenCompraLifecycleEffective(
        buildUser("JEFE_AREA", {
          tipoUnidad: "GERENCIA_ADMINISTRACION",
          nombre: "Control Presupuestal",
          abreviatura: "CPP",
        }),
      ),
    ).toBe(true);
  });

  it("rechaza lifecycle a OPERADOR aunque este en contexto administrativo", () => {
    expect(
      canManageOrdenCompraLifecycleEffective(
        buildUser("OPERADOR", {
          tipoUnidad: "GERENCIA_ADMINISTRACION",
          nombre: "Control Presupuestal",
        }),
      ),
    ).toBe(false);
  });

  it("rechaza ver listado OC cuando solo hay coincidencia textual de administracion", () => {
    expect(
      canViewOrdenCompraListEffective(
        buildUser("OPERADOR", {
          tipoUnidad: null,
          nombre: "Administracion",
          abreviatura: "ADM",
        }),
      ),
    ).toBe(false);
  });

  it("permite la bandeja de aprobacion de OC a jefatura logistica", () => {
    expect(
      canViewOrdenCompraApprovalTrayEffective(
        buildUser("JEFE_AREA", {
          esAreaLogistica: true,
          nombre: "Compras",
        }),
      ),
    ).toBe(true);
  });

  it("mantiene la vista general de OC para perfiles que solo tienen bandeja de aprobacion", () => {
    expect(canViewOrdenesCompraEffective(buildUser("GERENTE_GENERAL"))).toBe(
      true,
    );
  });
});

describe("ordenes de compra - aprobacion snapshot por etapa real", () => {
  const buildOrdenCompra = (overrides = {}) => ({
    nivelPendienteActual: "JEFATURA_LOGISTICA",
    snapshotFormal: {
      aprobadorLogisticaIdSnapshot: 1,
      aprobadorAdministracionIdSnapshot: 2,
      aprobadorGerenciaGeneralIdSnapshot: 3,
      nivelPendienteActualSnapshot: "JEFATURA_LOGISTICA",
    },
    ...overrides,
  });

  it("permite aprobar la OC a JEFE_AREA logistico cuando la etapa pendiente es logistica", () => {
    expect(
      canApproveOrdenCompraStageEffective(
        buildUser("JEFE_AREA", { esAreaLogistica: true }),
        buildOrdenCompra(),
      ),
    ).toBe(true);
  });

  it("rechaza aprobar la OC a OPERADOR logistico aunque este en logistica", () => {
    expect(
      canApproveOrdenCompraStageEffective(
        buildUser("OPERADOR", { esAreaLogistica: true }),
        buildOrdenCompra(),
      ),
    ).toBe(false);
  });

  it("solo activa gerencia general cuando la etapa pendiente real es GERENCIA_GENERAL", () => {
    expect(
      canApproveOrdenCompraStageEffective(
        buildUser("GERENTE_GENERAL"),
        buildOrdenCompra({
          nivelPendienteActual: "GERENCIA_GENERAL",
          snapshotFormal: {
            aprobadorLogisticaIdSnapshot: 1,
            aprobadorAdministracionIdSnapshot: 2,
            aprobadorGerenciaGeneralIdSnapshot: 1,
            nivelPendienteActualSnapshot: "GERENCIA_GENERAL",
          },
        }),
      ),
    ).toBe(true);
  });
});

describe("dashboard logistico - entrada operativa", () => {
  it("mantiene acceso operativo para OPERADOR logistico sin concederle la entrada de jefatura", () => {
    expect(
      canAccessCotizacionesEffective(
        buildUser("OPERADOR", {
          esAreaLogistica: true,
          nombre: "Compras",
        }),
      ),
    ).toBe(true);
    expect(
      canViewAllCotizacionesLogisticaEffective(
        buildUser("OPERADOR", {
          esAreaLogistica: true,
          nombre: "Compras",
        }),
      ),
    ).toBe(false);
  });
});

describe("canManageSunatEffective - visibilidad de acciones SUNAT", () => {
  it("permite a ADMINISTRADOR_SISTEMA", () => {
    expect(canManageSunatEffective(buildUser("ADMINISTRADOR_SISTEMA"))).toBe(
      true,
    );
  });

  it("permite a GERENTE_ADMINISTRACION", () => {
    expect(canManageSunatEffective(buildUser("GERENTE_ADMINISTRACION"))).toBe(
      true,
    );
  });

  it("rechaza a JEFE_AREA aunque este en logistica", () => {
    expect(
      canManageSunatEffective(
        buildUser("JEFE_AREA", { esAreaLogistica: true }),
      ),
    ).toBe(false);
  });

  it("rechaza a OPERADOR aunque este en logistica", () => {
    expect(
      canManageSunatEffective(buildUser("OPERADOR", { esAreaLogistica: true })),
    ).toBe(false);
  });
});
