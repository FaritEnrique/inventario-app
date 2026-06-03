import { describe, expect, it } from "vitest";
import {
  buildRecepcionDraftFromOrdenCompra,
  getRecepcionPayloadItems,
  validateRecepcionDraft,
} from "./recepcionOrdenCompraUi";

const buildOrdenCompra = () => ({
  id: 10,
  items: [
    {
      id: 1,
      cantidadPendiente: 5,
      producto: { id: 100, codigo: "P-100", nombre: "Laptop" },
      precioUnidad: 1000,
    },
    {
      id: 2,
      cantidadPendiente: 3,
      producto: null,
      productoTemporal: {
        id: 200,
        nombre: "Equipo temporal",
        unidadMedida: "UND",
      },
    },
  ],
});

describe("recepcionOrdenCompraUi", () => {
  it("construye borrador con lineas desmarcadas y cantidad cero", () => {
    const draft = buildRecepcionDraftFromOrdenCompra(buildOrdenCompra());

    expect(draft[0]).toMatchObject({
      selected: false,
      cantidadAceptada: "0",
      cantidadRechazada: "0",
    });
  });

  it("bloquea productos temporales pendientes de validacion", () => {
    const draft = buildRecepcionDraftFromOrdenCompra(buildOrdenCompra());

    expect(draft[1].disabled).toBe(true);
    expect(draft[1].disabledReason).toContain("Producto temporal");
  });

  it("permite recepcionar una linea temporal cuando ya tiene producto real", () => {
    const ordenCompra = buildOrdenCompra();
    ordenCompra.items[1] = {
      ...ordenCompra.items[1],
      producto: { id: 101, codigo: "P-101", nombre: "Equipo catalogado" },
    };

    const draft = buildRecepcionDraftFromOrdenCompra(ordenCompra);

    expect(draft[1]).toMatchObject({
      selected: false,
      cantidadAceptada: "0",
      disabled: false,
      disabledReason: "",
    });
  });

  it("genera payload solo con lineas seleccionadas y aceptadas", () => {
    const ordenCompra = buildOrdenCompra();
    const draft = buildRecepcionDraftFromOrdenCompra(ordenCompra).map((item) =>
      item.itemOrdenCompraId === "1"
        ? { ...item, selected: true, cantidadAceptada: "2" }
        : item,
    );

    expect(getRecepcionPayloadItems(draft, ordenCompra)).toEqual([
      {
        itemOrdenCompraId: 1,
        cantidadAceptada: 2,
        cantidadRechazada: 0,
        cantidadPendiente: 3,
        motivoRechazo: undefined,
        motivoIncidencia: undefined,
        fechaReposicionComprometida: undefined,
        decisionSaldoPendiente: undefined,
      },
    ]);
  });

  it("rechaza cantidad mayor al saldo pendiente", () => {
    const ordenCompra = buildOrdenCompra();
    const draft = buildRecepcionDraftFromOrdenCompra(ordenCompra).map((item) =>
      item.itemOrdenCompraId === "1"
        ? { ...item, selected: true, cantidadAceptada: "6" }
        : item,
    );

    expect(validateRecepcionDraft(draft, ordenCompra)).toContain(
      "sin exceder el saldo pendiente",
    );
  });

  it("rechaza seleccionar un temporal", () => {
    const ordenCompra = buildOrdenCompra();
    const draft = buildRecepcionDraftFromOrdenCompra(ordenCompra).map((item) =>
      item.itemOrdenCompraId === "2"
        ? { ...item, selected: true, cantidadAceptada: "1" }
        : item,
    );

    expect(validateRecepcionDraft(draft, ordenCompra)).toContain(
      "productos temporales",
    );
  });
});
