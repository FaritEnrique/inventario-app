// src/components/LayoutGerencia.jsx
import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Outlet } from "react-router-dom";
import AsideGerencia from "./AsideGerencia";

const LayoutGerencia = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  return (
    <div className="relative bg-slate-50 lg:flex lg:h-[calc(100vh-96px)] lg:min-h-0">
      <button
        type="button"
        onClick={() => setMenuAbierto(true)}
        className="fixed left-4 top-28 z-40 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-indigo-700 shadow-lg lg:hidden"
        aria-label="Abrir menú de gerencia"
      >
        <Menu className="h-5 w-5" />
      </button>

      {menuAbierto && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
          aria-label="Cerrar menú de gerencia"
          onClick={cerrarMenu}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-dvh w-72 transform bg-indigo-900 text-slate-100 shadow-2xl transition-transform duration-200 lg:static lg:z-auto lg:h-full lg:w-64 lg:translate-x-0 lg:shadow-xl ${
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-3 lg:hidden">
          <button
            type="button"
            onClick={cerrarMenu}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
            aria-label="Cerrar menú de gerencia"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <AsideGerencia onNavigate={cerrarMenu} />
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto p-4 pt-20 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default LayoutGerencia;