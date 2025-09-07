// src/pages/GestionProductosPage.jsx
import { useEffect, useState, useCallback } from "react";
import useProductos from "../hooks/useProductos";
import useMarcas from "../hooks/useMarcas";
import useTipoProductos from "../hooks/useTipoProductos";
import { toast } from "react-toastify";
import productosApi from "../api/productosApi";
import Modal from "react-modal";
import { FaSearch } from "react-icons/fa";
import { TbArrowBackUpDouble } from "react-icons/tb";
import { MdCategory } from "react-icons/md";
import { FaRegistered } from "react-icons/fa";
import useDebounce from "../hooks/useDebounce";
import { Link } from "react-router-dom";

Modal.setAppElement("#root");

const cardClasses =
  "border-2 border-indigo-500 bg-white rounded-lg p-6 shadow transition-transform duration-300 transform hover:scale-105 hover:shadow-xl";

const cards = [
  {
    title: "Gestión de Tipos de Producto",
    description:
      "Organiza, crea y administra las categorías y clasificaciones de tus productos.",
    icon: <MdCategory />,
    path: "/gestion-tipo-producto",
  },
  {
    title: "Marcas",
    description: "Gestionar marcas asociadas a productos.",
    icon: <FaRegistered />,
    path: "/gestion-marcas",
  },
];

const devLog = (...args) => {
  if (import.meta.env.MODE === "development") {
  }
};

const initialProducto = {
  id: null,
  codigo: "",
  nombre: "",
  descripcion: "",
  unidadMedida: "",
  stock: 0,
  imagenUrl: "",
  marcaId: "",
  tipoProductoId: "",
  activo: true,
};

const GestionProductosPage = () => {
  const [productoActual, setProductoActual] = useState(initialProducto);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [productoEnDetalle, setProductoEnDetalle] = useState(null);

  const {
    productos,
    fetchProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    cargando: cargandoProductos,
  } = useProductos();
  const { marcas, fetchMarcas, cargando: cargandoMarcas } = useMarcas();
  const {
    tiposProducto,
    fetchTiposProducto,
    cargando: cargandoTipos,
  } = useTipoProductos();

  const debouncedBusqueda = useDebounce(busqueda, 2000);

  useEffect(() => {
    fetchProductos(debouncedBusqueda);
  }, [fetchProductos, debouncedBusqueda]); // Depende de fetchProductos y del valor debounced de la búsqueda

  useEffect(() => {
    fetchMarcas();
    fetchTiposProducto();
  }, [fetchMarcas, fetchTiposProducto]);

  useEffect(() => {
    const generarCodigoAutomatico = async () => {
      if (!modoEdicion && productoActual.tipoProductoId) {
        try {
          const siguienteCodigo = await productosApi.getSiguienteCodigo(
            productoActual.tipoProductoId
          );
          setProductoActual((prev) => ({ ...prev, codigo: siguienteCodigo }));
        } catch (error) {
          console.error("Error al obtener el siguiente código:", error);
          toast.error(
            "Error al generar código automático. Revise la consola para más detalles."
          );
          setProductoActual((prev) => ({ ...prev, codigo: "" }));
        }
      } else if (!modoEdicion && !productoActual.tipoProductoId) {
        setProductoActual((prev) => ({ ...prev, codigo: "" }));
      }
    };

    generarCodigoAutomatico();
  }, [productoActual.tipoProductoId, modoEdicion]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setProductoActual((prevProductoActual) => ({
      ...prevProductoActual,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseFloat(value)
          : value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const { nombre, unidadMedida, tipoProductoId } = productoActual;

      if (!nombre.trim() || !unidadMedida.trim() || !tipoProductoId) {
        toast.error(
          "❌ Los campos Nombre, Unidad de Medida y Tipo de Producto son obligatorios y deben ser válidos."
        );
        return;
      }
      if (!modoEdicion && !tipoProductoId) {
        toast.error("❌ Seleccione un tipo de producto válido para continuar.");
        return;
      }

      try {
        const datosParaGuardar = {
          ...productoActual,
          marcaId: productoActual.marcaId
            ? parseInt(productoActual.marcaId)
            : null,
          tipoProductoId: parseInt(tipoProductoId),
        };

        if (modoEdicion) {
          const {
            codigo,
            stock,
            precio,
            usaStockMinimo,
            stockMinimo,
            ...datosLimpios
          } = datosParaGuardar;
          await actualizarProducto(productoActual.id, datosLimpios);
        } else {
          const {
            codigo,
            stock,
            precio,
            usaStockMinimo,
            stockMinimo,
            ...datosLimpiosParaCrear
          } = datosParaGuardar;
          await crearProducto(datosLimpiosParaCrear);
        }
        setProductoActual(initialProducto);
        setModoEdicion(false);
        fetchProductos(debouncedBusqueda);
        toast.success(
          `✅ Producto ${
            modoEdicion ? "actualizado" : "registrado"
          } correctamente.`
        );
      } catch (err) {
        console.error("Error al guardar producto:", err);
        toast.error(
          `❌ Error al guardar producto: ${err.message || "Error desconocido"}`
        );
      }
    },
    [
      productoActual,
      modoEdicion,
      actualizarProducto,
      crearProducto,
      fetchProductos,
      debouncedBusqueda,
    ]
  );

  const handleEditar = useCallback((producto) => {
    setProductoActual({
      ...producto,
      stock: parseFloat(producto.stock),
      marcaId: producto.marcaId ? String(producto.marcaId) : "",
      tipoProductoId: String(producto.tipoProductoId),
      activo: typeof producto.activo === "boolean" ? producto.activo : true,
    });
    setModoEdicion(true);
  }, []);

  const handleEliminar = useCallback(
    async (id) => {
      if (
        confirm(
          "¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer."
        )
      ) {
        try {
          await eliminarProducto(id);
          toast.success("🗑️ Producto eliminado correctamente.");
          fetchProductos(debouncedBusqueda); // Volver a cargar productos después de eliminar
          if (productoActual.id === id) {
            setProductoActual(initialProducto);
            setModoEdicion(false);
          }
        } catch (err) {
          console.error("Error al eliminar producto:", err);
          toast.error(
            `❌ Error al eliminar producto: ${
              err.message || "Error desconocido"
            }`
          );
        }
      }
    },
    [eliminarProducto, fetchProductos, productoActual, debouncedBusqueda]
  );

  const handleClearForm = useCallback(() => {
    setProductoActual(initialProducto);
    setModoEdicion(false);
  }, []);

  const handleVerDetalles = useCallback((producto) => {
    setProductoEnDetalle(producto);
    setModalIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalIsOpen(false);
    setProductoEnDetalle(null);
  }, []);

  const cargandoGeneral = cargandoProductos || cargandoMarcas || cargandoTipos;

  return (
    <div className="max-w-5xl p-6 mx-auto">
      <h1 className="text-2xl font-bold text-center text-indigo-700">
        Gestión de Productos
      </h1>
      <div className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-lg">
        <div className="flex items-center justify-end w-full mb-2">
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 hover:underline text-sky-500 hover:text-indigo-500"
          >
            <TbArrowBackUpDouble size={22} />
            <span className="text-lg font-semibold">Dashboard</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 mb-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.title} to={card.path} className={cardClasses}>
              <div className="flex items-center justify-center mx-auto mb-3 text-3xl text-indigo-600 bg-indigo-100 border-2 border-blue-600 rounded-full w-14 h-14">
                {card.icon}
              </div>
              <h2 className="text-lg font-semibold text-center text-gray-800">
                {card.title}
              </h2>
              <p className="text-sm text-center text-gray-600">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
        <h2 className="pb-3 mb-5 text-2xl font-bold text-gray-700 border-b-2 border-blue-600">
          {modoEdicion ? "Actualizar Producto" : "Crear Nuevo Producto"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2"
        >
          <div>
            <label
              htmlFor="tipoProductoId"
              className="block text-sm font-medium text-gray-700"
            >
              Tipo de Producto
            </label>
            <select
              id="tipoProductoId"
              name="tipoProductoId"
              value={productoActual.tipoProductoId}
              onChange={handleChange}
              className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
              disabled={cargandoGeneral || modoEdicion}
            >
              <option value="">Seleccionar tipo de producto</option>
              {Array.isArray(tiposProducto) &&
                tiposProducto.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} ({t.prefijo})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="codigo"
              className="block text-sm font-medium text-gray-700"
            >
              Código
            </label>
            <input
              type="text"
              id="codigo"
              name="codigo"
              value={productoActual.codigo}
              className="block w-full p-2 mt-1 bg-gray-100 border border-gray-300 rounded-md shadow-sm cursor-not-allowed"
              readOnly
              disabled={cargandoGeneral || modoEdicion}
            />
            {!modoEdicion && !productoActual.tipoProductoId && (
              <p className="mt-1 text-xs text-gray-500">
                Seleccione un tipo de producto para generar el código
                automáticamente.
              </p>
            )}
            {!modoEdicion &&
              productoActual.tipoProductoId &&
              productoActual.codigo && (
                <p className="mt-1 text-xs text-gray-500">
                  Código autogenerado. Se confirmará al guardar.
                </p>
              )}
          </div>
          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-gray-700"
            >
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={productoActual.nombre}
              onChange={handleChange}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
              disabled={cargandoGeneral}
            />
          </div>
          <div>
            <label
              htmlFor="descripcion"
              className="block text-sm font-medium text-gray-700"
            >
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={productoActual.descripcion || ""}
              onChange={handleChange}
              rows="2"
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={cargandoGeneral}
            ></textarea>
          </div>
          <div>
            <label
              htmlFor="unidadMedida"
              className="block text-sm font-medium text-gray-700"
            >
              Unidad de Medida
            </label>
            <input
              type="text"
              id="unidadMedida"
              name="unidadMedida"
              value={productoActual.unidadMedida}
              onChange={handleChange}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
              disabled={cargandoGeneral}
            />
          </div>
          <div>
            <label
              htmlFor="stock"
              className="block text-sm font-medium text-gray-700"
            >
              Stock Actual
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={productoActual.stock}
              className="block w-full p-2 mt-1 bg-gray-100 border border-gray-300 rounded-md shadow-sm cursor-not-allowed"
              readOnly
              disabled={cargandoGeneral}
            />
            <p className="mt-1 text-xs text-gray-500">
              El stock se actualiza mediante movimientos de almacén.
            </p>
          </div>
          <div>
            <label
              htmlFor="imagenUrl"
              className="block text-sm font-medium text-gray-700"
            >
              URL de Imagen
            </label>
            <input
              type="text"
              id="imagenUrl"
              name="imagenUrl"
              value={productoActual.imagenUrl || ""}
              onChange={handleChange}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={cargandoGeneral}
            />
          </div>
          <div>
            <label
              htmlFor="marcaId"
              className="block text-sm font-medium text-gray-700"
            >
              Marca
            </label>
            <select
              id="marcaId"
              name="marcaId"
              value={productoActual.marcaId}
              onChange={handleChange}
              className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={cargandoGeneral}
            >
              <option value="">Seleccionar marca (Opcional)</option>
              {Array.isArray(marcas) &&
                marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
            </select>
          </div>

          {/* Checkbox: Activo */}
          <div className="flex items-center mt-2">
            <input
              id="activo"
              name="activo"
              type="checkbox"
              checked={productoActual.activo}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              disabled={cargandoGeneral}
            />
            <label
              htmlFor="activo"
              className="block ml-2 text-sm text-gray-900"
            >
              Activo
            </label>
          </div>
          <div className="flex flex-col justify-end col-span-2 gap-4 mt-4 sm:flex-row">
            <button
              type="submit"
              disabled={
                cargandoGeneral ||
                (!modoEdicion && !productoActual.tipoProductoId)
              }
              className="px-6 py-3 font-semibold text-white transition duration-200 ease-in-out bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cargandoGeneral
                ? "Guardando..."
                : modoEdicion
                ? "Actualizar Producto"
                : "Crear Producto"}
            </button>
            {modoEdicion && (
              <button
                type="button"
                onClick={handleClearForm}
                disabled={cargandoGeneral}
                className="px-6 py-3 font-semibold text-white transition duration-200 ease-in-out bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancelar Edición
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Formulario de Búsqueda */}
      <div className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-lg">
        <h2 className="pb-3 mb-5 text-2xl font-bold text-gray-700 border-b-2 border-blue-600">
          Buscar Productos
        </h2>
        <form className="flex flex-col gap-4 sm:flex-row">
          <input
            type="text"
            id="busquedaProducto"
            name="busquedaProducto"
            placeholder="Buscar por código o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={cargandoGeneral}
          />
        </form>
      </div>
      <div className="p-6 overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-lg">
        <h2 className="pb-3 mb-5 text-2xl font-bold text-gray-700 border-b-2 border-blue-600">
          Listado de Productos
        </h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th
                scope="col"
                className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b border-gray-300"
              >
                Código
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b border-gray-300"
              >
                Nombre
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b border-gray-300"
              >
                Stock
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border-b border-gray-300"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cargandoGeneral ? (
              <tr>
                <td colSpan="4" className="py-4 text-center text-gray-500">
                  Cargando datos...
                </td>
              </tr>
            ) : Array.isArray(productos) && productos.length > 0 ? (
              productos.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {p.codigo}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {p.nombre}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {p.stock}
                  </td>
                  <td className="px-4 py-2 text-sm font-medium text-right whitespace-nowrap">
                    <div className="flex flex-col items-center justify-center space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                      <button
                        onClick={() => handleVerDetalles(p)}
                        className="p-2 text-xs font-semibold text-white transition duration-150 ease-in-out bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Ver Detalles"
                        disabled={cargandoGeneral}
                      >
                        <FaSearch className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditar(p)}
                        className="px-3 py-1 text-xs font-semibold text-white transition duration-150 ease-in-out bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Editar Producto"
                        disabled={cargandoGeneral}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(p.id)}
                        className="px-3 py-1 text-xs font-semibold text-white transition duration-150 ease-in-out bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Eliminar Producto"
                        disabled={cargandoGeneral}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-4 text-center text-gray-500">
                  No hay productos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalles del Producto */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Detalles del Producto"
        className="relative w-11/12 p-6 mx-auto my-10 bg-white rounded-lg shadow-xl outline-none md:w-3/4 lg:w-1/2 xl:w-1/3"
        overlayClassName="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50"
      >
        {productoEnDetalle && (
          <div className="flex flex-col items-center">
            <h2 className="w-full pb-2 mb-4 text-2xl font-bold text-center text-gray-800 border-b-2 border-indigo-500">
              Detalles de {productoEnDetalle.nombre}
            </h2>
            {productoEnDetalle.imagenUrl ? (
              <img
                src={productoEnDetalle.imagenUrl}
                alt={`Imagen de ${productoEnDetalle.nombre}`}
                className="object-cover w-48 h-48 mb-4 rounded-lg shadow-md"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://placehold.co/192x192/cccccc/333333?text=No+Imagen";
                }}
              />
            ) : (
              <div className="flex items-center justify-center w-48 h-48 mb-4 text-gray-500 bg-gray-200 rounded-lg shadow-md">
                No hay imagen disponible
              </div>
            )}
            <div className="w-full space-y-2 text-sm text-left text-gray-700 md:text-base">
              <p>
                <strong className="font-semibold">Código:</strong>{" "}
                {productoEnDetalle.codigo}
              </p>
              <p>
                <strong className="font-semibold">Descripción:</strong>{" "}
                {productoEnDetalle.descripcion || "N/A"}
              </p>
              <p>
                <strong className="font-semibold">Unidad de Medida:</strong>{" "}
                {productoEnDetalle.unidadMedida}
              </p>
              <p>
                <strong className="font-semibold">Stock Actual:</strong>{" "}
                {productoEnDetalle.stock}
              </p>
              <p>
                <strong className="font-semibold">Marca:</strong>{" "}
                {productoEnDetalle.marca?.nombre || "N/A"}
              </p>
              <p>
                <strong className="font-semibold">Tipo de Producto:</strong>{" "}
                {productoEnDetalle.tipoProducto?.nombre || "N/A"}
              </p>
              <p>
                <strong className="font-semibold">Activo:</strong>{" "}
                {productoEnDetalle.activo ? "Sí" : "No"}
              </p>
              <p>
                <strong className="font-semibold">Creado:</strong>{" "}
                {new Date(productoEnDetalle.createdAt).toLocaleDateString()}
              </p>
              <p>
                <strong className="font-semibold">Última Actualización:</strong>{" "}
                {new Date(productoEnDetalle.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={closeModal}
              className="px-6 py-2 mt-6 font-semibold text-white transition duration-200 ease-in-out bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cerrar
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GestionProductosPage;
