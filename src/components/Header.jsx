//src/components/Header.jsx
import { useState, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isNotValidatedModalOpen, setIsNotValidatedModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDashboardClick = (e) => {
    // ✅ CORRECCIÓN: Agregamos la condición !isAuthenticated
    if (!isAuthenticated || (user && !user.activo)) {
      e.preventDefault();
      setIsNotValidatedModalOpen(true);
    }
  };

  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '400px',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
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
            <Link
              to="/dashboard"
              className="hover:underline"
              onClick={handleDashboardClick}
            >
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

      <Modal
        isOpen={isNotValidatedModalOpen}
        onRequestClose={() => setIsNotValidatedModalOpen(false)}
        style={customStyles}
        contentLabel="Usuario no validado"
      >
        <h3 className="text-xl font-bold mb-4">Acceso Denegado</h3>
        <p className="text-gray-700">
          Usuario no validado, sólo acceso a la plataforma los usuarios validados y autorizados.
        </p>
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setIsNotValidatedModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Aceptar
          </button>
        </div>
      </Modal>
    </Fragment>
  );
};

export default Header;