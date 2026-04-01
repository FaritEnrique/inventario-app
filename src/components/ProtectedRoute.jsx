import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { useAuth } from "../context/authContext";

Modal.setAppElement("#root");

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "min(420px, calc(100vw - 2rem))",
    maxWidth: "calc(100vw - 2rem)",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
};

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
    return <Navigate to="/login" />;
  }

  if (!identity.activo) {
    return (
      <Modal
        isOpen
        onRequestClose={() => navigate("/login")}
        style={customStyles}
        contentLabel="Usuario no validado"
      >
        <h3 className="mb-4 text-xl font-bold">Acceso denegado</h3>
        <p className="text-gray-700">
          Solo los usuarios activos y autorizados pueden ingresar a la plataforma.
        </p>
        <div className="mt-4 flex justify-end">
          <button
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
