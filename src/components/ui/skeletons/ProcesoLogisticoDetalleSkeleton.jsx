import React from "react";
import Skeleton from "./Skeleton";
import SkeletonCard from "./SkeletonCard";
import SkeletonPageHeader from "./SkeletonPageHeader";
import SkeletonSection from "./SkeletonSection";
import SkeletonTable from "./SkeletonTable";

const ProcesoLogisticoDetalleSkeleton = () => (
  <div aria-busy="true" className="mx-auto max-w-7xl space-y-6 p-6">
    <SkeletonPageHeader actions={2} />

    <div className="flex flex-wrap gap-2" aria-hidden="true">
      <Skeleton className="h-7 w-44" rounded="full" />
      <Skeleton className="h-7 w-56" rounded="full" />
      <Skeleton className="h-7 w-40" rounded="full" />
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonCard key={index} lines={2} />
      ))}
    </div>

    <div
      aria-hidden="true"
      className="rounded-xl border border-indigo-100 bg-indigo-50 p-5"
    >
      <Skeleton className="h-3 w-36 bg-indigo-200" rounded="full" />
      <Skeleton className="mt-3 h-6 w-72 bg-indigo-200" />
      <Skeleton className="mt-3 h-4 w-full max-w-2xl bg-indigo-200" />
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-28 bg-indigo-200" />
        ))}
      </div>
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <SkeletonSection rows={4} />
      <SkeletonSection rows={5} />
    </div>

    <SkeletonTable columns={5} rows={4} />
    <SkeletonTable columns={6} rows={4} />
  </div>
);

export default ProcesoLogisticoDetalleSkeleton;
