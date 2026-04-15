// src/pages/GestionProductosPage.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import useProductos from "../hooks/useProductos";
import useMarcas from "../hooks/useMarcas";
import useTipoProductos from "../hooks/useTipoProductos";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmDeleteToast from "../components/ConfirmDeleteToast";
import Modal from "../components/Modal";
import productosApi from "../api/productosApi";
import { FaSearch, FaRegistered } from "react-icons/fa";
import { TbArrowBackUpDouble } from "react-icons/tb";
import { MdCategory } from "react-icons/md";
import useDebounce from "../hooks/useDebounce";
import { Link } from "react-router-dom";
import imageCompression from "browser-image-compression";

const buildUploadsBaseUrl = () => {
  const rawApiUrl =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === "development" ? "http://localhost:3000" : "");

  return String(rawApiUrl || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
};

const resolveProductoImageUrl = (imageUrl) => {
  if (!imageUrl) return "";

  if (
    imageUrl.startsWith("blob:") ||
    imageUrl.startsWith("data:") ||
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  const uploadsBaseUrl = buildUploadsBaseUrl();
  if (!uploadsBaseUrl) {
    return imageUrl;
  }

  return `${uploadsBaseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
};

const revokeIfBlobUrl = (url) => {
  if (typeof url === "string" && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

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
  valorReferencial: 0,
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
  const [estadoFiltro, setEstadoFiltro] = useState("activos");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [productoEnDetalle, setProductoEnDetalle] = useState(null);
  const [incluirStockInicial, setIncluirStockInicial] = useState(false);
  const [stockInicialInput, setStockInicialInput] = useState("");
  const [fechaMovimientoCreacion, setFechaMovimientoCreacion] = useState("");
  const [observacionesStockCreacion, setObservacionesStockCreacion] =
    useState("");
  const [enviandoFormulario, setEnviandoFormulario] = useState(false);

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
    crearProductoConStockInicial,
    actualizarProducto,
    desactivarProducto,
    reactivarProducto,
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
    fetchProductos(debouncedBusqueda, page, limit, estadoFiltro);
  }, [fetchProductos, debouncedBusqueda, page, limit, estadoFiltro]);

  useEffect(() => {
    fetchMarcas();
    fetchTiposProducto();
  }, [fetchMarcas, fetchTiposProducto]);

  useEffect(() => {
    const generarCodigoAutomatico = async () => {
      if (!modoEdicion && productoActual.tipoProductoId) {
        try {
          const siguienteCodigo = await productosApi.getSiguienteCodigo(
            productoActual.tipoProductoId,
          );
          setProductoActual((prev) => ({ ...prev, codigo: siguienteCodigo }));
        } catch (error) {
          console.error("Error al obtener el siguiente código:", error);
          toast.error(
            "Error al generar código automático. Revise la consola para más detalles.",
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
            ? value === ""
              ? ""
              : parseFloat(value)
            : value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (enviandoFormulario) return;
  
      const { nombre, unidadMedida, tipoProductoId } = productoActual;
  
      if (!nombre.trim() || !unidadMedida.trim() || !tipoProductoId) {
        toast.error("❌ Los campos obligatorios deben completarse correctamente");
        return;
      }
  
      if (
        !modoEdicion &&
        incluirStockInicial &&
        (stockInicialInput === "" ||
          !Number.isFinite(Number(stockInicialInput)) ||
          Number(stockInicialInput) <= 0)
      ) {
        toast.error(
          "❌ Con stock inicial activado, indique una cantidad mayor que cero.",
        );
        return;
      }
  
      setEnviandoFormulario(true);
  
      try {
        const formData = new FormData();
        formData.append("nombre", nombre.trim());
        formData.append("unidadMedida", unidadMedida.trim());
        formData.append("tipoProductoId", String(tipoProductoId));
        formData.append(
          "valorReferencial",
          String(Number(productoActual.valorReferencial || 0)),
        );
  
        if (productoActual.descripcion?.trim()) {
          formData.append("descripcion", productoActual.descripcion.trim());
        }
  
        if (productoActual.marcaId) {
          formData.append("marcaId", String(productoActual.marcaId));
        }
  
        if (productoActual.imagenFile) {
          formData.append("imagen", productoActual.imagenFile);
        }
  
        if (modoEdicion) {
          await actualizarProducto(productoActual.id, formData);
        } else if (incluirStockInicial) {
          formData.append("stockInicial", String(Number(stockInicialInput)));
  
          if (fechaMovimientoCreacion.trim()) {
            const d = new Date(fechaMovimientoCreacion);
            if (!Number.isNaN(d.getTime())) {
              formData.append("fechaMovimiento", d.toISOString());
            }
          }
  
          if (observacionesStockCreacion.trim()) {
            formData.append(
              "observaciones",
              observacionesStockCreacion.trim(),
            );
          }
  
          await crearProductoConStockInicial(formData);
        } else {
          await crearProducto(formData);
        }
  
        revokeIfBlobUrl(productoActual.imagenUrl);
  
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
  
        setProductoActual({ ...initialProducto, imagenFile: null });
        setModoEdicion(false);
        setIncluirStockInicial(false);
        setStockInicialInput("");
        setFechaMovimientoCreacion("");
        setObservacionesStockCreacion("");
  
        fetchProductos(debouncedBusqueda, page, limit, estadoFiltro);
      } catch (err) {
        console.error("Error al guardar producto:", err);
      } finally {
        setEnviandoFormulario(false);
      }
    },
    [
      productoActual,
      modoEdicion,
      incluirStockInicial,
      stockInicialInput,
      fechaMovimientoCreacion,
      observacionesStockCreacion,
      enviandoFormulario,
      crearProducto,
      crearProductoConStockInicial,
      actualizarProducto,
      fetchProductos,
      debouncedBusqueda,
      page,
      limit,
      estadoFiltro,
    ],
  );

  const handleEditar = useCallback((producto) => {
    setProductoActual({
      ...producto,
      stock: parseFloat(producto.stock),
      valorReferencial: Number(producto.valorReferencial || 0),
      marcaId: producto.marcaId ? String(producto.marcaId) : "",
      tipoProductoId: String(producto.tipoProductoId),
      activo: typeof producto.activo === "boolean" ? producto.activo : true,
    });
    setModoEdicion(true);
    setIncluirStockInicial(false);
    setStockInicialInput("");
    setFechaMovimientoCreacion("");
    setObservacionesStockCreacion("");
  }, []);

  const handleDesactivar = useCallback(
    (id) => {
      const producto = productos.find((p) => p.id === id);
      if (!producto || producto.activo === false) return;

      toast.warn(
        ({ closeToast, toastProps }) => (
          <ConfirmDeleteToast
            closeToast={closeToast}
            toastProps={toastProps}
            message={`¿Deseas desactivar el producto "${producto.nombre}"? Dejara de estar disponible para nuevas operaciones, pero se conservara para el historico.`}
            onConfirm={async () => {
              try {
                await desactivarProducto(id);
                fetchProductos(debouncedBusqueda, page, limit, estadoFiltro);
                if (productoActual.id === id) {
                  setProductoActual(initialProducto);
                  setModoEdicion(false);
                }
              } catch (err) {
                console.error("Error al desactivar producto:", err);
                toast.error(
                  `❌ Error al desactivar producto: ${
                    err.message || "Error desconocido"
                  }`,
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
        },
      );
    },
    [
      productos,
      desactivarProducto,
      fetchProductos,
      debouncedBusqueda,
      productoActual.id,
      page,
      limit,
      estadoFiltro,
    ],
  );

  const handleReactivar = useCallback(
    (id) => {
      const producto = productos.find((p) => p.id === id);
      if (!producto || producto.activo !== false) return;

      toast.warn(
        ({ closeToast, toastProps }) => (
          <ConfirmDeleteToast
            closeToast={closeToast}
            toastProps={toastProps}
            message={`¿Deseas reactivar el producto "${producto.nombre}"? Volvera a estar disponible para nuevas operaciones.`}
            onConfirm={async () => {
              try {
                await reactivarProducto(id);
                fetchProductos(debouncedBusqueda, page, limit, estadoFiltro);
              } catch (err) {
                console.error("Error al reactivar producto:", err);
                toast.error(
                  `❌ Error al reactivar producto: ${
                    err.message || "Error desconocido"
                  }`,
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
        },
      );
    },
    [
      productos,
      reactivarProducto,
      fetchProductos,
      debouncedBusqueda,
      page,
      limit,
      estadoFiltro,
    ],
  );

  const handleClearForm = useCallback(() => {
    revokeIfBlobUrl(productoActual.imagenUrl);
  
    setProductoActual({ ...initialProducto });
    setModoEdicion(false);
    setIncluirStockInicial(false);
    setStockInicialInput("");
    setFechaMovimientoCreacion("");
    setObservacionesStockCreacion("");
  
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

          <div>
            <label
              htmlFor="valorReferencial"
              className="block text-sm font-medium text-gray-700"
            >
              Valor referencial
            </label>
            <input
              type="number"
              id="valorReferencial"
              name="valorReferencial"
              min="0"
              step="0.01"
              value={productoActual.valorReferencial}
              onChange={handleChange}
              className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Se usa como base para requerimientos cuando aun no hay historial
              de compra.
            </p>
          </div>

          {/* Stock */}
          <div>
            <label
              htmlFor="stock"
              className="block text-sm font-medium text-gray-700"
            >
              Stock actual
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={productoActual.stock}
              readOnly
              disabled
              className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              El stock se muestra como referencia y no se edita desde este
              formulario.
            </p>
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
              
                    setProductoActual((prev) => {
                      revokeIfBlobUrl(prev.imagenUrl);
              
                      return {
                        ...prev,
                        imagenFile: compressedFile,
                        imagenUrl: URL.createObjectURL(compressedFile),
                      };
                    });
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
                src={resolveProductoImageUrl(productoActual.imagenUrl)}
                alt="Preview"
                className="object-contain w-32 h-32 mt-2 border rounded"
              />
            )}
          </div>

          {/* Estado */}
          <div className="md:col-span-2">
            <div className="px-4 py-3 text-sm border rounded-md border-slate-200 bg-slate-50 text-slate-700">
              <span className="font-semibold text-slate-900">
                Estado del producto:
              </span>{" "}
              {productoActual.activo ? "Activo" : "Inactivo"}
              <p className="mt-1 text-xs text-slate-500">
                El estado operativo del producto se administra desde las
                acciones de la tabla mediante desactivacion o reactivacion.
              </p>
            </div>
          </div>

          {!modoEdicion && (
            <div className="p-4 border rounded-md md:col-span-2 border-amber-200 bg-amber-50/80">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incluirStockInicial}
                  onChange={(e) => {
                    setIncluirStockInicial(e.target.checked);
                    if (!e.target.checked) {
                      setStockInicialInput("");
                      setFechaMovimientoCreacion("");
                      setObservacionesStockCreacion("");
                    }
                  }}
                  className="mt-1 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-800">
                  <span className="font-semibold">
                    Registrar stock inicial al crear
                  </span>
                  <span className="block mt-0.5 text-xs text-gray-600">
                    Si lo activa, el producto se crea y se registra carga inicial
                    en inventario (almacén principal si no indica otro en backend).
                  </span>
                </span>
              </label>
              {incluirStockInicial && (
                <div className="grid grid-cols-1 gap-3 mt-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="stockInicialCreacion"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Cantidad stock inicial <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      id="stockInicialCreacion"
                      name="stockInicialCreacion"
                      min="0"
                      step="any"
                      value={stockInicialInput}
                      onChange={(e) => setStockInicialInput(e.target.value)}
                      className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required={incluirStockInicial}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="fechaMovimientoCreacion"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Fecha del movimiento (opcional)
                    </label>
                    <input
                      type="datetime-local"
                      id="fechaMovimientoCreacion"
                      name="fechaMovimientoCreacion"
                      value={fechaMovimientoCreacion}
                      onChange={(e) =>
                        setFechaMovimientoCreacion(e.target.value)
                      }
                      className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="observacionesStockCreacion"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Observaciones (opcional)
                    </label>
                    <textarea
                      id="observacionesStockCreacion"
                      name="observacionesStockCreacion"
                      rows={2}
                      value={observacionesStockCreacion}
                      onChange={(e) =>
                        setObservacionesStockCreacion(e.target.value)
                      }
                      className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-2 md:col-span-2">
            <button
              type="submit"
              disabled={enviandoFormulario}
              className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
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
      <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="flex items-center gap-2">
          <FaSearch size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            name="gestion-productos-page-input-592"
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={estadoFiltro}
          onChange={(e) => {
            setEstadoFiltro(e.target.value);
            setPage(1);
          }}
          className="w-full p-2 text-sm border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="activos">Solo activos</option>
          <option value="inactivos">Solo inactivos</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {/* Tabla de Productos */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-lg">
        {cargandoGeneral ? (
          <p className="p-6 text-center text-gray-500">Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p className="p-6 text-center text-gray-500">
            No hay productos registrados para el filtro actual.
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
                <th className="px-4 py-2 border">Valor referencial</th>
                <th className="px-4 py-2 border">Stock</th>
                <th className="px-4 py-2 border">Estado</th>
                <th className="px-4 py-2 border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto, index) => (
                <tr
                  key={producto.id}
                  className={`text-center ${
                    producto.activo === false
                      ? "bg-slate-50 text-slate-500"
                      : ""
                  }`}
                >
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
                  <td className="px-4 py-2 border">
                    S/ {Number(producto.valorReferencial || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 border">{producto.stock}</td>
                  <td className="px-4 py-2 border">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        producto.activo === false
                          ? "bg-slate-200 text-slate-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {producto.activo === false ? "Inactivo" : "Activo"}
                    </span>
                  </td>
                  <td className="flex items-center justify-center px-4 py-2 space-x-2 border">
                    <button
                      onClick={() => handleVerDetalles(producto)}
                      className="px-2 py-1 text-sm font-semibold text-white bg-green-500 rounded hover:bg-green-600"
                    >
                      <FaSearch className="w-4 h-5" />
                    </button>
                    {producto.activo === false ? (
                      <button
                        onClick={() => handleReactivar(producto.id)}
                        className="px-2 py-1 text-sm font-semibold text-white rounded bg-sky-600 hover:bg-sky-700"
                      >
                        Reactivar
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditar(producto)}
                          className="px-2 py-1 text-sm font-semibold text-white bg-yellow-500 rounded hover:bg-yellow-600"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDesactivar(producto.id)}
                          className="px-2 py-1 text-sm font-semibold text-white bg-red-500 rounded hover:bg-red-600"
                        >
                          Desactivar
                        </button>
                      </>
                    )}
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
        onClose={closeModal}
        title={
          productoEnDetalle
            ? `Detalles de ${productoEnDetalle.nombre}`
            : "Detalles del producto"
        }
        maxWidth="max-w-3xl"
        overlayClassName="bg-gray-800 bg-opacity-75"
        bodyClassName="px-6 pb-6 pt-6"
      >
        {productoEnDetalle && (
          <div className="flex flex-col items-center">
            {productoEnDetalle.imagenUrl ? (
              <img
                src={resolveProductoImageUrl(productoEnDetalle.imagenUrl)}
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
                <strong className="font-semibold">Valor Referencial:</strong> S/{" "}
                {Number(productoEnDetalle.valorReferencial || 0).toFixed(2)}
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
                <strong className="font-semibold">Estado:</strong>{" "}
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    productoEnDetalle.activo === false
                      ? "bg-slate-200 text-slate-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {productoEnDetalle.activo === false ? "Inactivo" : "Activo"}
                </span>
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
