// src/pages/GestionMarcasPage.jsx
import React, { useState, useEffect } from 'react';
import useMarcas from '../hooks/useMarcas';
import useDebounce from '../hooks/useDebounce';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ConfirmDeleteToast from '../components/ConfirmDeleteToast';

const GestionMarcasPage = () => {
  const {
    marcas,
    marca: marcaAEditar,
    cargando,
    error,
    fetchMarcas,
    fetchMarcaPorId,
    crearMarca,
    actualizarMarca,
    eliminarMarca,
  } = useMarcas();

  const [nombreMarca, setNombreMarca] = useState('');
  const [marcaSeleccionadaId, setMarcaSeleccionadaId] = useState(null);
  const [searchTermInput, setSearchTermInput] = useState('');
  const debouncedSearchTerm = useDebounce(searchTermInput, 700);

  useEffect(() => {
    fetchMarcas(debouncedSearchTerm);
  }, [fetchMarcas, debouncedSearchTerm]);

  useEffect(() => {
    if (marcaAEditar) {
      setNombreMarca(marcaAEditar.nombre || '');
      setMarcaSeleccionadaId(marcaAEditar.id);
    } else {
      setNombreMarca('');
      setMarcaSeleccionadaId(null);
    }
  }, [marcaAEditar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombreMarca.trim()) {
      alert('El nombre de la marca no puede estar vacío.');
      return;
    }

    try {
      if (marcaSeleccionadaId) {
        await actualizarMarca(marcaSeleccionadaId, { nombre: nombreMarca });
      } else {
        await crearMarca({ nombre: nombreMarca });
      }
      setNombreMarca('');
      setMarcaSeleccionadaId(null);
      fetchMarcas(debouncedSearchTerm);
    } catch (err) {
      console.error("Error en la operación de marca:", err);
    }
  };

  const handleEditar = (id) => {
    fetchMarcaPorId(id);
  };

  const handleDeleteClick = (id) => {
    const marca = marcas.find(m => m.id === id);
    if (!marca) return;

    toast.warn(({ closeToast, toastProps }) => (
      <ConfirmDeleteToast
        closeToast={closeToast}
        toastProps={toastProps}
        message={`¿Estás seguro de que deseas eliminar la marca "${marca.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={async () => {
          try {
            await eliminarMarca(id);
            if (marcaSeleccionadaId === id) {
              setNombreMarca('');
              setMarcaSeleccionadaId(null);
            }
            fetchMarcas(debouncedSearchTerm);
          } catch (err) {
            console.error("Error al eliminar la marca:", err);
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
      className: "w-full max-w-sm sm:max-w-md",
      bodyClassName: "p-0",
      style: {
        width: 'auto',
        padding: '0',
        boxShadow: 'none',
        backgroundColor: 'transparent',
      }
    });
  };
  
  const handleClearForm = () => {
    setNombreMarca('');
    setMarcaSeleccionadaId(null);
  };

  return (
    <div className="p-5 max-w-4xl mx-auto my-5 bg-gray-50 rounded-xl shadow-2xl border border-gray-200">
      <h1 className="text-center text-4xl font-extrabold text-gray-800 mb-8 tracking-wide">Gestión de Marcas</h1>

      <div className="mb-8 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-700 mb-5 pb-3 border-b-2 border-blue-600">
          {marcaSeleccionadaId ? 'Actualizar Marca' : 'Crear Nueva Marca'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="font-semibold text-gray-600 text-lg">
            Nombre de la Marca:
            <input
              type="text"
              value={nombreMarca}
              onChange={(e) => setNombreMarca(e.target.value)}
              disabled={cargando}
              className="mt-2 w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Escribe el nombre de la marca"
            />
          </label>
          <div className="flex gap-4 justify-end flex-wrap">
            <button
              type="submit"
              disabled={cargando || !nombreMarca.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ease-in-out transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cargando ? 'Guardando...' : marcaSeleccionadaId ? 'Actualizar Marca' : 'Crear Marca'}
            </button>
            {marcaSeleccionadaId && (
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
        <h2 className="text-2xl font-bold text-gray-700 mb-5 pb-3 border-b-2 border-blue-600">Buscar Marcas</h2>
        <input
          type="text"
          placeholder="Buscar por nombre de marca..."
          value={searchTermInput}
          onChange={(e) => setSearchTermInput(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={cargando}
        />
      </div>

      <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-700 mb-5 pb-3 border-b-2 border-blue-600">Listado de Marcas</h2>
        {cargando && marcas.length === 0 && (
          <p className="text-center text-lg text-gray-600 py-4 bg-gray-100 rounded-lg">Cargando marcas...</p>
        )}
        {error && (
          <p className="text-center text-lg text-red-700 py-4 bg-red-100 border border-red-400 rounded-lg">
            {error}
          </p>
        )}

        {marcas.length === 0 && !cargando && !error && (
          <p className="text-center text-lg text-gray-600 py-4 bg-gray-100 rounded-lg">
            {debouncedSearchTerm ? `No hay marcas que coincidan con "${debouncedSearchTerm}".` : 'No hay marcas registradas.'}
          </p>
        )}

        <ul className="list-none p-0 space-y-3">
          {marcas.map((m) => (
            <li
              key={m.id}
              className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg shadow-sm border border-gray-200 transition duration-200 ease-in-out ${
                marcaSeleccionadaId === m.id ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-white hover:shadow-md'
              }`}
            >
              <span className="text-xl font-medium text-gray-800 mb-2 sm:mb-0 w-full sm:w-auto">
                {m.nombre}
              </span>
              <div className="flex gap-3 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleEditar(m.id)}
                  disabled={cargando}
                  className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-md shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 transition duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteClick(m.id)}
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

export default GestionMarcasPage;