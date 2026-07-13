// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../context/authContext";
import Modal from "../components/Modal";

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
      toast.success("Inicio de sesion exitoso.");
      navigate(
        result.contextSelectionRequired
          ? "/seleccionar-contexto"
          : "/dashboard",
        { replace: true },
      );
    } else {
      setEmail("");
      setPassword("");

      if (result.error && result.error.includes("Credenciales")) {
        setIsErrorModalOpen(true);
      } else {
        toast.error(result.error || "Ocurrio un error inesperado.");
      }
    }

    setCargando(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white border-2 border-indigo-700 shadow rounded-xl">
        <h2 className="mb-6 text-2xl font-semibold text-center text-indigo-700">
          Iniciar sesion
        </h2>
        <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
          <div>
            <label
              htmlFor="email"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Correo electronico
            </label>
            <input
              id="email"
              type="email"
              name="login-email"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Contrasena
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="login-password"
                className="w-full px-4 py-2 pr-10 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                  showPassword ? "Ocultar contrasena" : "Mostrar contrasena"
                }
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 text-white transition duration-300 bg-indigo-600 rounded hover:bg-indigo-700 disabled:bg-indigo-400"
            disabled={cargando}
          >
            {cargando ? "Iniciando sesion..." : "Iniciar sesion"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/solicitar-restablecimiento"
            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Olvidaste tu contrasena?
          </Link>
        </div>
      </div>

      <Modal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        title="Error de credenciales"
        maxWidth="max-w-md"
      >
        <p className="text-gray-700">
          El usuario o la contrasena que estas ingresando no coincide con la que
          esta almacenada en la base de datos para ese usuario. Solo pueden
          acceder a la plataforma usuarios autorizados.
        </p>
        <div className="flex justify-end mt-4">
          <button type="button"
            onClick={() => setIsErrorModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Aceptar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;
