// src/components/AsideGerencia.jsx
import React, { memo, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  ClipboardCheck,
  FileSearch,
  ShoppingCart,
  FileText,
  ChevronRight,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const baseUrl = "/modulo-gerencia";

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
        exact: true,
      },
      {
        name: "Aprobación de Requerimientos",
        to: `${baseUrl}/requerimientos/aprobaciones`,
        exact: true,
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
        exact: true,
      },
      {
        name: "Alertas Logísticas",
        to: `${baseUrl}/expedientes/alertas`,
        exact: true,
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
        exact: true,
      },
      {
        name: "Aprobación de O/C",
        to: `${baseUrl}/ordenes-compra/aprobaciones`,
        exact: true,
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
        exact: true,
      },
    ],
  },
];

const isPathActive = (pathname, to, exact = true) => {
  if (exact) {
    return pathname === to;
  }

  return pathname === to || pathname.startsWith(`${to}/`);
};

const buildSubmenuId = (name) =>
  `submenu-gerencia-${name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")}`;

const AsideGerencia = ({ onNavigate }) => {
  const location = useLocation();
  const asideRef = useRef(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (asideRef.current && !asideRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setActiveDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setActiveDropdown(null);
  }, [location.pathname]);

  const toggleDropdown = (menuName) => {
    setActiveDropdown((current) => (current === menuName ? null : menuName));
  };

  const handleNavigate = () => {
    setActiveDropdown(null);
    onNavigate?.();
  };

  const isGroupActive = (item) =>
    item.subItems?.some((subItem) =>
      isPathActive(location.pathname, subItem.to, subItem.exact !== false),
    );

  return (
    <div
      ref={asideRef}
      className="flex h-full w-full flex-col overflow-visible bg-indigo-900 text-slate-100 select-none"
    >
      <div className="flex items-center gap-3 border-b border-indigo-600/50 bg-indigo-500 p-4">
        <div className="flex items-center justify-center rounded-lg bg-indigo-600 p-1.5 text-white shadow-inner">
          <BriefcaseBusiness className="h-5 w-5" />
        </div>
        <h1 className="fuente-poppins text-xl font-extrabold tracking-wide text-white">
          Módulo Gerencia
        </h1>
      </div>

      <nav className="relative z-[100] flex flex-1 flex-col gap-1.5 overflow-y-auto overflow-x-hidden p-4 xl:overflow-visible">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasSubItems =
            Array.isArray(item.subItems) && item.subItems.length > 0;
          const isOpen = activeDropdown === item.name;
          const groupActive = hasSubItems ? isGroupActive(item) : false;

          if (hasSubItems) {
            const submenuId = buildSubmenuId(item.name);

            return (
              <div key={item.name} className="relative overflow-visible">
                <button
                  type="button"
                  onClick={() => toggleDropdown(item.name)}
                  aria-expanded={isOpen}
                  aria-controls={submenuId}
                  aria-haspopup="true"
                  className={`
                    flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200
                    ${
                      isOpen || groupActive
                        ? "bg-indigo-800 text-white shadow-md"
                        : "text-indigo-200 hover:bg-indigo-900/60 hover:text-white"
                    }
                  `}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 opacity-80" />
                    <span className="truncate">{item.name}</span>
                  </div>

                  <ChevronRight
                    className={`h-4 w-4 shrink-0 opacity-60 transition-transform duration-200 ${
                      isOpen ? "rotate-90 text-white" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <>
                    <div
                      id={submenuId}
                      className="mt-2 rounded-xl bg-indigo-950/35 p-2 xl:hidden"
                    >
                      {item.subItems.map((subItem) => (
                        <NavLink
                          key={subItem.to}
                          to={subItem.to}
                          end={subItem.exact !== false}
                          onClick={handleNavigate}
                          className={({ isActive }) => `
                            block rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-150
                            ${
                              isActive
                                ? "bg-indigo-500 text-white shadow-md"
                                : "text-indigo-100 hover:bg-indigo-800 hover:text-white"
                            }
                          `}
                        >
                          {subItem.name}
                        </NavLink>
                      ))}
                    </div>

                    <div
                      id={`${submenuId}-desktop`}
                      className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-cover bg-center bg-no-repeat shadow-2xl duration-150 animate-in fade-in slide-in-from-left-2 xl:absolute xl:left-full xl:top-0 xl:z-[120] xl:ml-3 xl:flex xl:w-80 2xl:w-96"
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

                      <div className="relative z-10 flex flex-1 flex-col justify-center gap-2 p-4 pl-5">
                        {item.subItems.map((subItem) => (
                          <NavLink
                            key={subItem.to}
                            to={subItem.to}
                            end={subItem.exact !== false}
                            onClick={handleNavigate}
                            className={({ isActive }) => `
                              block rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-150
                              ${
                                isActive
                                  ? "translate-x-1 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                  : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                              }
                            `}
                          >
                            {subItem.name}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={handleNavigate}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-indigo-500 text-white shadow-md"
                    : "text-indigo-200 hover:bg-indigo-900/60 hover:text-white",
                ].join(" ")
              }
            >
              <Icon className="h-5 w-5 shrink-0 opacity-80" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default memo(AsideGerencia);
