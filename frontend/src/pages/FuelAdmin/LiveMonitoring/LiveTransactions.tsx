import React, { useState, useEffect } from "react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ClockIcon, EyeIcon } from "../../../icons";
import transactionService from "../../../services/transactionService";

interface TransactionItem {
  id: number;
  operator_id: string;
  nozzle_id: number;
  litres_sold: string | number;
  price_per_litre_at_sale: string | number;
  total_amount: string | number;
  payment_method_id: number;
  operator_group_id?: number;
  transaction_time: string;
  Operator?: {
    user_id: string;
    email: string;
    UserDetails?: {
      full_name?: string;
      phone?: string;
    };
  };
  Nozzle?: {
    id: number;
    code: string;
    boothId: number;
    Product?: {
      id: number;
      name: string;
      category: string;
    };
  };
  PaymentMethod?: {
    id: number;
    name: string;
  };
}

const LiveTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBooth, setFilterBooth] = useState<string>("all");
  const [filterOperator, setFilterOperator] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"time" | "amount" | "litres">("time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      console.log("Fetching all recent transactions...");
      const response = await transactionService.getAllTransactions(50);

      const allTransactions = response.data?.data || [];
      console.log("Recent transactions loaded:", allTransactions.length);
      setTransactions(allTransactions);
    } catch (error) {
      console.error("Failed to fetch recent transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Listen for global refresh events
    const handleRefresh = () => {
      fetchTransactions();
    };

    window.addEventListener("liveMonitoringRefresh", handleRefresh);
    return () =>
      window.removeEventListener("liveMonitoringRefresh", handleRefresh);
  }, []);

  // Helper functions for safe number conversion
  const safeNumber = (value: string | number): number => {
    if (typeof value === "number") return value;
    return parseFloat(value) || 0;
  };

  const formatCurrency = (amount: string | number): string => {
    const num = safeNumber(amount);
    return `₹${num.toFixed(2)}`;
  };

  const formatLitres = (litres: string | number): string => {
    const num = safeNumber(litres);
    return `${num.toFixed(2)} L`;
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDateTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = transactions
    .filter((transaction) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const operatorName =
          transaction.Operator?.UserDetails?.full_name ||
          transaction.Operator?.email?.split("@")[0] ||
          "";
        const nozzleCode = transaction.Nozzle?.code || "";
        const productName = transaction.Nozzle?.Product?.name || "";

        if (
          !operatorName.toLowerCase().includes(searchLower) &&
          !nozzleCode.toLowerCase().includes(searchLower) &&
          !productName.toLowerCase().includes(searchLower) &&
          !transaction.id.toString().includes(searchLower)
        ) {
          return false;
        }
      }

      // Booth filter
      if (filterBooth !== "all") {
        const boothId = transaction.Nozzle?.boothId?.toString();
        if (boothId !== filterBooth) return false;
      }

      // Operator filter
      if (filterOperator !== "all") {
        if (transaction.operator_id !== filterOperator) return false;
      }

      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "time":
          aValue = new Date(a.transaction_time).getTime();
          bValue = new Date(b.transaction_time).getTime();
          break;
        case "amount":
          aValue = safeNumber(a.total_amount);
          bValue = safeNumber(b.total_amount);
          break;
        case "litres":
          aValue = safeNumber(a.litres_sold);
          bValue = safeNumber(b.litres_sold);
          break;
        default:
          aValue = new Date(a.transaction_time).getTime();
          bValue = new Date(b.transaction_time).getTime();
      }

      if (sortOrder === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

  // Get unique booths and operators for filters
  const uniqueBooths: number[] = Array.from(
    new Set(
      transactions
        .map((t) => t.Nozzle?.boothId)
        .filter((b): b is number => typeof b === "number")
    )
  ).sort((a, b) => a - b);

  const uniqueOperators = Array.from(
    new Set(
      transactions.map((t) => ({
        id: t.operator_id,
        name:
          t.Operator?.UserDetails?.full_name ||
          t.Operator?.email?.split("@")[0] ||
          "Unknown",
      }))
    )
  ).filter(
    (op, index, self) => index === self.findIndex((o) => o.id === op.id)
  );

  const handleSort = (field: "time" | "amount" | "litres") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading transactions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Live Transactions</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time transaction feed with filtering and search
          </p>
        </div>
        <Button onClick={fetchTransactions} variant="outline">
          <ClockIcon className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <EyeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Booth Filter */}
          <select
            value={filterBooth}
            onChange={(e) => setFilterBooth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Booths</option>
            {uniqueBooths.map((boothId) => (
              <option key={boothId} value={boothId.toString()}>
                Booth {boothId}
              </option>
            ))}
          </select>

          {/* Operator Filter */}
          <select
            value={filterOperator}
            onChange={(e) => setFilterOperator(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Operators</option>
            {uniqueOperators.map((operator) => (
              <option key={operator.id} value={operator.id}>
                {operator.name}
              </option>
            ))}
          </select>

          {/* Sort Options */}
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "time" | "amount" | "litres")
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="time">Sort by Time</option>
              <option value="amount">Sort by Amount</option>
              <option value="litres">Sort by Litres</option>
            </select>
            <Button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              variant="outline"
              size="sm"
              className="px-3"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Transaction Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredAndSortedTransactions.length} of{" "}
          {transactions.length} transactions
        </p>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="p-6">
        {filteredAndSortedTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No transactions found matching your criteria
            </p>
          </div>
        ) : (
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      ID
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("amount")}
                    >
                      Amount{" "}
                      {sortBy === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("litres")}
                    >
                      Litres{" "}
                      {sortBy === "litres" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Operator
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Nozzle
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Payment
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("time")}
                    >
                      Time{" "}
                      {sortBy === "time" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAndSortedTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        #{transaction.id}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(transaction.total_amount)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatLitres(transaction.litres_sold)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>
                          <div className="font-medium text-xs">
                            {transaction.Nozzle?.Product?.name ||
                              "Unknown Fuel"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(
                              transaction.price_per_litre_at_sale
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>
                          <div className="font-medium text-xs">
                            {transaction.Operator?.UserDetails?.full_name ||
                              transaction.Operator?.email?.split("@")[0] ||
                              "Unknown"}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>
                          <div className="font-medium text-xs">
                            {transaction.Nozzle?.code || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Booth {transaction.Nozzle?.boothId || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {transaction.PaymentMethod?.name || "Cash"}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>
                          <div className="font-medium text-xs">
                            {formatTime(transaction.transaction_time)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDateTime(transaction.transaction_time)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LiveTransactions;
