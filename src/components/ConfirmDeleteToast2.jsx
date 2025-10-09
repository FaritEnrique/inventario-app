// src/components/ConfirmDeleteToast2.jsx
import React from "react";
import { motion } from "framer-motion";
import { Trash2, XCircle } from "lucide-react";

const ConfirmDeleteToast2 = ({ closeToast, message, onConfirm }) => {
  const handleConfirm = () => {
    onConfirm();
    closeToast();
  };

  const handleCancel = () => {
    closeToast();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="max-w-md p-6 mx-auto bg-white border border-gray-300 shadow-xl dark:bg-gray-900 rounded-2xl dark:border-gray-700"
    >
      <div className="flex items-center gap-3 mb-4">
        <Trash2 className="w-6 h-6 text-red-600 dark:text-red-500" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Confirmar Eliminación
        </h3>
      </div>
      <p className="mb-6 text-sm text-gray-700 dark:text-gray-300">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={handleCancel}
          className="flex items-center gap-1 px-4 py-2 font-medium text-gray-800 transition bg-gray-200 rounded-md dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          <XCircle className="w-4 h-4" /> Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 font-medium text-white transition bg-red-600 rounded-md shadow-md hover:bg-red-700"
        >
          Eliminar
        </button>
      </div>
    </motion.div>
  );
};

export default ConfirmDeleteToast2;
