import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

const Header = () => {
  const {
    isAuthenticated,
    logout,
    activeContext,
    availableContexts,
    contextSelectionRequired,
  } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const headerElement = headerRef.current;
    if (!headerElement || typeof document === "undefined") return undefined;

    const root = document.documentElement;
    const updateHeaderHeight = () => {
      root.style.setProperty(
        "--app-header-height",
        `${headerElement.offsetHeight}px`,
      );
    };

    updateHeaderHeight();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateHeaderHeight())
        : null;

    if (resizeObserver) {
      resizeObserver.observe(headerElement);
    } else {
      window.addEventListener("resize", updateHeaderHeight);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", updateHeaderHeight);
      }
    };
  }, [
    isMobileMenuOpen,
    isAuthenticated,
    activeContext,
    contextSelectionRequired,
  ]);

  const handleLogout = async () => {
    const result = await logout();

    if (result?.success) {
      navigate("/login");
    }
  };

  const commonLinkClasses =
    "rounded-md px-3 py-2 text-sm font-medium transition hover:bg-white/10";
  const primaryActionClasses =
    "rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20";

  const canChangeContext = isAuthenticated && availableContexts.length > 1;
  const shouldShowContextAction =
    isAuthenticated && (canChangeContext || !activeContext);
  const contextActionLabel = activeContext
    ? "Cambiar contexto"
    : "Seleccionar contexto";
  const contextSummary = activeContext
    ? [
        activeContext.role,
        activeContext.areaNombre || activeContext.area?.nombre,
      ]
        .filter(Boolean)
        .join(" | ")
    : null;
  const summaryText = !isAuthenticated
    ? "Gestiona requerimientos, inventario y seguimiento logístico desde una sola plataforma."
    : contextSelectionRequired
      ? "Selección de contexto pendiente"
      : null;

  return (
    <Fragment>
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-40 bg-indigo-700 text-white shadow-md"
      >
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Link
                to="/"
                className="inline-flex max-w-full items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-white/10"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white shadow-lg shadow-indigo-900/20 sm:h-14 sm:w-14">
                  <svg
                    viewBox="0 0 64 64"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                    aria-hidden="true"
                    fill="none"
                  >
                    <rect
                      x="8"
                      y="12"
                      width="24"
                      height="18"
                      rx="3"
                      className="fill-white/90"
                    />
                    <rect
                      x="20"
                      y="34"
                      width="20"
                      height="14"
                      rx="3"
                      className="fill-indigo-100"
                    />
                    <path d="M34 24h11l7 8v10H34z" className="fill-white/90" />
                    <circle cx="40" cy="46" r="4" className="fill-indigo-700" />
                    <circle cx="49" cy="46" r="4" className="fill-indigo-700" />
                    <path
                      d="M14 21h12M14 39h10"
                      stroke="rgb(67 56 202)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xl font-bold leading-tight sm:text-2xl">
                    LogisticaAPP
                  </div>
                  <div className="hidden text-xs uppercase tracking-[0.24em] text-indigo-100 sm:block">
                    Operacion Logistica
                  </div>
                </div>
              </Link>
              {summaryText && (
                <p className="mt-1 hidden max-w-2xl text-sm text-indigo-100 md:block">
                  {summaryText}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <nav className="hidden items-center gap-2 md:flex">
                <Link to="/" className={commonLinkClasses}>
                  Inicio
                </Link>

                {isAuthenticated && (
                  <Link to="/dashboard" className={commonLinkClasses}>
                    Dashboard
                  </Link>
                )}

                {shouldShowContextAction && (
                  <Link
                    to="/seleccionar-contexto"
                    className={commonLinkClasses}
                  >
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
              {summaryText && (
                <p className="border-b border-white/10 pb-3 text-sm text-indigo-100">
                  {summaryText}
                </p>
              )}
              <nav
                className={
                  summaryText
                    ? "mt-3 flex flex-col gap-2"
                    : "flex flex-col gap-2"
                }
              >
                <Link
                  to="/"
                  className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/10"
                >
                  Inicio
                </Link>

                {isAuthenticated && (
                  <Link
                    to="/dashboard"
                    className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/10"
                  >
                    Dashboard
                  </Link>
                )}

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
