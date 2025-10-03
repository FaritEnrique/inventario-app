// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./context/authContext";
import LayoutInventario from "./components/LayoutInventario";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductosPage from "./pages/ProductosPage";
import MovimientosPage from "./pages/MovimientosPage";
import ReportesPage from "./pages/ReportesPage";
import TipoProductosPage from "./pages/TipoProductosPage";
import MarcasPage from "./pages/MarcasPage";
import AreasPage from "./pages/AreasPage";
import RequerimientosPage from "./pages/RequerimientosPage";
import UsersPage from "./pages/UsersPage";
import GestionProductosPage from "./pages/GestionProductosPage";
import GestionMarcasPage from "./pages/GestionMarcasPage";
import GestionTipoProductosPage from "./pages/GestionTipoProductosPage";
import GestionAreasPage from "./pages/GestionAreasPage";
import GestionRangosPage from "./pages/GestionRangosPage";
import SolicitarRestablecimientoPage from "./pages/SolicitarRestablecimientoPage";
import RestablecerContrasenaPage from "./pages/RestablecerContrasenaPage";
import GestionUsuariosPage from "./pages/GestionUsuariosPage";
import CrearRequerimientoPage from "./pages/CrearRequerimientoPage";

import "./index.css";
import GestionProveedoresPage from "./pages/GestionProveedoresPage";

const App = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <Helmet>
            <title>Sistema de Inventario</title>
            <meta
              name="description"
              content="Sistema web para gestión de inventarios"
            />
          </Helmet>

          <ToastContainer position="top-right" autoClose={3000} />

          <Routes>
            <Route path="/" element={<LayoutInventario />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route
                path="/solicitar-restablecimiento"
                element={<SolicitarRestablecimientoPage />}
              />
              <Route
                path="/reset-password"
                element={<RestablecerContrasenaPage />}
              />
              // Ruta protegida
              <Route element={<ProtectedRoute />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route
                  path="gestion-productos"
                  element={<GestionProductosPage />}
                />
                <Route path="gestion-marcas" element={<GestionMarcasPage />} />
                <Route
                  path="gestion-tipo-producto"
                  element={<GestionTipoProductosPage />}
                />
                <Route path="gestion-areas" element={<GestionAreasPage />} />
                <Route
                  path="gestion-usuarios"
                  element={<GestionUsuariosPage />}
                />
                <Route path="gestion-rangos" element={<GestionRangosPage />} />
                <Route
                  path="crear-requerimiento"
                  element={<CrearRequerimientoPage />}
                />
                <Route path="productos" element={<ProductosPage />} />
                <Route path="movimientos" element={<MovimientosPage />} />
                <Route path="reportes" element={<ReportesPage />} />
                <Route path="tipos-producto" element={<TipoProductosPage />} />
                <Route path="marcas" element={<MarcasPage />} />
                <Route path="/areas" element={<AreasPage />} />
                <Route path="/requerimientos" element={<RequerimientosPage />} />
                <Route path="/usuarios" element={<UsersPage />} />
                <Route
                  path="gestion-proveedores"
                  element={<GestionProveedoresPage />}
                />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;
