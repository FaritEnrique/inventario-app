import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiFetch from "../api/apiFetch";

const initialFeedback = {
  type: "",
  message: "",
};

const buildErrorMessage = (error) =>
  error?.response?.data?.error ||
  error?.message ||
  "No se pudo procesar la solicitud de restablecimiento.";

const SolicitarRestablecimientoPage = () => {
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [feedback, setFeedback] = useState(initialFeedback);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCargando(true);
    setFeedback(initialFeedback);

    try {
      const response = await apiFetch("auth/solicitar-restablecimiento", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      const message =
        response?.message ||
        "Si el correo existe, se ha enviado un enlace para restablecer la contrasena.";

      setFeedback({
        type: "success",
        message,
      });
      toast.success(message);
    } catch (error) {
      const message = buildErrorMessage(error);

      console.error("Error al solicitar restablecimiento:", error);
      setFeedback({
        type: "error",
        message,
      });
      toast.error(message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded bg-white p-8 shadow">
        <h2 className="mb-6 text-center text-2xl font-semibold text-indigo-700">
          Restablecer Contrasena
        </h2>
        <p className="mb-4 text-center text-sm text-gray-600">
          Ingresa tu correo electronico para recibir un enlace de
          restablecimiento.
        </p>

        {feedback.message ? (
          <div
            className={`mb-4 rounded border px-4 py-3 text-sm ${
              feedback.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="solicitar-restablecimiento-email" className="mb-1 block text-sm font-medium text-gray-700">
              Correo electronico
            </label>
            <input
              id="solicitar-restablecimiento-email"
              type="email"
              className="w-full rounded border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="ejemplo@correo.com"
              value={email}
              name="solicitar-restablecimiento-page-input-84" onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-indigo-600 py-2 text-white transition duration-300 hover:bg-indigo-700 disabled:bg-indigo-400"
            disabled={cargando}
          >
            {cargando ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Volver al inicio de sesion
          </Link>
          {feedback.type === "success" ? (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="rounded border border-emerald-300 px-3 py-1.5 font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Ir a iniciar sesion
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SolicitarRestablecimientoPage;
