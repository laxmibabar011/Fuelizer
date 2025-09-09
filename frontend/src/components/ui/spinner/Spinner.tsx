/**
 * Loading Spinner Component
 * Simple animated loading spinner with size variants
 */

import React from "react";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  className = "",
}) => {
  const sizeClasses = {
    small: "h-4 w-4 border-2",
    medium: "h-8 w-8 border-2",
    large: "h-12 w-12 border-4",
  };

  return (
    <div
      className={`
        inline-block animate-spin rounded-full border-b-transparent
        ${sizeClasses[size]} 
        border-gray-900 dark:border-white
        ${className}
      `}
    />
  );
};

export default LoadingSpinner;
