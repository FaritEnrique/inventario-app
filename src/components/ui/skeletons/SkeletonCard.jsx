import React from "react";
import Skeleton from "./Skeleton";

const SkeletonCard = ({ lines = 3, className = "" }) => (
  <div
    aria-hidden="true"
    className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
  >
    <Skeleton className="h-3 w-28" rounded="full" />
    <Skeleton className="mt-3 h-6 w-3/5" />
    <div className="mt-4 space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={index === lines - 1 ? "h-3 w-2/3" : "h-3 w-full"}
        />
      ))}
    </div>
  </div>
);

export default SkeletonCard;
