import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { canOperateInventoryEffective } from "../accessRules";
import ProductoSearchField from "../components/ProductoSearchField";
import { useAuth } from "../context/authContext";
import useAreas from "../hooks/useAreas";
import useInventario from "../hooks/useInventario";
import useOrdenesCompra from "../hooks/useOrdenesCompra";

const simpleInitialState = {
  almacenDestinoId: "",
  areaId: "",
  fechaMovimiento: "",
  fechaDocumento: "",
  codigoNotaIngreso: "",
  cantidad: "",
  subtipoMovimiento: "NOTA_INGRESO",
  observaciones: "",
  referenciaTipo: "",
  referenciaId: "",
  referenciaCodigo: "",
};

const createEmptyOcForm = () => ({
  ordenCompraId: "",
  almacenDestinoId: "",
  areaId: "",
  fechaMovimiento: "",
  fechaDocumento: "",
  codigoNotaIngreso: "",
  observaciones: "",
  items: [],
});

const createOcItemDraft = (linea) => ({
  itemOrdenCompraId: String(linea.id),
  cantidadAceptada: String(Number(linea.cantidadPendiente || 0)),
  cantidadRechazada: "0",
  motivoRechazo: "",
  motivoIncidencia: "",
  fechaReposicionComprometida: "",
  decisionSaldoPendiente: "",
  selected: true,
});

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const InventarioRecepcionesPage = () => {
  const { user } = useAuth();
  const { areas } = useAreas();
  const { loading, registrarIngresoPorNota } = useInventario();
  const {
    loading: ordenesCompraLoading,
    obtenerOrdenesCompra,
    obtenerOrdenCompraPorId,
  } = useOrdenesCompra();

  const [mode, setMode] = useState("simple");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [simpleForm, setSimpleForm] = useState(simpleInitialState);
  const [ocForm, setOcForm] = useState(createEmptyOcForm());
  const [resultado, setResultado] = useState(null);
  const [ordenesCompraDisponibles, setOrdenesCompraDisponibles] = useState([]);
  const [selectedOrdenCompra, setSelectedOrdenCompra] = useState(null);
  const [ordenesSearch, setOrdenesSearch] = useState("");

  const canOperate = canOperateInventoryEffective(user);

  const pendingOrdenesCompra = useMemo(() => {
    const search = normalizeText(ordenesSearch);

    return ordenesCompraDisponibles.filter((ordenCompra) => {
      const hasPending = Number(ordenCompra?.resumen?.totalPendiente || 0) > 0;
      if (!hasPending) {
        return false;
      }

      if (!search) {
        return true;
      }

      const codigo = normalizeText(ordenCompra.codigo);
      const proveedor = normalizeText(ordenCompra.proveedor?.razonSocial);
      return codigo.includes(search) || proveedor.includes(search);
    });
  }, [ordenesCompraDisponibles, ordenesSearch]);

  useEffect(() => {
    setResultado(null);
  }, [mode]);

  useEffect(() => {
    if (mode !== "ordenCompra" || !canOperate) {
      return;
    }

    let active = true;

    const loadOrdenesCompra = async () => {
      try {
        const response = await obtenerOrdenesCompra({
          limit: 200,
          includeInactive: false,
        });

        if (!active) {
          return;
        }

        setOrdenesCompraDisponibles(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        if (active) {
          toast.error(
            error.message ||
              "No se pudieron cargar las ordenes de compra recepcionables."
          );
        }
      }
    };

    loadOrdenesCompra();

    return () => {
      active = false;
    };
  }, [canOperate, mode, obtenerOrdenesCompra]);

  const resetOcSelection = () => {
    setSelectedOrdenCompra(null);
    setOcForm(createEmptyOcForm());
  };

  const getPendingCurrentForItem = (itemOrdenCompraId) => {
    const line = selectedOrdenCompra?.items?.find(
      (currentItem) => String(currentItem.id) === String(itemOrdenCompraId)
    );
    return Number(line?.cantidadPendiente || 0);
  };

  const getPendingResultForDraft = (item) => {
    const pendingCurrent = getPendingCurrentForItem(item.itemOrdenCompraId);
    const cantidadAceptada = Number(item.cantidadAceptada || 0);
    const cantidadRechazada = Number(item.cantidadRechazada || 0);
    return pendingCurrent - cantidadAceptada - cantidadRechazada;
  };

  const refreshOrdenesCompra = async () => {
    const response = await obtenerOrdenesCompra({
      limit: 200,
      includeInactive: false,
    });

    setOrdenesCompraDisponibles(Array.isArray(response?.data) ? response.data : []);
  };

  const handleSimpleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedProduct?.id) {
      toast.error("Debes seleccionar un producto.");
      return;
    }

    try {
      const payload = {
        productoId: selectedProduct.id,
        cantidad: Number(simpleForm.cantidad),
        almacenDestinoId: simpleForm.almacenDestinoId || undefined,
        areaId: simpleForm.areaId || undefined,
        fechaMovimiento: simpleForm.fechaMovimiento || undefined,
        fechaDocumento: simpleForm.fechaDocumento || undefined,
        codigoNotaIngreso: simpleForm.codigoNotaIngreso || undefined,
        subtipoMovimiento: simpleForm.subtipoMovimiento || undefined,
        observaciones: simpleForm.observaciones || undefined,
        referenciaTipo: simpleForm.referenciaTipo || undefined,
        referenciaId: simpleForm.referenciaId || undefined,
        referenciaCodigo: simpleForm.referenciaCodigo || undefined,
      };

      const response = await registrarIngresoPorNota(payload);
      setResultado(response);
      toast.success("Ingreso por nota registrado correctamente.");
      setSimpleForm(simpleInitialState);
      setSelectedProduct(null);
    } catch (error) {
      toast.error(error.message || "No se pudo registrar la nota de ingreso.");
    }
  };

  const handleOcItemChange = (index, field, value) => {
    setOcForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSelectOrdenCompra = async (ordenCompraId) => {
    if (!ordenCompraId) {
      resetOcSelection();
      return;
    }

    try {
      const ordenCompra = await obtenerOrdenCompraPorId(ordenCompraId);
      const pendingLines = (ordenCompra.items || []).filter(
        (item) => Number(item.cantidadPendiente || 0) > 0
      );

      setSelectedOrdenCompra(ordenCompra);
      setOcForm((prev) => ({
        ...prev,
        ordenCompraId: String(ordenCompra.id),
        items: pendingLines.map(createOcItemDraft),
      }));

      if (!pendingLines.length) {
        toast.info("La orden seleccionada ya no tiene lineas pendientes.");
      }
    } catch (error) {
      toast.error(
        error.message || "No se pudo cargar el detalle de la orden de compra."
      );
    }
  };

  const handleOcSubmit = async (event) => {
    event.preventDefault();

    if (!selectedOrdenCompra?.id) {
      toast.error("Debes seleccionar una orden de compra.");
      return;
    }

    const selectedItems = ocForm.items.filter((item) => item.selected !== false);

    if (!selectedItems.length) {
      toast.error("Debes seleccionar al menos una linea para recepcionar.");
      return;
    }

    const invalidItem = selectedItems.find((item) => {
      const pendingCurrent = getPendingCurrentForItem(item.itemOrdenCompraId);
      const cantidadAceptada = Number(item.cantidadAceptada || 0);
      const cantidadRechazada = Number(item.cantidadRechazada || 0);

      return (
        cantidadAceptada < 0 ||
        cantidadRechazada < 0 ||
        cantidadAceptada + cantidadRechazada <= 0 ||
        cantidadAceptada + cantidadRechazada > pendingCurrent
      );
    });

    if (invalidItem) {
      toast.error(
        "Cada linea seleccionada debe registrar una cantidad valida sin exceder el saldo pendiente."
      );
      return;
    }

    try {
      const payload = {
        ordenCompraId: Number(ocForm.ordenCompraId),
        almacenDestinoId: ocForm.almacenDestinoId || undefined,
        areaId: ocForm.areaId || undefined,
        fechaMovimiento: ocForm.fechaMovimiento || undefined,
        fechaDocumento: ocForm.fechaDocumento || undefined,
        codigoNotaIngreso: ocForm.codigoNotaIngreso || undefined,
        observaciones: ocForm.observaciones || undefined,
        items: selectedItems.map((item) => ({
          itemOrdenCompraId: Number(item.itemOrdenCompraId),
          cantidadAceptada: Number(item.cantidadAceptada || 0),
          cantidadRechazada: Number(item.cantidadRechazada || 0),
          cantidadPendiente: getPendingResultForDraft(item),
          motivoRechazo: item.motivoRechazo || undefined,
          motivoIncidencia: item.motivoIncidencia || undefined,
          fechaReposicionComprometida:
            item.fechaReposicionComprometida || undefined,
          decisionSaldoPendiente: item.decisionSaldoPendiente || undefined,
        })),
      };

      const response = await registrarIngresoPorNota(payload);
      setResultado(response);
      toast.success("Recepcion contra orden de compra registrada.");
      resetOcSelection();
      await refreshOrdenesCompra();
    } catch (error) {
      toast.error(error.message || "No se pudo registrar la recepcion.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Recepciones y notas de ingreso
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Modulo operativo minimo para ingreso simple y recepcion contra
            orden de compra.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/ordenes-compra"
            className="rounded border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Ordenes de compra
          </Link>
          <Link
            to="/dashboard"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {!canOperate ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Tu usuario no tiene perfil operativo de almacen u operaciones para
          registrar recepciones.
        </div>
      ) : (
        <>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setMode("simple")}
              className={`rounded px-4 py-2 text-sm font-medium ${
                mode === "simple"
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-300 text-gray-700"
              }`}
            >
              Ingreso simple
            </button>
            <button
              type="button"
              onClick={() => setMode("ordenCompra")}
              className={`rounded px-4 py-2 text-sm font-medium ${
                mode === "ordenCompra"
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-300 text-gray-700"
              }`}
            >
              Recepcion contra OC
            </button>
          </div>

          {mode === "simple" ? (
            <form
              onSubmit={handleSimpleSubmit}
              className="space-y-4 rounded-lg bg-white p-4 shadow"
            >
              <ProductoSearchField
                selectedProduct={selectedProduct}
                onSelect={setSelectedProduct}
              />
              <div className="grid gap-4 md:grid-cols-3">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={simpleForm.cantidad}
                  name="inventario-recepciones-page-input-366"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      cantidad: event.target.value,
                    }))
                  }
                  className="rounded border border-gray-300 px-3 py-2"
                  placeholder="Cantidad"
                  required
                />
                <input
                  type="number"
                  min="1"
                  value={simpleForm.almacenDestinoId}
                  name="inventario-recepciones-page-input-381"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      almacenDestinoId: event.target.value,
                    }))
                  }
                  className="rounded border border-gray-300 px-3 py-2"
                  placeholder="Almacen destino ID (opcional)"
                />
                <select
                  value={simpleForm.areaId}
                  name="inventario-recepciones-page-select-394"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      areaId: event.target.value,
                    }))
                  }
                  className="rounded border border-gray-300 px-3 py-2"
                >
                  <option value="">Area (opcional)</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.nombre}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={simpleForm.fechaMovimiento}
                  name="inventario-recepciones-page-input-411"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      fechaMovimiento: event.target.value,
                    }))
                  }
                  className="rounded border border-gray-300 px-3 py-2"
                />
                <input
                  type="date"
                  value={simpleForm.fechaDocumento}
                  name="inventario-recepciones-page-input-422"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      fechaDocumento: event.target.value,
                    }))
                  }
                  className="rounded border border-gray-300 px-3 py-2"
                />
                <input
                  type="text"
                  value={simpleForm.codigoNotaIngreso}
                  name="inventario-recepciones-page-input-433"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      codigoNotaIngreso: event.target.value,
                    }))
                  }
                  className="rounded border border-gray-300 px-3 py-2"
                  placeholder="Codigo nota ingreso (opcional)"
                />
                <input
                  type="text"
                  value={simpleForm.subtipoMovimiento}
                  name="inventario-recepciones-page-input-445"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      subtipoMovimiento: event.target.value,
                    }))
                  }
                  className="rounded border border-gray-300 px-3 py-2"
                  placeholder="Subtipo movimiento"
                />
                <input
                  type="text"
                  value={simpleForm.referenciaTipo}
                  name="inventario-recepciones-page-input-457"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      referenciaTipo: event.target.value,
                    }))
                  }
                  className="rounded border border-gray-300 px-3 py-2"
                  placeholder="Referencia tipo"
                />
                <input
                  type="number"
                  min="1"
                  value={simpleForm.referenciaId}
                  name="inventario-recepciones-page-input-469"
                  onChange={(event) =>
                    setSimpleForm((prev) => ({
                      ...prev,
                      referenciaId: event.target.value,
                    }))
                  }
                  className="rounded border border-gray-300 px-3 py-2"
                  placeholder="Referencia ID"
                />
              </div>
              <textarea
                value={simpleForm.observaciones}
                name="inventario-recepciones-page-textarea-483"
                onChange={(event) =>
                  setSimpleForm((prev) => ({
                    ...prev,
                    observaciones: event.target.value,
                  }))
                }
                rows="3"
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="Observaciones"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? "Registrando..." : "Registrar ingreso"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleOcSubmit}
              className="space-y-4 rounded-lg bg-white p-4 shadow"
            >
              <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                La recepcion contra OC sigue creando NotaIngreso y dejando el
                stock disponible para el flujo normal de almacen. La salida no
                nace de la OC: despues del ingreso, el consumo sigue por
                PedidoInterno, Reserva y NotaSalida.
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <div className="space-y-3 rounded border border-gray-200 p-4">
                  <div>
                    <label htmlFor="recepcion-oc-search" className="mb-1 block text-sm font-medium text-gray-700">
                      Buscar orden de compra recepcionable
                    </label>
                    <input
                      id="recepcion-oc-search"
                      type="text"
                      value={ordenesSearch}
                      name="inventario-recepciones-page-input-521" onChange={(event) => setOrdenesSearch(event.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      placeholder="Codigo o proveedor"
                    />
                  </div>

                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {ordenesCompraLoading ? (
                      <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                        Cargando ordenes de compra...
                      </div>
                    ) : pendingOrdenesCompra.length === 0 ? (
                      <div className="rounded border border-dashed border-gray-300 p-3 text-sm text-gray-500">
                        No hay ordenes de compra con saldo pendiente para
                        recepcionar.
                      </div>
                    ) : (
                      pendingOrdenesCompra.map((ordenCompra) => {
                        const isSelected =
                          String(ordenCompra.id) === String(ocForm.ordenCompraId);

                        return (
                          <button
                            key={ordenCompra.id}
                            type="button"
                            onClick={() => handleSelectOrdenCompra(ordenCompra.id)}
                            className={`w-full rounded border p-3 text-left ${
                              isSelected
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium text-gray-900">
                                {ordenCompra.codigo}
                              </span>
                              <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                {ordenCompra.estadoRecepcion}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                              {ordenCompra.proveedor?.razonSocial ||
                                "Proveedor sin nombre"}
                            </p>
                            <p className="mt-2 text-xs text-gray-500">
                              Pendiente total:{" "}
                              {Number(ordenCompra.resumen?.totalPendiente || 0)}
                            </p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <input
                      type="text"
                      value={selectedOrdenCompra?.codigo || ""}
                      readOnly
                      className="rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      placeholder="Orden de compra" name="inventario-recepciones-page-input-581" />
                    <input
                      type="number"
                      min="1"
                      value={ocForm.almacenDestinoId}
                      name="inventario-recepciones-page-input-588"
                      onChange={(event) =>
                        setOcForm((prev) => ({
                          ...prev,
                          almacenDestinoId: event.target.value,
                        }))
                      }
                      className="rounded border border-gray-300 px-3 py-2"
                      placeholder="Almacen destino ID"
                    />
                    <select
                      value={ocForm.areaId}
                      name="inventario-recepciones-page-select-600"
                      onChange={(event) =>
                        setOcForm((prev) => ({
                          ...prev,
                          areaId: event.target.value,
                        }))
                      }
                      className="rounded border border-gray-300 px-3 py-2"
                    >
                      <option value="">Area (opcional)</option>
                      {areas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.nombre}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={ocForm.fechaMovimiento}
                      name="inventario-recepciones-page-input-618"
                      onChange={(event) =>
                        setOcForm((prev) => ({
                          ...prev,
                          fechaMovimiento: event.target.value,
                        }))
                      }
                      className="rounded border border-gray-300 px-3 py-2"
                    />
                    <input
                      type="date"
                      value={ocForm.fechaDocumento}
                      name="inventario-recepciones-page-input-629"
                      onChange={(event) =>
                        setOcForm((prev) => ({
                          ...prev,
                          fechaDocumento: event.target.value,
                        }))
                      }
                      className="rounded border border-gray-300 px-3 py-2"
                    />
                    <input
                      type="text"
                      value={ocForm.codigoNotaIngreso}
                      name="inventario-recepciones-page-input-640"
                      onChange={(event) =>
                        setOcForm((prev) => ({
                          ...prev,
                          codigoNotaIngreso: event.target.value,
                        }))
                      }
                      className="rounded border border-gray-300 px-3 py-2"
                      placeholder="Codigo nota ingreso"
                    />
                  </div>

                  {selectedOrdenCompra ? (
                    <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">Proveedor:</span>{" "}
                        {selectedOrdenCompra.proveedor?.razonSocial ||
                          "Sin proveedor"}
                      </p>
                      <p>
                        <span className="font-medium">Estado recepcion:</span>{" "}
                        {selectedOrdenCompra.estadoRecepcion}
                      </p>
                      <p>
                        <span className="font-medium">Pendiente total:</span>{" "}
                        {Number(selectedOrdenCompra.resumen?.totalPendiente || 0)}
                      </p>
                      <Link
                        to={`/ordenes-compra/${selectedOrdenCompra.id}`}
                        className="mt-2 inline-block font-medium text-indigo-700 hover:text-indigo-800"
                      >
                        Abrir detalle de la orden de compra
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                      Selecciona una orden de compra para cargar sus lineas
                      pendientes de recepcion.
                    </div>
                  )}
                </div>
              </div>

              <textarea
                value={ocForm.observaciones}
                name="inventario-recepciones-page-textarea-684"
                onChange={(event) =>
                  setOcForm((prev) => ({
                    ...prev,
                    observaciones: event.target.value,
                  }))
                }
                rows="3"
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="Observaciones de la recepcion"
              />

              <div className="space-y-4">
                {!selectedOrdenCompra ? null : ocForm.items.length === 0 ? (
                  <div className="rounded border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                    La orden seleccionada ya no tiene lineas pendientes.
                  </div>
                ) : (
                  ocForm.items.map((item, index) => {
                    const linea = selectedOrdenCompra.items.find(
                      (currentItem) =>
                        String(currentItem.id) === String(item.itemOrdenCompraId)
                    );
                    const pendingResult = getPendingResultForDraft(item);

                    return (
                      <div
                        key={item.itemOrdenCompraId}
                        className="space-y-3 rounded border border-gray-200 p-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {linea?.producto?.nombre || "Linea de orden"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {linea?.producto?.codigo || "Sin codigo"} ·
                              pendiente actual:{" "}
                              {Number(linea?.cantidadPendiente || 0)}
                            </p>
                          </div>
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={item.selected !== false}
                              name="inventario-recepciones-page-input-728"
                              onChange={(event) =>
                                handleOcItemChange(
                                  index,
                                  "selected",
                                  event.target.checked
                                )
                              }
                            />
                            Incluir en esta recepcion
                          </label>
                        </div>

                        <div className="grid gap-3 md:grid-cols-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.cantidadAceptada}
                            name="inventario-recepciones-page-input-744"
                            onChange={(event) =>
                              handleOcItemChange(
                                index,
                                "cantidadAceptada",
                                event.target.value
                              )
                            }
                            className="rounded border border-gray-300 px-3 py-2"
                            placeholder="Cantidad aceptada"
                            disabled={item.selected === false}
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.cantidadRechazada}
                            name="inventario-recepciones-page-input-760"
                            onChange={(event) =>
                              handleOcItemChange(
                                index,
                                "cantidadRechazada",
                                event.target.value
                              )
                            }
                            className="rounded border border-gray-300 px-3 py-2"
                            placeholder="Cantidad rechazada"
                            disabled={item.selected === false}
                          />
                          <input
                            type="text"
                            readOnly
                            name="inventario-recepciones-page-input-776"
                            value={pendingResult >= 0 ? pendingResult : "Excede saldo"}
                            className="rounded border border-gray-300 bg-gray-50 px-3 py-2"
                            placeholder="Saldo resultante"
                          />
                          <input
                            type="text"
                            readOnly
                            value={linea?.estadoRecepcion || "PENDIENTE"}
                            className="rounded border border-gray-300 bg-gray-50 px-3 py-2"
                            placeholder="Estado recepcion" name="inventario-recepciones-page-input-783" />
                          <input
                            type="text"
                            value={item.motivoRechazo}
                            name="inventario-recepciones-page-input-790"
                            onChange={(event) =>
                              handleOcItemChange(
                                index,
                                "motivoRechazo",
                                event.target.value
                              )
                            }
                            className="rounded border border-gray-300 px-3 py-2 md:col-span-2"
                            placeholder="Motivo de rechazo"
                            disabled={item.selected === false}
                          />
                          <input
                            type="text"
                            value={item.motivoIncidencia}
                            name="inventario-recepciones-page-input-804"
                            onChange={(event) =>
                              handleOcItemChange(
                                index,
                                "motivoIncidencia",
                                event.target.value
                              )
                            }
                            className="rounded border border-gray-300 px-3 py-2 md:col-span-2"
                            placeholder="Motivo de incidencia"
                            disabled={item.selected === false}
                          />
                          <input
                            type="date"
                            value={item.fechaReposicionComprometida}
                            name="inventario-recepciones-page-input-818"
                            onChange={(event) =>
                              handleOcItemChange(
                                index,
                                "fechaReposicionComprometida",
                                event.target.value
                              )
                            }
                            className="rounded border border-gray-300 px-3 py-2"
                            disabled={item.selected === false}
                          />
                          <input
                            type="text"
                            value={item.decisionSaldoPendiente}
                            name="inventario-recepciones-page-input-831"
                            onChange={(event) =>
                              handleOcItemChange(
                                index,
                                "decisionSaldoPendiente",
                                event.target.value
                              )
                            }
                            className="rounded border border-gray-300 px-3 py-2 md:col-span-3"
                            placeholder="Decision sobre el saldo pendiente"
                            disabled={item.selected === false}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetOcSelection}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Limpiar seleccion
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedOrdenCompra || ocForm.items.length === 0}
                  className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loading ? "Registrando..." : "Registrar recepcion"}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {resultado && (
        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Resultado de la operacion
          </h2>
          <div className="mb-4 flex flex-wrap gap-3 text-sm">
            {resultado.notaIngreso?.id ? (
              <Link
                to={`/inventario-notas-ingreso/${resultado.notaIngreso.id}`}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Abrir nota de ingreso
              </Link>
            ) : null}
            {resultado.ordenCompra?.id ? (
              <Link
                to={`/ordenes-compra/${resultado.ordenCompra.id}`}
                className="font-medium text-slate-600 hover:text-slate-700"
              >
                Abrir orden de compra
              </Link>
            ) : null}
          </div>
          <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-xs text-gray-700">
            {JSON.stringify(resultado, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default InventarioRecepcionesPage;
