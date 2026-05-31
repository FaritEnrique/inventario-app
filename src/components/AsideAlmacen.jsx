// src/components/AsideAlmacen.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard,
  Box,
  PackageOpen,
  Boxes,
  Activity,
  FileCheck,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";

function AsideAlmacen() {
  const baseUrl = "/modulo-almacen";
  const asideRef = useRef(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const menuItems = [
    {
      name: "Dashboard",
      to: `${baseUrl}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Productos",
      icon: PackageOpen,
      subItems: [
        { name: "Administración de Productos", to: `${baseUrl}/productos` },
        { name: "Tipos de Productos", to: `${baseUrl}/tipo-productos` },
        { name: "Gestión de Marcas", to: `${baseUrl}/gestion-marcas` },
      ],
    },
    {
      name: "Movimientos",
      icon: Activity,
      subItems: [
        { name: "Kardex General", to: "/inventario-kardex" },
        { name: "Ver Movimientos", to: `${baseUrl}/movimientos` },
        { name: "Notas de Ingreso", to: "/inventario-notas-ingreso" },
        { name: "Notas de Salida", to: "/inventario-notas-salida" },
      ],
    },
    {
      name: "Recepción O/C",
      to: `${baseUrl}/recepcion-oc`,
      icon: FileCheck,
    },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (asideRef.current && !asideRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (menuName) => {
    setActiveDropdown(activeDropdown === menuName ? null : menuName);
  };

  return (
    <div
      ref={asideRef}
      className="sticky top-0 h-screen flex flex-col w-64 bg-indigo-900 text-slate-100 shadow-xl select-none"
    >
      <div className="flex bg-indigo-500 items-center p-4 gap-3 border-b border-indigo-600/50">
        <div className="text-white bg-indigo-600 p-1.5 rounded-lg flex items-center justify-center shadow-inner">
          <Box className="w-5 h-5" />
        </div>
        <h1 className="fuente-poppins text-white font-extrabold text-xl tracking-wide">
          Módulo Almacén
        </h1>
      </div>
      <nav className="p-4 flex flex-col gap-1.5 flex-1 relative">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isOpen = activeDropdown === item.name;
          if (hasSubItems) {
            return (
              <div key={item.name} className="relative">
                <button
                  onClick={() => toggleDropdown(item.name)}
                  className={`
                    flex items-center justify-between w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                    text-indigo-200 hover:bg-indigo-900/60 hover:text-white
                    ${isOpen ? "bg-indigo-800 text-white shadow-md" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 opacity-80" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-90 text-white" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div
                    className="absolute left-full top-0 ml-3 w-72 lg:w-96 border border-slate-200/80 rounded-2xl shadow-2xl flex overflow-hidden bg-cover bg-center bg-no-repeat animate-in fade-in slide-in-from-left-2 duration-150 z-50"
                    style={{
                      backgroundImage: `url('/images/sub_menu.webp')`,
                      aspectRatio: "3 / 2",
                    }}
                  >
                    <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] z-0" />
                    <div className="relative z-10 bg-indigo-600 flex items-center justify-center min-w-[38px] py-4 shadow-md select-none">
                      <span className="text-[11px] font-extrabold text-white uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 whitespace-nowrap text-center">
                        Gestión {item.name}
                      </span>
                    </div>
                    <div className="relative z-10 flex-1 p-4 flex flex-col gap-2 justify-center pl-5">
                      {item.subItems.map((sub) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          onClick={() => setActiveDropdown(null)}
                          className={({ isActive }) => `
                            block px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150
                            ${
                              isActive
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 translate-x-1"
                                : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                            }
                          `}
                        >
                          {sub.name}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => setActiveDropdown(null)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-md"
                    : "text-indigo-200 hover:bg-indigo-900/60 hover:text-white"
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
