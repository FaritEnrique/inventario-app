import React, { useEffect, useMemo, useReducer, useState } from "react";
import { toast } from "react-toastify";

const createEmptyExistingItem = () => ({
  localId: `item-${Date.now()}-${Math.random()}`,
  id: null,
  productoId: null,
  productoTemporalId: null,
  productoTemporal: null,
  producto: null,
  descripcionVisible: "",
  unidadMedida: "",
  cantidadRequerida: 1,
  valorReferencialUnitario: 0,
  observaciones: "",
  activo: true,
});

const normalizeInitialItems = (items = []) =>
  items.map((item, index) => ({
    localId: `existing-${item.id || index}`,
    id: item.id || null,
    productoId: item.productoId || null,
    productoTemporalId: item.productoTemporalId || null,
    productoTemporal: item.productoTemporal || null,
    producto: item.producto || null,
    descripcionVisible: item.descripcionVisible || "",
    unidadMedida: item.unidadMedida || item.producto?.unidadMedida || item.productoTemporal?.unidadMedida || "",
    cantidadRequerida: item.cantidadRequerida || 1,
    valorReferencialUnitario: item.valorReferencialUnitario || 0,
    observaciones: item.observaciones || "",
    activo: item.activo !== false,
  }));

const buildInitialState = (initialData) => ({
  areaId: initialData?.areaId ? String(initialData.areaId) : "",
  prioridad: initialData?.prioridad || "Normal",
  descripcion: initialData?.descripcion || "",
  usoFinalidad: initialData?.usoFinalidad || "",
  ubicacionUso: initialData?.ubicacionUso || "",
  observacionesGenerales: initialData?.observacionesGenerales || "",
  items: initialData?.items?.length ? normalizeInitialItems(initialData.items) : [],
});

const formReducer = (state, action) => {
  switch (action.type) {
    case "RESET":
      return buildInitialState(action.payload);
    case "FIELD":
      return { ...state, [action.name]: action.value };
    case "ADD_ITEM":
      return { ...state, items: [...state.items, action.item] };
    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((item) =>
          item.localId === action.localId ? { ...item, [action.name]: action.value } : item
        ),
      };
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.localId !== action.localId),
      };
    default:
      return state;
  }
};

const ProductDetailModal = ({ producto, onClose }) => {
  if (!producto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{producto.nombre}</h3>
            <p className="text-sm text-gray-500">{producto.codigo}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded border border-gray-300 px-3 py-1 text-sm">
            Cerrar
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-[220px,1fr]">
          <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-4">
            {producto.imagenUrl ? (
              <img src={producto.imagenUrl} alt={producto.nombre} className="max-h-56 rounded object-contain" />
            ) : (
              <span className="text-sm text-gray-500">Sin imagen</span>
            )}
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <p><span className="font-semibold">Descripcion:</span> {producto.descripcion || "-"}</p>
            <p><span className="font-semibold">Marca:</span> {producto.marca?.nombre || "-"}</p>
            <p><span className="font-semibold">Tipo:</span> {producto.tipoProducto?.nombre || "-"}</p>
            <p><span className="font-semibold">Unidad:</span> {producto.unidadMedida}</p>
            <p><span className="font-semibold">Stock actual:</span> {producto.stock?.cantidadActual ?? 0}</p>
            <p><span className="font-semibold">Stock reservado:</span> {producto.stock?.cantidadReservada ?? 0}</p>
            <p><span className="font-semibold">Stock disponible:</span> {producto.stock?.cantidadDisponible ?? 0}</p>
            <p><span className="font-semibold">Valor referencial sugerido:</span> S/ {(producto.valorReferencialSugerido || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const RequerimientoForm = ({
  initialData,
  areas,
  prioridades,
  allowAreaSelection,
  buscarCatalogoProductos,
  onSubmit,
  submitting,
}) => {
  const [state, dispatch] = useReducer(formReducer, initialData, buildInitialState);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tempDraft, setTempDraft] = useState({
    nombre: "",
    descripcion: "",
    unidadMedida: "UND",
    valorReferencialUnitario: "",
    observaciones: "",
    cantidadRequerida: "1",
  });

  useEffect(() => {
    dispatch({ type: "RESET", payload: initialData });
  }, [initialData]);

  useEffect(() => {
    const trimmed = search.trim();
    if (!trimmed) {
      setResults([]);
      return undefined;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await buscarCatalogoProductos({ search: trimmed, page: 1, limit: 10 });
        setResults(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        toast.error(error.message || "No se pudo consultar el catalogo.");
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, buscarCatalogoProductos]);

  const totalReferencial = useMemo(
    () => state.items.reduce((acc, item) => acc + Number(item.cantidadRequerida || 0) * Number(item.valorReferencialUnitario || 0), 0),
    [state.items]
  );

  const addCatalogProduct = (producto) => {
    if (state.items.some((item) => item.productoId === producto.id)) {
      toast.info("Ese producto ya esta agregado al requerimiento.");
      return;
    }

    dispatch({
      type: "ADD_ITEM",
      item: {
        ...createEmptyExistingItem(),
        productoId: producto.id,
        producto: producto,
        descripcionVisible: producto.nombre,
        unidadMedida: producto.unidadMedida,
        cantidadRequerida: 1,
        valorReferencialUnitario: Number(producto.valorReferencialSugerido || 0),
      },
    });
    setSearch("");
    setResults([]);
  };

  const addTemporaryProduct = () => {
    if (!tempDraft.nombre.trim()) {
      toast.error("Debes ingresar el nombre del producto temporal.");
      return;
    }
    if (!tempDraft.unidadMedida.trim()) {
      toast.error("Debes ingresar la unidad de medida del producto temporal.");
      return;
    }
    const cantidad = Number(tempDraft.cantidadRequerida);
    const valor = Number(tempDraft.valorReferencialUnitario);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      toast.error("La cantidad del producto temporal debe ser mayor a 0.");
      return;
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error("El valor referencial del producto temporal debe ser mayor a 0.");
      return;
    }

    dispatch({
      type: "ADD_ITEM",
      item: {
        ...createEmptyExistingItem(),
        productoTemporal: {
          nombre: tempDraft.nombre.trim(),
          descripcion: tempDraft.descripcion.trim() || null,
          unidadMedida: tempDraft.unidadMedida.trim(),
          valorReferencialUnitario: valor,
          observaciones: tempDraft.observaciones.trim() || null,
        },
        descripcionVisible: tempDraft.nombre.trim(),
        unidadMedida: tempDraft.unidadMedida.trim(),
        cantidadRequerida: cantidad,
        valorReferencialUnitario: valor,
        observaciones: tempDraft.observaciones.trim(),
      },
    });

    setTempDraft({
      nombre: "",
      descripcion: "",
      unidadMedida: "UND",
      valorReferencialUnitario: "",
      observaciones: "",
      cantidadRequerida: "1",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!state.areaId) {
      toast.error("Debes seleccionar el area solicitante.");
      return;
    }
    if (!state.usoFinalidad.trim()) {
      toast.error("Debes registrar el uso o finalidad principal.");
      return;
    }
    if (!state.ubicacionUso.trim()) {
      toast.error("Debes registrar la ubicacion de uso.");
      return;
    }
    if (!state.items.length) {
      toast.error("Debes agregar al menos un item al requerimiento.");
      return;
    }

    const invalidItem = state.items.find(
      (item) =>
        !Number.isFinite(Number(item.cantidadRequerida)) ||
        Number(item.cantidadRequerida) <= 0 ||
        !Number.isFinite(Number(item.valorReferencialUnitario)) ||
        Number(item.valorReferencialUnitario) <= 0
    );

    if (invalidItem) {
      toast.error(
        "Cada item debe tener cantidad y valor referencial unitario mayores a 0."
      );
      return;
    }

    const payload = {
      areaId: Number(state.areaId),
      prioridad: state.prioridad,
      descripcion: state.descripcion.trim() || null,
      usoFinalidad: state.usoFinalidad.trim(),
      ubicacionUso: state.ubicacionUso.trim(),
      observacionesGenerales: state.observacionesGenerales.trim() || null,
      items: state.items.map((item) => {
        const base = {
          id: item.id || undefined,
          cantidadRequerida: Number(item.cantidadRequerida),
          descripcionVisible: item.descripcionVisible || item.producto?.nombre || item.productoTemporal?.nombre,
          unidadMedida: item.unidadMedida,
          valorReferencialUnitario: Number(item.valorReferencialUnitario || 0),
          observaciones: item.observaciones?.trim() || null,
          activo: item.activo !== false,
        };

        if (item.productoId) {
          return { ...base, productoId: item.productoId };
        }

        if (item.productoTemporalId) {
          return { ...base, productoTemporalId: item.productoTemporalId };
        }

        return {
          ...base,
          productoTemporal: {
            nombre: item.productoTemporal?.nombre || item.descripcionVisible,
            descripcion: item.productoTemporal?.descripcion || null,
            unidadMedida: item.unidadMedida,
            valorReferencialUnitario: Number(item.valorReferencialUnitario || 0),
            observaciones: item.productoTemporal?.observaciones || item.observaciones || null,
          },
        };
      }),
    };

    await onSubmit(payload);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-6 shadow">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="requerimiento-area-id" className="mb-1 block text-sm font-medium text-gray-700">Area solicitante</label>
            <select
              id="requerimiento-area-id"
              value={state.areaId}
              name="requerimiento-form-select-318" onChange={(event) => dispatch({ type: "FIELD", name: "areaId", value: event.target.value })}
              disabled={!allowAreaSelection}
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="">Selecciona un area</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.branchDescription ? `${area.nombre} - ${area.branchDescription}` : area.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="requerimiento-prioridad" className="mb-1 block text-sm font-medium text-gray-700">Prioridad</label>
            <select
              id="requerimiento-prioridad"
              value={state.prioridad}
              name="requerimiento-form-select-334" onChange={(event) => dispatch({ type: "FIELD", name: "prioridad", value: event.target.value })}
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              {prioridades.map((prioridad) => (
                <option key={prioridad} value={prioridad}>{prioridad}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="requerimiento-uso-finalidad" className="mb-1 block text-sm font-medium text-gray-700">Uso o finalidad principal</label>
            <input
              id="requerimiento-uso-finalidad"
              type="text"
              value={state.usoFinalidad}
              name="requerimiento-form-input-349" onChange={(event) => dispatch({ type: "FIELD", name: "usoFinalidad", value: event.target.value })}
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Ej. reparacion de sistema de agua"
            />
          </div>
          <div>
            <label htmlFor="requerimiento-ubicacion-uso" className="mb-1 block text-sm font-medium text-gray-700">Ubicacion / donde se usara</label>
            <input
              id="requerimiento-ubicacion-uso"
              type="text"
              value={state.ubicacionUso}
              name="requerimiento-form-input-359" onChange={(event) => dispatch({ type: "FIELD", name: "ubicacionUso", value: event.target.value })}
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Ej. edificio administrativo"
            />
          </div>
        </div>

        <div>
          <label htmlFor="requerimiento-descripcion-general" className="mb-1 block text-sm font-medium text-gray-700">Descripcion general</label>
          <textarea
            id="requerimiento-descripcion-general"
            value={state.descripcion}
            name="requerimiento-form-textarea-371" onChange={(event) => dispatch({ type: "FIELD", name: "descripcion", value: event.target.value })}
            rows="2"
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="requerimiento-observaciones-generales" className="mb-1 block text-sm font-medium text-gray-700">Observaciones generales</label>
          <textarea
            id="requerimiento-observaciones-generales"
            value={state.observacionesGenerales}
            name="requerimiento-form-textarea-381" onChange={(event) => dispatch({ type: "FIELD", name: "observacionesGenerales", value: event.target.value })}
            rows="3"
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900">Agregar producto existente</h3>
            <p className="mt-1 text-sm text-gray-500">Busca en el catalogo y revisa stock, caracteristicas e imagen.</p>
            <input
              type="text"
              value={search}
              name="requerimiento-form-input-393" onChange={(event) => setSearch(event.target.value)}
              className="mt-3 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Buscar por codigo, nombre o descripcion"
            />
            {searching && <p className="mt-2 text-sm text-gray-500">Buscando productos...</p>}
            {!searching && results.length > 0 && (
              <div className="mt-3 max-h-80 overflow-y-auto rounded border border-gray-200">
                {results.map((producto) => (
                  <div key={producto.id} className="border-b border-gray-200 px-4 py-3 last:border-b-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{producto.nombre}</p>
                        <p className="text-sm text-gray-500">{producto.codigo}</p>
                        <p className="text-sm text-gray-600">Disponible: {producto.stock?.cantidadDisponible ?? 0} {producto.unidadMedida}</p>
                        <p className="text-sm text-gray-600">Valor sugerido: S/ {(producto.valorReferencialSugerido || 0).toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button type="button" onClick={() => addCatalogProduct(producto)} className="rounded bg-indigo-600 px-3 py-1 text-sm text-white">Agregar</button>
                        <button type="button" onClick={() => setSelectedProduct(producto)} className="rounded border border-gray-300 px-3 py-1 text-sm">Ver detalle</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900">Proponer producto temporal</h3>
            <p className="mt-1 text-sm text-gray-500">Usa esta opcion si el catalogo actual no corresponde.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input className="rounded border border-gray-300 px-3 py-2" placeholder="Nombre" value={tempDraft.nombre} name="requerimiento-form-input-427" onChange={(event) => setTempDraft((prev) => ({ ...prev, nombre: event.target.value }))} />
              <input className="rounded border border-gray-300 px-3 py-2" placeholder="Unidad" value={tempDraft.unidadMedida} name="requerimiento-form-input-428" onChange={(event) => setTempDraft((prev) => ({ ...prev, unidadMedida: event.target.value }))} />
              <input className="rounded border border-gray-300 px-3 py-2" placeholder="Cantidad" type="number" min="1" step="0.01" value={tempDraft.cantidadRequerida} name="requerimiento-form-input-429" onChange={(event) => setTempDraft((prev) => ({ ...prev, cantidadRequerida: event.target.value }))} />
              <input className="rounded border border-gray-300 px-3 py-2" placeholder="Valor referencial" type="number" min="0" step="0.01" value={tempDraft.valorReferencialUnitario} name="requerimiento-form-input-430" onChange={(event) => setTempDraft((prev) => ({ ...prev, valorReferencialUnitario: event.target.value }))} />
            </div>
            <textarea className="mt-3 w-full rounded border border-gray-300 px-3 py-2" rows="2" placeholder="Descripcion" value={tempDraft.descripcion} name="requerimiento-form-textarea-432" onChange={(event) => setTempDraft((prev) => ({ ...prev, descripcion: event.target.value }))} />
            <textarea className="mt-3 w-full rounded border border-gray-300 px-3 py-2" rows="2" placeholder="Observaciones" value={tempDraft.observaciones} name="requerimiento-form-textarea-433" onChange={(event) => setTempDraft((prev) => ({ ...prev, observaciones: event.target.value }))} />
            <button type="button" onClick={addTemporaryProduct} className="mt-3 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Agregar producto temporal</button>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Items del requerimiento</h3>
            <span className="rounded bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">Total referencial: S/ {totalReferencial.toFixed(2)}</span>
          </div>
          {state.items.length === 0 ? (
            <div className="rounded border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">Todavia no agregaste items.</div>
          ) : (
            <div className="space-y-4">
              {state.items.map((item) => (
                <div key={item.localId} className="rounded-lg border border-gray-200 p-4">
                  <div className="grid gap-3 md:grid-cols-6">
                    <div className="md:col-span-2">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Item</span>
                      <p className="font-medium text-gray-900">{item.descripcionVisible || item.producto?.nombre || item.productoTemporal?.nombre}</p>
                      <p className="text-xs text-gray-500">{item.productoId ? (item.producto?.codigo || "Producto catalogado") : "Producto temporal"}</p>
                    </div>
                    <div>
                      <label htmlFor={`requerimiento-item-cantidad-${item.localId}`} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Cantidad</label>
                      <input id={`requerimiento-item-cantidad-${item.localId}`} type="number" min="1" step="0.01" value={item.cantidadRequerida} name="requerimiento-form-input-457" onChange={(event) => dispatch({ type: "UPDATE_ITEM", localId: item.localId, name: "cantidadRequerida", value: Number(event.target.value) || 1 })} className="w-full rounded border border-gray-300 px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor={`requerimiento-item-unidad-${item.localId}`} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Unidad</label>
                      <input id={`requerimiento-item-unidad-${item.localId}`} value={item.unidadMedida} name="requerimiento-form-input-461" onChange={(event) => dispatch({ type: "UPDATE_ITEM", localId: item.localId, name: "unidadMedida", value: event.target.value })} className="w-full rounded border border-gray-300 px-3 py-2" />
                    </div>
                    <div>
                      <label htmlFor={`requerimiento-item-valor-${item.localId}`} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Valor referencial</label>
                      <input id={`requerimiento-item-valor-${item.localId}`} type="number" min="0" step="0.01" value={item.valorReferencialUnitario} name="requerimiento-form-input-465" onChange={(event) => dispatch({ type: "UPDATE_ITEM", localId: item.localId, name: "valorReferencialUnitario", value: Number(event.target.value) || 0 })} className="w-full rounded border border-gray-300 px-3 py-2" />
                    </div>
                    <div className="flex items-end justify-end">
                      <button type="button" onClick={() => dispatch({ type: "REMOVE_ITEM", localId: item.localId })} className="rounded border border-red-200 px-3 py-2 text-sm text-red-700">Retirar</button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <textarea value={item.observaciones} name="requerimiento-form-textarea-472" onChange={(event) => dispatch({ type: "UPDATE_ITEM", localId: item.localId, name: "observaciones", value: event.target.value })} rows="2" className="w-full rounded border border-gray-300 px-3 py-2" placeholder="Observaciones del item" />
                    <div className="rounded bg-gray-50 p-3 text-sm text-gray-600">
                      <p><span className="font-semibold">Subtotal referencial:</span> S/ {(Number(item.cantidadRequerida || 0) * Number(item.valorReferencialUnitario || 0)).toFixed(2)}</p>
                      <p><span className="font-semibold">Stock al momento:</span> {item.producto?.stock?.cantidadDisponible ?? item.stockAlMomento ?? "-"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="submit" disabled={submitting} className="rounded bg-indigo-600 px-5 py-2 font-medium text-white disabled:opacity-60">
            {submitting ? "Guardando..." : "Guardar requerimiento"}
          </button>
        </div>
      </form>

      <ProductDetailModal producto={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
};

export default RequerimientoForm;
