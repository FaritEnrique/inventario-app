// src/components/Modal.jsx
import React from "react";

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center w-full h-full p-4 overflow-y-auto bg-gray-600 bg-opacity-50">
      <div
        className={`relative mx-auto border shadow-lg rounded-md bg-white w-full ${maxWidth}`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-3xl font-light leading-none text-gray-500 hover:text-gray-800"
          >
            &times;
          </button>
        </div>
        {/* Espacio adicional en la parte superior del contenido */}
        <div className="px-4 pt-6 pb-4 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
