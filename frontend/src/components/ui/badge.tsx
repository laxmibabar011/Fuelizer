import * as React from "react";
import { cn } from "../../utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className,
}) => {
  const baseClasses =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  const variantClasses = {
    default: "border-transparent bg-blue-500 text-white hover:bg-blue-500/80",
    secondary:
      "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-800/80",
    destructive: "border-transparent bg-red-500 text-white hover:bg-red-500/80",
    outline: "text-gray-900 dark:text-gray-100",
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </div>
  );
};

export { Badge };
