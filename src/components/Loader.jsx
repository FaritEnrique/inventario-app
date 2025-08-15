// src/components/Loader.jsx
import React from 'react';
import { FaSpinner } from 'react-icons/fa'; // Asegúrate de tener react-icons instalado

const Loader = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <FaSpinner className="animate-spin text-4xl text-blue-500" />
    </div>
  );
};

export default Loader;