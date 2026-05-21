import React from "react";
import Skeleton from "./Skeleton";

const SkeletonTable = ({ columns = 4, rows = 5, className = "" }) => (
  <div
    aria-hidden="true"
    className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
  >
    <div className="border-b border-slate-200 px-5 py-4">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-2 h-3 w-80 max-w-full" />
    </div>
    <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-4 py-3">
                <Skeleton className="h-3 w-20" rounded="full" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <td key={columnIndex} className="p-4">
                  <Skeleton
                    className={columnIndex === 0 ? "h-4 w-28" : "h-4 w-full"}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="space-y-3 p-4 md:hidden">
      {Array.from({ length: Math.min(rows, 3) }).map((_, index) => (
        <div key={index} className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20" rounded="full" />
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default SkeletonTable;
