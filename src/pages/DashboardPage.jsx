// src/pages/DashboardPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-indigo-700 mb-4">Panel de Control</h1>

        <p className="text-gray-700 text-lg mb-6">
          ¡Bienvenido al sistema de InventarioApp! Aquí podrás gestionar productos, categorías, movimientos y más.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Productos */}
          <Link to="/productos" className="bg-white shadow hover:shadow-md rounded-lg p-6 transition">
            <h2 className="text-lg font-semibold text-gray-800">Productos</h2>
            <p className="text-sm text-gray-600">Ver y administrar los productos del inventario.</p>
          </Link>

          {/* Tipo de Productos */}
          <Link to="/tipos-producto" className="bg-white shadow hover:shadow-md rounded-lg p-6 transition">
            <h2 className="text-lg font-semibold text-gray-800">Tipos de Producto</h2>
            <p className="text-sm text-gray-600">Gestionar tipos y prefijos de productos.</p>
          </Link>

          {/* Movimientos */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800">Movimientos</h2>
            <p className="text-sm text-gray-600">Registrar entradas y salidas de stock.</p>
          </div>

          {/* Reportes */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800">Reportes</h2>
            <p className="text-sm text-gray-600">Visualizar reportes y estadísticas del sistema.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;