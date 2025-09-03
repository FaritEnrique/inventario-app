import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";
import useProveedores from "../hooks/useProveedores";
import useSunat from "../hooks/useSunat";
import Loader from "../components/Loader";
import FormularioProveedor from "../components/FormularioProveedor";
import ConfirmDeleteToast from "../components/ConfirmDeleteToast";
import ConfirmToast from "../components/ConfirmToast";

const RUC_REGEX = /^\d{11}$/;

const GestionProveedoresPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProveedor, setSelectedProveedor] = useState(null);

  const { proveedores, loading, fetchProveedores, actualizarEstadoProveedor } =
    useProveedores();
  const {
    consultarPadronSunat,
    actualizarPadronSunat,
    actualizando,
    loading: sunatLoading,
  } = useSunat();

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      toast.warn("Ingrese un nombre o RUC para buscar.");
      return;
    }

    setSelectedProveedor(null);

    const isRuc = RUC_REGEX.test(query);

    const resultados = await fetchProveedores(query);
    if (resultados?.length === 1) {
      setSelectedProveedor(resultados[0]);
      toast.success("Proveedor encontrado en su base de datos.");
    } else if (resultados?.length > 1) {
      toast.info(
        `Se encontraron ${resultados.length} proveedores. Por favor, seleccione uno de la lista.`
      );
    } else {
      if (isRuc) {
        const sunatData = await consultarPadronSunat(query);
        if (sunatData) {
          setSelectedProveedor({
            ruc: sunatData.ruc,
            razonSocial: sunatData.razonSocial,
            nombreComercial: sunatData.nombreComercial,
            direccion: sunatData.direccion,
            condicion: sunatData.condicion,
            estado: sunatData.estado,
            departamento: sunatData.departamento,
            provincia: sunatData.provincia,
            distrito: sunatData.distrito,
            ubigeo: sunatData.ubigeo,
            contacto: "",
            telefono: "",
            correoElectronico: "",
          });
          toast.success(
            "Proveedor encontrado en padrón SUNAT. Puede crearlo en el sistema."
          );
        } else {
          setSelectedProveedor({ ruc: query });
          toast.info(
            "No se encontró información para este RUC. Por favor, ingrese los datos manualmente."
          );
        }
      } else {
        setSelectedProveedor({
          ruc: "",
          razonSocial: "",
          nombreComercial: "",
          direccion: "",
          condicion: "",
          estado: "",
          departamento: "",
          provincia: "",
          distrito: "",
          ubigeo: "",
          contacto: "",
          telefono: "",
          correoElectronico: "",
        });
        toast.info(
          "No se encontraron proveedores con ese nombre. Puede crear uno nuevo."
        );
      }
    }
  };

  const handleDeactivate = (id) => {
    toast.dark(
      ({ closeToast, toastProps }) => (
        <ConfirmDeleteToast
          closeToast={closeToast}
          toastProps={toastProps}
          message="¿Estás seguro de que deseas desactivar este proveedor? Se ocultará de la lista principal."
          onConfirm={() => actualizarEstadoProveedor(id, false)}
        />
      ),
      { autoClose: false, closeButton: false }
    );
  };

  const handleEdit = (proveedor) => setSelectedProveedor(proveedor);

  const handleCreateNew = () => {
    setSelectedProveedor({
      ruc: "",
      razonSocial: "",
      nombreComercial: "",
      direccion: "",
      condicion: "",
      estado: "",
      departamento: "",
      provincia: "",
      distrito: "",
      ubigeo: "",
      contacto: "",
      telefono: "",
      correoElectronico: "",
    });
    setSearchQuery("");
  };

  const handleFormSuccess = () => {
    setSelectedProveedor(null);
    fetchProveedores();
  };

  const handleFormCancel = () => setSelectedProveedor(null);

  const handleActualizarClick = () => {
    if (actualizando) {
      toast.warn("Ya hay una actualización en curso. Espere a que finalice.");
      return;
    }

    toast(
      ({ closeToast }) => (
        <ConfirmToast
          closeToast={closeToast}
          message="La actualización manual del padrón SUNAT consume recursos y se ejecuta automáticamente. Úsela solo si es estrictamente necesario."
          confirmButtonText="Sí, actualizar"
          cancelButtonText="No"
          onConfirm={async () => {
            await actualizarPadronSunat();
          }}
        />
      ),
      { autoClose: false }
    );
  };

  if (loading) return <Loader />;

  return (
    <>
      <Helmet>
        <title>Gestión de Proveedores | Sistema de Inventario</title>
      </Helmet>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Gestión de Proveedores</h1>

        {/* Búsqueda y botones */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
          <form onSubmit={handleSearch} className="flex flex-grow md:mr-2">
            <input
              type="text"
              className="max-w-80 flex-grow border p-2 rounded-l-md"
              placeholder="Buscar por nombre o RUC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded-r-md flex items-center justify-center"
              disabled={sunatLoading}
            >
              {sunatLoading ? <Loader size="sm" /> : "Buscar"}
            </button>
          </form>
          <div className="flex flex-col md:flex-row gap-2">
            <button
              onClick={handleActualizarClick}
              disabled={actualizando || sunatLoading}
              className={`px-4 py-2 rounded text-white font-bold flex items-center justify-center ${
                actualizando || sunatLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-yellow-500 hover:bg-yellow-600"
              }`}
            >
              {actualizando ? (
                <>
                  <Loader size="sm" />
                  <span className="ml-2">Actualizando...</span>
                </>
              ) : (
                "Actualizar padrón SUNAT"
              )}
            </button>
            <button
              onClick={handleCreateNew}
              className="bg-green-500 text-white p-2 rounded-md"
            >
              Crear Proveedor
            </button>
          </div>
        </div>

        {/* Formulario de creación/edición */}
        {selectedProveedor && (
          <div
            className="bg-white shadow-xl border-2 border-blue-400 rounded-lg p-6 mb-4 transform transition-all duration-500 ease-out opacity-0 animate-slideIn"
            style={{ opacity: 1 }}
          >
            <h2 className="text-xl font-semibold mb-4">
              Llenar Formulario
            </h2>
            <FormularioProveedor
              key={selectedProveedor?.id || "new"}
              proveedor={selectedProveedor}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        {/* Tabla de proveedores con click en fila */}
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal table-fixed">
            <thead>
              <tr className="bg-gray-100">
                <th className="w-[14.28%] px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                <th className="w-[14.28%] px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">RUC</th>
                <th className="w-[14.28%] px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre Comercial</th>
                <th className="w-[14.28%] px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dirección</th>
                <th className="w-[14.28%] px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Condición</th>
                <th className="w-[14.28%] px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="w-[14.28%] px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.length > 0 ? (
                proveedores.map((proveedor) => (
                  <tr
                    key={proveedor.id}
                    onClick={() => handleEdit(proveedor)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{proveedor.razonSocial}</td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{proveedor.ruc || "N/A"}</td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{proveedor.nombreComercial || "N/A"}</td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{proveedor.direccion || "N/A"}</td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{proveedor.condicion || "N/A"}</td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{proveedor.estado || "N/A"}</td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(proveedor);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeactivate(proveedor.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Desactivar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-5 py-5 text-center text-gray-500">
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