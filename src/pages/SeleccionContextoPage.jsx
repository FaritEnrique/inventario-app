import React from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { isLogisticaContext, isLogisticaJefaturaContext } from "../accessRules";
import { useAuth } from "../context/authContext";

const cardClasses =
  "rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md";

const SeleccionContextoPage = () => {
  const {
    identity,
    activeContext,
    availableContexts,
    loading,
    contextBusy,
    activateContext,
    changeContext,
    refreshAuthSession,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const targetPath =
    location.state?.from?.pathname &&
    location.state.from.pathname !== "/seleccionar-contexto"
      ? location.state.from.pathname
      : "/dashboard";
  const reason = location.state?.reason || null;
  const expectedContext = location.state?.expectedContext || null;
  const requiresLogistica =
    expectedContext === "logistica-jefatura" ||
    expectedContext === "logistica-operador";

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-4 text-sm text-slate-600">
        Cargando contextos operativos…
      </div>
    );
  }

  if (!identity) {
    return <Navigate to="/login" replace />;
  }

  const handleSelect = async (contextKey) => {
    try {
      const response = activeContext
        ? await changeContext(contextKey)
        : await activateContext(contextKey);

      toast.success(
        response?.activeContext?.displayName
          ? `Contexto activo: ${response.activeContext.displayName}`
          : "Contexto operativo activado.",
      );
      navigate(targetPath, { replace: true });
    } catch (error) {
      toast.error(
        error.message || "No se pudo activar el contexto seleccionado.",
      );
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshAuthSession();
      toast.success("Contextos operativos resincronizados.");
    } catch (error) {
      toast.error(error.message || "No se pudieron recargar los contextos.");
    }
  };

  const renderContextCard = (context) => {
    const isCurrent = activeContext?.contextKey === context.contextKey;
    const isLogistica = isLogisticaContext(context);
    const isLogisticaJefatura = isLogisticaJefaturaContext(context);

    return (
      <article key={context.contextKey} className={cardClasses}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-900">
                {context.displayName || context.rolOperativo || context.role}
              </h3>
              {isCurrent && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Activo
                </span>
              )}
              {isLogistica && (
                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  Logistica
                </span>
              )}
              {isLogisticaJefatura && (
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                  Jefatura
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600">
              {[
                context.areaNombre || context.area?.nombre,
                context.branchDescription,
                context.sourceLabel,
              ]
                .filter(Boolean)
                .join(" | ") || "Sin descripcion adicional."}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                Rol operativo: {context.rolOperativo || context.role}
              </span>
              {(context.areaNombre || context.area?.nombre) && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  Unidad: {context.areaNombre || context.area?.nombre}
                </span>
              )}
              {context.sourceType && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  Fuente: {context.sourceType}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelect(context.contextKey)}
              disabled={contextBusy || isCurrent}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isCurrent
                ? "Contexto activo"
                : activeContext
                  ? "Cambiar a este contexto"
                  : "Activar contexto"}
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
          Sesion operativa
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          {activeContext
            ? "Cambiar contexto operativo"
            : "Seleccionar contexto operativo"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-200">
          {activeContext
            ? "La plataforma ya reconoce tu sesion, pero para operar solo puede mantenerse un contexto activo por vez."
            : "Tu identidad fue autenticada correctamente. Antes de continuar, selecciona con que investidura operativa vas a trabajar en esta sesion."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-200">
          <span className="rounded-full bg-white/10 px-3 py-1.5">
            Usuario: {identity.nombre || identity.email || `#${identity.id}`}
          </span>
          {identity.cargo && (
            <span className="rounded-full bg-white/10 px-3 py-1.5">
              Cargo referencial: {identity.cargo}
            </span>
          )}
          {activeContext?.displayName && (
            <span className="rounded-full bg-emerald-500/20 px-3 py-1.5 text-emerald-100">
              Contexto activo actual: {activeContext.displayName}
            </span>
          )}
        </div>
      </section>

      {reason === "CONTEXT_INCOMPATIBLE" && requiresLogistica && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-900 shadow-sm">
          <p className="font-semibold">
            El contexto activo actual no corresponde a Logistica.
          </p>
          <p className="mt-1 text-amber-800">
            Para continuar en la bandeja logistica, selecciona un contexto de
            Logistica disponible abajo. Luego volveras automaticamente a{" "}
            {targetPath}.
          </p>
        </section>
      )}

      {availableContexts.length === 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900">
            No hay contextos operativos disponibles
          </h2>
          <p className="mt-2 text-sm text-amber-800">
            La sesión está autenticada, pero no se encontró ninguna asignación
            operativa vigente para continuar.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
            >
              Cerrar sesion
            </button>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Contextos disponibles
              </h2>
              <p className="text-sm text-slate-600">
                Selecciona una unica investidura operativa para esta sesion.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={contextBusy}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Recargar contextos
              </button>
              {activeContext && (
                <button
                  type="button"
                  onClick={() => navigate(targetPath, { replace: true })}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Volver al sistema
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            {availableContexts.map(renderContextCard)}
          </div>
        </section>
      )}
    </div>
  );
};

export default SeleccionContextoPage;
