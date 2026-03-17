import React, { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LayoutInventario from "./components/LayoutInventario";
import Loader from "./components/Loader";
import ProtectedRoute from "./components/ProtectedRoute";
import RoutePermissionGuard from "./components/RoutePermissionGuard";
import { AuthProvider, useAuth } from "./context/authContext";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import {
  canAccessCotizaciones,
  canViewAllCotizacionesLogistica,
  isLogisticaOperador,
} from "./utils/cotizacionPermissions";
import { canAccessTrayLevel } from "./utils/requerimientoPermissions";
import "./index.css";

const CrearPrimerUsuarioPage = lazy(() => import("./pages/CrearPrimerUsuarioPage"));
const CambiarContrasenaPage = lazy(() =>
  import("./pages/CambiarContrasenaPage")
);
const CrearRequerimientoPage = lazy(() => import("./pages/CrearRequerimientoPage"));
const BandejaAlmacenNotasPedidoPage = lazy(() =>
  import("./pages/BandejaAlmacenNotasPedidoPage")
);
const BandejaAprobacionNotasPedidoPage = lazy(() =>
  import("./pages/BandejaAprobacionNotasPedidoPage")
);
const CrearNotaPedidoPage = lazy(() => import("./pages/CrearNotaPedidoPage"));
const EditarRequerimientoPage = lazy(() =>
  import("./pages/EditarRequerimientoPage")
);
const GestionAreasPage = lazy(() => import("./pages/GestionAreasPage"));
const GestionMarcasPage = lazy(() => import("./pages/GestionMarcasPage"));
const GestionProductosPage = lazy(() => import("./pages/GestionProductosPage"));
const GestionProveedoresPage = lazy(() =>
  import("./pages/GestionProveedoresPage")
);
const GestionTipoProductosPage = lazy(() =>
  import("./pages/GestionTipoProductosPage")
);
const GestionUsuariosPage = lazy(() => import("./pages/GestionUsuariosPage"));
const InventarioKardexPage = lazy(() => import("./pages/InventarioKardexPage"));
const InventarioNotaIngresoDetallePage = lazy(() =>
  import("./pages/InventarioNotaIngresoDetallePage")
);
const InventarioNotaSalidaDetallePage = lazy(() =>
  import("./pages/InventarioNotaSalidaDetallePage")
);
const InventarioMovimientosPage = lazy(() =>
  import("./pages/InventarioMovimientosPage")
);
const InventarioNotasIngresoPage = lazy(() =>
  import("./pages/InventarioNotasIngresoPage")
);
const InventarioNotasSalidaPage = lazy(() =>
  import("./pages/InventarioNotasSalidaPage")
);
const InventarioOperacionesPage = lazy(() =>
  import("./pages/InventarioOperacionesPage")
);
const InventarioReservaDetallePage = lazy(() =>
  import("./pages/InventarioReservaDetallePage")
);
const InventarioReservasPage = lazy(() =>
  import("./pages/InventarioReservasPage")
);
const InventarioRecepcionesPage = lazy(() =>
  import("./pages/InventarioRecepcionesPage")
);
const InventarioStockPage = lazy(() => import("./pages/InventarioStockPage"));
const NotaPedidoDetallePage = lazy(() => import("./pages/NotaPedidoDetallePage"));
const NotasPedidoPage = lazy(() => import("./pages/NotasPedidoPage"));
const OrdenCompraDetallePage = lazy(() =>
  import("./pages/OrdenCompraDetallePage")
);
const OrdenesCompraPage = lazy(() => import("./pages/OrdenesCompraPage"));
const RequerimientoDetallePage = lazy(() =>
  import("./pages/RequerimientoDetallePage")
);
const RequerimientosBandejaPage = lazy(() =>
  import("./pages/RequerimientosBandejaPage")
);
const RequerimientosPage = lazy(() => import("./pages/RequerimientosPage"));
const RestablecerContrasenaPage = lazy(() =>
  import("./pages/RestablecerContrasenaPage")
);
const SolicitarRestablecimientoPage = lazy(() =>
  import("./pages/SolicitarRestablecimientoPage")
);
const CotizacionesBandejaPage = lazy(() =>
  import("./pages/CotizacionesBandejaPage")
);
const ProcesoLogisticoDetallePage = lazy(() =>
  import("./pages/ProcesoLogisticoDetallePage")
);
const CotizacionesPage = lazy(() => import("./pages/CotizacionesPage"));

const AppRoutes = () => {
  const { loading, needsInitialSetup } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader />;
  }

  if (needsInitialSetup) {
    return (
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/crear-primer-usuario" element={<CrearPrimerUsuarioPage />} />
          <Route path="*" element={<Navigate to="/crear-primer-usuario" state={{ from: location }} replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<LayoutInventario />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="solicitar-restablecimiento" element={<SolicitarRestablecimientoPage />} />
          <Route path="reset-password" element={<RestablecerContrasenaPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="cambiar-contrasena" element={<CambiarContrasenaPage />} />
            <Route path="gestion-productos" element={<GestionProductosPage />} />
            <Route path="gestion-marcas" element={<GestionMarcasPage />} />
            <Route path="gestion-tipo-producto" element={<GestionTipoProductosPage />} />
            <Route path="gestion-areas" element={<GestionAreasPage />} />
            <Route path="gestion-usuarios" element={<GestionUsuariosPage />} />
            <Route path="gestion-proveedores" element={<GestionProveedoresPage />} />
            <Route
              path="cotizaciones"
              element={
                <RoutePermissionGuard allow={canAccessCotizaciones}>
                  <CotizacionesPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="cotizaciones/bandeja/jefatura"
              element={
                <RoutePermissionGuard allow={canViewAllCotizacionesLogistica}>
                  <CotizacionesBandejaPage tipo="jefatura" />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="cotizaciones/bandeja/operador"
              element={
                <RoutePermissionGuard
                  allow={(user) =>
                    isLogisticaOperador(user) ||
                    user?.rol === "ADMINISTRADOR_SISTEMA"
                  }
                >
                  <CotizacionesBandejaPage tipo="operador" />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="cotizaciones/proceso/:id"
              element={
                <RoutePermissionGuard allow={canAccessCotizaciones}>
                  <ProcesoLogisticoDetallePage />
                </RoutePermissionGuard>
              }
            />
            <Route path="inventario-stock" element={<InventarioStockPage />} />
            <Route path="notas-pedido" element={<NotasPedidoPage />} />
            <Route path="notas-pedido/nueva" element={<CrearNotaPedidoPage />} />
            <Route path="notas-pedido/aprobaciones" element={<BandejaAprobacionNotasPedidoPage />} />
            <Route path="notas-pedido/almacen" element={<BandejaAlmacenNotasPedidoPage />} />
            <Route path="notas-pedido/:id" element={<NotaPedidoDetallePage />} />
            <Route path="inventario-movimientos" element={<InventarioMovimientosPage />} />
            <Route path="inventario-kardex" element={<InventarioKardexPage />} />
            <Route path="inventario-notas-ingreso" element={<InventarioNotasIngresoPage />} />
            <Route path="inventario-notas-ingreso/:id" element={<InventarioNotaIngresoDetallePage />} />
            <Route path="inventario-notas-salida" element={<InventarioNotasSalidaPage />} />
            <Route path="inventario-notas-salida/:id" element={<InventarioNotaSalidaDetallePage />} />
            <Route path="inventario-reservas" element={<InventarioReservasPage />} />
            <Route path="inventario-reservas/:id" element={<InventarioReservaDetallePage />} />
            <Route path="inventario-recepciones" element={<InventarioRecepcionesPage />} />
            <Route path="inventario-operaciones" element={<InventarioOperacionesPage />} />
            <Route path="ordenes-compra" element={<OrdenesCompraPage />} />
            <Route path="ordenes-compra/:id" element={<OrdenCompraDetallePage />} />
            <Route path="requerimientos" element={<RequerimientosPage />} />
            <Route path="requerimientos/nuevo" element={<CrearRequerimientoPage />} />
            <Route path="requerimientos/:id" element={<RequerimientoDetallePage />} />
            <Route path="requerimientos/:id/editar" element={<EditarRequerimientoPage />} />
            <Route
              path="requerimientos/bandeja/jefatura"
              element={
                <RoutePermissionGuard allow={(user) => canAccessTrayLevel(user, "jefatura")}>
                  <RequerimientosBandejaPage nivel="jefatura" />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="requerimientos/bandeja/gerencia-area"
              element={
                <RoutePermissionGuard allow={(user) => canAccessTrayLevel(user, "gerencia-area")}>
                  <RequerimientosBandejaPage nivel="gerencia-area" />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="requerimientos/bandeja/gerencia-administracion"
              element={
                <RoutePermissionGuard allow={(user) => canAccessTrayLevel(user, "gerencia-administracion")}>
                  <RequerimientosBandejaPage nivel="gerencia-administracion" />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="requerimientos/bandeja/gerencia-general"
              element={
                <RoutePermissionGuard allow={(user) => canAccessTrayLevel(user, "gerencia-general")}>
                  <RequerimientosBandejaPage nivel="gerencia-general" />
                </RoutePermissionGuard>
              }
            />
            <Route path="crear-requerimiento" element={<Navigate to="/requerimientos/nuevo" replace />} />

            <Route path="productos" element={<Navigate to="/gestion-productos" replace />} />
            <Route path="marcas" element={<Navigate to="/gestion-marcas" replace />} />
            <Route path="tipos-producto" element={<Navigate to="/gestion-tipo-producto" replace />} />
            <Route path="areas" element={<Navigate to="/gestion-areas" replace />} />
            <Route path="usuarios" element={<Navigate to="/gestion-usuarios" replace />} />
            <Route path="gestion-rangos" element={<Navigate to="/dashboard" replace />} />
            <Route path="movimientos" element={<Navigate to="/inventario-movimientos" replace />} />
            <Route path="reportes" element={<Navigate to="/dashboard" replace />} />
            <Route path="pedidos" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <Helmet>
            <title>Sistema de Inventario</title>
            <meta name="description" content="Sistema web para gestion de inventarios" />
          </Helmet>
          <ToastContainer position="top-right" autoClose={3000} />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;

