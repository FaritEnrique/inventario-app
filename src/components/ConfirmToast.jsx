// src/components/ConfirmToast.jsx
import React from 'react';

const ConfirmToast = ({ closeToast, message, onConfirm, confirmButtonText, cancelButtonText }) => {
  const handleConfirm = () => {
    onConfirm();
    closeToast();
  };

  const handleCancel = () => {
    closeToast();
  };

  return (
    <div className="p-4 bg-sky-200 rounded-lg shadow-xl border border-blue-700">
      <h3 className="text-xl font-semibold text-gray-800 mb-3">Confirmar Acción</h3>
      <p className="text-gray-700 text-base mb-5">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-300 border-2 border-gray-900 text-gray-800 rounded-md font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200"
        >
          {cancelButtonText || 'Cancelar'}
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
        >
          {confirmButtonText || 'Confirmar'}
        </button>
      </div>
    </div>
  );
};

export default ConfirmToast;