import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiFetch from "../api/apiFetch";
import { useAuth } from "../context/authContext";

const CrearPrimerUsuarioPage = () => {
  const navigate = useNavigate();
  const { completeInitialSetup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    cargo: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await apiFetch("usuarios/primer-usuario", {
        method: "POST",
        body: JSON.stringify(form),
      });

      completeInitialSetup();
      toast.success("Usuario administrador creado con éxito. Inicia sesión.");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error al crear el primer usuario:", error);
      toast.error(error.message || "No se pudo crear el primer usuario.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h1 className="mb-2 text-center text-2xl font-extrabold text-blue-600">
          Crear administrador inicial
        </h1>
        <p className="mb-5 text-center text-sm text-gray-500">
          Este formulario solo se usa una vez para inicializar el sistema.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-gray-700"
            >
              Nombre completo
            </label>
            <input
              id="nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              autoComplete="off"
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              autoComplete="off"
              required
            />
          </div>

          <div>
            <label
              htmlFor="cargo"
              className="block text-sm font-medium text-gray-700"
            >
              Cargo
            </label>
            <input
              id="cargo"
              name="cargo"
              value={form.cargo}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              autoComplete="off"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Contraseña
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 p-2 pr-10 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-sm text-gray-500"
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {submitting ? "Creando..." : "Crear usuario administrador"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CrearPrimerUsuarioPage;
