import React from "react";
import Skeleton from "./Skeleton";
import SkeletonCard from "./SkeletonCard";
import SkeletonPageHeader from "./SkeletonPageHeader";
import SkeletonSection from "./SkeletonSection";
import SkeletonTable from "./SkeletonTable";

const RequerimientoDetalleSkeleton = () => (
  <div aria-busy="true" className="mx-auto max-w-7xl p-6">
    <div className="print:hidden">
      <SkeletonPageHeader actions={5} />

      <div className="mt-6 space-y-6 rounded-xl bg-white p-6 shadow">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} lines={1} />
          ))}
        </div>

        <Skeleton className="h-8 w-56" rounded="full" />

        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonSection rows={4} />
          <SkeletonSection rows={4} />
        </div>

        <SkeletonTable columns={5} rows={5} />

        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonSection rows={4} />
          <SkeletonSection rows={4} />
        </div>
      </div>
    </div>
  </div>
);

export default RequerimientoDetalleSkeleton;
