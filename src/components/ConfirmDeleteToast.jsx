// src/components/ConfirmDeleteToast.jsx
import React from 'react';

const ConfirmDeleteToast = ({ closeToast, toastProps, message, onConfirm }) => {
  const handleConfirm = () => {
    onConfirm(); // Ejecuta la función de confirmación pasada
    closeToast(); // Cierra el toast
  };

  const handleCancel = () => {
    closeToast(); // Simplemente cierra el toast
  };

  return (
    <div className="p-4 bg-sky-200 rounded-lg shadow-xl border border-blue-700">
      <h3 className="text-xl font-semibold text-gray-800 mb-3">Confirmar Eliminación</h3>
      <p className="text-gray-700 text-base mb-5">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-300 border-2 border-gray-900 text-gray-800 rounded-md font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default ConfirmDeleteToast;