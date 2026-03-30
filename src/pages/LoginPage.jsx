// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../context/authContext";
import Modal from "react-modal";

Modal.setAppElement("#root");

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setCargando(true);
    const result = await login(email, password);

    if (result.success) {
      toast.success("¡Inicio de sesión exitoso!");
      navigate("/dashboard");
    } else {
      setEmail("");
      setPassword("");

      if (result.error && result.error.includes("Credenciales")) {
        setIsErrorModalOpen(true);
      } else {
        toast.error(result.error || "Ocurrió un error inesperado.");
      }
    }

    setCargando(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded bg-white p-8 shadow">
        <h2 className="mb-6 text-center text-2xl font-semibold text-indigo-700">
          Iniciar sesión
        </h2>
        <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              name="login-email"
              className="w-full rounded border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="login-password"
                className="w-full rounded border px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="off"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded bg-indigo-600 py-2 text-white transition duration-300 hover:bg-indigo-700 disabled:bg-indigo-400"
            disabled={cargando}
          >
            {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/solicitar-restablecimiento"
            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>

      <Modal
        isOpen={isErrorModalOpen}
        onRequestClose={() => setIsErrorModalOpen(false)}
        style={customStyles}
        contentLabel="Error de credenciales"
      >
        <h3 className="mb-4 text-xl font-bold">Error de credenciales</h3>
        <p className="text-gray-700">
          El usuario o la contraseña que estás ingresando no coincide con la
          que está almacenada en la base de datos para ese usuario. Solo pueden
          acceder a la plataforma usuarios autorizados.
        </p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setIsErrorModalOpen(false)}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Aceptar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;
