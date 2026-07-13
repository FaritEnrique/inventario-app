import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import Modal from "./Modal";

const PATHS_ALLOWED_WITHOUT_ACTIVE_CONTEXT = new Set([
  "/seleccionar-contexto",
  "/cambiar-contrasena",
]);

const ProtectedRoute = () => {
  const { isAuthenticated, loading, identity, activeContext } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated || !identity) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!identity.activo) {
    return (
      <Modal
        isOpen
        onClose={() => navigate("/login")}
        title="Acceso denegado"
        maxWidth="max-w-md"
      >
        <p className="text-gray-700">
          Solo los usuarios activos y autorizados pueden ingresar a la plataforma.
        </p>
        <div className="mt-4 flex justify-end">
          <button type="button"
            onClick={() => navigate("/login")}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Aceptar
          </button>
        </div>
      </Modal>
    );
  }

  if (
    !activeContext &&
    !PATHS_ALLOWED_WITHOUT_ACTIVE_CONTEXT.has(location.pathname)
  ) {
    return <Navigate to="/seleccionar-contexto" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
