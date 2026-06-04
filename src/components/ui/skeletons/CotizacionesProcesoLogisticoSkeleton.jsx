import React from "react";
import Skeleton from "./Skeleton";
import SkeletonCard from "./SkeletonCard";
import SkeletonTable from "./SkeletonTable";

const CotizacionesProcesoLogisticoSkeleton = () => (
  <div aria-busy="true" className="space-y-5">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>

    <div className="grid gap-3 md:grid-cols-3">
      <SkeletonCard lines={2} />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={2} />
    </div>

    <SkeletonTable columns={6} rows={5} />

    <div className="grid gap-3 lg:grid-cols-2">
      <SkeletonCard lines={3} />
      <SkeletonCard lines={3} />
    </div>
  </div>
);

export default CotizacionesProcesoLogisticoSkeleton;