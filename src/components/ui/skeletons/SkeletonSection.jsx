import React from "react";
import Skeleton from "./Skeleton";

const SkeletonSection = ({ rows = 4, className = "" }) => (
  <div
    aria-hidden="true"
    className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
  >
    <Skeleton className="h-4 w-44" />
    <div className="mt-5 space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid gap-3 sm:grid-cols-[180px,1fr]">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  </div>
);

export default SkeletonSection;
