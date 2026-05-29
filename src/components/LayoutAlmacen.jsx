import React from "react";
import { Outlet } from "react-router-dom";
import AsideAlmacen from "./AsideAlmacen";

const LayoutAlmacen = () => {
  return (
    <div className="flex w-full min-w-0 items-start">
      <AsideAlmacen />
      <main className="flex-1 min-w-0 p-6 bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
};

export default LayoutAlmacen;
