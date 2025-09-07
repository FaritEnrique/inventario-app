import { useState, useEffect, useCallback } from "react";

const ArrowBackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-arrow-left-from-line"
  >
    <path d="M9 18V6" />
    <path d="M2 12h16" />
    <path d="m15 15 3-3-3-3" />
    <path d="M22 18V6" />
  </svg>
);
const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-plus"
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);
const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-trash"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

// Mocks de la API y el hook
const mockProductos = [
  {
    id: "prod-1",
    codigo: "P-001",
    nombre: "Tornillos de 3mm",
    unidadMedida: "Und",
  },
  {
    id: "prod-2",
    codigo: "P-002",
    nombre: "Cemento x 5kg",
    unidadMedida: "Und",
  },
  {
    id: "prod-3",
    codigo: "P-003",
    nombre: "Lámpara LED",
    unidadMedida: "Und",
  },
  {
    id: "prod-4",
    codigo: "P-004",
    nombre: "Cable de red (metro)",
    unidadMedida: "Mts",
  },
];

const mockProductosApi = {
  getProductos: (query) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filtered = mockProductos.filter(
          (p) =>
            p.nombre.toLowerCase().includes(query.toLowerCase()) ||
            p.codigo.toLowerCase().includes(query.toLowerCase())
        );
        resolve(filtered);
      }, 500);
    });
  },
};

const mockRequerimientosApi = {
  crear: (requerimiento) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simular un código generado en el backend
        const nuevoRequerimiento = {
          ...requerimiento,
          codigo: "REQ-" + Math.floor(Math.random() * 10000),
        };
        resolve(nuevoRequerimiento);
      }, 1000);
    });
  },
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

// --- Reemplazando `react-toastify` con un sistema de mensajes en la UI
const useToast = () => {
  const [message, setMessage] = useState(null);
  const [type, setType] = useState(null);

  const showToast = (msg, msgType) => {
    setMessage(msg);
    setType(msgType);
    setTimeout(() => {
      setMessage(null);
      setType(null);
    }, 3000);
  };

  const toast = {
    success: (msg) => showToast(msg, "success"),
    error: (msg) => showToast(msg, "error"),
    warn: (msg) => showToast(msg, "warn"),
  };

  return { message, type, toast };
};
// --- Fin de Mocks ---

const initialRequerimiento = {
  // El código se genera en el backend, no se incluye aquí
  areaId: "",
  userId: "tu-id-de-usuario-aqui", // ⚠️ IMPORTANTE: Reemplaza esto con el ID del usuario autenticado
  solicitante: "",
  actividad: "",
  prioridad: "Normal",
  detalleUso: "", // Corregido: coincide con el backend
  items: [],
  estado: "Pendiente",
};

const CrearRequerimientoPage = () => {
  const [requerimiento, setRequerimiento] = useState(initialRequerimiento);
  const [productos, setProductos] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const { message, type, toast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const debouncedBusqueda = useDebounce(busquedaProducto, 500);

  // Cargar productos al escribir en el campo de búsqueda
  useEffect(() => {
    const fetchProductos = async () => {
      setCargandoProductos(true);
      try {
        const data = await mockProductosApi.getProductos(debouncedBusqueda);
        setProductos(data);
      } catch (error) {
        console.error("Error al buscar productos:", error);
      } finally {
        setCargandoProductos(false);
      }
    };
    if (debouncedBusqueda) {
      fetchProductos();
    } else {
      setProductos([]);
    }
  }, [debouncedBusqueda]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setRequerimiento((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleAddItem = useCallback(
    (producto) => {
      const itemExistente = requerimiento.items.find(
        (item) => item.productoId === producto.id
      );

      if (itemExistente) {
        toast.warn("Este producto ya ha sido agregado.");
        return;
      }

      setRequerimiento((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            productoId: producto.id,
            cantidad: 1,
            producto: producto,
          },
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
    const { value } = e.target;
    setRequerimiento((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productoId === productoId
          ? { ...item, cantidad: Number(value) }
          : item
      ),
    }));
  }, []);

  const handleConfirmSubmission = useCallback(async () => {
    setShowConfirmation(false);
    setCargando(true);
    try {
      const nuevoRequerimiento = await mockRequerimientosApi.crear(
        requerimiento
      );

      toast.success(
        `✅ Requerimiento ${nuevoRequerimiento.codigo} creado correctamente!`
      );
      setRequerimiento(initialRequerimiento);
    } catch (error) {
      console.error("Error al crear el requerimiento:", error);
      toast.error("❌ Error al crear el requerimiento.");
    } finally {
      setCargando(false);
    }
  }, [requerimiento, toast]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (requerimiento.items.length === 0) {
        toast.error("❌ Debe agregar al menos un ítem al requerimiento.");
        return;
      }
      setShowConfirmation(true);
    },
    [requerimiento, toast]
  );

  const getMessageClass = () => {
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
  };

  return (
    <div className="min-h-screen p-6 font-sans antialiased bg-gray-100">
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl text-center ${getMessageClass()}`}
        >
          {message}
        </div>
      )}
      {showConfirmation && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-sm p-6 text-center bg-white rounded-lg shadow-xl">
            <p className="mb-4 text-xl font-bold">Confirmar Requerimiento</p>
            <p className="mb-6 text-gray-700">
              ¿Estás seguro de que deseas crear este requerimiento?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={handleConfirmSubmission}
                className="px-4 py-2 font-semibold text-white bg-green-500 rounded-lg shadow hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Sí, Confirmar
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 font-semibold text-gray-800 bg-gray-200 rounded-lg shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-5xl p-6 mx-auto bg-white shadow-lg rounded-xl">
        {/* Reemplazado el texto del logo con un espacio para imagen */}
        <img
          src="https://placehold.co/400x100/A0A0A0/FFFFFF?text=Logo+Aqui"
          alt="Logo de la Empresa"
          className="mx-auto mb-4 rounded-lg shadow-sm"
        />

        <div className="flex items-center justify-end w-full mb-4">
          <a
            href="/gestion-requerimientos"
            className="flex items-center space-x-2 text-sky-500 hover:text-indigo-500"
          >
            <ArrowBackIcon />
            <span className="text-lg font-semibold">
              Volver a Requerimientos
            </span>
          </a>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label
                htmlFor="solicitante"
                className="block text-sm font-medium text-gray-700"
              >
                Nombre del Solicitante
              </label>
              <input
                type="text"
                id="solicitante"
                name="solicitante"
                value={requerimiento.solicitante}
                onChange={handleChange}
                className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="areaId"
                className="block text-sm font-medium text-gray-700"
              >
                Área Solicitante
              </label>
              <select
                id="areaId"
                name="areaId"
                value={requerimiento.areaId}
                onChange={handleChange}
                className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">-- Selecciona un Área --</option>
                <option value="area-1">Operaciones</option>
                <option value="area-2">Recursos Humanos</option>
                <option value="area-3">Contabilidad</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="actividad"
                className="block text-sm font-medium text-gray-700"
              >
                Actividad
              </label>
              <input
                type="text"
                id="actividad"
                name="actividad"
                value={requerimiento.actividad}
                onChange={handleChange}
                className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
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
                required
              >
                <option value="Normal">Normal</option>
                <option value="Urgente">Urgente</option>
                <option value="Emergencia">Emergencia</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label
                htmlFor="detalleUso"
                className="block text-sm font-medium text-gray-700"
              >
                Descripción del Uso
              </label>
              <textarea
                id="detalleUso"
                name="detalleUso"
                value={requerimiento.detalleUso}
                onChange={handleChange}
                rows="3"
                className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              ></textarea>
            </div>
          </div>

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
                name="busquedaProducto"
                placeholder="Escribe para buscar..."
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                className="block w-full p-2 mt-1 border rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

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
                      <PlusIcon />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
                          onChange={(e) =>
                            handleItemQuantityChange(e, item.productoId)
                          }
                          min="1"
                          className="w-16 p-1 text-sm text-center border rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productoId)}
                          className="p-1 text-white bg-red-500 rounded-full hover:bg-red-600"
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end col-span-1 mt-6">
            <button
              type="submit"
              disabled={cargando || requerimiento.items.length === 0}
              className="px-6 py-3 font-semibold text-white transition duration-200 ease-in-out bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cargando ? "Guardando..." : "Crear Requerimiento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearRequerimientoPage;
