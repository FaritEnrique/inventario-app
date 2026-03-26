import React, { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import RequerimientoForm from "../components/RequerimientoForm";
import { useAuth } from "../context/authContext";
import useAreas from "../hooks/useAreas";
import useRequerimientos from "../hooks/useRequerimientos";
import {
  canEditRequerimientoEffective,
  canSelectAreaRequerimientoEffective,
} from "../accessRules";

const EditarRequerimientoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { areas } = useAreas();
  const { prioridades, getRequerimientoById, actualizarRequerimiento, buscarCatalogoProductos } = useRequerimientos();
  const [loading, setLoading] = useState(true);
  const [requerimiento, setRequerimiento] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRequerimientoById(id);
        setRequerimiento(data);
      } catch (error) {
        toast.error(error.message || "No se pudo cargar el requerimiento.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [getRequerimientoById, id]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const actualizado = await actualizarRequerimiento(id, payload);
      toast.success("Requerimiento actualizado correctamente.");
      navigate(`/requerimientos/${actualizado.id}`);
    } catch (error) {
      const details = Array.isArray(error?.errores) ? error.errores.join(". ") : null;
      toast.error(details || error.message || "No se pudo actualizar el requerimiento.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (!requerimiento) return <div className="p-6 text-sm text-red-600">No se pudo cargar el requerimiento.</div>;

  if (!canEditRequerimientoEffective(user, requerimiento)) {
    return <Navigate to={`/requerimientos/${id}`} replace />;
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar requerimiento</h1>
          <p className="mt-1 text-sm text-gray-600">Actualiza cabecera e items mientras el documento siga en flujo.</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/requerimientos/${id}`} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Ver detalle</Link>
          <Link to="/requerimientos" className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Listado</Link>
        </div>
      </div>

      <RequerimientoForm
        initialData={requerimiento}
        areas={areas}
        prioridades={prioridades.length ? prioridades : ["Normal", "Urgente", "Emergencia"]}
        allowAreaSelection={canSelectAreaRequerimientoEffective(user)}
        buscarCatalogoProductos={buscarCatalogoProductos}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
};

export default EditarRequerimientoPage;

