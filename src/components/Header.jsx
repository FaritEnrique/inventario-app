import { Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { canAccessCotizaciones } from "../utils/cotizacionPermissions";

const Header = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Fragment>
      <header className="bg-indigo-700 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-2xl font-bold">
            InventarioApp
          </Link>

          <nav className="flex items-center space-x-4">
            <Link to="/" className="hover:underline">
              Inicio
            </Link>

            {isAuthenticated && (
              <Link to="/dashboard" className="hover:underline">
                Dashboard
              </Link>
            )}

            {isAuthenticated && canAccessCotizaciones(user) && (
              <Link to="/cotizaciones" className="hover:underline">
                Cotizaciones
              </Link>
            )}

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="rounded bg-indigo-500 px-3 py-1 text-white transition duration-300 hover:bg-indigo-600"
              >
                Cerrar sesion
              </button>
            ) : (
              <Link to="/login" className="hover:underline">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>
    </Fragment>
  );
};

export default Header;
