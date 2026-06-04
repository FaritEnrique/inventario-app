import React, { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/authContext";
import { hasRole } from "../../utils/userRoles";
import RequerimientosBandejaPage from "../RequerimientosBandejaPage";

const nivelesGerenciales = [
  {
    value: "gerencia-administracion",
    label: "Gerencia de Administración",
  },
  {
    value: "gerencia-general",
    label: "Gerencia General",
  },
];

const resolveNivelInicial = (user) => {
  if (hasRole(user, "GERENTE_GENERAL")) return "gerencia-general";
  return "gerencia-administracion";
};

const AprobacionesRequerimientosGerenciaPage = () => {
  const { user } = useAuth();
  const isAdmin = hasRole(user, "ADMINISTRADOR_SISTEMA");
  const [nivel, setNivel] = useState(resolveNivelInicial(user));

  const titulo = useMemo(
    () =>
      nivel === "gerencia-general"
        ? "Aprobación de Requerimientos - Gerencia General"
        : "Aprobación de Requerimientos - Gerencia de Administración",
    [nivel],
  );

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Módulo Gerencia
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {titulo}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              Bandeja gerencial de aprobación documental de requerimientos. Se
              conserva la lógica original de aprobación por niveles sin
              redirigir fuera del módulo gerencia.
            </p>
          </div>

          <div className="rounded-full bg-indigo-50 p-3 text-indigo-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>

        {isAdmin ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {nivelesGerenciales.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setNivel(item.value)}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-semibold transition",
                  nivel === item.value
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <RequerimientosBandejaPage nivel={nivel} />
    </section>
  );
};

export default AprobacionesRequerimientosGerenciaPage;