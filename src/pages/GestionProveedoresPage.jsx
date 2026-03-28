import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmDeleteToast from "../components/ConfirmDeleteToast";
import FormularioProveedor from "../components/FormularioProveedor";
import Loader from "../components/Loader";
import ProveedorDetalleModal from "../components/ProveedorDetalleModal";
import useProveedores from "../hooks/useProveedores";
import useSunat from "../hooks/useSunat";

const RUC_REGEX = /^(10|20)\d{9}$/;

const GestionProveedoresPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [lastAppliedSearchQuery, setLastAppliedSearchQuery] = useState("");
  const [registeredFilterQuery, setRegisteredFilterQuery] = useState("");
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [detailProveedor, setDetailProveedor] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isRucDisabledForNewForm, setIsRucDisabledForNewForm] = useState(false);

  const {
    proveedores,
    loading: proveedoresLoading,
    fetchProveedores,
    actualizarEstadoProveedor,
  } = useProveedores();

  const {
    consultarPadronSunat,
    actualizarPadronSunat,
    actualizarPadronReducido,
    obtenerUltimaActualizacion,
    obtenerUltimaActualizacionReducido,
    ultimaActualizacion,
    ultimaActualizacionReducido,
    loading: sunatLoading,
    actualizando: actualizandoSunat,
    actualizandoReducido,
  } = useSunat();

  useEffect(() => {
    fetchProveedores(lastAppliedSearchQuery);
  }, [lastAppliedSearchQuery]);

  useEffect(() => {
    obtenerUltimaActualizacion();
    obtenerUltimaActualizacionReducido();
  }, [obtenerUltimaActualizacion, obtenerUltimaActualizacionReducido]);

  const handleSearchChange = (event) => {
    const value = event.target.value;

    if (/[^0-9]/.test(value)) {
      setSearchQuery(value);
      return;
    }

    if (value.length <= 11) {
      setSearchQuery(value);
    }
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    const query = searchQuery.trim();

    const isNumericQuery = /^\d+$/.test(query);
    if (isNumericQuery && query.length === 11 && !RUC_REGEX.test(query)) {
      toast.error("El RUC debe tener 11 digitos y empezar con 10 o 20.");
      return;
    }

    setIsRucDisabledForNewForm(false);

    if (!query) {
      fetchProveedores();
      return;
    }

    const isRuc = RUC_REGEX.test(query);

    setIsFormVisible(false);
    setSelectedProveedor(null);
    setLastAppliedSearchQuery(query);
    setRegisteredFilterQuery(query);

    const localResults = await fetchProveedores(query);

    if (localResults.length > 0) {
      toast.info(`Se encontraron ${localResults.length} coincidencias locales.`);
      return;
    }

    if (isRuc) {
      const sunatData = await consultarPadronSunat(query);
      if (sunatData) {
        setSelectedProveedor(sunatData);
        setIsFormVisible(true);
        toast.success(
          "Proveedor encontrado en SUNAT. Completa los datos para registrarlo."
        );
      } else {
        setSelectedProveedor(null);
        setIsFormVisible(true);
        toast.info(
          "El RUC no fue encontrado. Puedes registrar un nuevo proveedor con este RUC."
        );
      }
      return;
    }

    toast.info("Proveedor no encontrado. Para buscar en SUNAT, ingresa un RUC.");
  };

  const handleCreateNew = () => {
    setSelectedProveedor(null);
    setIsFormVisible(true);
    setIsRucDisabledForNewForm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info(
      "Formulario para nuevo proveedor. El RUC depende de la procedencia seleccionada."
    );
  };

  const handleEdit = (proveedor) => {
    setSelectedProveedor(proveedor);
    setIsFormVisible(true);
    setIsRucDisabledForNewForm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeactivate = (id) => {
    toast.dark(
      ({ closeToast }) => (
        <ConfirmDeleteToast
          closeToast={closeToast}
          message="Estas seguro de que deseas desactivar este proveedor?"
          onConfirm={async () => {
            await actualizarEstadoProveedor(id, false);
            fetchProveedores(lastAppliedSearchQuery);
          }}
        />
      ),
      { autoClose: false, closeButton: false }
    );
  };

  const handleFormSuccess = () => {
    setIsFormVisible(false);
    setSelectedProveedor(null);
    setIsRucDisabledForNewForm(false);
    setSearchQuery("");
    fetchProveedores();
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setSelectedProveedor(null);
    setIsRucDisabledForNewForm(false);
  };

  const handleActualizarPadron = async () => {
    await actualizarPadronSunat();
  };

  const handleActualizarPadronReducido = async () => {
    await actualizarPadronReducido();
  };

  const handleRegisteredFilterSubmit = async (event) => {
    event.preventDefault();
    const query = registeredFilterQuery.trim();
    setLastAppliedSearchQuery(query);
  };

  const handleClearRegisteredFilter = () => {
    setRegisteredFilterQuery("");
    setLastAppliedSearchQuery("");
  };

  const loading = proveedoresLoading || sunatLoading;

  return (
    <>
      <Helmet>
        <title>Gestion de Proveedores | Sistema de Inventario</title>
      </Helmet>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-800">
          Gestion de Proveedores
        </h1>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <form onSubmit={handleSearchSubmit}>
            <label
              htmlFor="search-proveedor"
              className="mb-2 block font-medium text-gray-700 text-md"
            >
              Buscar o Registrar Proveedor
            </label>
            <div className="flex">
              <input
                id="search-proveedor"
                type="text"
                className="max-w-96 flex-grow rounded-l-md border border-gray-500 p-3 transition-shadow focus:ring-2 focus:ring-blue-500"
                placeholder="Ingresa un RUC o nombre..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <button
                type="submit"
                className="flex items-center justify-center rounded-r-md bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? <Loader size="sm" /> : "Buscar / Registrar"}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Busca un proveedor existente por RUC o nombre, o inicia un nuevo
              registro.
            </p>
          </form>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCreateNew}
                className="rounded-md bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
              >
                Crear nuevo
              </button>
              <button
                type="button"
                onClick={handleActualizarPadron}
                disabled={actualizandoSunat}
                className="rounded-md bg-amber-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actualizandoSunat
                  ? "Actualizando padron SUNAT..."
                  : "Actualizar padron SUNAT"}
              </button>
              <button
                type="button"
                onClick={handleActualizarPadronReducido}
                disabled={actualizandoReducido}
                className="rounded-md bg-teal-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actualizandoReducido
                  ? "Actualizando padron reducido..."
                  : "Actualizar padron reducido"}
              </button>
              <Link
                to="/solicitudes-tipo-producto"
                className="rounded-md bg-slate-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Bandeja de solicitudes
              </Link>
            </div>
            <div className="max-w-md text-sm text-gray-600">
              <p className="font-medium text-gray-700">
                Actualizacion manual del padron SUNAT
              </p>
              <p>
                Usala cuando necesites refrescar la base externa para que la
                busqueda por RUC recupere datos recientes del proveedor.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Ultima actualizacion padron SUNAT:{" "}
                {ultimaActualizacion || "Sin informacion disponible"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Ultima actualizacion padron reducido:{" "}
                {ultimaActualizacionReducido || "Sin informacion disponible"}
              </p>
            </div>
          </div>
        </div>

        {isFormVisible ? (
          <div className="mb-6">
            <FormularioProveedor
              key={selectedProveedor?.id || "new"}
              proveedor={selectedProveedor}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              disableRucField={isRucDisabledForNewForm}
            />
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-lg bg-white shadow-lg">
          <div className="border-b p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Proveedores Registrados
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Filtra manualmente por razon social, RUC o tipo de producto.
                </p>
              </div>

              <form
                onSubmit={handleRegisteredFilterSubmit}
                className="flex w-full flex-col gap-2 md:max-w-2xl md:flex-row"
              >
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm transition-shadow focus:ring-2 focus:ring-blue-500"
                  placeholder="Buscar por razon social, RUC o tipo de producto..."
                  value={registeredFilterQuery}
                  onChange={(event) => setRegisteredFilterQuery(event.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-md bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                    disabled={proveedoresLoading}
                  >
                    Filtrar
                  </button>
                  <button
                    type="button"
                    onClick={handleClearRegisteredFilter}
                    className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    disabled={proveedoresLoading && !registeredFilterQuery}
                  >
                    Limpiar
                  </button>
                </div>
              </form>
            </div>
          </div>
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-b-2 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Razon Social
                </th>
                <th className="border-b-2 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  RUC
                </th>
                <th className="border-b-2 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Representante
                </th>
                <th className="border-b-2 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Contacto
                </th>
                <th className="border-b-2 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Telefono
                </th>
                <th className="border-b-2 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Tipos de Producto
                </th>
                <th className="border-b-2 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Estado
                </th>
                <th className="border-b-2 px-5 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {proveedores.length > 0 ? (
                proveedores.map((proveedor) => (
                  <tr key={proveedor.id} className="hover:bg-gray-50">
                    <td className="border-b px-5 py-4 text-sm">
                      {proveedor.razonSocial}
                    </td>
                    <td className="border-b px-5 py-4 text-sm">
                      {proveedor.ruc || "N/A"}
                    </td>
                    <td className="border-b px-5 py-4 text-sm">
                      {proveedor.representante || "N/A"}
                    </td>
                    <td className="border-b px-5 py-4 text-sm">
                      {proveedor.contacto || "N/A"}
                    </td>
                    <td className="border-b px-5 py-4 text-sm">
                      {proveedor.telefono || "N/A"}
                    </td>
                    <td className="border-b px-5 py-4 text-sm">
                      {(proveedor.especialidades || []).length > 0
                        ? proveedor.especialidades
                            .map((especialidad) => especialidad.tipoProducto?.nombre)
                            .filter(Boolean)
                            .join(", ")
                        : "Sin definir"}
                    </td>
                    <td className="border-b px-5 py-4 text-sm">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold leading-tight ${
                          proveedor.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {proveedor.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="flex gap-3 border-b px-5 py-4 text-sm">
                      <button
                        onClick={() => setDetailProveedor(proveedor)}
                        className="font-medium text-slate-700 hover:text-slate-900"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => handleEdit(proveedor)}
                        className="font-medium text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeactivate(proveedor.id)}
                        className="font-medium text-red-600 hover:text-red-900"
                      >
                        Desactivar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-gray-500">
                    No se encontraron proveedores.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ProveedorDetalleModal
          isOpen={Boolean(detailProveedor)}
          onClose={() => setDetailProveedor(null)}
          proveedor={detailProveedor}
        />
      </div>
    </>
  );
};

export default GestionProveedoresPage;
