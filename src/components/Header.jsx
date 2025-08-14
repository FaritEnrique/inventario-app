// src/components/Header.jsx
import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Fragment>
      <header className="bg-indigo-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            InventarioApp
          </Link>
          <nav className="space-x-4 flex items-center">
            <Link to="/" className="hover:underline">Inicio</Link>
            
            {/* ✅ CORRECCIÓN: El enlace al dashboard no debe tener un evento onClick */}
            <Link to="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1 rounded transition duration-300"
              >
                Cerrar Sesión
              </button>
            ) : (
              <Link to="/login" className="hover:underline">Login</Link>
            )}
          </nav>
        </div>
      </header>
    </Fragment>
  );
};

export default Header;