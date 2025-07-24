// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LayoutInventario from './components/LayoutInventario';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductosPage from './pages/ProductosPage';
import MovimientosPage from './pages/MovimientosPage';
import ReportesPage from './pages/ReportesPage';
import TipoProductosPage from './pages/TipoProductosPage';

import './index.css';

const App = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Helmet>
          <title>Sistema de Inventario</title>
          <meta name="description" content="Sistema web para gestión de inventarios" />
        </Helmet>

        {/* Notificaciones de toastify */}
        <ToastContainer position="top-right" autoClose={3000} />

        <Routes>
          <Route path="/" element={<LayoutInventario />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="productos" element={<ProductosPage />} />
            <Route path="movimientos" element={<MovimientosPage />} />
            <Route path="reportes" element={<ReportesPage />} />
            <Route path="tipos-producto" element={<TipoProductosPage />} />
            {/* Agrega más rutas como productos, usuarios, etc */}
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;