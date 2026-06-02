// src/components/HeaderProcesoLogistico.jsx
import React, { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { getAlertasSeguimientoCount } from "../utils/logisticaAlertasUi";

const linkClasses = ({ isActive }) =>
  `px-3 py-1.5 text-sm font-semibold transition-transform duration-200 rounded-lg hover:scale-105 sm:px-4 sm:py-2 sm:text-base ${
    isActive
      ? "bg-indigo-500 text-white"
      : "bg-white text-indigo-500 border border-indigo-500 hover:bg-indigo-50"
  }`;

const HeaderProcesoLogistico = ({ id, detalleGlobal }) => {
  const basePath = `/cotizaciones/proceso/${id}`;
  const alertasCount = getAlertasSeguimientoCount(detalleGlobal);
  const navItems = [
    { label: "Resumen", to: basePath, end: true },
    { label: "Solicitudes", to: `${basePath}/solicitudes` },
    { label: "Cotizaciones", to: `${basePath}/cotizaciones` },
    { label: "Comparativo", to: `${basePath}/comparativos` },
    { label: "Órdenes de Compra", to: `${basePath}/orden-compra` },
    { label: "Alertas", to: `${basePath}/alertas`, badge: alertasCount },
  ];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef();

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const renderNavLabel = (item) => (
    <span className="inline-flex items-center gap-2">
      {item.label}
      {item.badge > 0 ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
          {item.badge}
        </span>
      ) : null}
    </span>
  );

  return (
    <header className="p-3 border border-indigo-500 rounded-lg bg-slate-200 sm:p-4">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="items-center justify-between w-fit">
          <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
            Expediente Logístico
          </h1>
          <div className="flex flex-col items-start mt-1 space-x-4 sm:mt-2 sm:flex-row ">
            <h2 className="font-semibold text-gray-700">Requerimiento N°</h2>
            <p className="text-sm font-medium text-left text-gray-900 sm:text-base">
              {detalleGlobal?.codigo || `#${id}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div ref={mobileMenuRef} className="relative lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="inline-flex items-center justify-center p-1 text-indigo-600 border border-indigo-500 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:p-1.5"
              aria-label="Abrir menú"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu size={22} />
            </button>
            {isMobileMenuOpen ? (
              <nav className="absolute right-0 z-20 flex flex-col w-52 gap-1.5 p-2 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg sm:w-56 sm:gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={linkClasses}
                  >
                    {renderNavLabel(item)}
                  </NavLink>
                ))}
              </nav>
            ) : null}
          </div>
          <nav className="hidden mt-4 space-x-4 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={linkClasses}
              >
                {renderNavLabel(item)}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default HeaderProcesoLogistico;
