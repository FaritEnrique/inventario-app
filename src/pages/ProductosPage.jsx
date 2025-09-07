// src/pages/ProductosPage.jsx
import React, { useEffect } from "react";
import useProductos from "../hooks/useProductos";
import { Link } from "react-router-dom";
import { TbArrowBackUpDouble } from "react-icons/tb";

const ProductosPage = () => {
  const { productos, cargando, error, fetchProductos } = useProductos();

  useEffect(() => {
    fetchProductos(); // Cargar productos al montar
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="flex items-center justify-end w-full">
        <Link
          to="/dashboard"
          className="flex items-center space-x-2 hover:underline text-sky-500 hover:text-indigo-500"
        >
          <TbArrowBackUpDouble size={22} />
          <span className="text-lg font-semibold">Dashboard</span>
        </Link>
      </div>
      <h1 className="mb-4 text-3xl font-bold text-indigo-700">
        Lista de Productos
      </h1>

      {cargando ? (
        <p className="text-gray-600">Cargando productos...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : productos.length === 0 ? (
        <p className="text-gray-600">No hay productos registrados.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((prod) => (
            <li key={prod.id} className="p-4 bg-white rounded shadow">
              <h2 className="font-bold text-indigo-600">{prod.codigo}</h2>
              <p className="text-gray-800">{prod.nombre}</p>
              <p className="text-sm text-gray-600">
                {prod.descripcion || "Sin descripción"}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-semibold">Stock:</span> {prod.stock}{" "}
                {prod.unidadMedida}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProductosPage;
