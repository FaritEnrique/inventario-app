import React from "react";
import Skeleton from "./Skeleton";
import SkeletonCard from "./SkeletonCard";
import SkeletonTable from "./SkeletonTable";

const ResumenProcesoLogisticoSkeleton = () => (
  <div aria-busy="true" className="space-y-4 sm:space-y-6">
    <section className="space-y-4">
      <Skeleton className="h-8 w-72 max-w-full" />

      <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-44 bg-emerald-200" />
          <Skeleton className="h-4 w-36 bg-emerald-200" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-56 bg-emerald-200" />
          <Skeleton className="h-4 w-32 bg-emerald-200" />
        </div>
      </div>

      <div className="space-y-3">
        <SkeletonCard lines={2} />
        <div className="grid gap-3 sm:grid-cols-2">
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
        </div>
      </div>

      <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
        <Skeleton className="h-5 w-44 bg-indigo-200" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-28 bg-indigo-200" />
              <Skeleton className="h-4 w-40 max-w-full bg-indigo-200" />
            </div>
          ))}
        </div>
      </div>

      <SkeletonTable columns={6} rows={4} />

      <div className="ml-auto w-full max-w-xs space-y-2">
        <Skeleton className="mx-auto h-5 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
    </section>

    <section className="space-y-4">
      <Skeleton className="h-7 w-64 max-w-full" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonCard key={index} lines={2} />
        ))}
      </div>
    </section>
  </div>
);

export default ResumenProcesoLogisticoSkeleton;
