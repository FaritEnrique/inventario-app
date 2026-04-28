import React from "react";
import SkeletonCard from "./SkeletonCard";
import SkeletonPageHeader from "./SkeletonPageHeader";
import SkeletonSection from "./SkeletonSection";
import SkeletonTable from "./SkeletonTable";

const OrdenCompraDetalleSkeleton = () => (
  <div aria-busy="true" className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
    <SkeletonPageHeader actions={3} />

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonCard key={index} lines={2} />
      ))}
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
      <SkeletonSection rows={5} />
      <SkeletonSection rows={4} />
    </div>

    <SkeletonSection rows={3} />

    <div className="grid gap-6 xl:grid-cols-2">
      <SkeletonSection rows={4} />
      <SkeletonSection rows={4} />
    </div>

    <SkeletonTable columns={5} rows={5} />
  </div>
);

export default OrdenCompraDetalleSkeleton;
