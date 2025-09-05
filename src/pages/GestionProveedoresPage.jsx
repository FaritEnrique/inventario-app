import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";
import useProveedores from "../hooks/useProveedores";
import useSunat from "../hooks/useSunat";
import useDebounce from "../hooks/useDebounce";
import Loader from "../components/Loader";
import FormularioProveedor from "../components/FormularioProveedor";
import ConfirmDeleteToast from "../components/ConfirmDeleteToast";

const RUC_REGEX = /^\d{11}$/;

const GestionProveedoresPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { 
    proveedores, 
    loading: proveedoresLoading, 
    fetchProveedores, 
    actualizarEstadoProveedor 
  } = useProveedores();
  
  const { 
    consultarPadronSunat, 
    loading: sunatLoading 
  } = useSunat();

  useEffect(() => {
    // Actualiza la lista de proveedores en base a la búsqueda debounced
    fetchProveedores(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
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
      toast.info(`Se encontraron ${localResults.length} coincidencias locales.`);
    } else if (isRuc) {
      // Si no hay resultados locales y es un RUC, buscar en SUNAT
      const sunatData = await consultarPadronSunat(query);
      if (sunatData) {
        setSelectedProveedor(sunatData);
        setIsFormVisible(true);
        toast.success("Proveedor encontrado en SUNAT. Completa los datos para registrarlo.");
      } else {
        toast.warn("El RUC no fue encontrado ni en tu base de datos ni en SUNAT.");
      }
    } else {
      // No es RUC y no se encontró por nombre
      toast.info("Proveedor no encontrado. Para buscar en SUNAT, ingresa un RUC.");
    }
  };

  const handleEdit = (proveedor) => {
    setSelectedProveedor(proveedor);
    setIsFormVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setSearchQuery(''); // Limpiar búsqueda
    fetchProveedores(); // Cargar todos los proveedores
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setSelectedProveedor(null);
  };

  const loading = proveedoresLoading || sunatLoading;

  return (
    <>
      <Helmet>
        <title>Gestión de Proveedores | Sistema de Inventario</title>
      </Helmet>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Proveedores</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <form onSubmit={handleSearchSubmit}>
            <label htmlFor="search-proveedor" className="block text-md font-medium text-gray-700 mb-2">
              Buscar o Registrar Proveedor
            </label>
            <div className="flex">
              <input
                id="search-proveedor"
                type="text"
                className="flex-grow border p-3 rounded-l-md focus:ring-2 focus:ring-blue-500 transition-shadow"
                placeholder="Ingresa un RUC o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-r-md hover:bg-blue-700 transition-colors flex items-center justify-center font-semibold"
                disabled={loading}
              >
                {loading ? <Loader size="sm" /> : "Buscar / Registrar"}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Busca un proveedor existente por RUC/nombre o ingresa uno nuevo para registrarlo.
            </p>
          </form>
        </div>

        {isFormVisible && (
          <div className="mb-6">
            <FormularioProveedor
              key={selectedProveedor?.id || 'new'}
              proveedor={selectedProveedor}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
          <h2 className="text-xl font-semibold p-5 border-b">Proveedores Registrados</h2>
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase">Razón Social</th>
                <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase">RUC</th>
                <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase">Representante</th>
                <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase">Contacto</th>
                <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase">Teléfono</th>
                <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.length > 0 ? (
                proveedores.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 border-b text-sm">{p.razonSocial}</td>
                    <td className="px-5 py-4 border-b text-sm">{p.ruc || "N/A"}</td>
                    <td className="px-5 py-4 border-b text-sm">{p.representante || "N/A"}</td>
                    <td className="px-5 py-4 border-b text-sm">{p.contacto || "N/A"}</td>
                    <td className="px-5 py-4 border-b text-sm">{p.telefono || "N/A"}</td>
                    <td className="px-5 py-4 border-b text-sm">
                      <span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${
                        p.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-4 border-b text-sm flex gap-3">
                      <button onClick={() => handleEdit(p)} className="text-indigo-600 hover:text-indigo-900 font-medium">Editar</button>
                      <button onClick={() => handleDeactivate(p.id)} className="text-red-600 hover:text-red-900 font-medium">Desactivar</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-500">No se encontraron proveedores.</td>
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
