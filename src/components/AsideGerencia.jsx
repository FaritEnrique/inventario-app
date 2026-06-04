// src/components/AsideGerencia.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  ClipboardCheck,
  FileSearch,
  ShoppingCart,
  FileText,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";

function AsideGerencia() {
  const baseUrl = "/modulo-gerencia";
  const asideRef = useRef(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const menuItems = [
    {
      name: "Dashboard",
      to: baseUrl,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Requerimientos",
      icon: FileText,
      subItems: [
        {
          name: "Consulta de Requerimientos",
          to: `${baseUrl}/requerimientos`,
        },
        {
          name: "Aprobación de Requerimientos",
          to: `${baseUrl}/requerimientos/aprobaciones`,
        },
      ],
    },
    {
      name: "Expedientes Logísticos",
      icon: FileSearch,
      subItems: [
        {
          name: "Consulta de Expedientes",
          to: `${baseUrl}/expedientes`,
        },
        {
          name: "Alertas Logísticas",
          to: "/cotizaciones/alertas",
        },
      ],
    },
    {
      name: "Órdenes de Compra",
      icon: ShoppingCart,
      subItems: [
        {
          name: "Consulta de O/C",
          to: `${baseUrl}/ordenes-compra`,
        },
        {
          name: "Aprobación de O/C",
          to: `${baseUrl}/ordenes-compra/aprobaciones`,
        },
      ],
    },
    {
      name: "Notas de Pedido",
      icon: ClipboardCheck,
      subItems: [
        {
          name: "Aprobación de Notas de Pedido",
          to: `${baseUrl}/notas-pedido/aprobaciones`,
        },
      ],
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
    setActiveDropdown((current) => (current === menuName ? null : menuName));
  };

  return (
    <div
      ref={asideRef}
      className="sticky top-0 flex h-screen w-64 select-none flex-col bg-indigo-900 text-slate-100 shadow-xl"
    >
      <div className="flex items-center gap-3 border-b border-indigo-600/50 bg-indigo-500 p-4">
        <div className="flex items-center justify-center rounded-lg bg-indigo-600 p-1.5 text-white shadow-inner">
          <BriefcaseBusiness className="h-5 w-5" />
        </div>
        <h1 className="fuente-poppins text-xl font-extrabold tracking-wide text-white">
          Módulo Gerencia
        </h1>
      </div>

      <nav className="relative flex flex-1 flex-col gap-1.5 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
          const isOpen = activeDropdown === item.name;

          if (hasSubItems) {
            return (
              <div key={item.name} className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown(item.name)}
                  className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isOpen
                      ? "bg-indigo-800 text-white shadow-md"
                      : "text-indigo-200 hover:bg-indigo-900/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 opacity-80" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 opacity-60 transition-transform duration-200 ${
                      isOpen ? "rotate-90 text-white" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div
                    className="absolute left-full top-0 z-50 ml-3 flex w-72 overflow-hidden rounded-2xl border border-slate-200/80 bg-cover bg-center bg-no-repeat shadow-2xl duration-150 animate-in fade-in slide-in-from-left-2 lg:w-96"
                    style={{
                      backgroundImage: "url('/images/sub_menu.webp')",
                      aspectRatio: "3 / 2",
                    }}
                  >
                    <div className="absolute inset-0 z-0 bg-white/75 backdrop-blur-[2px]" />

                    <div className="relative z-10 flex min-w-[38px] items-center justify-center bg-indigo-600 py-4 shadow-md select-none">
                      <span className="rotate-180 whitespace-nowrap text-center text-[11px] font-extrabold uppercase tracking-widest text-white [writing-mode:vertical-lr]">
                        Gestión {item.name}
                      </span>
                    </div>

                    <div className="relative z-10 flex flex-1 flex-col justify-center gap-2 p-4">
                      {item.subItems.map((subItem) => (
                        <NavLink
                          key={subItem.to}
                          to={subItem.to}
                          onClick={() => setActiveDropdown(null)}
                          className={({ isActive }) =>
                            [
                              "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                              isActive
                                ? "bg-indigo-600 text-white shadow"
                                : "bg-white/80 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700",
                            ].join(" ")
                          }
                        >
                          {subItem.name}
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
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-indigo-800 text-white shadow-md"
                    : "text-indigo-200 hover:bg-indigo-900/60 hover:text-white",
                ].join(" ")
              }
            >
              <Icon className="h-5 w-5 opacity-80" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default AsideGerencia;