// src/components/Footer.jsx
import React from "react";

const CURRENT_YEAR = new Date().getFullYear();

const Footer = () => {
  return (
    <footer className="border-t border-cyan-950/70 bg-[#123848]">
      <div className="flex flex-col gap-4 px-4 py-5 mx-auto text-sm max-w-7xl text-cyan-50 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl border border-cyan-200/15 bg-white/10 shadow-sm">
              <svg
                viewBox="0 0 64 64"
                className="size-6 text-cyan-100"
                aria-hidden="true"
                fill="none"
              >
                <rect
                  x="8"
                  y="12"
                  width="24"
                  height="18"
                  rx="3"
                  className="fill-current opacity-90"
                />
                <rect
                  x="20"
                  y="34"
                  width="20"
                  height="14"
                  rx="3"
                  className="fill-cyan-200"
                />
                <path
                  d="M34 24h11l7 8v10H34z"
                  className="fill-current opacity-90"
                />
                <circle cx="40" cy="46" r="4" className="fill-[#123848]" />
                <circle cx="49" cy="46" r="4" className="fill-[#123848]" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                LogisticaAPP
              </p>
              <p className="text-xs truncate text-cyan-100/75">
                Aplicación operativa para requerimientos, compras, inventario y
                seguimiento logístico.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-xs text-cyan-100/75 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-200/15 bg-white/10 px-2.5 py-1 font-medium text-cyan-50">
              Uso interno
            </span>
            <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-2.5 py-1 font-medium text-cyan-100">
              Contexto operativo activo
            </span>
          </div>
          <p className="leading-relaxed sm:text-right">
            © {CURRENT_YEAR} LogisticaAPP. Entorno interno para
            gestión operativa y control del flujo logístico.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
