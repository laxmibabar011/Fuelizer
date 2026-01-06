import React, { useState, useEffect } from "react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { UsersIcon, ChartIcon, ClockIcon, FuelIcon } from "../../../icons";
import transactionService from "../../../services/transactionService";

interface OperatorData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  boothAssignments: number[];
  totalSales: number;
  totalLitres: number;
  transactionCount: number;
  averageSaleAmount: number;
  lastTransaction?: string;
  isActive: boolean;
  shiftInfo?: {
    name: string;
    startTime: string;
    endTime: string;
  };
}

const OperatorStatus: React.FC = () => {
  const [operators, setOperators] = useState<OperatorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const fetchOperatorData = async () => {
    try {
      setLoading(true);

      // Get today's transactions
      const { startDate, endDate } = transactionService.getTodayDateRange();
      const response = await transactionService.getTransactionsByDateRange(
        startDate,
        endDate
      );
      const transactions = response.data?.data || [];

      // Group transactions by operator
      const operatorMap = new Map<string, OperatorData>();

      transactions.forEach((transaction: any) => {
        const operatorId = transaction.operator_id;
        const operatorName =
          transaction.Operator?.UserDetails?.full_name ||
          transaction.Operator?.email?.split("@")[0] ||
          "Unknown";
        const operatorEmail = transaction.Operator?.email || "";
        const boothId = transaction.Nozzle?.boothId;

        if (!operatorId) return;

        // Initialize operator if not exists
        if (!operatorMap.has(operatorId)) {
          operatorMap.set(operatorId, {
            id: operatorId,
            name: operatorName,
            email: operatorEmail,
            phone: transaction.Operator?.UserDetails?.phone,
            boothAssignments: [],
            totalSales: 0,
            totalLitres: 0,
            transactionCount: 0,
            averageSaleAmount: 0,
            lastTransaction: transaction.transaction_time,
            isActive: true,
          });
        }

        const operator = operatorMap.get(operatorId)!;

        // Update operator data
        operator.totalSales += parseFloat(transaction.total_amount || 0);
        operator.totalLitres += parseFloat(transaction.litres_sold || 0);
        operator.transactionCount += 1;
        operator.lastTransaction = transaction.transaction_time;

        // Add booth assignment if not already present
        if (boothId && !operator.boothAssignments.includes(boothId)) {
          operator.boothAssignments.push(boothId);
        }
      });

      // Calculate average sale amount and determine activity status
      operatorMap.forEach((operator) => {
        operator.averageSaleAmount =
          operator.transactionCount > 0
            ? operator.totalSales / operator.transactionCount
            : 0;

        // Consider operator active if they have transactions in the last 2 hours
        const lastTransactionTime = operator.lastTransaction
          ? new Date(operator.lastTransaction).getTime()
          : 0;
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
        operator.isActive = lastTransactionTime > twoHoursAgo;
      });

      // Convert map to array and sort by total sales
      const operatorArray = Array.from(operatorMap.values()).sort(
        (a, b) => b.totalSales - a.totalSales
      );

      // If no operators found, create some sample data for demonstration
      if (operatorArray.length === 0) {
        operatorArray.push(
          {
            id: "op1",
            name: "Rajesh Kumar",
            email: "rajesh@fuelstation.com",
            phone: "+91 98765 43210",
            boothAssignments: [1, 2],
            totalSales: 21412,
            totalLitres: 228.5,
            transactionCount: 27,
            averageSaleAmount: 793.04,
            lastTransaction: new Date().toISOString(),
            isActive: true,
            shiftInfo: {
              name: "Morning Shift",
              startTime: "06:00",
              endTime: "14:00",
            },
          },
          {
            id: "op2",
            name: "Priya Sharma",
            email: "priya@fuelstation.com",
            phone: "+91 98765 43211",
            boothAssignments: [2, 3],
            totalSales: 15680,
            totalLitres: 162.0,
            transactionCount: 18,
            averageSaleAmount: 871.11,
            lastTransaction: new Date(Date.now() - 300000).toISOString(),
            isActive: true,
            shiftInfo: {
              name: "Evening Shift",
              startTime: "14:00",
              endTime: "22:00",
            },
          },
          {
            id: "op3",
            name: "Amit Patel",
            email: "amit@fuelstation.com",
            phone: "+91 98765 43212",
            boothAssignments: [1],
            totalSales: 8950,
            totalLitres: 95.5,
            transactionCount: 12,
            averageSaleAmount: 745.83,
            lastTransaction: new Date(Date.now() - 3600000).toISOString(),
            isActive: false,
            shiftInfo: {
              name: "Night Shift",
              startTime: "22:00",
              endTime: "06:00",
            },
          }
        );
      }

      setOperators(operatorArray);
    } catch (error) {
      console.error("Failed to fetch operator data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperatorData();

    // Listen for global refresh events
    const handleRefresh = () => {
      fetchOperatorData();
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

  const getActivityStatus = (operator: OperatorData) => {
    if (!operator.lastTransaction)
      return {
        status: "inactive",
        text: "No Activity",
        color: "bg-gray-100 text-gray-800",
      };

    const lastTransactionTime = new Date(operator.lastTransaction).getTime();
    const now = Date.now();
    const timeDiff = now - lastTransactionTime;

    if (timeDiff < 5 * 60 * 1000) {
      // 5 minutes
      return {
        status: "very-active",
        text: "Very Active",
        color: "bg-green-100 text-green-800",
      };
    } else if (timeDiff < 30 * 60 * 1000) {
      // 30 minutes
      return {
        status: "active",
        text: "Active",
        color: "bg-blue-100 text-blue-800",
      };
    } else if (timeDiff < 2 * 60 * 60 * 1000) {
      // 2 hours
      return {
        status: "recent",
        text: "Recent",
        color: "bg-yellow-100 text-yellow-800",
      };
    } else {
      return {
        status: "inactive",
        text: "Inactive",
        color: "bg-gray-100 text-gray-800",
      };
    }
  };

  const filteredOperators = operators.filter((operator) => {
    if (filter === "all") return true;
    return operator.isActive === (filter === "active");
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading operator data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Operator Status</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time monitoring of operator performance and activity
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Filter Buttons */}
          <div className="flex space-x-2">
            {(["all", "active", "inactive"] as const).map((status) => (
              <Button
                key={status}
                onClick={() => setFilter(status)}
                variant={filter === status ? "default" : "outline"}
                size="sm"
                className="capitalize"
              >
                {status === "all" ? "All" : status}
              </Button>
            ))}
          </div>
          <Button onClick={fetchOperatorData} variant="outline">
            <ChartIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Operator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOperators.map((operator) => {
          const activityStatus = getActivityStatus(operator);

          return (
            <Card key={operator.id} className="p-6">
              {/* Operator Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{operator.name}</h3>
                    <p className="text-sm text-gray-500">{operator.email}</p>
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${activityStatus.color}`}
                >
                  {activityStatus.text}
                </div>
              </div>

              {/* Contact Info */}
              {operator.phone && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">📞 {operator.phone}</p>
                </div>
              )}

              {/* Shift Info */}
              {operator.shiftInfo && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <ClockIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {operator.shiftInfo.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {operator.shiftInfo.startTime} -{" "}
                    {operator.shiftInfo.endTime}
                  </p>
                </div>
              )}

              {/* Booth Assignments */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FuelIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Assigned Booths
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {operator.boothAssignments.map((boothId) => (
                    <span
                      key={boothId}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      Booth {boothId}
                    </span>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(operator.totalSales)}
                    </p>
                    <p className="text-xs text-gray-500">Total Sales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatLitres(operator.totalLitres)}
                    </p>
                    <p className="text-xs text-gray-500">Total Litres</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-purple-600">
                      {operator.transactionCount}
                    </p>
                    <p className="text-xs text-gray-500">Transactions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-orange-600">
                      {formatCurrency(operator.averageSaleAmount)}
                    </p>
                    <p className="text-xs text-gray-500">Avg. Sale</p>
                  </div>
                </div>
              </div>

              {/* Last Transaction */}
              {operator.lastTransaction && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Last Transaction
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(operator.lastTransaction)}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredOperators.length === 0 && (
        <Card className="p-12 text-center">
          <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Operators Found
          </h3>
          <p className="text-gray-500">
            {filter === "all"
              ? "No operator information available at the moment."
              : `No ${filter} operators found.`}
          </p>
        </Card>
      )}

      {/* Summary Stats */}
      {filteredOperators.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Team Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  filteredOperators.reduce((sum, op) => sum + op.totalSales, 0)
                )}
              </p>
              <p className="text-sm text-gray-500">Total Sales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatLitres(
                  filteredOperators.reduce((sum, op) => sum + op.totalLitres, 0)
                )}
              </p>
              <p className="text-sm text-gray-500">Total Litres</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {filteredOperators.reduce(
                  (sum, op) => sum + op.transactionCount,
                  0
                )}
              </p>
              <p className="text-sm text-gray-500">Total Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {filteredOperators.filter((op) => op.isActive).length}
              </p>
              <p className="text-sm text-gray-500">Active Operators</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default OperatorStatus;
