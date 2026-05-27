import React from "react";
import Skeleton from "./Skeleton";
import SkeletonCard from "./SkeletonCard";
import SkeletonTable from "./SkeletonTable";

const SolicitudesProcesoLogisticoSkeleton = () => (
  <div aria-busy="true" className="space-y-4 sm:space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-7 w-80 max-w-full" />
      <Skeleton className="h-4 w-full max-w-2xl" />
    </div>

    <div className="grid gap-3 sm:gap-4 md:grid-cols-4">
      <SkeletonCard className="md:col-span-2" lines={2} />
      <SkeletonCard lines={1} />
      <SkeletonCard lines={2} />
    </div>

    <SkeletonTable columns={5} rows={5} />
  </div>
);

export default SolicitudesProcesoLogisticoSkeleton;
