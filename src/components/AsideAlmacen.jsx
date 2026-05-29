import React from "react";
import {
  LayoutDashboard,
  Box,
  PackageOpen,
  Boxes,
  Activity,
  FileCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";

function AsideAlmacen() {
  const baseUrl = "/modulo-almacen";
  const menuItems = [
    {
      name: "Dashboard",
      to: `${baseUrl}`,
      icon: LayoutDashboard,
    },
    { name: "Productos", to: `${baseUrl}/productos`, icon: PackageOpen },
    {
      name: "Tipo de Productos",
      to: `${baseUrl}/tipo-productos`,
      icon: Boxes,
    },
    { name: "Movimientos", to: `${baseUrl}/movimientos`, icon: Activity },
    {
      name: "Recepción O/C",
      to: `${baseUrl}/recepcion-oc`,
      icon: FileCheck,
    },
  ];

  return (
    <div className="sticky top-0 h-screen flex flex-col w-64 bg-indigo-900 text-slate-100 shadow-xl">
      <div className="flex bg-indigo-500 items-center p-4 gap-3 border-b border-indigo-600/50">
        <div className="text-white bg-indigo-600 p-1.5 rounded-lg flex items-center justify-center shadow-inner">
          <Box className="w-5 h-5" />
        </div>
        <h1 className="fuente-poppins text-white font-extrabold text-xl tracking-wide">
          Módulo Almacén
        </h1>
      </div>
      <nav className="p-4 flex flex-col gap-1.5 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/modulo-almacen" || item.to === baseUrl}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-md"
                    : "text-indigo-200 hover:bg-indigo-900/60 hover:text-white" // Estilo normal / reposo
                }
              `}
            >
              <Icon className="w-5 h-5 opacity-80" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default AsideAlmacen;
