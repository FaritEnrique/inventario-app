import React from "react";

const roundedClasses = {
  sm: "rounded",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

const Skeleton = ({ className = "", rounded = "md" }) => (
  <div
    aria-hidden="true"
    className={`animate-pulse bg-slate-200 motion-reduce:animate-none ${
      roundedClasses[rounded] || roundedClasses.md
    } ${className}`}
  />
);

export default Skeleton;
