// src/pages/CrearPrimerUsuarioPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiFetch from "../api/apiFetch";
import { toast } from "react-toastify";
import {
  EyeIcon,
  EyeSlashIcon,
  UserCircleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import ImagenInventario from "/images/ImagenInventario.png";
import { useAuth } from "../context/authContext";

// Sub-componente para campos de entrada genéricos
const InputGroup = ({
  id,
  name,
  type,
  value,
  onChange,
  placeholder,
  icon,
  autoComplete,
  required = true,
}) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
      {icon}
    </div>
    <input
      id={id}
      name={name}
      type={type}
      required={required}
      className="w-full py-2.5 pl-10 pr-4 transition-all border border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
    />
  </div>
);

// Sub-componente para campos de contraseña
const PasswordInput = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  show,
  toggleShow,
  autoComplete,
}) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
      <LockClosedIcon className="w-5 h-5 text-gray-400" />
    </div>
    <input
      id={id}
      name={name}
      type={show ? "text" : "password"}
      required
      className="w-full py-2.5 pl-10 pr-10 transition-all border border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
    />
    <button
      type="button"
      onClick={toggleShow}
      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-blue-500"
    >
      {show ? (
        <EyeSlashIcon className="w-6 h-6" />
      ) : (
        <EyeIcon className="w-6 h-6" />
      )}
    </button>
  </div>
);

const CrearPrimerUsuarioPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    cargo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { completeInitialSetup } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Separar nombre completo en nombre y apellido
      const [nombre, ...rest] = formData.name.trim().split(" ");
      const apellido = rest.join(" ");

      await apiFetch("usuarios/primer-usuario", {
        method: "POST",
        body: JSON.stringify({
          nombre,
          apellido,
          email: formData.email,
          password: formData.password,
          cargo: formData.cargo,
        }),
      });
      toast.success(
        "¡Usuario administrador creado con éxito! Ahora puedes iniciar sesión."
      );
      completeInitialSetup();
      navigate("/login");
    } catch (err) {
      const errorMessage =
        err.message || "Ocurrió un error al crear el usuario.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-2 bg-gray-200 md:p-4">
      <div className="flex flex-col w-full max-w-4xl mx-auto overflow-hidden bg-white shadow-2xl rounded-2xl md:flex-row">
        {/* Columna Izquierda: Bienvenida */}
        <div className="flex flex-col items-center justify-center w-full p-6 text-center text-white bg-blue-600 md:w-1/2 sm:p-8 md:items-start md:text-left">
          <h1 className="mb-3 text-3xl font-bold text-center md:text-4xl">
            Bienvenido al Sistema de Logística
          </h1>
          <p className="mb-4 text-base text-blue-100 md:text-lg">
            Para comenzar, configuremos la cuenta del administrador principal.
          </p>
          <div className="w-full p-2 md:p-4">
            <img
              src={ImagenInventario}
              alt="Ilustración de Inventario"
              className="object-cover w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>

        {/* Columna Derecha: Formulario */}
        <div className="w-full p-6 md:w-1/2 sm:p-8">
          <div className="flex flex-col items-center mb-4">
            <h2 className="text-2xl font-bold text-center text-blue-700 md:text-3xl">
              Crear Cuenta de Administrador del Sistema
            </h2>
            <p className="mt-2 text-sm text-gray-600 md:text-base">
              Esta cuenta tendrá todos los permisos.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <InputGroup
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nombre Completo"
              icon={<UserCircleIcon className="w-5 h-5 text-gray-400" />}
              autoComplete="name"
            />
            <InputGroup
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Correo Electrónico"
              icon={<EnvelopeIcon className="w-5 h-5 text-gray-400" />}
              autoComplete="email"
            />
            <InputGroup
              id="cargo"
              name="cargo"
              type="text"
              value={formData.cargo}
              onChange={handleChange}
              placeholder="Cargo (Ej: Administrador de TI)"
              icon={<BriefcaseIcon className="w-5 h-5 text-gray-400" />}
              autoComplete="organization-title"
            />
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Contraseña"
              show={showPassword}
              toggleShow={() => setShowPassword(!showPassword)}
              autoComplete="new-password"
            />
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirmar Contraseña"
              show={showConfirmPassword}
              toggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
              autoComplete="new-password"
            />

            {error && (
              <p className="p-2 text-sm text-center text-red-600 bg-red-100 rounded-lg">
                {error}
              </p>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 mt-3 font-semibold text-white transition-all duration-300 transform bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 hover:scale-105"
              >
                {loading ? "Creando Usuario..." : "Crear Usuario"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CrearPrimerUsuarioPage;
