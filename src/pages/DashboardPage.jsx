// src/pages/DashboardPage.jsx
import React from 'react';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-indigo-700 mb-4">Panel de Control</h1>

        <p className="text-gray-700 text-lg mb-6">
          ¡Bienvenido al sistema de InventarioApp! Aquí podrás gestionar productos, categorías, movimientos y más.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800">Productos</h2>
            <p className="text-sm text-gray-600">Ver y administrar los productos del inventario.</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800">Movimientos</h2>
            <p className="text-sm text-gray-600">Registrar entradas y salidas de stock.</p>
          </div>

          {/* Card 3 */}
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