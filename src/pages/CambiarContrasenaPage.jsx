import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiFetch from "../api/apiFetch";

const initialForm = {
  contrasenaActual: "",
  nuevaContrasena: "",
  confirmarNuevaContrasena: "",
};

const initialFeedback = {
  type: "",
  message: "",
};

const CambiarContrasenaPage = () => {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(initialFeedback);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(initialFeedback);

    if (
      !form.contrasenaActual ||
      !form.nuevaContrasena ||
      !form.confirmarNuevaContrasena
    ) {
      const message = "Completa todos los campos para cambiar la contrasena.";
      setFeedback({ type: "error", message });
      toast.error(message);
      return;
    }

    if (form.nuevaContrasena.length < 6) {
      const message = "La nueva contrasena debe tener al menos 6 caracteres.";
      setFeedback({ type: "error", message });
      toast.error(message);
      return;
    }

    if (form.nuevaContrasena !== form.confirmarNuevaContrasena) {
      const message = "La confirmacion de la nueva contrasena no coincide.";
      setFeedback({ type: "error", message });
      toast.error(message);
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiFetch("auth/cambiar-contrasena", {
        method: "POST",
        body: JSON.stringify({
          contrasenaActual: form.contrasenaActual,
          nuevaContrasena: form.nuevaContrasena,
        }),
      });

      const message =
        response?.message || "Contrasena actualizada correctamente.";

      setFeedback({ type: "success", message });
      setForm(initialForm);
      toast.success(message);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "No se pudo actualizar la contrasena.";

      setFeedback({ type: "error", message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700">
              Cambiar contrasena
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Actualiza tu acceso validando primero tu contrasena actual.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Volver al dashboard
          </Link>
        </div>

        <div className="rounded-lg border border-indigo-100 bg-white p-6 shadow">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="cambiar-password-actual"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Contrasena actual
              </label>
              <input
                id="cambiar-password-actual"
                name="contrasenaActual"
                type="password"
                autoComplete="current-password"
                value={form.contrasenaActual}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            <div>
              <label
                htmlFor="cambiar-password-nueva"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Nueva contrasena
              </label>
              <input
                id="cambiar-password-nueva"
                name="nuevaContrasena"
                type="password"
                autoComplete="new-password"
                value={form.nuevaContrasena}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Debe ser distinta de tu contrasena actual y de tus ultimas 5
                contrasenas.
              </p>
            </div>

            <div>
              <label
                htmlFor="cambiar-password-confirmar"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Confirmar nueva contrasena
              </label>
              <input
                id="cambiar-password-confirmar"
                name="confirmarNuevaContrasena"
                type="password"
                autoComplete="new-password"
                value={form.confirmarNuevaContrasena}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            {feedback.message ? (
              <div
                className={`rounded border px-4 py-3 text-sm ${
                  feedback.type === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {feedback.message}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                {submitting ? "Actualizando..." : "Guardar nueva contrasena"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CambiarContrasenaPage;
