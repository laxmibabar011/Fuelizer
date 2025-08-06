import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

export type ChartType =
  | "line"
  | "area"
  | "bar"
  | "pie"
  | "donut"
  | "radar"
  | "scatter";
export type ChartTheme = "light" | "dark";

interface BaseChartProps {
  type: ChartType;
  data: any[];
  categories?: string[];
  height?: number;
  theme?: ChartTheme;
  title?: string;
  subtitle?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showToolbar?: boolean;
  customOptions?: Partial<ApexOptions>;
  className?: string;
}

// Default color schemes
const defaultColors = {
  primary: ["#465FFF", "#9CB9FF", "#3B82F6", "#60A5FA"],
  success: ["#10B981", "#34D399", "#059669", "#047857"],
  warning: ["#F59E0B", "#FBBF24", "#D97706", "#B45309"],
  error: ["#EF4444", "#F87171", "#DC2626", "#B91C1C"],
  mixed: ["#465FFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"],
};

const BaseChart: React.FC<BaseChartProps> = ({
  type,
  data,
  categories = [],
  height = 350,
  theme = "light",
  title,
  subtitle,
  colors = defaultColors.primary,
  showLegend = true,
  showGrid = true,
  showToolbar = false,
  customOptions = {},
  className = "",
}) => {
  const baseOptions: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: type as any,
      height,
      toolbar: { show: showToolbar },
      background: "transparent",
    },
    colors,
    title: title
      ? {
          text: title,
          style: {
            fontSize: "18px",
            fontWeight: "600",
            color: theme === "dark" ? "#FFFFFF" : "#374151",
          },
        }
      : undefined,
    subtitle: subtitle
      ? {
          text: subtitle,
          style: {
            fontSize: "14px",
            color: theme === "dark" ? "#D1D5DB" : "#6B7280",
          },
        }
      : undefined,
    legend: {
      show: showLegend,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      labels: {
        colors: theme === "dark" ? "#D1D5DB" : "#374151",
      },
    },
    grid: {
      show: showGrid,
      borderColor: theme === "dark" ? "#374151" : "#E5E7EB",
      strokeDashArray: 3,
    },
    xaxis: {
      categories,
      labels: {
        style: {
          colors: theme === "dark" ? "#9CA3AF" : "#6B7280",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          colors: theme === "dark" ? "#9CA3AF" : "#6B7280",
        },
      },
    },
    tooltip: {
      theme: theme === "dark" ? "dark" : "light",
    },
    dataLabels: { enabled: false },
    ...customOptions,
  };

  return (
    <div className={`w-full ${className}`}>
      <Chart options={baseOptions} series={data} type={type} height={height} />
    </div>
  );
};

// Specific chart components with predefined configurations
export const LineChart: React.FC<
  Omit<BaseChartProps, "type"> & {
    smooth?: boolean;
    filled?: boolean;
  }
> = ({ smooth = false, filled = false, customOptions = {}, ...props }) => {
  const lineOptions: Partial<ApexOptions> = {
    stroke: {
      curve: smooth ? "smooth" : "straight",
      width: 3,
    },
    fill: filled
      ? {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.4,
            opacityTo: 0.1,
          },
        }
      : undefined,
    markers: {
      size: 4,
      strokeWidth: 2,
      hover: { size: 6 },
    },
    ...customOptions,
  };

  return (
    <BaseChart
      type={filled ? "area" : "line"}
      customOptions={lineOptions}
      {...props}
    />
  );
};

export const BarChart: React.FC<
  Omit<BaseChartProps, "type"> & {
    horizontal?: boolean;
    grouped?: boolean;
  }
> = ({ horizontal = false, grouped = false, customOptions = {}, ...props }) => {
  const barOptions: Partial<ApexOptions> = {
    plotOptions: {
      bar: {
        horizontal,
        columnWidth: grouped ? "60%" : "70%",
        borderRadius: 4,
        dataLabels: { position: "top" },
      },
    },
    ...customOptions,
  };

  return <BaseChart type="bar" customOptions={barOptions} {...props} />;
};

export const PieChart: React.FC<
  Omit<BaseChartProps, "type"> & {
    donut?: boolean;
    donutSize?: string;
  }
> = ({ donut = false, donutSize = "65%", customOptions = {}, ...props }) => {
  const pieOptions: Partial<ApexOptions> = {
    plotOptions: {
      pie: {
        donut: donut
          ? {
              size: donutSize,
              labels: {
                show: true,
                total: {
                  show: true,
                  fontSize: "22px",
                  fontWeight: "600",
                },
              },
            }
          : undefined,
      },
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
    },
    ...customOptions,
  };

  return (
    <BaseChart
      type={donut ? "donut" : "pie"}
      customOptions={pieOptions}
      {...props}
    />
  );
};

export const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  changeType?: "increase" | "decrease";
  icon?: React.ReactNode;
  chart?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({
  title,
  value,
  change,
  changeType,
  icon,
  chart,
  className = "",
  onClick,
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${
        onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  changeType === "increase"
                    ? "text-green-600 dark:text-green-400"
                    : changeType === "decrease"
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {changeType === "increase"
                  ? "+"
                  : changeType === "decrease"
                    ? "-"
                    : ""}
                {Math.abs(change)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                from last period
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
            {icon}
          </div>
        )}
      </div>
      {chart && <div className="mt-4">{chart}</div>}
    </div>
  );
};

export default BaseChart;
