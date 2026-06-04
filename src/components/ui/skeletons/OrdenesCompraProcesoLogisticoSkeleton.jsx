import React from "react";
import Skeleton from "./Skeleton";
import SkeletonCard from "./SkeletonCard";
import SkeletonTable from "./SkeletonTable";

const OrdenesCompraProcesoLogisticoSkeleton = () => (
  <section aria-busy="true" className="space-y-4">
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" rounded="full" />
          <Skeleton className="h-8 w-80 max-w-full" />
          <Skeleton className="h-4 w-full max-w-3xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-44 max-w-full" />
          </div>
        ))}
      </div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <SkeletonCard key={index} lines={2} />
      ))}
    </div>

    <SkeletonTable columns={7} rows={5} />

    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <Skeleton className="h-5 w-52" />
      <Skeleton className="mt-3 h-4 w-full max-w-4xl" />
      <Skeleton className="mt-2 h-4 w-full max-w-3xl" />
    </div>
  </section>
);

export default OrdenesCompraProcesoLogisticoSkeleton;