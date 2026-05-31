// src/components/LayoutInventario.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const LayoutInventario = () => {
  return (
    <div className="flex flex-col min-w-0 min-h-screen overflow-x-hidden">
      <Header />
      <main
        className="px-4 min-w-0 flex-1"
        style={{ paddingTop: "var(--app-header-height, 96px)" }}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default LayoutInventario;
