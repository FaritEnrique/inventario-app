import { Fragment, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getPrimaryNavigationLinksEffective } from "../accessRules";
import { useAuth } from "../context/authContext";

const Header = () => {
  const {
    isAuthenticated,
    logout,
    user,
    identity,
    activeContext,
    availableContexts,
    contextSelectionRequired,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const commonLinkClasses =
    "rounded-md px-3 py-2 text-sm font-medium transition hover:bg-white/10";
  const primaryActionClasses =
    "rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20";

  const publicLinks = [{ to: "/", label: "Inicio" }];
  const navigationLinks = isAuthenticated
    ? getPrimaryNavigationLinksEffective(user || {})
    : publicLinks;
  const canChangeContext = isAuthenticated && availableContexts.length > 1;
  const shouldShowContextAction =
    isAuthenticated && (canChangeContext || !activeContext);
  const contextActionLabel = activeContext
    ? "Cambiar contexto"
    : "Seleccionar contexto";
  const contextSummary = activeContext
    ? [activeContext.role, activeContext.areaNombre || activeContext.area?.nombre]
        .filter(Boolean)
        .join(" | ")
    : null;
  const summaryText = !isAuthenticated
    ? "Gestiona requerimientos, inventario y seguimiento logistico desde una sola plataforma."
    : activeContext
      ? [activeContext.displayName, contextSummary, identity?.cargo]
          .filter(Boolean)
          .join(" | ")
      : contextSelectionRequired
        ? "Seleccion de contexto pendiente"
        : [identity?.cargo, identity?.areaNombre].filter(Boolean).join(" | ");

  return (
    <Fragment>
      <header className="bg-indigo-700 text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Link to="/" className="text-2xl font-bold">
                InventarioApp
              </Link>
              <p className="mt-1 hidden max-w-2xl text-sm text-indigo-100 md:block">
                {isAuthenticated
                  ? `Sesion activa${identity?.nombre ? `: ${identity.nombre}` : ""}${
                      summaryText ? ` - ${summaryText}` : ""
                    }`
                  : summaryText}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <nav className="hidden items-center gap-2 md:flex">
                {navigationLinks.map((link) => (
                  <Link key={link.to} to={link.to} className={commonLinkClasses}>
                    {link.label}
                  </Link>
                ))}

                {shouldShowContextAction && (
                  <Link to="/seleccionar-contexto" className={commonLinkClasses}>
                    {contextActionLabel}
                  </Link>
                )}

                {activeContext && (
                  <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-indigo-50">
                    <div className="uppercase tracking-wide text-indigo-100">
                      Contexto activo
                    </div>
                    <div>{activeContext.displayName}</div>
                  </div>
                )}

                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={primaryActionClasses}
                  >
                    Cerrar sesion
                  </button>
                ) : (
                  <Link to="/login" className={primaryActionClasses}>
                    Ingresar
                  </Link>
                )}
              </nav>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 p-2 text-white transition hover:bg-white/10 md:hidden"
                aria-label={isMobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
                onClick={() => setIsMobileMenuOpen((current) => !current)}
              >
                <span className="text-xl leading-none">
                  {isMobileMenuOpen ? "x" : "Menu"}
                </span>
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div
              id="mobile-navigation"
              className="mt-4 rounded-xl border border-white/15 bg-indigo-800/80 p-3 md:hidden"
            >
              <p className="border-b border-white/10 pb-3 text-sm text-indigo-100">
                {isAuthenticated
                  ? `${identity?.nombre || "Usuario"}${summaryText ? ` - ${summaryText}` : ""}`
                  : "Accesos publicos y autenticados del sistema."}
              </p>
              <nav className="mt-3 flex flex-col gap-2">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/10"
                  >
                    {link.label}
                  </Link>
                ))}

                {shouldShowContextAction && (
                  <Link
                    to="/seleccionar-contexto"
                    className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/10"
                  >
                    {contextActionLabel}
                  </Link>
                )}

                {activeContext && (
                  <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-indigo-50">
                    <div className="text-xs uppercase tracking-wide text-indigo-100">
                      Contexto activo
                    </div>
                    <div>{activeContext.displayName}</div>
                    {contextSummary && (
                      <div className="mt-1 text-xs text-indigo-100">
                        {contextSummary}
                      </div>
                    )}
                  </div>
                )}

                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg bg-white px-3 py-2 text-left text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                  >
                    Cerrar sesion
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                  >
                    Ingresar
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
    </Fragment>
  );
};

export default Header;
