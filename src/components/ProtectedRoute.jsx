// src/components/ProtectedRoute.jsx
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import Modal from "react-modal";

Modal.setAppElement("#root");

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "400px",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
};

const ProtectedRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // ✅ CORRECCIÓN CLAVE: Renderizamos solo el modal si el usuario no está activo
  if (user && !user.activo) {
    return (
      <Modal
        isOpen={true} // Siempre abierto mientras el componente esté montado
        onRequestClose={() => navigate("/login")}
        style={customStyles}
        contentLabel="Usuario no validado"
      >
        <h3 className="text-xl font-bold mb-4">Acceso Denegado</h3>
        <p className="text-gray-700">
          Usuario no validado, sólo acceso a la plataforma los usuarios
          validados y autorizados.
        </p>
        <div className="flex justify-end mt-4">
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Aceptar
          </button>
        </div>
      </Modal>
    );
  }

  // Si todo es correcto, renderizamos el contenido de la ruta
  return <Outlet />;
};

export default ProtectedRoute;