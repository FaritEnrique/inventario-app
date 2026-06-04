import React from "react";
import Skeleton from "./Skeleton";
import SkeletonCard from "./SkeletonCard";
import SkeletonTable from "./SkeletonTable";

const ComparativosProcesoLogisticoSkeleton = () => (
  <section aria-busy="true" className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-8 w-80 max-w-full" />
      <Skeleton className="h-4 w-full max-w-3xl" />
    </div>

    <div className="grid gap-3 md:grid-cols-4">
      <SkeletonCard lines={1} />
      <SkeletonCard lines={1} />
      <SkeletonCard lines={1} />
      <SkeletonCard lines={1} />
    </div>

    <SkeletonTable columns={7} rows={5} />

    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <Skeleton className="h-5 w-52" />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    </div>
  </section>
);

export default ComparativosProcesoLogisticoSkeleton;