// src/components/Loader.jsx
import React from "react";
import { FaSpinner } from "react-icons/fa";

const sizeClasses = {
  sm: "text-base",
  md: "text-3xl",
  lg: "text-4xl",
};

const Loader = ({ size = "lg", className = "" }) => {
  const spinnerSize = sizeClasses[size] || sizeClasses.lg;

  return (
    <div className={`flex h-full items-center justify-center ${className}`}>
      <FaSpinner
        className={`animate-spin text-blue-500 motion-reduce:animate-none ${spinnerSize}`}
      />
    </div>
  );
};

export default Loader;
