import React from "react";
import { Link } from "react-router-dom";
import {
  FaClipboardCheck,
  FaFileAlt,
  FaShoppingCart,
  FaTasks,
} from "react-icons/fa";

const cards = [
  {
    title: "Consulta de Requerimientos",
    description:
      "Revisa requerimientos por código, periodo, área, prioridad y estado.",
    to: "/modulo-gerencia/requerimientos",
    icon: FaFileAlt,
  },
  {
    title: "Aprobación de Requerimientos",
    description:
      "Accede a la bandeja de aprobación que corresponde a tu nivel gerencial.",
    to: "/modulo-gerencia/requerimientos/aprobaciones",
    icon: FaClipboardCheck,
  },
  {
    title: "Expedientes Logísticos",
    description:
      "Consulta solicitudes, cotizaciones, comparativos, Buena Pro y Órdenes de Compra.",
    to: "/modulo-gerencia/expedientes",
    icon: FaTasks,
  },
  {
    title: "Aprobación de Órdenes de Compra",
    description:
      "Revisa Órdenes de Compra pendientes según la ruta de aprobación snapshot.",
    to: "/modulo-gerencia/ordenes-compra/aprobaciones",
    icon: FaShoppingCart,
  },
];

const DashboardGerenciaPage = () => (
  <section className="space-y-6">
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Panel gerencial
      </p>
      <h1 className="mt-1 text-3xl font-bold text-slate-900">
        Consulta y aprobaciones
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
        Accede a la información documental del proceso: requerimientos,
        expedientes logísticos, comparativos, Buena Pro y Órdenes de Compra. Las
        acciones operativas quedan restringidas a los responsables de cada
        módulo.
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Link
            key={card.to}
            to={card.to}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white">
              <Icon className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              {card.title}
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {card.description}
            </p>
          </Link>
        );
      })}
    </div>
  </section>
);

export default DashboardGerenciaPage;