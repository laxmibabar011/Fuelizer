import React from "react";

type ProgressVariant = "default" | "success" | "warning" | "error" | "info";
type ProgressSize = "sm" | "md" | "lg";

interface ProgressProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  showLabel?: boolean;
  showPercentage?: boolean;
  label?: string;
  animated?: boolean;
  striped?: boolean;
  className?: string;
  indicatorClassName?: string;
}

const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = "default",
  size = "md",
  showLabel = false,
  showPercentage = false,
  label,
  animated = false,
  striped = false,
  className = "",
  indicatorClassName = "",
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // Size styles
  const sizeStyles = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  // Variant styles
  const variantStyles = {
    default: "bg-brand-600",
    success: "bg-success-500",
    warning: "bg-warning-500",
    error: "bg-error-500",
    info: "bg-blue-light-500",
  };

  // Animation and striped styles
  const animationClass = animated ? "animate-pulse" : "";
  const stripedClass = striped
    ? "bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:20px_100%] animate-[stripe_1s_linear_infinite]"
    : "";

  return (
    <div className="w-full">
      {/* Label and Percentage Row */}
      {(showLabel || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {showLabel && label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div
        className={`relative w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 ${sizeStyles[size]} ${className}`}
      >
        <div
          className={`h-full transition-all duration-500 ease-out ${variantStyles[variant]} ${animationClass} ${stripedClass} ${indicatorClassName}`}
          style={{ width: `${percentage}%` }}
        />

        {/* Value label inside progress bar for larger sizes */}
        {size === "lg" && showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-white mix-blend-difference">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Additional Progress variants for specific use cases
export const CircularProgress: React.FC<{
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: ProgressVariant;
  showPercentage?: boolean;
  className?: string;
}> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  variant = "default",
  showPercentage = true,
  className = "",
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    default: "#465FFF",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={variantColors[variant]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Percentage text */}
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default Progress;
