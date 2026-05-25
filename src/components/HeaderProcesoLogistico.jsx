// src/components/HeaderProcesoLogistico.jsx
import React, { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";

const HeaderProcesoLogistico = ({ id, detalleGlobal }) => {
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

  return (
    <header className="p-4 border border-indigo-500 rounded-lg bg-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div className="items-center justify-between w-fit">
          <h1 className="text-2xl font-bold text-gray-800">
            Expediente Logístico
          </h1>
          <div className="flex flex-col items-start mt-2 space-x-4 sm:flex-row ">
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
              className="inline-flex items-center justify-center text-indigo-600 border border-indigo-500 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Abrir menú"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu />
            </button>
            {isMobileMenuOpen ? (
              <nav className="absolute right-0 z-20 flex flex-col w-56 gap-2 p-2 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                <NavLink
                  to={`/cotizaciones/proceso/${id}`}
                  end
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Detalle
                </NavLink>
                <NavLink
                  to={`/cotizaciones/proceso/${id}/solicitudes`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Solicitudes
                </NavLink>
                <NavLink
                  to={`/cotizaciones/proceso/${id}/cotizaciones`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Cotizaciones
                </NavLink>
                <NavLink
                  to={`/cotizaciones/proceso/${id}/comparativos`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Comparativos
                </NavLink>
                <NavLink
                  to={`/cotizaciones/proceso/${id}/orden-compra`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Orden de Compra
                </NavLink>
              </nav>
            ) : null}
          </div>
          <nav className="hidden mt-4 space-x-4 lg:flex">
            <NavLink
              to={`/cotizaciones/proceso/${id}`}
              end
              className={({ isActive }) =>
                `px-4 py-2 font-semibold transition-transform duration-200 rounded-lg hover:scale-105 ${
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-indigo-500 border border-indigo-500 hover:bg-indigo-50"
                }`
              }
            >
              Detalle
            </NavLink>
            <NavLink
              to={`/cotizaciones/proceso/${id}/solicitudes`}
              className={({ isActive }) =>
                `px-4 py-2 font-semibold transition-transform duration-200 rounded-lg hover:scale-105 ${
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-indigo-500 border border-indigo-500 hover:bg-indigo-50"
                }`
              }
            >
              Solicitudes
            </NavLink>
            <NavLink
              to={`/cotizaciones/proceso/${id}/cotizaciones`}
              className={({ isActive }) =>
                `px-4 py-2 font-semibold transition-transform duration-200 rounded-lg hover:scale-105 ${
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-indigo-500 border border-indigo-500 hover:bg-indigo-50"
                }`
              }
            >
              Cotizaciones
            </NavLink>
            <NavLink
              to={`/cotizaciones/proceso/${id}/comparativos`}
              className={({ isActive }) =>
                `px-4 py-2 font-semibold transition-transform duration-200 rounded-lg hover:scale-105 ${
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-indigo-500 border border-indigo-500 hover:bg-indigo-50"
                }`
              }
            >
              Comparativos
            </NavLink>
            <NavLink
              to={`/cotizaciones/proceso/${id}/orden-compra`}
              className={({ isActive }) =>
                `px-4 py-2 font-semibold transition-transform duration-200 rounded-lg hover:scale-105 ${
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-indigo-500 border border-indigo-500 hover:bg-indigo-50"
                }`
              }
            >
              Orden de Compra
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default HeaderProcesoLogistico;
