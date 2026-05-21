// src/pages/TipoProductosPage.jsx
import React from "react";
import SkeletonSection from "../components/ui/skeletons/SkeletonSection";
import useTipoProductos from "../hooks/useTipoProductos";

const TipoProductosPage = () => {
  const { tiposProducto, cargando, error, eliminarTipo } = useTipoProductos();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-indigo-700 mb-4">
          Tipos de Producto
        </h1>

        {error && <p className="text-red-500">{error}</p>}

        {cargando && tiposProducto.length === 0 ? (
          <SkeletonSection rows={4} />
        ) : (
          <ul className="space-y-3">
            {tiposProducto.map((tipo) => (
              <li
                key={tipo.id}
                className="bg-white shadow p-4 rounded flex justify-between items-center"
              >
                <div>
                  <h2 className="font-semibold text-gray-800">{tipo.nombre}</h2>
                  <p className="text-sm text-gray-600">
                    Prefijo: <strong>{tipo.prefijo}</strong>
                  </p>
                </div>
                <button
                  onClick={() => eliminarTipo(tipo.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TipoProductosPage;
