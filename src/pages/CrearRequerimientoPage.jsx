import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import RequerimientoForm from "../components/RequerimientoForm";
import { useAuth } from "../context/authContext";
import useRequerimientos from "../hooks/useRequerimientos";

const FeedbackModal = ({ isOpen, feedback, onClose }) => {
  if (!feedback) return null;

  const isSuccess = feedback.type === "success";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      overlayClassName="items-start bg-black/40"
      panelClassName="mt-24 rounded-xl shadow-xl"
      bodyClassName="p-6"
      showCloseButton={false}
    >
      <div className="space-y-4">
        <div>
          <h2
            className={`text-xl font-semibold ${
              isSuccess ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {feedback.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{feedback.message}</p>
        </div>

        {Array.isArray(feedback.details) && feedback.details.length > 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <ul className="list-disc space-y-1 pl-5">
              {feedback.details.map((detail, index) => (
                <li key={`${detail}-${index}`}>{detail}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`rounded px-4 py-2 text-sm font-medium text-white ${
              isSuccess
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {isSuccess ? "Abrir requerimiento" : "Entendido"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const CrearRequerimientoPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { prioridades, crearRequerimiento, buscarCatalogoProductos } = useRequerimientos();
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const creado = await crearRequerimiento(payload);
      setFeedback({
        open: true,
        type: "success",
        title: "Requerimiento registrado",
        message: `El requerimiento ${creado.codigo || ""} se registro correctamente.`,
        createdId: creado.id,
      });
    } catch (error) {
      setFeedback({
        open: true,
        type: "error",
        title: "No se pudo registrar el requerimiento",
        message:
          error.message || "Se produjo un error al intentar guardar el requerimiento.",
        details:
          error?.validationErrors ||
          error?.response?.data?.errores ||
          error?.errores ||
          [],
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseFeedback = () => {
    if (feedback?.type === "success" && feedback?.createdId) {
      navigate(`/requerimientos/${feedback.createdId}`);
      return;
    }

    setFeedback(null);
  };

  const initialData = useMemo(
    () => ({
      areaId: user?.areaId,
      prioridad: prioridades[0] || "Normal",
    }),
    [prioridades, user]
  );

  const contextualAreaLabel = useMemo(() => {
    const areaNombre = user?.areaNombre || user?.area?.nombre || "";
    const branchDescription =
      user?.activeContext?.branchDescription || user?.area?.branchDescription || "";

    return branchDescription
      ? `${areaNombre} - ${branchDescription}`
      : areaNombre;
  }, [user]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo requerimiento</h1>
          <p className="mt-1 text-sm text-gray-600">Registra una solicitud formal de adquisicion con productos de catalogo o temporales.</p>
        </div>
        <Link to="/requerimientos" className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Volver al listado</Link>
      </div>

      <RequerimientoForm
        initialData={initialData}
        prioridades={prioridades.length ? prioridades : ["Normal", "Urgente", "Emergencia"]}
        lockAreaToContext
        contextualAreaLabel={contextualAreaLabel}
        buscarCatalogoProductos={buscarCatalogoProductos}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <FeedbackModal
        isOpen={Boolean(feedback?.open)}
        feedback={feedback}
        onClose={handleCloseFeedback}
      />
    </div>
  );
};

export default CrearRequerimientoPage;

