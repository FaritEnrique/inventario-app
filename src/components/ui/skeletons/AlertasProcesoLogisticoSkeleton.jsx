import React from "react";
import Skeleton from "./Skeleton";
import SkeletonCard from "./SkeletonCard";

const AlertasProcesoLogisticoSkeleton = () => (
  <section aria-busy="true" className="space-y-4">
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <Skeleton className="h-3 w-40" rounded="full" />
      <Skeleton className="mt-3 h-8 w-80 max-w-full" />
      <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
    </div>

    <div className="grid gap-3 md:grid-cols-3">
      <SkeletonCard lines={2} />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={2} />
    </div>

    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-amber-100 bg-amber-50 p-4"
        >
          <Skeleton className="h-4 w-48 bg-amber-200" />
          <Skeleton className="mt-3 h-4 w-full bg-amber-200" />
          <Skeleton className="mt-2 h-4 w-2/3 bg-amber-200" />
        </div>
      ))}
    </div>
  </section>
);

export default AlertasProcesoLogisticoSkeleton;