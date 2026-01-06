import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import PageMeta from "../../components/common/PageMeta";
import staffshiftService from "../../services/staffshiftService";
import transactionService from "../../services/transactionService";

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
  };
  PaymentMethod?: {
    id: number;
    name: string;
  };
}

const Transactions: React.FC = () => {
  const { authUser } = useAuth();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operatorGroupId, setOperatorGroupId] = useState<number | null>(null);

  // Get cashier's operator group first
  const fetchOperatorGroup = useCallback(async () => {
    if (!authUser?.userId) return null;

    try {
      const contextResponse = await staffshiftService.getCashierPOSContext();
      const context = contextResponse.data?.data;

      if (context?.operatorGroup?.id) {
        setOperatorGroupId(context.operatorGroup.id);
        return context.operatorGroup.id;
      }
      return null;
    } catch (error) {
      console.error("Failed to get operator group:", error);
      return null;
    }
  }, [authUser?.userId]);

  // Fetch transactions by operator group
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("=== TRANSACTION FETCH DEBUG ===");
      console.log("authUser.userId:", authUser?.userId);

      // Get operator group first
      let groupId = operatorGroupId;
      if (!groupId) {
        groupId = await fetchOperatorGroup();
      }

      if (!groupId) {
        throw new Error("No operator group found for this cashier");
      }

      console.log("Fetching transactions for operator group:", groupId);

      const response =
        await transactionService.getTransactionsByOperatorGroup(groupId);
      console.log("Raw API response:", response);

      const transactionData = response.data?.data || [];
      console.log("Transactions loaded:", transactionData.length);

      setTransactions(transactionData);
    } catch (err: any) {
      console.error("Failed to fetch transactions:", err);
      setError(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [authUser?.userId, operatorGroupId, fetchOperatorGroup]);

  // Load transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Helper functions for safe number conversion
  const safeNumber = (value: string | number): number => {
    if (typeof value === "number") return value;
    return parseFloat(value) || 0;
  };

  const formatCurrency = (amount: string | number): string => {
    const num = safeNumber(amount);
    return `₹${num.toFixed(4)}`;
  };

  const formatLitres = (litres: string | number): string => {
    const num = safeNumber(litres);
    return `${num.toFixed(4)} L`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Transactions | FUELIZER"
        description="View team transactions"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Team Transactions
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                View all transactions for your operator group
              </p>
            </div>
            <button
              onClick={fetchTransactions}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">
              <h3 className="text-sm font-medium">
                Error loading transactions
              </h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Transaction History ({transactions.length})
            </h2>
            {operatorGroupId && (
              <p className="text-sm text-gray-500 mt-1">
                Operator Group ID: {operatorGroupId}
              </p>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Transactions Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                No transactions found for your operator group.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Litres
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Price/L
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Operator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Nozzle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        #{transaction.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(transaction.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatLitres(transaction.litres_sold)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(transaction.price_per_litre_at_sale)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>
                          <div className="font-medium">
                            {transaction.Operator?.UserDetails?.full_name ||
                              transaction.Operator?.email?.split("@")[0] ||
                              "Unknown"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {transaction.Operator?.email || "No email"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>
                          <div className="font-medium">
                            {transaction.Nozzle?.code || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Nozzle {transaction.nozzle_id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {transaction.PaymentMethod?.name || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(
                          transaction.transaction_time
                        ).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Total Sales
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(
                transactions.reduce(
                  (sum, tx) => sum + safeNumber(tx.total_amount),
                  0
                )
              )}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Total Litres
            </h3>
            <p className="text-2xl font-bold text-blue-600">
              {formatLitres(
                transactions.reduce(
                  (sum, tx) => sum + safeNumber(tx.litres_sold),
                  0
                )
              )}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Transactions
            </h3>
            <p className="text-2xl font-bold text-purple-600">
              {transactions.length}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Transactions;
