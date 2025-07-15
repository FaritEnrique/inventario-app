// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';

import LayoutInventario from './components/LayoutInventario';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

import './index.css';

const App = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Helmet>
          <title>Sistema de Inventario</title>
          <meta name="description" content="Sistema web para gestión de inventarios" />
        </Helmet>

        <Routes>
          <Route path="/" element={<LayoutInventario />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            {/* Agrega más rutas como productos, usuarios, etc */}
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;