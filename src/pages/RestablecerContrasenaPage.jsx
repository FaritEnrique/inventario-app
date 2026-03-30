// src/pages/RestablecerContrasenaPage.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiFetch from "../api/apiFetch";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const RestablecerContrasenaPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [tokenValido, setTokenValido] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setTokenValido(false);
      toast.error("Token no encontrado en la URL.");
    }
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    if (!token) {
      toast.error("Token de restablecimiento inválido.");
      return;
    }

    setCargando(true);
    try {
      await apiFetch("auth/restablecer-contrasena", {
        method: "POST",
        body: JSON.stringify({ token, nuevaContrasena: password }),
      });

      toast.success(
        "Contraseña restablecida con éxito. Ya puedes iniciar sesión."
      );
      navigate("/login");
    } catch (error) {
      console.error("Error al restablecer la contraseña:", error);
      toast.error(
        error.message ||
          "Error al restablecer la contraseña. El token pudo haber expirado."
      );
    } finally {
      setCargando(false);
    }
  };

  if (!tokenValido) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded bg-white p-8 text-center shadow">
          <h2 className="text-xl font-bold text-red-500">Error</h2>
          <p className="mt-2">
            El enlace de restablecimiento es inválido o ha expirado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded bg-white p-8 shadow">
        <h2 className="mb-6 text-center text-2xl font-semibold text-indigo-700">
          Nueva contraseña
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label
              htmlFor="restablecer-password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Nueva contraseña
            </label>
            <input
              id="restablecer-password"
              type={showPassword ? "text" : "password"}
              className="w-full rounded border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={password}
              name="restablecer-contrasena-page-input-73"
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 mt-6 flex items-center pr-3 text-sm leading-5"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div className="relative">
            <label
              htmlFor="restablecer-confirm-password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Confirmar contraseña
            </label>
            <input
              id="restablecer-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              className="w-full rounded border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={confirmPassword}
              name="restablecer-contrasena-page-input-90"
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 mt-6 flex items-center pr-3 text-sm leading-5"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <button
            type="submit"
            className="w-full rounded bg-indigo-600 py-2 text-white transition duration-300 hover:bg-indigo-700 disabled:bg-indigo-400"
            disabled={cargando}
          >
            {cargando ? "Restableciendo..." : "Restablecer contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RestablecerContrasenaPage;
