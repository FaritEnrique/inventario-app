const normalizeText = (value) => String(value ?? "").trim();

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const getLineaProductoReal = (linea) =>
  linea?.producto || linea?.itemRequerimiento?.producto || null;

export const getLineaProductoTemporal = (linea) =>
  linea?.productoTemporal || linea?.itemRequerimiento?.productoTemporal || null;

export const isLineaProductoTemporalPendiente = (linea) =>
  Boolean(getLineaProductoTemporal(linea)?.id) && !getLineaProductoReal(linea)?.id;

export const buildRecepcionDraftFromOrdenCompra = (ordenCompra = {}) =>
  (ordenCompra.items || [])
    .filter((linea) => toNumber(linea?.cantidadPendiente) > 0)
    .map((linea) => ({
      itemOrdenCompraId: String(linea.id),
      cantidadAceptada: "0",
      cantidadRechazada: "0",
      motivoRechazo: "",
      motivoIncidencia: "",
      fechaReposicionComprometida: "",
      decisionSaldoPendiente: "",
      selected: false,
      disabled: isLineaProductoTemporalPendiente(linea),
      disabledReason: isLineaProductoTemporalPendiente(linea)
        ? "Producto temporal pendiente de validacion."
        : "",
    }));

export const findLineaOrdenCompra = (ordenCompra, itemOrdenCompraId) =>
  (ordenCompra?.items || []).find(
    (linea) => String(linea.id) === String(itemOrdenCompraId),
  ) || null;

export const getRecepcionPayloadItems = (draftItems = [], ordenCompra = {}) =>
  draftItems
    .filter((item) => item.selected === true && item.disabled !== true)
    .filter(
      (item) =>
        toNumber(item.cantidadAceptada) > 0 ||
        toNumber(item.cantidadRechazada) > 0,
    )
    .map((item) => {
      const linea = findLineaOrdenCompra(ordenCompra, item.itemOrdenCompraId);
      const cantidadAceptada = toNumber(item.cantidadAceptada);
      const cantidadRechazada = toNumber(item.cantidadRechazada);
      const cantidadPendienteActual = toNumber(linea?.cantidadPendiente);

      return {
        itemOrdenCompraId: Number(item.itemOrdenCompraId),
        cantidadAceptada,
        cantidadRechazada,
        cantidadPendiente: Math.max(0, cantidadPendienteActual - cantidadAceptada),
        motivoRechazo: normalizeText(item.motivoRechazo) || undefined,
        motivoIncidencia: normalizeText(item.motivoIncidencia) || undefined,
        fechaReposicionComprometida:
          normalizeText(item.fechaReposicionComprometida) || undefined,
        decisionSaldoPendiente:
          normalizeText(item.decisionSaldoPendiente) || undefined,
      };
    });

export const validateRecepcionDraft = (draftItems = [], ordenCompra = {}) => {
  const selectedItems = draftItems.filter((item) => item.selected === true);

  if (!selectedItems.length) {
    return "Debes seleccionar al menos una linea recibida o rechazada.";
  }

  const temporalItem = selectedItems.find((item) => {
    const linea = findLineaOrdenCompra(ordenCompra, item.itemOrdenCompraId);
    return item.disabled === true || isLineaProductoTemporalPendiente(linea);
  });

  if (temporalItem) {
    return "Los productos temporales deben validarse en catalogo antes de recepcionarse.";
  }

  const invalidItem = selectedItems.find((item) => {
    const linea = findLineaOrdenCompra(ordenCompra, item.itemOrdenCompraId);
    const cantidadAceptada = toNumber(item.cantidadAceptada);
    const cantidadRechazada = toNumber(item.cantidadRechazada);
    const cantidadPendienteActual = toNumber(linea?.cantidadPendiente);

    return (
      cantidadAceptada < 0 ||
      cantidadRechazada < 0 ||
      cantidadAceptada + cantidadRechazada <= 0 ||
      cantidadAceptada + cantidadRechazada > cantidadPendienteActual
    );
  });

  if (invalidItem) {
    return "Cada linea seleccionada debe registrar cantidad aceptada o rechazada, sin exceder el saldo pendiente.";
  }

  const rejectedWithoutReasonItem = selectedItems.find((item) => {
    const cantidadRechazada = toNumber(item.cantidadRechazada);
    return (
      cantidadRechazada > 0 &&
      !normalizeText(item.motivoRechazo) &&
      !normalizeText(item.motivoIncidencia)
    );
  });

  if (rejectedWithoutReasonItem) {
    return "Toda cantidad rechazada debe indicar motivo de rechazo o incidencia.";
  }

  const payloadItems = getRecepcionPayloadItems(draftItems, ordenCompra);
  if (!payloadItems.length) {
    return "Debe registrar al menos un item recibido o rechazado.";
  }

  return "";
};
