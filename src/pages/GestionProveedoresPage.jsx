//src/pages/GestionProveedoresPage.jsx

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useProveedores from '../hooks/useProveedores';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import FormularioProveedor from '../components/FormularioProveedor';
import ConfirmDeleteToast from '../components/ConfirmDeleteToast';

const GestionProveedoresPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { proveedores, loading, fetchProveedores, actualizarEstadoProveedor } = useProveedores();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    const resultados = await fetchProveedores(searchQuery);
    if (resultados && resultados.length === 0) {
      openModal({ ruc: searchQuery });
    }
  };

  const handleDeactivate = (id) => {
    toast.dark(
      ({ closeToast, toastProps }) => (
        <ConfirmDeleteToast
          closeToast={closeToast}
          toastProps={toastProps}
          message="¿Estás seguro de que deseas desactivar este proveedor? Se ocultará de la lista principal."
          onConfirm={() => {
            actualizarEstadoProveedor(id, false);
          }}
        />
      ),
      { autoClose: false, closeButton: false }
    );
  };

  const openModal = (proveedor = null) => {
    setSelectedProveedor(proveedor);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedProveedor(null);
    fetchProveedores();
  };
  
  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Helmet>
        <title>Gestión de Proveedores | Sistema de Inventario</title>
      </Helmet>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Gestión de Proveedores</h1>
        
        <div className="flex justify-between items-center mb-4">
          <form onSubmit={handleSearch} className="flex flex-grow mr-2">
            <input
              type="text"
              className="max-w-80 flex-grow border p-2 rounded-l-md"
              placeholder="Buscar por nombre o RUC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="bg-blue-500 text-white p-2 rounded-r-md">
              Buscar
            </button>
          </form>
          <div>
            <button onClick={() => openModal()} className="bg-green-500 text-white p-2 rounded-md">
              Crear Proveedor
            </button>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  RUC
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nombre Comercial
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Dirección
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Condición
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {proveedores.length > 0 ? (
                proveedores.map((proveedor) => (
                  <tr key={proveedor.id}>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {proveedor.nombre}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {proveedor.ruc || 'N/A'}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {proveedor.nombreComercial || 'N/A'}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {proveedor.direccion || 'N/A'}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {proveedor.condicion || 'N/A'}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {proveedor.tipo || 'N/A'}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {proveedor.estado || 'N/A'}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <button onClick={() => openModal(proveedor)} className="text-indigo-600 hover:text-indigo-900 mr-2">
                        Editar
                      </button>
                      <button onClick={() => handleDeactivate(proveedor.id)} className="text-red-600 hover:text-red-900">
                        Desactivar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-5 py-5 text-center text-gray-500">
                    No se encontraron proveedores.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {modalOpen && (
        <Modal onClose={closeModal} title={selectedProveedor ? 'Editar Proveedor' : 'Crear Proveedor'}>
          <FormularioProveedor proveedor={selectedProveedor} onSuccess={closeModal} />
        </Modal>
      )}
    </>
  );
};

export default GestionProveedoresPage;