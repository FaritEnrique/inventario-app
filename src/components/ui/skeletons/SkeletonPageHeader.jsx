import React from "react";
import Skeleton from "./Skeleton";

const SkeletonPageHeader = ({ actions = 2 }) => (
  <div
    aria-hidden="true"
    className="flex flex-wrap items-start justify-between gap-4"
  >
    <div className="min-w-0 flex-1">
      <Skeleton className="h-8 w-72 max-w-full" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
    </div>
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: actions }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-32" />
      ))}
    </div>
  </div>
);

export default SkeletonPageHeader;
