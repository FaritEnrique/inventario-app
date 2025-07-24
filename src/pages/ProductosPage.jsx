// src/pages/ProductosPage.jsx
import React, { useEffect } from 'react';
import useProductos from '../hooks/useProductos';

const ProductosPage = () => {
  const { productos, cargando, error, fetchProductos } = useProductos();

  useEffect(() => {
    fetchProductos(); // Cargar productos al montar
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-indigo-700 mb-4">Lista de Productos</h1>

      {cargando ? (
        <p className="text-gray-600">Cargando productos...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : productos.length === 0 ? (
        <p className="text-gray-600">No hay productos registrados.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map((prod) => (
            <li key={prod.id} className="bg-white p-4 rounded shadow">
              <h2 className="font-bold text-indigo-600">{prod.codigo}</h2>
              <p className="text-gray-800">{prod.nombre}</p>
              <p className="text-sm text-gray-600">{prod.descripcion || 'Sin descripción'}</p>
              <p className="text-sm mt-1">
                <span className="font-semibold">Stock:</span> {prod.stock} {prod.unidadMedida}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProductosPage;