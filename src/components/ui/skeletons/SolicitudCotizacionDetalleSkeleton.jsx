import React from "react";
import Skeleton from "./Skeleton";
import SkeletonCard from "./SkeletonCard";
import SkeletonPageHeader from "./SkeletonPageHeader";
import SkeletonSection from "./SkeletonSection";
import SkeletonTable from "./SkeletonTable";

const SolicitudCotizacionDetalleSkeleton = () => (
  <div aria-busy="true" className="mx-auto max-w-7xl space-y-6 p-6">
    <SkeletonPageHeader actions={3} />

    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-3 w-36" rounded="full" />
          <Skeleton className="mt-3 h-6 w-48" />
        </div>
        <Skeleton className="h-7 w-24" rounded="full" />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <SkeletonCard key={index} lines={1} />
        ))}
      </div>
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <div className="space-y-6">
        <SkeletonSection rows={6} />
        <SkeletonCard lines={4} />
      </div>
      <SkeletonSection rows={5} />
    </div>

    <SkeletonTable columns={5} rows={4} />
    <SkeletonTable columns={4} rows={3} />
  </div>
);

export default SolicitudCotizacionDetalleSkeleton;
