// src/components/LayoutAlmacen.jsx
import React, { useCallback, useState } from "react";
import { Menu, X } from "lucide-react";
import { Outlet } from "react-router-dom";
import AsideAlmacen from "./AsideAlmacen";

const LayoutAlmacen = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const abrirMenu = () => {
    setMenuAbierto(true);
  };

  const cerrarMenu = useCallback(() => {
    setMenuAbierto(false);
  }, []);

  return (
    <div className="relative bg-slate-50 lg:-mx-4 lg:flex lg:h-[calc(100dvh-var(--app-header-height,104px))] lg:overflow-visible">
      <button
        type="button"
        onClick={abrirMenu}
        className="fixed left-4 top-[calc(var(--app-header-height,104px)+1rem)] z-[70] inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-indigo-700 shadow-lg lg:hidden"
        aria-label="Abrir menú de almacén"
      >
        <Menu className="h-5 w-5" />
      </button>

      {menuAbierto && (
        <button
          type="button"
          className="fixed inset-0 z-[80] bg-slate-950/45 lg:hidden"
          aria-label="Cerrar menú de almacén"
          onClick={cerrarMenu}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-[90] h-dvh w-72 transform bg-indigo-900 text-slate-100 shadow-2xl transition-transform duration-200 lg:relative lg:top-auto lg:h-full lg:w-64 lg:shrink-0 lg:translate-x-0 lg:shadow-xl ${
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-3 lg:hidden">
          <button
            type="button"
            onClick={cerrarMenu}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
            aria-label="Cerrar menú de almacén"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <AsideAlmacen onNavigate={cerrarMenu} />
      </aside>

      <main className="relative z-0 min-w-0 flex-1 p-4 pt-20 sm:p-6 sm:pt-20 lg:h-full lg:overflow-y-auto lg:p-8 lg:pt-8">
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default LayoutAlmacen;
