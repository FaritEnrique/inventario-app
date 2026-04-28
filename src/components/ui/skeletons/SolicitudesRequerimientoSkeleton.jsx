import React from "react";
import SkeletonCard from "./SkeletonCard";
import SkeletonPageHeader from "./SkeletonPageHeader";
import SkeletonTable from "./SkeletonTable";

const SolicitudesRequerimientoSkeleton = () => (
  <div aria-busy="true" className="mx-auto max-w-6xl space-y-6 p-6">
    <SkeletonPageHeader actions={1} />
    <div className="grid gap-4 md:grid-cols-4">
      <SkeletonCard className="md:col-span-2" lines={2} />
      <SkeletonCard lines={1} />
      <SkeletonCard lines={2} />
    </div>
    <SkeletonTable columns={5} rows={5} />
  </div>
);

export default SolicitudesRequerimientoSkeleton;
