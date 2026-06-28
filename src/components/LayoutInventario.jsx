// src/components/LayoutInventario.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const LayoutInventario = () => {
  return (
    <div className="flex min-h-screen min-w-0 flex-col">
      <Header />
      <main
        className="min-w-0 flex-1 px-4"
        style={{ paddingTop: "var(--app-header-height, 96px)" }}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default LayoutInventario;
