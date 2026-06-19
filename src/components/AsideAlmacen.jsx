// src/components/AsideAlmacen.jsx
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Box,
  ChevronRight,
  ClipboardList,
  FileCheck,
  LayoutDashboard,
  PackageOpen,
  Warehouse,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  canAdjustInventoryEffective,
  canManageCatalogMasterEffective,
  canOperateInventoryEffective,
  canViewWarehouseTrayEffective,
} from "../accessRules";
import { useAuth } from "../context/authContext";

const baseUrl = "/modulo-almacen";

const filtrarItemsVisibles = (items) =>
  items
    .map((item) => {
      if (!item.subItems) return item;

      const subItemsVisibles = item.subItems.filter(
        (subItem) => subItem.visible !== false,
      );

      return {
        ...item,
        subItems: subItemsVisibles,
        visible: subItemsVisibles.length > 0,
      };
    })
    .filter((item) => item.visible !== false);

const isPathActive = (pathname, to, exact = true) => {
  if (exact) {
    return pathname === to;
  }

  return pathname === to || pathname.startsWith(`${to}/`);
};

const AsideAlmacen = ({ onNavigate }) => {
  const { user } = useAuth();
  const location = useLocation();
  const asideRef = useRef(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const puedeOperarInventario = useMemo(
    () => canOperateInventoryEffective(user),
    [user],
  );

  const puedeAjustarInventario = useMemo(
    () => canAdjustInventoryEffective(user),
    [user],
  );

  const puedeGestionarCatalogos = useMemo(
    () => canManageCatalogMasterEffective(user),
    [user],
  );

  const puedeVerBandejaAlmacen = useMemo(
    () => canViewWarehouseTrayEffective(user),
    [user],
  );

  const puedeAccederModuloAlmacen =
    puedeOperarInventario ||
    puedeAjustarInventario ||
    puedeGestionarCatalogos ||
    puedeVerBandejaAlmacen;

  const menuItems = useMemo(
    () =>
      filtrarItemsVisibles([
        {
          name: "Dashboard",
          to: baseUrl,
          icon: LayoutDashboard,
          exact: true,
          visible: puedeAccederModuloAlmacen,
        },
        {
          name: "Consultas Dashboard",
          icon: ClipboardList,
          submenuLabel: "Consultas Dashboard",
          visible: puedeOperarInventario || puedeGestionarCatalogos,
          subItems: [
            {
              name: "Productos activos",
              to: `${baseUrl}/dashboard/productos-activos`,
              exact: true,
              visible: puedeOperarInventario || puedeGestionarCatalogos,
            },
            {
              name: "Stock disponible",
              to: `${baseUrl}/dashboard/stock-disponible`,
              exact: true,
              visible: puedeOperarInventario,
            },
            {
              name: "Recepciones pendientes",
              to: `${baseUrl}/dashboard/recepciones-pendientes`,
              exact: true,
              visible: puedeOperarInventario,
            },
            {
              name: "Reservas pendientes",
              to: `${baseUrl}/dashboard/reservas-pendientes`,
              exact: true,
              visible: puedeOperarInventario,
            },
            {
              name: "Notas de ingreso",
              to: `${baseUrl}/dashboard/notas-ingreso`,
              exact: true,
              visible: puedeOperarInventario,
            },
            {
              name: "Notas de salida",
              to: `${baseUrl}/dashboard/notas-salida`,
              exact: true,
              visible: puedeOperarInventario,
            },
            {
              name: "Almacenes con stock",
              to: `${baseUrl}/dashboard/almacenes-stock`,
              exact: true,
              visible: puedeOperarInventario,
            },
          ],
        },
        {
          name: "Productos",
          icon: PackageOpen,
          visible: puedeGestionarCatalogos,
          subItems: [
            {
              name: "AdministraciÃ³n de Productos",
              to: `${baseUrl}/productos`,
              exact: true,
              visible: puedeGestionarCatalogos,
            },
            {
              name: "Tipos de Productos",
              to: `${baseUrl}/productos/tipos`,
              exact: true,
              visible: puedeGestionarCatalogos,
            },
            {
              name: "GestiÃ³n de Marcas",
              to: `${baseUrl}/productos/marcas`,
              exact: true,
              visible: puedeGestionarCatalogos,
            },
            {
              name: "Validar Tipos de Producto",
              to: `${baseUrl}/productos/validacion-tipos`,
              exact: true,
              visible: puedeGestionarCatalogos,
            },
            {
              name: "Validar Productos Temporales",
              to: `${baseUrl}/productos/temporales`,
              exact: true,
              visible: puedeGestionarCatalogos,
            },
          ],
        },
        {
          name: "RecepciÃ³n y atenciÃ³n",
          icon: FileCheck,
          subItems: [
            {
              name: "RecepciÃ³n O/C",
              to: `${baseUrl}/recepcion-oc`,
              exact: true,
              visible: puedeOperarInventario,
            },
            {
              name: "Bandeja AlmacÃ©n N/P",
              to: `${baseUrl}/notas-pedido/almacen`,
              exact: true,
              visible: puedeVerBandejaAlmacen,
            },
          ],
        },
        {
          name: "Movimientos",
          icon: Activity,
          visible: puedeOperarInventario,
          subItems: [
            {
              name: "Stock por AlmacÃ©n",
              to: `${baseUrl}/stock`,
              exact: true,
              visible: puedeOperarInventario,
            },
            {
              name: "Kardex General",
              to: `${baseUrl}/kardex`,
              exact: true,
              visible: puedeOperarInventario,
            },
            {
              name: "Ver Movimientos",
              to: `${baseUrl}/movimientos`,
              exact: true,
              visible: puedeOperarInventario,
            },
            {
              name: "Notas de Ingreso",
              to: `${baseUrl}/notas-ingreso`,
              exact: false,
              visible: puedeOperarInventario,
            },
            {
              name: "Notas de Salida",
              to: `${baseUrl}/notas-salida`,
              exact: false,
              visible: puedeOperarInventario,
            },
            {
              name: "Reservas de Stock",
              to: `${baseUrl}/reservas`,
              exact: false,
              visible: puedeOperarInventario,
            },
          ],
        },
        {
          name: "Operaciones",
          icon: Warehouse,
          visible: puedeAjustarInventario,
          subItems: [
            {
              name: "Operaciones de Inventario",
              to: `${baseUrl}/operaciones`,
              exact: true,
              visible: puedeAjustarInventario,
            },
          ],
        },
      ]),
    [
      puedeAccederModuloAlmacen,
      puedeAjustarInventario,
      puedeGestionarCatalogos,
      puedeOperarInventario,
      puedeVerBandejaAlmacen,
    ],
  );

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
      <div className="flex bg-indigo-500 items-center p-4 gap-3 border-b border-indigo-600/50">
        <div className="text-white bg-indigo-600 p-1.5 rounded-lg flex items-center justify-center shadow-inner">
          <Box className="w-5 h-5" />
        </div>
        <h1 className="fuente-poppins text-white font-extrabold text-xl tracking-wide">
          MÃ³dulo AlmacÃ©n
        </h1>
      </div>

      <nav className="relative z-[100] flex flex-1 flex-col gap-1.5 overflow-y-auto overflow-x-hidden p-4 lg:overflow-visible">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isOpen = activeDropdown === item.name;
          const groupActive = hasSubItems ? isGroupActive(item) : false;

          if (hasSubItems) {
            const submenuId = `submenu-almacen-${item.name
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "")}`;

            return (
              <div key={item.name} className="relative overflow-visible">
                <button
                  type="button"
                  onClick={() => toggleDropdown(item.name)}
                  aria-expanded={isOpen}
                  aria-controls={submenuId}
                  aria-haspopup="true"
                  className={`
                    flex items-center justify-between w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                    text-indigo-200 hover:bg-indigo-900/60 hover:text-white
                    ${
                      isOpen || groupActive
                        ? "bg-indigo-800 text-white shadow-md"
                        : ""
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 opacity-80" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 opacity-60 transition-transform duration-200 ${
                      isOpen ? "rotate-90 text-white" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <>
                    <div
                      id={submenuId}
                      className="mt-2 rounded-xl bg-indigo-950/35 p-2 lg:hidden"
                    >
                      {item.subItems.map((sub) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          end={sub.exact !== false}
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
                          {sub.name}
                        </NavLink>
                      ))}
                    </div>

                    <div
                      id={`${submenuId}-desktop`}
                      className="hidden lg:absolute lg:left-full lg:top-0 lg:z-[120] lg:ml-3 lg:flex lg:w-96 overflow-hidden rounded-2xl border border-slate-200/80 bg-cover bg-center bg-no-repeat shadow-2xl animate-in fade-in slide-in-from-left-2 duration-150"
                      style={{
                        backgroundImage: "url('/images/sub_menu.webp')",
                        aspectRatio: "3 / 2",
                      }}
                    >
                      <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] z-0" />

                      <div className="relative z-10 bg-indigo-600 flex items-center justify-center min-w-[38px] py-4 shadow-md select-none">
                        <span className="text-[11px] font-extrabold text-white uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 whitespace-nowrap text-center">
                          {item.submenuLabel ?? `GestiÃ³n ${item.name}`}
                        </span>
                      </div>

                      <div className="relative z-10 flex-1 p-4 flex flex-col gap-2 justify-center pl-5">
                        {item.subItems.map((sub) => (
                          <NavLink
                            key={sub.to}
                            to={sub.to}
                            end={sub.exact !== false}
                            onClick={handleNavigate}
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

        {menuItems.length === 0 && (
          <div className="rounded-xl border border-indigo-700/60 bg-indigo-950/40 p-4 text-xs leading-relaxed text-indigo-100">
            No tienes opciones disponibles para el contexto activo de almacÃ©n.
          </div>
        )}
      </nav>
    </div>
  );
}

export default memo(AsideAlmacen);
