// src/components/ValidarProductoTemporalModal.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import marcasApi from "../api/marcasApi";
import productosApi from "../api/productosApi";
import productosTemporalesApi from "../api/productosTemporalesApi";
import tipoProductoApi from "../api/tipoProductoApi";

const asArray = (value, keys = []) => {
  if (Array.isArray(value)) return value;
  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
};

const initialCreateForm = (temporal) => ({
  nombre: temporal?.nombre || "",
  descripcion: temporal?.descripcion || "",
  unidadMedida: temporal?.unidadMedida || "",
  valorReferencial: temporal?.valorReferencialUnitario ?? "",
  tipoProductoId: "",
  marcaId: "",
});

const ValidarProductoTemporalModal = ({
  open,
  productoTemporal,
  onClose,
  onResolved,
}) => {
  const [mode, setMode] = useState("vincular");
  const [search, setSearch] = useState("");
  const [productos, setProductos] = useState([]);
  const [selectedProductoId, setSelectedProductoId] = useState("");
  const [tiposProducto, setTiposProducto] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [form, setForm] = useState(() => initialCreateForm(productoTemporal));
  const [loading, setLoading] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(false);

  const temporalId = productoTemporal?.id;
  const title = useMemo(
    () => productoTemporal?.nombre || "Producto temporal",
    [productoTemporal],
  );

  useEffect(() => {
    if (!open) return;
    setMode("vincular");
    setSearch(productoTemporal?.nombre || "");
    setProductos([]);
    setSelectedProductoId("");
    setForm(initialCreateForm(productoTemporal));
  }, [open, productoTemporal]);

  useEffect(() => {
    if (!open) return;

    let active = true;
    const loadCatalogs = async () => {
      try {
        setLoadingCatalogs(true);
        const [tiposResponse, marcasResponse] = await Promise.all([
          tipoProductoApi.getTodos(),
          marcasApi.getTodas(),
        ]);

        if (!active) return;
        setTiposProducto(
          asArray(tiposResponse, ["tiposProducto", "tipos", "data"]).filter(
            (item) => item?.activo !== false,
          ),
        );
        setMarcas(
          asArray(marcasResponse, ["marcas", "data"]).filter(
            (item) => item?.activo !== false,
          ),
        );
      } catch (error) {
        if (active) {
          toast.error(error.message || "No se pudieron cargar catálogos.");
        }
      } finally {
        if (active) setLoadingCatalogs(false);
      }
    };

    loadCatalogs();
    return () => {
      active = false;
    };
  }, [open]);

  if (!open) return null;

  const buscarProductos = async () => {
    try {
      setLoadingProductos(true);
      const response = await productosApi.getTodos(search, 1, 20, "activos");
      setProductos(asArray(response, ["productos", "data"]));
    } catch (error) {
      toast.error(error.message || "No se pudieron buscar productos.");
    } finally {
      setLoadingProductos(false);
    }
  };

  const handleVincular = async () => {
    if (!temporalId) return;
    if (!selectedProductoId) {
      toast.error("Selecciona un producto del catálogo.");
      return;
    }

    try {
      setLoading(true);
      const response = await productosTemporalesApi.vincular(temporalId, {
        productoId: Number(selectedProductoId),
      });
      toast.success("Producto temporal vinculado correctamente.");
      onResolved?.(response);
      onClose?.();
    } catch (error) {
      toast.error(error.message || "No se pudo vincular el producto temporal.");
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = async () => {
    if (!temporalId) return;
    if (!String(form.nombre || "").trim()) {
      toast.error("El nombre del producto es obligatorio.");
      return;
    }
    if (!String(form.unidadMedida || "").trim()) {
      toast.error("La unidad de medida es obligatoria.");
      return;
    }
    if (!form.tipoProductoId) {
      toast.error("Selecciona un tipo de producto.");
      return;
    }

    try {
      setLoading(true);
      const response = await productosTemporalesApi.crearProducto(temporalId, {
        ...form,
        tipoProductoId: Number(form.tipoProductoId),
        marcaId: form.marcaId ? Number(form.marcaId) : null,
        valorReferencial:
          form.valorReferencial === "" ? null : Number(form.valorReferencial),
      });
      toast.success("Producto creado y vinculado correctamente.");
      onResolved?.(response);
      onClose?.();
    } catch (error) {
      toast.error(error.message || "No se pudo crear el producto.");
    } finally {
      setLoading(false);
    }
  };

  const submitAction = mode === "vincular" ? handleVincular : handleCrear;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Validar producto temporal
              </h2>
              <p className="mt-1 text-sm text-slate-600">{title}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Este producto proviene de un requerimiento y debe resolverse como
            producto maestro antes de recepcionar la línea.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("vincular")}
              className={`rounded border px-4 py-2 text-sm font-medium ${
                mode === "vincular"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Vincular a producto existente
            </button>
            <button
              type="button"
              onClick={() => setMode("crear")}
              className={`rounded border px-4 py-2 text-sm font-medium ${
                mode === "crear"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Crear producto maestro
            </button>
          </div>

          {mode === "vincular" ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="flex-1 rounded border border-slate-300 px-3 py-2"
                  placeholder="Buscar producto existente"
                />
                <button
                  type="button"
                  onClick={buscarProductos}
                  disabled={loadingProductos}
                  className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:bg-slate-400"
                >
                  {loadingProductos ? "Buscando..." : "Buscar"}
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto rounded border border-slate-200">
                {productos.length === 0 ? (
                  <p className="p-3 text-sm text-slate-500">
                    Busca y selecciona un producto del catálogo.
                  </p>
                ) : (
                  productos.map((producto) => (
                    <label
                      key={producto.id}
                      className="flex cursor-pointer items-start gap-3 border-b border-slate-100 p-3 text-sm hover:bg-slate-50"
                    >
                      <input
                        type="radio"
                        name="producto-existente"
                        value={producto.id}
                        checked={
                          String(selectedProductoId) === String(producto.id)
                        }
                        onChange={(event) =>
                          setSelectedProductoId(event.target.value)
                        }
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium text-slate-900">
                          {producto.codigo} - {producto.nombre}
                        </span>
                        <span className="block text-slate-500">
                          {producto.unidadMedida || "Sin unidad"} |{" "}
                          {producto.descripcion || "Sin descripción"}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                {tiposProducto.length === 0 ? (
                  <p className="text-amber-800">
                    Tipo de producto pendiente de validación. Valide el tipo
                    antes de crear el producto maestro.
                  </p>
                ) : (
                  <p>
                    Selecciona un tipo oficial activo. Si el tipo requerido aún
                    no existe, primero valídalo en la bandeja de tipos.
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-sm font-medium">
                  <Link
                    to="/modulo-almacen/productos/validacion-tipos"
                    className="text-indigo-700 hover:text-indigo-900"
                    onClick={onClose}
                  >
                    Validar Tipos de Producto
                  </Link>
                  <Link
                    to="/modulo-almacen/productos/marcas"
                    className="text-indigo-700 hover:text-indigo-900"
                    onClick={onClose}
                  >
                    Gestión de Marcas
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, nombre: event.target.value }))
                  }
                  className="rounded border border-slate-300 px-3 py-2"
                  placeholder="Nombre"
                />

                <input
                  type="text"
                  value={form.unidadMedida}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      unidadMedida: event.target.value,
                    }))
                  }
                  className="rounded border border-slate-300 px-3 py-2"
                  placeholder="Unidad de medida"
                />

                <select
                  value={form.tipoProductoId}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      tipoProductoId: event.target.value,
                    }))
                  }
                  disabled={loadingCatalogs}
                  className="rounded border border-slate-300 px-3 py-2"
                >
                  <option value="">Tipo de producto</option>
                  {tiposProducto.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>

                <select
                  value={form.marcaId}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      marcaId: event.target.value,
                    }))
                  }
                  disabled={loadingCatalogs}
                  className="rounded border border-slate-300 px-3 py-2"
                >
                  <option value="">Marca opcional</option>
                  {marcas.map((marca) => (
                    <option key={marca.id} value={marca.id}>
                      {marca.nombre}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valorReferencial}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      valorReferencial: event.target.value,
                    }))
                  }
                  className="rounded border border-slate-300 px-3 py-2"
                  placeholder="Valor referencial"
                />

                <textarea
                  value={form.descripcion}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      descripcion: event.target.value,
                    }))
                  }
                  rows="3"
                  className="rounded border border-slate-300 px-3 py-2 md:col-span-2"
                  placeholder="Descripción"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submitAction}
            disabled={loading}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {loading
              ? "Procesando..."
              : mode === "vincular"
                ? "Vincular producto"
                : "Crear y vincular producto"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ValidarProductoTemporalModal;
