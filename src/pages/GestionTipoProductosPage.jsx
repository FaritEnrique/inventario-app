// src/pages/GestionTipoProductosPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import useTipoProductos from '../hooks/useTipoProductos';
import useDebounce from '../hooks/useDebounce';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ConfirmDeleteToast from '../components/ConfirmDeleteToast';

const devLog = (...args) => {
  if (import.meta.env.MODE === 'development') { 
    console.log('[DEV_LOG_GESTION_TIPOS]', ...args);
  }
};

const FRECUENCIA_REPOSICION_OPTIONS = [
  'diaria',
  'semanal',
  'quincenal',
  'mensual',
  'bimestral',
  'trimestral',
];

const GestionTipoProductosPage = () => {
  const {
    tiposProducto,
    tipo: tipoAEditar,
    cargando,
    error,
    fetchTiposProducto,
    fetchTipoPorId,
    crearTipo,
    actualizarTipo,
    eliminarTipo,
    clearTipo,
  } = useTipoProductos();

  const [nombreTipo, setNombreTipo] = useState('');
  const [prefijoTipo, setPrefijoTipo] = useState('');
  const [frecuenciaReposicionTipo, setFrecuenciaReposicionTipo] = useState('mensual');
  const [tipoSeleccionadoId, setTipoSeleccionadoId] = useState(null);
  const [searchTermInput, setSearchTermInput] = useState('');
  const debouncedSearchTerm = useDebounce(searchTermInput, 2000);

  useEffect(() => {
    fetchTiposProducto(debouncedSearchTerm);
  }, [fetchTiposProducto, debouncedSearchTerm]);

  useEffect(() => {
    if (tipoAEditar) {
      setNombreTipo(tipoAEditar.nombre || '');
      setPrefijoTipo(tipoAEditar.prefijo || '');
      setFrecuenciaReposicionTipo(tipoAEditar.frecuenciaReposicion || 'mensual');
      setTipoSeleccionadoId(tipoAEditar.id);
    } else {
      setNombreTipo('');
      setPrefijoTipo('');
      setFrecuenciaReposicionTipo('mensual');
      setTipoSeleccionadoId(null);
    }
  }, [tipoAEditar]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!nombreTipo.trim()) {
      alert('El nombre del tipo de producto no puede estar vacío.');
      return;
    }
    if (!prefijoTipo.trim()) {
      alert('El prefijo no puede estar vacío.');
      return;
    }
    if (!/^[A-Z]{2}$/.test(prefijoTipo)) {
      alert('El prefijo debe tener exactamente 2 letras mayúsculas (ej. "FE").');
      return;
    }

    const datosTipo = {
      nombre: nombreTipo,
      prefijo: prefijoTipo.toUpperCase(),
      frecuenciaReposicion: frecuenciaReposicionTipo,
    };

    try {
      if (tipoSeleccionadoId) {
        await actualizarTipo(tipoSeleccionadoId, datosTipo);
      } else {
        await crearTipo(datosTipo);
      }
      setNombreTipo('');
      setPrefijoTipo('');
      setFrecuenciaReposicionTipo('mensual');
      setTipoSeleccionadoId(null);
      clearTipo();
      fetchTiposProducto(debouncedSearchTerm);
    } catch (err) {
      console.error("Error en la operación de tipo de producto:", err);
    }
  }, [nombreTipo, prefijoTipo, frecuenciaReposicionTipo, tipoSeleccionadoId, actualizarTipo, crearTipo, clearTipo, fetchTiposProducto, debouncedSearchTerm]);

  const handleEditar = useCallback((id) => {
    fetchTipoPorId(id);
  }, [fetchTipoPorId]);

  const handleDeleteClick = useCallback((id) => {
    const tipo = tiposProducto.find(t => t.id === id);
    if (!tipo) return;

    toast.warn(({ closeToast, toastProps }) => (
      <ConfirmDeleteToast
        closeToast={closeToast}
        toastProps={toastProps}
        message={`¿Estás seguro de que deseas eliminar el tipo de producto "${tipo.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={async () => {
          try {
            await eliminarTipo(id);
            fetchTipos(debouncedSearchTerm);
          } catch (err) {
            console.error("Error al eliminar el tipo de producto:", err);
            toast.error("Error al eliminar la marca.");
          }
        }}
      />
    ), {
      position: "top-center",
      autoClose: false,
      closeButton: false,
      hideProgressBar: true,
      closeOnClick: false,
      draggable: false,
      pauseOnHover: false,
    });
  }, [tiposProducto, eliminarTipo, fetchTiposProducto, debouncedSearchTerm]);
  
  const handleClearForm = useCallback(() => {
    setNombreTipo('');
    setPrefijoTipo('');
    setFrecuenciaReposicionTipo('mensual');
    setTipoSeleccionadoId(null);
    clearTipo();
  }, [clearTipo]);

  devLog('Datos de tiposProducto en GestionTipoProductosPage:', tiposProducto);

  return (
    <div className="p-5 max-w-4xl mx-auto my-5 bg-gray-50 rounded-xl shadow-2xl border border-gray-200">
      <h1 className="text-center text-4xl font-extrabold text-gray-800 mb-8 tracking-wide">Gestión de Tipos de Producto</h1>

      <div className="mb-8 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-700 mb-5 pb-3 border-b-2 border-blue-600">
          {tipoSeleccionadoId ? 'Actualizar Tipo de Producto' : 'Crear Nuevo Tipo de Producto'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label htmlFor="nombreTipo" className="font-semibold text-gray-600 text-lg"> {/* Añadir 'htmlFor' aquí */}
            Nombre del Tipo de Producto:
            <input
              type="text"
              id="nombreTipo"
              name="nombre"
              value={nombreTipo}
              onChange={(e) => setNombreTipo(e.target.value)}
              disabled={cargando}
              className="mt-2 w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Escribe el nombre del tipo de producto"
            />
          </label>

          <label htmlFor="prefijoTipo" className="font-semibold text-gray-600 text-lg"> {/* Añadir 'htmlFor' aquí */}
            Prefijo (2 letras mayúsculas):
            <input
              type="text"
              id="prefijoTipo"
              name="prefijo"
              value={prefijoTipo}
              onChange={(e) => setPrefijoTipo(e.target.value.toUpperCase())}
              maxLength="2"
              disabled={cargando}
              className="mt-2 w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Ej. FE"
            />
          </label>

          <label htmlFor="frecuenciaReposicionTipo" className="font-semibold text-gray-600 text-lg"> {/* Añadir 'htmlFor' aquí */}
            Frecuencia de Reposición:
            <select
              id="frecuenciaReposicionTipo"
              name="frecuenciaReposicion"
              value={frecuenciaReposicionTipo}
              onChange={(e) => setFrecuenciaReposicionTipo(e.target.value)}
              disabled={cargando}
              className="mt-2 w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {FRECUENCIA_REPOSICION_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-4 justify-end flex-wrap">
            <button
              type="submit"
              disabled={cargando || !nombreTipo.trim() || !prefijoTipo.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cargando ? 'Guardando...' : tipoSeleccionadoId ? 'Actualizar Tipo' : 'Crear Tipo'}
            </button>
            {tipoSeleccionadoId && (
              <button
                type="button"
                onClick={handleClearForm}
                disabled={cargando}
                className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancelar Edición
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="mb-8 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-700 mb-5 pb-3 border-b-2 border-blue-600">Buscar Tipos de Producto</h2>
        <input
          type="text"
          id="searchTermInput"
          name="search"
          placeholder="Buscar por nombre o prefijo..."
          value={searchTermInput}
          onChange={(e) => setSearchTermInput(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={cargando}
        />
      </div>

      <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-700 mb-5 pb-3 border-b-2 border-blue-600">Listado de Tipos de Producto</h2>
        {cargando && tiposProducto.length === 0 && (
          <p className="text-center text-lg text-gray-600 py-4 bg-gray-100 rounded-lg">Cargando tipos de producto...</p>
        )}
        {error && (
          <p className="text-center text-lg text-red-700 py-4 bg-red-100 border border-red-400 rounded-lg">
            {error}
          </p>
        )}

        {tiposProducto.length === 0 && !cargando && !error && (
          <p className="text-center text-lg text-gray-600 py-4 bg-gray-100 rounded-lg">
            {debouncedSearchTerm ? `No hay tipos de producto que coincidan con "${debouncedSearchTerm}".` : 'No hay tipos de producto registrados.'}
          </p>
        )}

        <ul className="list-none p-0 space-y-3">
          {tiposProducto.map((t) => (
            <li
              key={t.id}
              className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg shadow-sm border border-gray-200 transition duration-200 ease-in-out ${
                tipoSeleccionadoId === t.id ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-white hover:shadow-md'
              }`}
            >
              <span className="text-xl font-medium text-gray-800 mb-2 sm:mb-0 w-full sm:w-auto">
                {t.nombre} <span className="text-gray-500 text-sm">({t.prefijo}) - {t.frecuenciaReposicion}</span>
              </span>
              <div className="flex gap-3 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleEditar(t.id)}
                  disabled={cargando}
                  className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-md shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 transition duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteClick(t.id)}
                  disabled={cargando}
                  className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <ToastContainer />
    </div>
  );
};

export default GestionTipoProductosPage;