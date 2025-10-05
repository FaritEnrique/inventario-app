import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AiOutlineArrowLeft,
  AiOutlinePlus,
  AiOutlineDelete,
} from "react-icons/ai";
import productosApi from "../api/productosApi";
import useTipoProductos from "../hooks/useTipoProductos";
import useMarcas from "../hooks/useMarcas";
import useProductos from "../hooks/useProductos";
import useAreas from "../hooks/useAreas";
import useRequerimientos from "../hooks/useRequerimientos";

// Hook de debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Toast simple
const useToast = () => {
  const [message, setMessage] = useState(null);
  const [type, setType] = useState(null);

  const showToast = useCallback((msg, msgType) => {
    setMessage(msg);
    setType(msgType);
    setTimeout(() => {
      setMessage(null);
      setType(null);
    }, 3000);
  }, []);

  return {
    message,
    type,
    toast: {
      success: (msg) => showToast(msg, "success"),
      error: (msg) => showToast(msg, "error"),
      warn: (msg) => showToast(msg, "warn"),
    },
  };
};

const initialRequerimiento = {
  areaId: "",
  userId: "tu-id-de-usuario-aqui",
  solicitante: "",
  actividad: "",
  prioridad: "Normal",
  detalleUso: "",
  items: [],
  estado: "Pendiente",
};

const initialProducto = {
  nombre: "",
  codigo: "",
  unidadMedida: "",
  tipoProductoId: null,
  marcaId: null,
  descripcion: "",
  imagenUrl: "",
};

const CrearRequerimientoPage = () => {
  const [requerimiento, setRequerimiento] = useState(initialRequerimiento);
  const [productos, setProductos] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
  const [productoActual, setProductoActual] = useState(initialProducto);

  const { areas, cargando: cargandoAreas, error: errorAreas } = useAreas();
  const { tiposProducto, cargando: cargandoTipos } = useTipoProductos();
  const { marcas, cargando: cargandoMarcas } = useMarcas();
  const { crearProducto } = useProductos();
  const { prioridades } = useRequerimientos();

  const { message, type, toast } = useToast();

  const debouncedBusqueda = useDebounce(busquedaProducto, 500);

  // Buscar productos
  useEffect(() => {
    const fetchProductos = async () => {
      setCargandoProductos(true);
      try {
        const data = await productosApi.getTodos(debouncedBusqueda);
        setProductos(data);
      } catch (error) {
        console.error("Error al buscar productos:", error);
      } finally {
        setCargandoProductos(false);
      }
    };
    if (debouncedBusqueda) fetchProductos();
    else setProductos([]);
  }, [debouncedBusqueda]);

  // Handlers
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setRequerimiento((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAddItem = useCallback(
    (producto) => {
      if (requerimiento.items.some((i) => i.productoId === producto.id)) {
        toast.warn("Este producto ya ha sido agregado.");
        return;
      }
      setRequerimiento((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          { productoId: producto.id, cantidad: 1, producto },
        ],
      }));
      setBusquedaProducto("");
    },
    [requerimiento.items, toast]
  );

  const handleRemoveItem = useCallback((productoId) => {
    setRequerimiento((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.productoId !== productoId),
    }));
  }, []);

  const handleItemQuantityChange = useCallback((e, productoId) => {
    const value = Number(e.target.value);
    setRequerimiento((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productoId === productoId ? { ...item, cantidad: value } : item
      ),
    }));
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (requerimiento.items.length === 0) {
        toast.error("❌ Debe agregar al menos un ítem al requerimiento.");
        return;
      }
      setShowConfirmation(true);
    },
    [requerimiento.items, toast]
  );

  const handleConfirmSubmission = useCallback(async () => {
    setShowConfirmation(false);
    setCargando(true);
    try {
      await productosApi.crearRequerimiento(requerimiento);
      toast.success("✅ Requerimiento creado correctamente!");
      setRequerimiento(initialRequerimiento);
    } catch (error) {
      console.error(error);
      toast.error("❌ Error al crear el requerimiento.");
    } finally {
      setCargando(false);
    }
  }, [requerimiento, toast]);

  const abrirModalProducto = () => {
    setProductoActual(initialProducto);
    setModalProductoAbierto(true);
  };

  const cerrarModalProducto = () => {
    setModalProductoAbierto(false);
    setProductoActual(initialProducto);
  };

  const handleCrearProducto = async () => {
    const {
      nombre,
      unidadMedida,
      tipoProductoId,
      marcaId,
      descripcion,
      imagenUrl,
    } = productoActual;

    if (!nombre || !unidadMedida || !tipoProductoId) {
      toast.error("❌ Completa los campos obligatorios");
      return;
    }

    try {
      const nuevoProducto = {
        nombre,
        unidadMedida,
        tipoProductoId,
        marcaId: marcaId || null,
        descripcion: descripcion || null,
        imagenUrl: imagenUrl || null,
      };
      const creado = await crearProducto(nuevoProducto);
      toast.success("✅ Producto creado correctamente");
      cerrarModalProducto();
      setProductos((prev) => [...prev, creado]);
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Error al crear producto";
      toast.error(`❌ ${msg}`);
    }
  };

  const messageClass = useMemo(() => {
    switch (type) {
      case "success":
        return "bg-green-500 text-white";
      case "error":
        return "bg-red-500 text-white";
      case "warn":
        return "bg-yellow-500 text-black";
      default:
        return "";
    }
  }, [type]);

  return (
    <div className="min-h-screen p-6 font-sans antialiased bg-gray-100">
      {/* Toast */}
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl text-center ${messageClass}`}
        >
          {message}
        </div>
      )}

      {/* Confirmación Requerimiento */}
      {showConfirmation && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-sm p-6 text-center bg-white rounded-lg shadow-xl">
            <p className="mb-4 text-xl font-bold">Confirmar Requerimiento</p>
            <p className="mb-6 text-gray-700">
              ¿Estás seguro de que deseas crear este requerimiento?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleConfirmSubmission}
                className="px-4 py-2 font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600"
              >
                Sí, Confirmar
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 font-semibold text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      <div className="max-w-5xl p-6 mx-auto bg-white shadow-lg rounded-xl">
        <div className="flex items-center justify-end w-full mb-4">
          <a
            href="/gestion-requerimientos"
            className="flex items-center space-x-2 text-sky-500 hover:text-indigo-500"
          >
            <AiOutlineArrowLeft size={24} />
            <span className="text-lg font-semibold">
              Volver a Requerimientos
            </span>
          </a>
        </div>

        <form onSubmit={handleSubmit}>
          <h2 className="mb-4 text-2xl font-bold text-gray-700">
            Crear Nuevo Requerimiento
          </h2>

          <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-end">
            {/* Área */}
            <div className="flex-1">
              {cargandoAreas ? (
                <p className="text-sm text-gray-500">Cargando áreas...</p>
              ) : errorAreas ? (
                <p className="text-sm text-red-500">
                  Error cargando áreas: {errorAreas}
                </p>
              ) : (
                <div className="flex flex-col">
                  <label
                    htmlFor="areaId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Área
                  </label>
                  <select
                    id="areaId"
                    name="areaId"
                    value={requerimiento.areaId}
                    onChange={handleChange}
                    className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Selecciona un área</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Prioridad */}
            <div className="flex-1">
              <label
                htmlFor="prioridad"
                className="block text-sm font-medium text-gray-700"
              >
                Prioridad
              </label>
              <select
                id="prioridad"
                name="prioridad"
                value={requerimiento.prioridad}
                onChange={handleChange}
                className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Selecciona prioridad</option>
                {prioridades.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ítems */}
          <h3 className="pb-2 mt-8 mb-4 text-xl font-semibold text-gray-700 border-b-2 border-blue-600">
            Ítems del Requerimiento
          </h3>

          <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-end">
            <div className="flex-grow">
              <label
                htmlFor="busquedaProducto"
                className="block text-sm font-medium text-gray-700"
              >
                Buscar y Agregar Producto
              </label>
              <input
                type="text"
                id="busquedaProducto"
                placeholder="Escribe para buscar..."
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={abrirModalProducto}
                className="px-4 py-2 text-white bg-indigo-600 rounded-md shadow hover:bg-indigo-700"
              >
                Crear Producto <AiOutlinePlus className="inline ml-1" />
              </button>
            </div>
          </div>

          {/* Resultados de búsqueda */}
          {cargandoProductos && (
            <p className="text-sm text-gray-500">Buscando productos...</p>
          )}
          {busquedaProducto && productos.length > 0 && (
            <div className="p-4 mb-4 border rounded-md shadow-inner bg-gray-50">
              <p className="mb-2 text-sm font-semibold">
                Resultados de la búsqueda:
              </p>
              <ul className="space-y-1">
                {productos.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between p-2 text-sm bg-white border rounded-md shadow-sm"
                  >
                    <span>
                      {p.nombre} ({p.codigo}) - {p.unidadMedida}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddItem(p)}
                      className="p-1 text-xs text-white bg-green-500 rounded-full hover:bg-green-600"
                    >
                      <AiOutlinePlus />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabla de ítems */}
          {requerimiento.items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                      Ítem
                    </th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                      Código
                    </th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                      Denominación
                    </th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                      U.M.
                    </th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requerimiento.items.map((item, index) => (
                    <tr key={item.productoId}>
                      <td className="px-4 py-2 text-sm text-center text-gray-700">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {item.producto.codigo}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {item.producto.nombre}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {item.producto.unidadMedida}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <input
                          type="number"
                          value={item.cantidad}
                          min="1"
                          onChange={(e) =>
                            handleItemQuantityChange(e, item.productoId)
                          }
                          className="w-16 p-1 text-sm text-center border rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productoId)}
                          className="p-1 text-white bg-red-500 rounded-full hover:bg-red-600"
                        >
                          <AiOutlineDelete />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={cargando || requerimiento.items.length === 0}
              className="px-6 py-3 font-semibold text-white transition duration-200 ease-in-out bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cargando ? "Guardando..." : "Crear Requerimiento"}
            </button>
          </div>
        </form>
      </div>

      {/* Modal Crear Producto */}
      {modalProductoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h2 className="mb-4 text-xl font-bold text-gray-700">
              Crear Producto
            </h2>
            <div className="flex flex-col gap-3">
              {/* Nombre */}
              <div className="flex flex-col">
                <label
                  htmlFor="productoNombre"
                  className="text-sm font-medium text-gray-700"
                >
                  Nombre *
                </label>
                <input
                  type="text"
                  id="productoNombre"
                  name="nombre"
                  value={productoActual.nombre}
                  onChange={(e) =>
                    setProductoActual((prev) => ({
                      ...prev,
                      nombre: e.target.value,
                    }))
                  }
                  className="p-2 border rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Unidad de Medida */}
              <div className="flex flex-col">
                <label
                  htmlFor="productoUnidadMedida"
                  className="text-sm font-medium text-gray-700"
                >
                  Unidad de Medida *
                </label>
                <input
                  type="text"
                  id="productoUnidadMedida"
                  name="unidadMedida"
                  value={productoActual.unidadMedida}
                  onChange={(e) =>
                    setProductoActual((prev) => ({
                      ...prev,
                      unidadMedida: e.target.value,
                    }))
                  }
                  className="p-2 border rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Descripción */}
              <div className="flex flex-col">
                <label
                  htmlFor="productoDescripcion"
                  className="text-sm font-medium text-gray-700"
                >
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  id="productoDescripcion"
                  name="descripcion"
                  value={productoActual.descripcion || ""}
                  onChange={(e) =>
                    setProductoActual((prev) => ({
                      ...prev,
                      descripcion: e.target.value,
                    }))
                  }
                  className="p-2 border rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* URL de Imagen */}
              <div className="flex flex-col">
                <label
                  htmlFor="productoImagenUrl"
                  className="text-sm font-medium text-gray-700"
                >
                  URL de Imagen (opcional)
                </label>
                <input
                  type="text"
                  id="productoImagenUrl"
                  name="imagenUrl"
                  value={productoActual.imagenUrl || ""}
                  onChange={(e) =>
                    setProductoActual((prev) => ({
                      ...prev,
                      imagenUrl: e.target.value,
                    }))
                  }
                  className="p-2 border rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Tipo de Producto */}
              <div className="flex flex-col">
                <label
                  htmlFor="productoTipo"
                  className="text-sm font-medium text-gray-700"
                >
                  Tipo de Producto *
                </label>
                <select
                  id="productoTipo"
                  name="tipoProductoId"
                  value={productoActual.tipoProductoId || ""}
                  onChange={(e) =>
                    setProductoActual((prev) => ({
                      ...prev,
                      tipoProductoId: Number(e.target.value),
                    }))
                  }
                  className="p-2 border rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="" disabled>
                    {cargandoTipos
                      ? "Cargando tipos..."
                      : "Selecciona Tipo de Producto"}
                  </option>
                  {tiposProducto.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Marca */}
              <div className="flex flex-col">
                <label
                  htmlFor="productoMarca"
                  className="text-sm font-medium text-gray-700"
                >
                  Marca (opcional)
                </label>
                <select
                  id="productoMarca"
                  name="marcaId"
                  value={productoActual.marcaId || ""}
                  onChange={(e) =>
                    setProductoActual((prev) => ({
                      ...prev,
                      marcaId: Number(e.target.value) || null,
                    }))
                  }
                  className="p-2 border rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">
                    {cargandoMarcas ? "Cargando marcas..." : "Selecciona Marca"}
                  </option>
                  {marcas.map((marca) => (
                    <option key={marca.id} value={marca.id}>
                      {marca.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={cerrarModalProducto}
                  className="px-4 py-2 font-semibold text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCrearProducto}
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrearRequerimientoPage;
