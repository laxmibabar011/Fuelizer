import React, { useState, useEffect } from "react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { FuelIcon, ChartIcon, UsersIcon } from "../../../icons";
import transactionService from "../../../services/transactionService";

interface NozzleData {
  id: number;
  code: string;
  boothId: number;
  boothName: string;
  productName: string;
  status: "active" | "inactive" | "busy" | "maintenance";
  sales: number;
  litres: number;
  transactions: number;
  currentRate: number;
  activeOperator?: string;
  lastTransaction?: string;
}

const NozzleTracking: React.FC = () => {
  const [nozzles, setNozzles] = useState<NozzleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "active" | "busy" | "maintenance"
  >("all");

  const fetchNozzleData = async () => {
    try {
      setLoading(true);

      // Get today's transactions
      const { startDate, endDate } = transactionService.getTodayDateRange();
      const response = await transactionService.getTransactionsByDateRange(
        startDate,
        endDate
      );
      const transactions = response.data?.data || [];

      // Group transactions by nozzle
      const nozzleMap = new Map<number, NozzleData>();

      transactions.forEach((transaction: any) => {
        const nozzleId = transaction.nozzle_id;
        const boothId = transaction.Nozzle?.boothId;

        if (!nozzleId || !boothId) return;

        // Initialize nozzle if not exists
        if (!nozzleMap.has(nozzleId)) {
          nozzleMap.set(nozzleId, {
            id: nozzleId,
            code: transaction.Nozzle?.code || `N${nozzleId}`,
            boothId: boothId,
            boothName: `Booth ${boothId}`,
            productName: transaction.Nozzle?.Product?.name || "Unknown Fuel",
            status: "active",
            sales: 0,
            litres: 0,
            transactions: 0,
            currentRate: parseFloat(transaction.price_per_litre_at_sale || 0),
            activeOperator: undefined,
            lastTransaction: transaction.transaction_time,
          });
        }

        const nozzle = nozzleMap.get(nozzleId)!;

        // Update nozzle data
        nozzle.sales += parseFloat(transaction.total_amount || 0);
        nozzle.litres += parseFloat(transaction.litres_sold || 0);
        nozzle.transactions += 1;
        nozzle.currentRate = parseFloat(
          transaction.price_per_litre_at_sale || 0
        );
        nozzle.activeOperator =
          transaction.Operator?.UserDetails?.full_name ||
          transaction.Operator?.email?.split("@")[0] ||
          "Unknown";
        nozzle.lastTransaction = transaction.transaction_time;
      });

      // Convert map to array and sort by booth then nozzle code
      const nozzleArray = Array.from(nozzleMap.values()).sort((a, b) => {
        if (a.boothId !== b.boothId) return a.boothId - b.boothId;
        return a.code.localeCompare(b.code);
      });

      // If no nozzles found, create some sample data for demonstration
      if (nozzleArray.length === 0) {
        nozzleArray.push(
          {
            id: 1,
            code: "P1",
            boothId: 1,
            boothName: "Booth 1",
            productName: "Petrol",
            status: "active",
            sales: 12450,
            litres: 128.5,
            transactions: 15,
            currentRate: 96.72,
            activeOperator: "Rajesh Kumar",
            lastTransaction: new Date().toISOString(),
          },
          {
            id: 2,
            code: "D1",
            boothId: 1,
            boothName: "Booth 1",
            productName: "Diesel",
            status: "active",
            sales: 8962,
            litres: 100.0,
            transactions: 12,
            currentRate: 89.62,
            activeOperator: "Rajesh Kumar",
            lastTransaction: new Date(Date.now() - 300000).toISOString(),
          },
          {
            id: 3,
            code: "P2",
            boothId: 2,
            boothName: "Booth 2",
            productName: "Petrol",
            status: "busy",
            sales: 15680,
            litres: 162.0,
            transactions: 18,
            currentRate: 96.72,
            activeOperator: "Priya Sharma",
            lastTransaction: new Date(Date.now() - 60000).toISOString(),
          },
          {
            id: 4,
            code: "D2",
            boothId: 2,
            boothName: "Booth 2",
            productName: "Diesel",
            status: "maintenance",
            sales: 0,
            litres: 0,
            transactions: 0,
            currentRate: 89.62,
            lastTransaction: new Date(Date.now() - 3600000).toISOString(),
          }
        );
      }

      setNozzles(nozzleArray);
    } catch (error) {
      console.error("Failed to fetch nozzle data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNozzleData();

    // Listen for global refresh events
    const handleRefresh = () => {
      fetchNozzleData();
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

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const getProductColor = (productName: string) => {
    switch (productName.toLowerCase()) {
      case "petrol":
        return "text-blue-600 bg-blue-100";
      case "diesel":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const filteredNozzles = nozzles.filter((nozzle) => {
    if (filter === "all") return true;
    return nozzle.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading nozzle data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Nozzle Tracking</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Individual nozzle performance and status monitoring
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Filter Buttons */}
          <div className="flex space-x-2">
            {(["all", "active", "busy", "maintenance"] as const).map(
              (status) => (
                <Button
                  key={status}
                  onClick={() => setFilter(status)}
                  variant={filter === status ? "default" : "outline"}
                  size="sm"
                  className="capitalize"
                >
                  {status === "all" ? "All" : status}
                </Button>
              )
            )}
          </div>
          <Button onClick={fetchNozzleData} variant="outline">
            <ChartIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Nozzle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredNozzles.map((nozzle) => (
          <Card key={nozzle.id} className="p-4">
            {/* Nozzle Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FuelIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{nozzle.code}</h3>
                  <p className="text-xs text-gray-500">{nozzle.boothName}</p>
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(nozzle.status)}`}
              >
                {getStatusIcon(nozzle.status)}
              </div>
            </div>

            {/* Product Type */}
            <div className="mb-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getProductColor(nozzle.productName)}`}
              >
                {nozzle.productName}
              </span>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Sales</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(nozzle.sales)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Litres</span>
                <span className="text-sm font-semibold text-blue-600">
                  {formatLitres(nozzle.litres)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Rate</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(nozzle.currentRate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Transactions</span>
                <span className="text-sm font-semibold text-purple-600">
                  {nozzle.transactions}
                </span>
              </div>
            </div>

            {/* Active Operator */}
            {nozzle.activeOperator && (
              <div className="mb-3 pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <UsersIcon className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-500">Operator:</span>
                </div>
                <p className="text-xs font-medium text-gray-700 mt-1">
                  {nozzle.activeOperator}
                </p>
              </div>
            )}

            {/* Last Transaction */}
            {nozzle.lastTransaction && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Last Sale</span>
                  <span className="text-xs text-gray-500">
                    {formatTime(nozzle.lastTransaction)}
                  </span>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredNozzles.length === 0 && (
        <Card className="p-12 text-center">
          <FuelIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Nozzles Found
          </h3>
          <p className="text-gray-500">
            {filter === "all"
              ? "No nozzle information available at the moment."
              : `No nozzles with status "${filter}" found.`}
          </p>
        </Card>
      )}

      {/* Summary Stats */}
      {filteredNozzles.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  filteredNozzles.reduce((sum, n) => sum + n.sales, 0)
                )}
              </p>
              <p className="text-sm text-gray-500">Total Sales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatLitres(
                  filteredNozzles.reduce((sum, n) => sum + n.litres, 0)
                )}
              </p>
              <p className="text-sm text-gray-500">Total Litres</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {filteredNozzles.reduce((sum, n) => sum + n.transactions, 0)}
              </p>
              <p className="text-sm text-gray-500">Total Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {filteredNozzles.filter((n) => n.status === "active").length}
              </p>
              <p className="text-sm text-gray-500">Active Nozzles</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default NozzleTracking;
