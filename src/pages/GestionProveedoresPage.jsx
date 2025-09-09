import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";
import useProveedores from "../hooks/useProveedores";
import useSunat from "../hooks/useSunat";
import useDebounce from "../hooks/useDebounce";
import Loader from "../components/Loader";
import FormularioProveedor from "../components/FormularioProveedor";
import ConfirmDeleteToast from "../components/ConfirmDeleteToast";

const RUC_REGEX = /^(10|20)\d{9}$/;

const GestionProveedoresPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isRucDisabledForNewForm, setIsRucDisabledForNewForm] = useState(false); // New state

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const {
    proveedores,
    loading: proveedoresLoading,
    fetchProveedores,
    actualizarEstadoProveedor,
  } = useProveedores();

  const { consultarPadronSunat, loading: sunatLoading } = useSunat();

  useEffect(() => {
    // Actualiza la lista de proveedores en base a la búsqueda debounced
    fetchProveedores(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    // If the input contains non-digit characters, it's a name search, don't limit length.
    if (/[^0-9]/.test(value)) {
      setSearchQuery(value);
      return;
    }
    // If it contains only digits, it's a RUC search, limit to 11 digits.
    if (value.length <= 11) {
      setSearchQuery(value);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();

    // Validación de formato de RUC antes de cualquier otra cosa
    const isNumericQuery = /^\d+$/.test(query);
    if (isNumericQuery && query.length === 11 && !RUC_REGEX.test(query)) {
      toast.error("El RUC debe tener 11 dígitos y empezar con 10 o 20.");
      return; // Detener la ejecución si el formato es inválido
    }

    // Resetear el estado de deshabilitación del RUC al iniciar una búsqueda normal
    setIsRucDisabledForNewForm(false); // Reset on normal search

    if (!query) {
      fetchProveedores(); // Cargar todos si la búsqueda está vacía
      return;
    }

    const isRuc = RUC_REGEX.test(query);

    // Siempre limpiar el formulario y la selección anterior al iniciar una búsqueda
    setIsFormVisible(false);
    setSelectedProveedor(null);

    const localResults = await fetchProveedores(query);

    if (localResults.length > 0) {
      // Si hay resultados locales, los mostramos en la tabla.
      // Si es un solo resultado y es RUC, podríamos mostrar el form, pero
      // por consistencia, dejaremos que el usuario haga clic en "Editar".
      toast.info(
        `Se encontraron ${localResults.length} coincidencias locales.`
      );
    } else if (isRuc) {
      // Si no hay resultados locales y es un RUC, buscar en SUNAT
      const sunatData = await consultarPadronSunat(query);
      if (sunatData) {
        setSelectedProveedor(sunatData);
        setIsFormVisible(true);
        toast.success(
          "Proveedor encontrado en SUNAT. Completa los datos para registrarlo."
        );
      } else {
        setSelectedProveedor(null); // Para asegurar que el formulario se trate como una nueva creación
        setIsFormVisible(true); // Mostrar el formulario
        toast.info(
          "El RUC no fue encontrado. Puedes registrar un nuevo proveedor con este RUC."
        );
      }
    } else {
      // No es RUC y no se encontró por nombre
      toast.info(
        "Proveedor no encontrado. Para buscar en SUNAT, ingresa un RUC."
      );
    }
  };

  // New handler for "Crear sin RUC" button
  const handleCreateWithoutRuc = () => {
    setSelectedProveedor(null);
    setIsFormVisible(true);
    setIsRucDisabledForNewForm(true); // Disable RUC field
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info("Formulario para nuevo proveedor sin RUC. El campo RUC está deshabilitado.");
  };

  const handleEdit = (proveedor) => {
    setSelectedProveedor(proveedor);
    setIsFormVisible(true);
    setIsRucDisabledForNewForm(false); // Ensure RUC is not disabled when editing
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeactivate = (id) => {
    toast.dark(
      ({ closeToast }) => (
        <ConfirmDeleteToast
          closeToast={closeToast}
          message="¿Estás seguro de que deseas desactivar este proveedor?"
          onConfirm={async () => {
            await actualizarEstadoProveedor(id, false);
            fetchProveedores(debouncedSearchQuery); // Refrescar lista
          }}
        />
      ),
      { autoClose: false, closeButton: false }
    );
  };

  const handleFormSuccess = () => {
    setIsFormVisible(false);
    setSelectedProveedor(null);
    setIsRucDisabledForNewForm(false); // Reset state
    setSearchQuery(""); // Limpiar búsqueda
    fetchProveedores(); // Cargar todos los proveedores
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setSelectedProveedor(null);
    setIsRucDisabledForNewForm(false); // Reset state
  };

  const loading = proveedoresLoading || sunatLoading;

  return (
    <>
      <Helmet>
        <title>Gestión de Proveedores | Sistema de Inventario</title>
      </Helmet>
      <div className="container p-4 mx-auto md:p-6 lg:p-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-800">
          Gestión de Proveedores
        </h1>

        <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
          <form onSubmit={handleSearchSubmit}>
            <label
              htmlFor="search-proveedor"
              className="block mb-2 font-medium text-gray-700 text-md"
            >
              Buscar o Registrar Proveedor
            </label>
            <div className="flex">
              <input
                id="search-proveedor"
                type="text"
                className="flex-grow p-3 transition-shadow border border-gray-500 max-w-96 rounded-l-md focus:ring-2 focus:ring-blue-500"
                placeholder="Ingresa un RUC o nombre..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <button
                type="submit"
                className="flex items-center justify-center px-6 py-3 font-semibold text-white transition-colors bg-blue-600 rounded-r-md hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? <Loader size="sm" /> : "Buscar / Registrar"}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Busca un proveedor existente por RUC/nombre o ingresa uno nuevo
              para registrarlo.
            </p>
          </form>
          {/* New button for creating without RUC */}
          <div className="mt-4">
            <button
              onClick={handleCreateWithoutRuc}
              className="px-6 py-3 font-semibold text-white transition-colors bg-purple-600 rounded-md hover:bg-purple-700"
            >
              Crear sin RUC
            </button>
          </div>
        </div>

        {isFormVisible && (
          <div className="mb-6">
            <FormularioProveedor
              key={selectedProveedor?.id || "new"}
              proveedor={selectedProveedor}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              disableRucField={isRucDisabledForNewForm} // Pass new prop
            />
          </div>
        )}

        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
          <h2 className="p-5 text-xl font-semibold border-b">
            Proveedores Registrados
          </h2>
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-5 py-3 text-xs font-semibold text-left text-gray-600 uppercase border-b-2">
                  Razón Social
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-left text-gray-600 uppercase border-b-2">
                  RUC
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-left text-gray-600 uppercase border-b-2">
                  Representante
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-left text-gray-600 uppercase border-b-2">
                  Contacto
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-left text-gray-600 uppercase border-b-2">
                  Teléfono
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-left text-gray-600 uppercase border-b-2">
                  Estado
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-left text-gray-600 uppercase border-b-2">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {proveedores.length > 0 ? (
                proveedores.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm border-b">
                      {p.razonSocial}
                    </td>
                    <td className="px-5 py-4 text-sm border-b">
                      {p.ruc || "N/A"}
                    </td>
                    <td className="px-5 py-4 text-sm border-b">
                      {p.representante || "N/A"}
                    </td>
                    <td className="px-5 py-4 text-sm border-b">
                      {p.contacto || "N/A"}
                    </td>
                    <td className="px-5 py-4 text-sm border-b">
                      {p.telefono || "N/A"}
                    </td>
                    <td className="px-5 py-4 text-sm border-b">
                      <span
                        className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${
                          p.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="flex gap-3 px-5 py-4 text-sm border-b">
                      <button
                        onClick={() => handleEdit(p)}
                        className="font-medium text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeactivate(p.id)}
                        className="font-medium text-red-600 hover:text-red-900"
                      >
                        Desactivar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-gray-500">
                    No se encontraron proveedores.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default GestionProveedoresPage;
