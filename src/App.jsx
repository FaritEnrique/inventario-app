import React, { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LayoutInventario from "./components/LayoutInventario";
import LayoutAlmacen from "./components/LayoutAlmacen";
import Loader from "./components/Loader";
import ProtectedRoute from "./components/ProtectedRoute";
import RoutePermissionGuard from "./components/RoutePermissionGuard";
import { AuthProvider, useAuth } from "./context/authContext";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import {
  canAccessAreasManagementEffective,
  canAccessCompanySettingsEffective,
  canAccessCotizacionesEffective,
  canAdjustInventoryEffective,
  canManageCatalogMasterEffective,
  canAccessProveedorManagementEffective,
  canApprovePedidoInternoEffective,
  canCreatePedidoInternoEffective,
  canOperateInventoryEffective,
  canViewOrdenesCompraEffective,
  canViewAllCotizacionesLogisticaEffective,
  canViewWarehouseTrayEffective,
  isLogisticaOperadorEffective,
  canAccessGerenciaModuleEffective,
  canViewGerenciaExpedienteLogisticoEffective,
} from "./accessRules";
import { canAccessTrayLevelEffective } from "./accessRules";
import { hasRole } from "./utils/userRoles";
import { canAccessUserManagementEffective } from "./accessRules";
import "./index.css";

const CrearPrimerUsuarioPage = lazy(
  () => import("./pages/CrearPrimerUsuarioPage"),
);
const CambiarContrasenaPage = lazy(
  () => import("./pages/CambiarContrasenaPage"),
);
const CrearRequerimientoPage = lazy(
  () => import("./pages/CrearRequerimientoPage"),
);
const BandejaAlmacenNotasPedidoPage = lazy(
  () => import("./pages/BandejaAlmacenNotasPedidoPage"),
);
const BandejaAprobacionNotasPedidoPage = lazy(
  () => import("./pages/BandejaAprobacionNotasPedidoPage"),
);
const CrearNotaPedidoPage = lazy(() => import("./pages/CrearNotaPedidoPage"));
const EditarRequerimientoPage = lazy(
  () => import("./pages/EditarRequerimientoPage"),
);
const GestionAreasPage = lazy(() => import("./pages/GestionAreasPage"));
const GestionMarcasPage = lazy(() => import("./pages/GestionMarcasPage"));
const GestionProductosPage = lazy(() => import("./pages/GestionProductosPage"));
const GestionProveedoresPage = lazy(
  () => import("./pages/GestionProveedoresPage"),
);
const ConfiguracionEmpresaPage = lazy(
  () => import("./pages/ConfiguracionEmpresaPage"),
);
const BandejaSolicitudesTipoProductoPage = lazy(
  () => import("./pages/BandejaSolicitudesTipoProductoPage"),
);
const GestionTipoProductosPage = lazy(
  () => import("./pages/GestionTipoProductosPage"),
);
const GestionUsuariosPage = lazy(() => import("./pages/GestionUsuariosPage"));
const InventarioKardexPage = lazy(() => import("./pages/InventarioKardexPage"));
const InventarioNotaIngresoDetallePage = lazy(
  () => import("./pages/InventarioNotaIngresoDetallePage"),
);
const InventarioNotaSalidaDetallePage = lazy(
  () => import("./pages/InventarioNotaSalidaDetallePage"),
);
const InventarioMovimientosPage = lazy(
  () => import("./pages/InventarioMovimientosPage"),
);
const InventarioNotasIngresoPage = lazy(
  () => import("./pages/InventarioNotasIngresoPage"),
);
const InventarioNotasSalidaPage = lazy(
  () => import("./pages/InventarioNotasSalidaPage"),
);
const InventarioOperacionesPage = lazy(
  () => import("./pages/InventarioOperacionesPage"),
);
const InventarioReservaDetallePage = lazy(
  () => import("./pages/InventarioReservaDetallePage"),
);
const InventarioReservasPage = lazy(
  () => import("./pages/InventarioReservasPage"),
);
const InventarioRecepcionesPage = lazy(
  () => import("./pages/InventarioRecepcionesPage"),
);
const InventarioStockPage = lazy(() => import("./pages/InventarioStockPage"));
const NotaPedidoDetallePage = lazy(
  () => import("./pages/NotaPedidoDetallePage"),
);
const NotasPedidoPage = lazy(() => import("./pages/NotasPedidoPage"));
const OrdenCompraDetallePage = lazy(
  () => import("./pages/OrdenCompraDetallePage"),
);
const OrdenesCompraPage = lazy(() => import("./pages/OrdenesCompraPage"));
const RequerimientoDetallePage = lazy(
  () => import("./pages/RequerimientoDetallePage"),
);
const RequerimientosBandejaPage = lazy(
  () => import("./pages/RequerimientosBandejaPage"),
);
const RequerimientosPage = lazy(() => import("./pages/RequerimientosPage"));
const RestablecerContrasenaPage = lazy(
  () => import("./pages/RestablecerContrasenaPage"),
);
const SolicitarRestablecimientoPage = lazy(
  () => import("./pages/SolicitarRestablecimientoPage"),
);
const CotizacionesBandejaPage = lazy(
  () => import("./pages/CotizacionesBandejaPage"),
);
const AlertasLogisticasPage = lazy(
  () => import("./pages/AlertasLogisticasPage"),
);
const ProcesoLogisticoPage = lazy(() => import("./pages/ProcesoLogisticoPage"));
const CotizacionesPage = lazy(() => import("./pages/CotizacionesPage"));
const SolicitudCotizacionDetallePage = lazy(
  () => import("./pages/SolicitudCotizacionDetallePage"),
);
const SolicitudCotizacionDocumentoPage = lazy(
  () => import("./pages/SolicitudCotizacionDocumentoPage"),
);
/* const SolicitudesRequerimientoPage = lazy(
  () => import("./pages/SolicitudesRequerimientoPage"),
); */
const ProveedorCotizacionPublicPage = lazy(
  () => import("./pages/public/ProveedorCotizacionPublicPage"),
);
const ResumenProcesoLogisticoPage = lazy(
  () => import("./pages/ResumenProcesoLogisticoPage"),
);
const ComparativosProcesoLogisticoPage = lazy(
  () => import("./pages/ComparativosProcesoLogisticoPage"),
);
const OrdenesCompraProcesoLogisticoPage = lazy(
  () => import("./pages/OrdenesCompraProcesoLogisticoPage"),
);
const SolicitudesProcesoLogisticoPage = lazy(
  () => import("./pages/SolicitudesProcesoLogisticoPage"),
);
const CotizacionesProcesoLogisticoPage = lazy(
  () => import("./pages/CotizacionesProcesoLogisticoPage"),
);
const AlertasProcesoLogisticoPage = lazy(
  () => import("./pages/AlertasProcesoLogisticoPage"),
);
const ExpedienteLogisticoConsultaPage = lazy(
  () => import("./pages/gerencia/ExpedienteLogisticoConsultaPage"),
);
const SeleccionContextoPage = lazy(
  () => import("./pages/SeleccionContextoPage"),
);
const DashboardAlmacenPage = lazy(() => import("./pages/DashboardAlmacenPage"));
const ProductosTemporalesAlmacenPage = lazy(
  () => import("./pages/ProductosTemporalesAlmacenPage"),
);
const LayoutGerencia = lazy(() => import("./components/LayoutGerencia"));
const DashboardGerenciaPage = lazy(
  () => import("./pages/DashboardGerenciaPage"),
);

const RequerimientosGerenciaPage = lazy(
  () => import("./pages/gerencia/RequerimientosGerenciaPage"),
);
const AprobacionesRequerimientosGerenciaPage = lazy(
  () => import("./pages/gerencia/AprobacionesRequerimientosGerenciaPage"),
);
const ExpedientesGerenciaPage = lazy(
  () => import("./pages/gerencia/ExpedientesGerenciaPage"),
);
const OrdenesCompraGerenciaPage = lazy(
  () => import("./pages/gerencia/OrdenesCompraGerenciaPage"),
);
const AprobacionesOrdenesCompraGerenciaPage = lazy(
  () => import("./pages/gerencia/AprobacionesOrdenesCompraGerenciaPage"),
);
const AprobacionesNotasPedidoGerenciaPage = lazy(
  () => import("./pages/gerencia/AprobacionesNotasPedidoGerenciaPage"),
);
const MovimientosAlmacenPage = lazy(
  () => import("./pages/MovimientosAlmacenPage"),
);
const RecepcionOrdenCompraPage = lazy(
  () => import("./pages/RecepcionOrdenCompraPage"),
);

const SolicitudesRequerimientoRedirect = () => {
  const { id } = useParams();

  return (
    <Navigate
      to={`/cotizaciones/proceso/${id}/solicitudes`}
      replace
    />
  );
};

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
          <Route
            path="/crear-primer-usuario"
            element={<CrearPrimerUsuarioPage />}
          />
          <Route
            path="*"
            element={
              <Navigate
                to="/crear-primer-usuario"
                state={{ from: location }}
                replace
              />
            }
          />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route
          path="/proveedor/cotizaciones/:token"
          element={<ProveedorCotizacionPublicPage />}
        />
        <Route path="/" element={<LayoutInventario />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route
            path="solicitar-restablecimiento"
            element={<SolicitarRestablecimientoPage />}
          />
          <Route
            path="reset-password"
            element={<RestablecerContrasenaPage />}
          />
          <Route element={<ProtectedRoute />}>
            <Route
              path="seleccionar-contexto"
              element={<SeleccionContextoPage />}
            />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route
              path="cambiar-contrasena"
              element={<CambiarContrasenaPage />}
            />
            <Route
              path="gestion-productos"
              element={
                <RoutePermissionGuard allow={canOperateInventoryEffective}>
                  <GestionProductosPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="gestion-marcas"
              element={
                <RoutePermissionGuard allow={canManageCatalogMasterEffective}>
                  <GestionMarcasPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="gestion-tipo-producto"
              element={
                <RoutePermissionGuard allow={canManageCatalogMasterEffective}>
                  <GestionTipoProductosPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="gestion-areas"
              element={
                <RoutePermissionGuard allow={canAccessAreasManagementEffective}>
                  <GestionAreasPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="gestion-usuarios"
              element={
                <RoutePermissionGuard allow={canAccessUserManagementEffective}>
                  <GestionUsuariosPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="gestion-proveedores"
              element={
                <RoutePermissionGuard
                  allow={canAccessProveedorManagementEffective}
                >
                  <GestionProveedoresPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="configuracion-empresa"
              element={
                <RoutePermissionGuard allow={canAccessCompanySettingsEffective}>
                  <ConfiguracionEmpresaPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="solicitudes-tipo-producto"
              element={
                <RoutePermissionGuard allow={canAdjustInventoryEffective}>
                  <BandejaSolicitudesTipoProductoPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="cotizaciones"
              element={
                <RoutePermissionGuard
                  allow={canAccessCotizacionesEffective}
                  contextGate="logistica-access"
                >
                  <CotizacionesPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="cotizaciones/alertas"
              element={
                <RoutePermissionGuard
                  allow={canAccessCotizacionesEffective}
                  contextGate="logistica-access"
                >
                  <AlertasLogisticasPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="cotizaciones/bandeja/jefatura"
              element={
                <RoutePermissionGuard
                  allow={canViewAllCotizacionesLogisticaEffective}
                  contextGate="logistica-jefatura"
                >
                  <CotizacionesBandejaPage tipo="jefatura" />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="cotizaciones/bandeja/operador"
              element={
                <RoutePermissionGuard
                  allow={(user) =>
                    isLogisticaOperadorEffective(user) ||
                    hasRole(user, "ADMINISTRADOR_SISTEMA")
                  }
                  contextGate="logistica-operador"
                >
                  <CotizacionesBandejaPage tipo="operador" />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="cotizaciones/proceso/:id"
              element={
                <RoutePermissionGuard
                  allow={canAccessCotizacionesEffective}
                  contextGate="logistica-access"
                >
                  <ProcesoLogisticoPage />
                </RoutePermissionGuard>
              }
            >
              <Route index element={<ResumenProcesoLogisticoPage />} />
              <Route
                path="solicitudes"
                element={<SolicitudesProcesoLogisticoPage />}
              />
              <Route
                path="cotizaciones"
                element={<CotizacionesProcesoLogisticoPage />}
              />
              <Route
                path="comparativos"
                element={<ComparativosProcesoLogisticoPage />}
              />
              <Route
                path="orden-compra"
                element={<OrdenesCompraProcesoLogisticoPage />}
              />
              <Route path="alertas" element={<AlertasProcesoLogisticoPage />} />
            </Route>
            <Route
              path="cotizaciones/requerimientos/:id/solicitudes"
              element={
                <RoutePermissionGuard
                  allow={canAccessCotizacionesEffective}
                  contextGate="logistica-access"
                >
                  <SolicitudesRequerimientoRedirect />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="solicitudes-cotizacion/:id"
              element={
                <RoutePermissionGuard
                  allow={canAccessCotizacionesEffective}
                  contextGate="logistica-access"
                >
                  <SolicitudCotizacionDetallePage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="modulo-almacen"
              element={
                <RoutePermissionGuard allow={canOperateInventoryEffective}>
                  <LayoutAlmacen />
                </RoutePermissionGuard>
              }
            >
              <Route index element={<DashboardAlmacenPage />} />
              <Route path="productos" element={<GestionProductosPage />} />
              <Route
                path="productos/tipos"
                element={<GestionTipoProductosPage />}
              />
              <Route path="productos/marcas" element={<GestionMarcasPage />} />
              <Route
                path="productos/validacion-tipos"
                element={
                  <RoutePermissionGuard allow={canManageCatalogMasterEffective}>
                    <BandejaSolicitudesTipoProductoPage />
                  </RoutePermissionGuard>
                }
              />
              <Route
                path="productos/temporales"
                element={
                  <RoutePermissionGuard allow={canManageCatalogMasterEffective}>
                    <ProductosTemporalesAlmacenPage />
                  </RoutePermissionGuard>
                }
              />
              <Route
                path="tipo-productos"
                element={<Navigate to="/modulo-almacen/productos/tipos" replace />}
              />
              <Route
                path="gestion-marcas"
                element={<Navigate to="/modulo-almacen/productos/marcas" replace />}
              />
              <Route
                path="productos-temporales"
                element={<Navigate to="/modulo-almacen/productos/temporales" replace />}
              />
              <Route path="movimientos" element={<MovimientosAlmacenPage />} />
              <Route
                path="recepcion-oc"
                element={<RecepcionOrdenCompraPage />}
              />
            </Route>
            <Route
              path="solicitudes-cotizacion/:id/documento"
              element={
                <RoutePermissionGuard
                  allow={canAccessCotizacionesEffective}
                  contextGate="logistica-access"
                >
                  <SolicitudCotizacionDocumentoPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="inventario-stock"
              element={
                <RoutePermissionGuard allow={canOperateInventoryEffective}>
                  <InventarioStockPage />
                </RoutePermissionGuard>
              }
            />
            <Route path="notas-pedido" element={<NotasPedidoPage />} />
            <Route
              path="notas-pedido/nueva"
              element={
                <RoutePermissionGuard allow={canCreatePedidoInternoEffective}>
                  <CrearNotaPedidoPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="notas-pedido/aprobaciones"
              element={
                <RoutePermissionGuard allow={canApprovePedidoInternoEffective}>
                  <BandejaAprobacionNotasPedidoPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="notas-pedido/almacen"
              element={
                <RoutePermissionGuard allow={canViewWarehouseTrayEffective}>
                  <BandejaAlmacenNotasPedidoPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="notas-pedido/:id"
              element={<NotaPedidoDetallePage />}
            />
            <Route
              path="inventario-movimientos"
              element={
                <RoutePermissionGuard allow={canOperateInventoryEffective}>
                  <InventarioMovimientosPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="inventario-kardex"
              element={
                <RoutePermissionGuard allow={canOperateInventoryEffective}>
                  <InventarioKardexPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="inventario-notas-ingreso"
              element={
                <RoutePermissionGuard allow={canOperateInventoryEffective}>
                  <InventarioNotasIngresoPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="inventario-notas-ingreso/:id"
              element={
                <RoutePermissionGuard allow={canOperateInventoryEffective}>
                  <InventarioNotaIngresoDetallePage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="inventario-notas-salida"
              element={
                <RoutePermissionGuard allow={canOperateInventoryEffective}>
                  <InventarioNotasSalidaPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="inventario-notas-salida/:id"
              element={
                <RoutePermissionGuard allow={canOperateInventoryEffective}>
                  <InventarioNotaSalidaDetallePage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="inventario-reservas"
              element={
                <RoutePermissionGuard allow={canOperateInventoryEffective}>
                  <InventarioReservasPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="inventario-reservas/:id"
              element={
                <RoutePermissionGuard allow={canOperateInventoryEffective}>
                  <InventarioReservaDetallePage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="inventario-recepciones"
              element={<Navigate to="/modulo-almacen/recepcion-oc" replace />}
            />
            <Route
              path="inventario-operaciones"
              element={
                <RoutePermissionGuard allow={canOperateInventoryEffective}>
                  <InventarioOperacionesPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="ordenes-compra"
              element={
                <RoutePermissionGuard allow={canViewOrdenesCompraEffective}>
                  <OrdenesCompraPage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="ordenes-compra/:id"
              element={
                <RoutePermissionGuard allow={canViewOrdenesCompraEffective}>
                  <OrdenCompraDetallePage />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="modulo-gerencia"
              element={
                <RoutePermissionGuard allow={canAccessGerenciaModuleEffective}>
                  <LayoutGerencia />
                </RoutePermissionGuard>
              }
            >
              <Route index element={<DashboardGerenciaPage />} />
              <Route
                path="requerimientos"
                element={<RequerimientosGerenciaPage />}
              />
              <Route
                path="requerimientos/aprobaciones"
                element={<AprobacionesRequerimientosGerenciaPage />}
              />
              <Route
                path="expedientes"
                element={<ExpedientesGerenciaPage />}
              />
              <Route
                path="expedientes/:id"
                element={
                  <RoutePermissionGuard allow={canViewGerenciaExpedienteLogisticoEffective}>
                    <ExpedienteLogisticoConsultaPage />
                  </RoutePermissionGuard>
                }
              />
              <Route
                path="ordenes-compra"
                element={<OrdenesCompraGerenciaPage />}
              />
              <Route
                path="ordenes-compra/aprobaciones"
                element={<AprobacionesOrdenesCompraGerenciaPage />}
              />
              <Route
                path="notas-pedido/aprobaciones"
                element={<AprobacionesNotasPedidoGerenciaPage />}
              />
            </Route>
            <Route path="requerimientos" element={<RequerimientosPage />} />
            <Route
              path="requerimientos/nuevo"
              element={<CrearRequerimientoPage />}
            />
            <Route
              path="requerimientos/:id"
              element={<RequerimientoDetallePage />}
            />
            <Route
              path="requerimientos/:id/editar"
              element={<EditarRequerimientoPage />}
            />
            <Route
              path="requerimientos/bandeja/jefatura"
              element={
                <RoutePermissionGuard
                  allow={(user) =>
                    canAccessTrayLevelEffective(user, "jefatura")
                  }
                >
                  <RequerimientosBandejaPage nivel="jefatura" />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="requerimientos/bandeja/gerencia-area"
              element={
                <RoutePermissionGuard
                  allow={(user) =>
                    canAccessTrayLevelEffective(user, "gerencia-area")
                  }
                >
                  <RequerimientosBandejaPage nivel="gerencia-area" />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="requerimientos/bandeja/gerencia-administracion"
              element={
                <RoutePermissionGuard
                  allow={(user) =>
                    canAccessTrayLevelEffective(user, "gerencia-administracion")
                  }
                >
                  <RequerimientosBandejaPage nivel="gerencia-administracion" />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="requerimientos/bandeja/gerencia-general"
              element={
                <RoutePermissionGuard
                  allow={(user) =>
                    canAccessTrayLevelEffective(user, "gerencia-general")
                  }
                >
                  <RequerimientosBandejaPage nivel="gerencia-general" />
                </RoutePermissionGuard>
              }
            />
            <Route
              path="crear-requerimiento"
              element={<Navigate to="/requerimientos/nuevo" replace />}
            />

            <Route
              path="productos"
              element={<Navigate to="/gestion-productos" replace />}
            />
            <Route
              path="marcas"
              element={<Navigate to="/gestion-marcas" replace />}
            />
            <Route
              path="tipos-producto"
              element={<Navigate to="/gestion-tipo-producto" replace />}
            />
            <Route
              path="areas"
              element={<Navigate to="/gestion-areas" replace />}
            />
            <Route
              path="usuarios"
              element={<Navigate to="/gestion-usuarios" replace />}
            />
            <Route
              path="gestion-rangos"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="movimientos"
              element={<Navigate to="/inventario-movimientos" replace />}
            />
            <Route
              path="reportes"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="pedidos"
              element={<Navigate to="/dashboard" replace />}
            />
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
            <meta
              name="description"
              content="Sistema web para gestion de inventarios"
            />
          </Helmet>
          <ToastContainer position="top-right" autoClose={3000} />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;
