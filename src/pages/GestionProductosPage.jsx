// src/pages/GestionProductosPage.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import useProductos from "../hooks/useProductos";
import useMarcas from "../hooks/useMarcas";
import useTipoProductos from "../hooks/useTipoProductos";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmDeleteToast from "../components/ConfirmDeleteToast";
import productosApi from "../api/productosApi";
import Modal from "react-modal";
import { FaSearch, FaRegistered } from "react-icons/fa";
import { TbArrowBackUpDouble } from "react-icons/tb";
import { MdCategory } from "react-icons/md";
import useDebounce from "../hooks/useDebounce";
import { Link } from "react-router-dom";
import imageCompression from "browser-image-compression";

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

const initialProducto = {
  id: null,
  codigo: "",
  nombre: "",
  descripcion: "",
  unidadMedida: "",
  stock: 0,
  imagenFile: null,
  imagenUrl: "",
  marcaId: "",
  tipoProductoId: "",
  activo: true,
};

const GestionProductosPage = () => {
  const fileInputRef = useRef(null);
  const [productoActual, setProductoActual] = useState(initialProducto);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [productoEnDetalle, setProductoEnDetalle] = useState(null);

  const {
    productos,
    total,
    page,
    limit,
    desde,
    hasta,
    setPage,
    setLimit,
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
    fetchProductos(debouncedBusqueda, page, limit);
  }, [fetchProductos, debouncedBusqueda, page, limit]);

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
          "❌ Los campos obligatorios deben completarse correctamente"
        );
        return;
      }

      try {
        const formData = new FormData();
        formData.append("nombre", nombre);
        formData.append("unidadMedida", unidadMedida);
        formData.append("tipoProductoId", tipoProductoId);
        if (productoActual.descripcion)
          formData.append("descripcion", productoActual.descripcion);
        if (productoActual.marcaId)
          formData.append("marcaId", productoActual.marcaId);
        formData.append("activo", productoActual.activo);

        if (productoActual.imagenFile) {
          formData.append("imagen", productoActual.imagenFile);
        }

        if (modoEdicion) {
          await actualizarProducto(productoActual.id, formData, true);
          toast.success("✅ Producto actualizado correctamente");
        } else {
          await crearProducto(formData);
          toast.success("✅ Producto creado correctamente");
        }

        if (
          productoActual.imagenUrl &&
          !productoActual.imagenUrl.startsWith("http")
        ) {
          URL.revokeObjectURL(productoActual.imagenUrl);
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        setProductoActual({ ...initialProducto, imagenFile: null });
        setModoEdicion(false);
        fetchProductos(debouncedBusqueda, page, limit);
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Error al guardar producto";
        toast.error(`❌ ${msg}`);
      }
    },
    [
      productoActual,
      modoEdicion,
      crearProducto,
      actualizarProducto,
      fetchProductos,
      debouncedBusqueda,
      page,
      limit,
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
    (id) => {
      const producto = productos.find((p) => p.id === id);
      if (!producto) return;

      toast.warn(
        ({ closeToast, toastProps }) => (
          <ConfirmDeleteToast
            closeToast={closeToast}
            toastProps={toastProps}
            message={`¿Estás seguro de que deseas eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`}
            onConfirm={async () => {
              try {
                await eliminarProducto(id);
                fetchProductos(debouncedBusqueda, page, limit);
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
            }}
          />
        ),
        {
          position: "top-center",
          autoClose: false,
          closeButton: false,
          hideProgressBar: true,
          closeOnClick: false,
          draggable: false,
          pauseOnHover: false,
        }
      );
    },
    [
      productos,
      eliminarProducto,
      fetchProductos,
      debouncedBusqueda,
      productoActual.id,
      page,
      limit,
    ]
  );

  const handleClearForm = useCallback(() => {
    if (
      productoActual.imagenUrl &&
      !productoActual.imagenUrl.startsWith("http")
    ) {
      URL.revokeObjectURL(productoActual.imagenUrl);
    }
    setProductoActual({ ...initialProducto });
    setModoEdicion(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [productoActual.imagenUrl]);

  const handleVerDetalles = useCallback((producto) => {
    setProductoEnDetalle(producto);
    setModalIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalIsOpen(false);
    setProductoEnDetalle(null);
  }, []);

  const cargandoGeneral = cargandoProductos || cargandoMarcas || cargandoTipos;
  const apiUrl = import.meta.env.VITE_API_URL;

  return (
    <div className="max-w-5xl p-6 mx-auto">
      <h1 className="text-2xl font-bold text-center text-indigo-700">
        Gestión de Productos
      </h1>

      {/* Tarjetas de gestión */}
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
      </div>

      {/* Formulario Crear/Actualizar */}
      <div className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-lg">
        <h2 className="pb-3 mb-5 text-2xl font-bold text-gray-700 border-b-2 border-blue-600">
          {modoEdicion ? "Actualizar Producto" : "Crear Nuevo Producto"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2"
        >
          {/* Tipo Producto */}
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
            >
              <option value="">Seleccione un tipo</option>
              {tiposProducto.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Marca */}
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
            >
              <option value="">Seleccione una marca</option>
              {marcas.map((marca) => (
                <option key={marca.id} value={marca.id}>
                  {marca.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Código */}
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
              readOnly
              className="block w-full p-2 mt-1 bg-gray-100 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Nombre */}
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
              className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          {/* Unidad de Medida */}
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
              className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          {/* Stock */}
          <div>
            <label
              htmlFor="stock"
              className="block text-sm font-medium text-gray-700"
            >
              Stock
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={productoActual.stock}
              onChange={handleChange}
              className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Descripción */}
          <div className="md:col-span-2">
            <label
              htmlFor="descripcion"
              className="block text-sm font-medium text-gray-700"
            >
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={productoActual.descripcion}
              onChange={handleChange}
              rows={3}
              className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Imagen */}
          <div className="md:col-span-2">
            <label
              htmlFor="imagenFile"
              className="block text-sm font-medium text-gray-700"
            >
              Imagen
            </label>
            <input
              ref={fileInputRef}
              type="file"
              id="imagenFile"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  try {
                    const compressedFile = await imageCompression(file, {
                      maxSizeMB: 0.5,
                      maxWidthOrHeight: 800,
                      useWebWorker: true,
                    });
                    setProductoActual((prev) => ({
                      ...prev,
                      imagenFile: compressedFile,
                      imagenUrl: URL.createObjectURL(compressedFile),
                    }));
                  } catch (error) {
                    console.error("Error al comprimir la imagen:", error);
                    toast.error("❌ Error al comprimir la imagen");
                  }
                }
              }}
              className="block w-full mt-1"
            />
            {productoActual.imagenUrl && (
              <img
                src={productoActual.imagenUrl}
                alt="Preview"
                className="object-contain w-32 h-32 mt-2 border rounded"
              />
            )}
          </div>

          {/* Activo */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="activo"
              name="activo"
              checked={productoActual.activo}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label
              htmlFor="activo"
              className="text-sm font-medium text-gray-700"
            >
              Activo
            </label>
          </div>

          {/* Botones */}
          <div className="flex space-x-2 md:col-span-2">
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700"
            >
              {modoEdicion ? "Actualizar" : "Crear"}
            </button>
            <button
              type="button"
              onClick={handleClearForm}
              className="px-4 py-2 font-semibold text-white bg-gray-600 rounded hover:bg-gray-700"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-2 mb-4">
        <FaSearch size={18} className="text-gray-500" />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Tabla de Productos */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-lg">
        {cargandoGeneral ? (
          <p className="p-6 text-center text-gray-500">Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p className="p-6 text-center text-gray-500">
            No hay productos registrados.
          </p>
        ) : (
          <table className="w-full border-collapse table-auto">
            <thead>
              <tr className="bg-indigo-100">
                <th className="px-4 py-2 border">Item</th>
                <th className="px-4 py-2 border">Código</th>
                <th className="px-4 py-2 text-left border">Nombre</th>
                <th className="px-4 py-2 border">Tipo</th>
                <th className="px-4 py-2 border">Marca</th>
                <th className="px-4 py-2 border">Stock</th>
                <th className="px-4 py-2 border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto, index) => (
                <tr key={producto.id} className="text-center">
                  <td className="px-4 py-2 border">{desde + index}</td>
                  <td className="px-4 py-2 border">{producto.codigo}</td>
                  <td className="px-4 py-2 text-left border">
                    {producto.nombre}
                  </td>
                  <td className="px-4 py-2 border">
                    {producto.tipoProducto?.nombre}
                  </td>
                  <td className="px-4 py-2 border">
                    {producto.marca?.nombre || "-"}
                  </td>
                  <td className="px-4 py-2 border">{producto.stock}</td>
                  <td className="flex items-center justify-center px-4 py-2 space-x-2 border">
                    <button
                      onClick={() => handleVerDetalles(producto)}
                      className="px-2 py-1 text-sm font-semibold text-white bg-green-500 rounded hover:bg-green-600"
                    >
                      <FaSearch className="w-4 h-5" />
                    </button>
                    <button
                      onClick={() => handleEditar(producto)}
                      className="px-2 py-1 text-sm font-semibold text-white bg-yellow-500 rounded hover:bg-yellow-600"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(producto.id)}
                      className="px-2 py-1 text-sm font-semibold text-white bg-red-500 rounded hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {total > limit && (
        <div className="flex items-center justify-between p-4 mt-4 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div>
            <p>
              Mostrando {desde} a {hasta} de {total} productos
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 text-white bg-indigo-600 rounded disabled:bg-gray-300"
            >
              Anterior
            </button>
            <button
              disabled={hasta >= total}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 text-white bg-indigo-600 rounded disabled:bg-gray-300"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal Detalle Producto */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Detalles del Producto"
        className="relative w-11/12 p-6 mx-auto my-10 bg-white rounded-lg shadow-xl outline-none md:w-3/4 lg:w-1/2 xl:w-1/3 max-h-[80vh] overflow-y-auto"
        overlayClassName="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50"
      >
        {productoEnDetalle && (
          <div className="flex flex-col items-center">
            <h2 className="w-full pb-2 mb-4 text-2xl font-bold text-center text-gray-800 border-b-2 border-indigo-500">
              Detalles de {productoEnDetalle.nombre}
            </h2>
            {productoEnDetalle.imagenUrl ? (
              <img
                src={`${apiUrl}${productoEnDetalle.imagenUrl}`}
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

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default GestionProductosPage;
