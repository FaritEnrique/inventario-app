import React from "react";
import SkeletonCard from "./SkeletonCard";
import SkeletonPageHeader from "./SkeletonPageHeader";
import SkeletonSection from "./SkeletonSection";
import SkeletonTable from "./SkeletonTable";

const InventarioDocumentoDetalleSkeleton = () => (
  <div aria-busy="true" className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
    <SkeletonPageHeader actions={2} />

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonCard key={index} lines={1} />
      ))}
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <SkeletonSection rows={5} />
      <SkeletonSection rows={4} />
    </div>

    <SkeletonTable columns={4} rows={5} />
    <SkeletonSection rows={4} />
  </div>
);

export default InventarioDocumentoDetalleSkeleton;
