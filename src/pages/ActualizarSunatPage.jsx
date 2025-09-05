// src/pages/ActualizarSunatPage.jsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import apiFetch from '../api/apiFetch';
import ConfirmToast from '../components/ConfirmToast'; // ✅ NUEVO: Importa el componente genérico

const ActualizarSunatPage = () => {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    // Usamos el toast de confirmación para advertir al usuario
    toast.dark(
      ({ closeToast }) => (
        <ConfirmToast
          closeToast={closeToast}
          message="¿Estás seguro de que deseas ejecutar la actualización manual del padrón de la SUNAT? Esta operación es intensiva y no se recomienda su uso frecuente. Puede tomar varios minutos."
          confirmButtonText="Continuar"
          onConfirm={async () => {
            setLoading(true);
            try {
              const response = await apiFetch('sunat/actualizar', { method: 'POST' });
              toast.success(response.mensaje || 'Actualización del padrón SUNAT iniciada correctamente. El proceso puede tomar unos minutos.');
            } catch (error) {
              toast.error(`Error al iniciar la actualización: ${error.message}`);
            } finally {
              setLoading(false);
            }
          }}
        />
      ),
      { autoClose: false, closeButton: false }
    );
  };

  return (
    <>
      <Helmet>
        <title>Actualizar Padrón SUNAT | Sistema de Inventario</title>
      </Helmet>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Actualizar Padrón de Proveedores SUNAT</h1>
        
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
          <p className="font-bold">Advertencia:</p>
          <p>Esta es una operación manual que descarga y procesa un archivo muy grande. No se recomienda su uso frecuente, ya que puede sobrecargar el servidor y el ancho de banda. La actualización automática se ejecuta periódicamente.</p>
        </div>

        <div className="flex justify-center items-center">
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="bg-blue-500 text-white p-4 rounded-md text-lg font-semibold disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center">
                <Loader />
                <span className="ml-2">Iniciando actualización...</span>
              </div>
            ) : (
              'Ejecutar Actualización Manual'
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default ActualizarSunatPage;