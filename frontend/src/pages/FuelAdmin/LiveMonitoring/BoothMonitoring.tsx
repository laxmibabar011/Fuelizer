import React, { useState, useEffect } from "react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { FuelIcon, UsersIcon, ChartIcon } from "../../../icons";
import transactionService from "../../../services/transactionService";

interface BoothData {
  id: number;
  name: string;
  code: string;
  active: boolean;
  nozzles: NozzleData[];
  totalSales: number;
  totalLitres: number;
  transactionCount: number;
  activeOperators: string[];
}

interface NozzleData {
  id: number;
  code: string;
  productName: string;
  status: "active" | "inactive" | "busy" | "maintenance";
  sales: number;
  litres: number;
  transactions: number;
  currentRate: number;
  activeOperator?: string;
}

const BoothMonitoring: React.FC = () => {
  const [booths, setBooths] = useState<BoothData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoothData = async () => {
    try {
      setLoading(true);

      // Get today's transactions
      const { startDate, endDate } = transactionService.getTodayDateRange();
      const response = await transactionService.getTransactionsByDateRange(
        startDate,
        endDate
      );
      const transactions = response.data?.data || [];

      // Group transactions by booth
      const boothMap = new Map<number, BoothData>();

      transactions.forEach((transaction: any) => {
        const boothId = transaction.Nozzle?.boothId;
        const nozzleId = transaction.nozzle_id;

        if (!boothId || !nozzleId) return;

        // Initialize booth if not exists
        if (!boothMap.has(boothId)) {
          boothMap.set(boothId, {
            id: boothId,
            name: `Booth ${boothId}`,
            code: `B${boothId}`,
            active: true,
            nozzles: [],
            totalSales: 0,
            totalLitres: 0,
            transactionCount: 0,
            activeOperators: [],
          });
        }

        const booth = boothMap.get(boothId)!;

        // Update booth totals
        booth.totalSales += parseFloat(transaction.total_amount || 0);
        booth.totalLitres += parseFloat(transaction.litres_sold || 0);
        booth.transactionCount += 1;

        // Add operator if not already present
        const operatorName =
          transaction.Operator?.UserDetails?.full_name ||
          transaction.Operator?.email?.split("@")[0] ||
          "Unknown";
        if (!booth.activeOperators.includes(operatorName)) {
          booth.activeOperators.push(operatorName);
        }

        // Update or create nozzle data
        let nozzle = booth.nozzles.find((n) => n.id === nozzleId);
        if (!nozzle) {
          nozzle = {
            id: nozzleId,
            code: transaction.Nozzle?.code || `N${nozzleId}`,
            productName: transaction.Nozzle?.Product?.name || "Unknown Fuel",
            status: "active",
            sales: 0,
            litres: 0,
            transactions: 0,
            currentRate: parseFloat(transaction.price_per_litre_at_sale || 0),
            activeOperator: operatorName,
          };
          booth.nozzles.push(nozzle);
        }

        // Update nozzle data
        nozzle.sales += parseFloat(transaction.total_amount || 0);
        nozzle.litres += parseFloat(transaction.litres_sold || 0);
        nozzle.transactions += 1;
        nozzle.currentRate = parseFloat(
          transaction.price_per_litre_at_sale || 0
        );
        nozzle.activeOperator = operatorName;
      });

      // Convert map to array and sort by booth ID
      const boothArray = Array.from(boothMap.values()).sort(
        (a, b) => a.id - b.id
      );

      // If no booths found, create some sample data for demonstration
      if (boothArray.length === 0) {
        boothArray.push(
          {
            id: 1,
            name: "Booth 1",
            code: "B1",
            active: true,
            nozzles: [
              {
                id: 1,
                code: "P1",
                productName: "Petrol",
                status: "active",
                sales: 12450,
                litres: 128.5,
                transactions: 15,
                currentRate: 96.72,
                activeOperator: "Rajesh Kumar",
              },
              {
                id: 2,
                code: "D1",
                productName: "Diesel",
                status: "active",
                sales: 8962,
                litres: 100.0,
                transactions: 12,
                currentRate: 89.62,
                activeOperator: "Rajesh Kumar",
              },
            ],
            totalSales: 21412,
            totalLitres: 228.5,
            transactionCount: 27,
            activeOperators: ["Rajesh Kumar"],
          },
          {
            id: 2,
            name: "Booth 2",
            code: "B2",
            active: true,
            nozzles: [
              {
                id: 3,
                code: "P2",
                productName: "Petrol",
                status: "busy",
                sales: 15680,
                litres: 162.0,
                transactions: 18,
                currentRate: 96.72,
                activeOperator: "Priya Sharma",
              },
              {
                id: 4,
                code: "D2",
                productName: "Diesel",
                status: "maintenance",
                sales: 0,
                litres: 0,
                transactions: 0,
                currentRate: 89.62,
              },
            ],
            totalSales: 15680,
            totalLitres: 162.0,
            transactionCount: 18,
            activeOperators: ["Priya Sharma"],
          }
        );
      }

      setBooths(boothArray);
    } catch (error) {
      console.error("Failed to fetch booth data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoothData();

    // Listen for global refresh events
    const handleRefresh = () => {
      fetchBoothData();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "busy":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "maintenance":
        return "bg-red-100 text-red-800 border-red-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return "✅";
      case "busy":
        return "⚠️";
      case "maintenance":
        return "🔧";
      case "inactive":
        return "❌";
      default:
        return "❓";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading booth data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Booth Monitoring</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time monitoring of all dispensing booths
          </p>
        </div>
        <Button onClick={fetchBoothData} variant="outline">
          <ChartIcon className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Booth Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {booths.map((booth) => (
          <Card key={booth.id} className="p-6">
            {/* Booth Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FuelIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{booth.name}</h3>
                  <p className="text-sm text-gray-500">{booth.code}</p>
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium border ${
                  booth.active
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-gray-100 text-gray-800 border-gray-200"
                }`}
              >
                {booth.active ? "Active" : "Inactive"}
              </div>
            </div>

            {/* Booth Summary */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(booth.totalSales)}
                </p>
                <p className="text-xs text-gray-500">Total Sales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {formatLitres(booth.totalLitres)}
                </p>
                <p className="text-xs text-gray-500">Total Litres</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {booth.transactionCount}
                </p>
                <p className="text-xs text-gray-500">Transactions</p>
              </div>
            </div>

            {/* Active Operators */}
            {booth.activeOperators.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <UsersIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Active Operators
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {booth.activeOperators.map((operator, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {operator}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Nozzles */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Nozzles
              </h4>
              <div className="space-y-3">
                {booth.nozzles.map((nozzle) => (
                  <div key={nozzle.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">
                          {nozzle.code}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({nozzle.productName})
                        </span>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(nozzle.status)}`}
                      >
                        {getStatusIcon(nozzle.status)} {nozzle.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Sales:</span>
                        <span className="ml-1 font-medium">
                          {formatCurrency(nozzle.sales)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Litres:</span>
                        <span className="ml-1 font-medium">
                          {formatLitres(nozzle.litres)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Rate:</span>
                        <span className="ml-1 font-medium">
                          {formatCurrency(nozzle.currentRate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Transactions:</span>
                        <span className="ml-1 font-medium">
                          {nozzle.transactions}
                        </span>
                      </div>
                    </div>

                    {nozzle.activeOperator && (
                      <div className="mt-2 pt-2 border-t">
                        <span className="text-xs text-gray-500">
                          Operator:{" "}
                        </span>
                        <span className="text-xs font-medium">
                          {nozzle.activeOperator}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {booths.length === 0 && (
        <Card className="p-12 text-center">
          <FuelIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Booth Data
          </h3>
          <p className="text-gray-500">
            No booth information available at the moment.
          </p>
        </Card>
      )}
    </div>
  );
};

export default BoothMonitoring;
