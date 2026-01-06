import React, { useState, useEffect } from "react";
import { Card } from "../../../components/ui/card";
import { DollarLineIcon, FuelIcon, UsersIcon, ChartIcon } from "../../../icons";
import transactionService from "../../../services/transactionService";

interface DashboardSummary {
  totalSales: number;
  totalLitres: number;
  totalTransactions: number;
  activeBooths: number;
  activeOperators: number;
  lastUpdated: string;
}

const DashboardOverview: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary>({
    totalSales: 0,
    totalLitres: 0,
    totalTransactions: 0,
    activeBooths: 0,
    activeOperators: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardSummary = async () => {
    try {
      setLoading(true);

      // Get today's transactions for summary
      const { startDate, endDate } = transactionService.getTodayDateRange();
      const response = await transactionService.getTransactionsByDateRange(
        startDate,
        endDate
      );

      const transactions = response.data?.data || [];

      // Calculate summary data
      const totalSales = transactions.reduce(
        (sum: number, t: any) => sum + parseFloat(t.total_amount || 0),
        0
      );

      const totalLitres = transactions.reduce(
        (sum: number, t: any) => sum + parseFloat(t.litres_sold || 0),
        0
      );

      // Get unique booths and operators
      const uniqueBooths = new Set(
        transactions.map((t: any) => t.Nozzle?.boothId).filter(Boolean)
      );
      const uniqueOperators = new Set(
        transactions.map((t: any) => t.operator_id).filter(Boolean)
      );

      setSummary({
        totalSales,
        totalLitres,
        totalTransactions: transactions.length,
        activeBooths: uniqueBooths.size,
        activeOperators: uniqueOperators.size,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to fetch dashboard summary:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardSummary();

    // Listen for global refresh events
    const handleRefresh = () => {
      fetchDashboardSummary();
    };

    window.addEventListener("liveMonitoringRefresh", handleRefresh);
    return () =>
      window.removeEventListener("liveMonitoringRefresh", handleRefresh);
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatLitres = (litres: number): string => {
    return `${litres.toFixed(1)} L`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sales */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Sales Today
              </p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(summary.totalSales)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <DollarLineIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        {/* Total Litres */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Litres Sold
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {formatLitres(summary.totalLitres)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <FuelIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        {/* Total Transactions */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Transactions
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {summary.totalTransactions}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <ChartIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        {/* Active Operators */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Operators
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {summary.activeOperators}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <UsersIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Average Sale Amount
              </span>
              <span className="font-semibold">
                {summary.totalTransactions > 0
                  ? formatCurrency(
                      summary.totalSales / summary.totalTransactions
                    )
                  : formatCurrency(0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Average Litres per Sale
              </span>
              <span className="font-semibold">
                {summary.totalTransactions > 0
                  ? formatLitres(
                      summary.totalLitres / summary.totalTransactions
                    )
                  : formatLitres(0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Active Booths
              </span>
              <span className="font-semibold">{summary.activeBooths}</span>
            </div>
          </div>
        </Card>

        {/* System Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Live Monitoring
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Data Connection
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Last Updated
              </span>
              <span className="text-sm text-gray-500">
                {new Date(summary.lastUpdated).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
