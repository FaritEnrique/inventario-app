import React from "react";
import { Outlet } from "react-router-dom";
import AsideGerencia from "./AsideGerencia";

const LayoutGerencia = () => {
  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <AsideGerencia />

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default LayoutGerencia;