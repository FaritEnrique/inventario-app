// src/pages/HomePage.jsx
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white shadow-lg rounded-2xl p-8 text-center">
        <h1 className="text-4xl font-bold text-blue-700 mb-4">
          Bienvenido al Sistema de Inventario
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Gestiona tus productos, controla tu stock y mantén tu negocio organizado en todo momento.
        </p>
        <img
          src="/images/ImagenInventario.png"
          alt="Inventario"
          className="mx-auto w-96 object-cover mb-6 rounded-lg shadow-md"
        />
        <Link
          to="/login"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-3 px-6 rounded-xl transition duration-300"
        >
          Ingresar al sistema
        </Link>
      </div>
    </div>
  );
}