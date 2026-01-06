import apiClient from "./apiClient";

export interface TransactionListItem {
  id: number;
  operator_id: string;
  nozzle_id: number;
  litres_sold: number;
  price_per_litre_at_sale: number;
  total_amount: number;
  payment_method_id: number;
  operator_group_id?: number;
  transaction_time: string;

  // Populated via includes
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
    Booth?: {
      id: number;
      name: string;
    };
  };
  PaymentMethod?: {
    id: number;
    name: string;
  };
}

class TransactionService {
  async getTransactionsByOperator(
    operatorId: string,
    options?: { startDate?: string; endDate?: string }
  ) {
    const params = new URLSearchParams();
    if (options?.startDate) params.set("startDate", options.startDate);
    if (options?.endDate) params.set("endDate", options.endDate);

    const queryString = params.toString();
    const url = queryString
      ? `api/tenant/transactions/operator/${operatorId}?${queryString}`
      : `api/tenant/transactions/operator/${operatorId}`;

    return apiClient.get(url);
  }

  async getTransactionsByDateRange(startDate: string, endDate: string) {
    return apiClient.get("api/tenant/transactions/date-range", {
      params: { startDate, endDate },
    });
  }

  async getTransactionsByOperatorGroup(operatorGroupId: string | number) {
    return apiClient.get(
      `api/tenant/transactions/operator-group/${operatorGroupId}`
    );
  }

  async getAllTransactions(limit: number = 50) {
    return apiClient.get(`api/tenant/transactions/all?limit=${limit}`);
  }

  async getTransactionById(id: number) {
    return apiClient.get(`api/tenant/transactions/${id}`);
  }

  // Helper: Get today's date range
  getTodayDateRange() {
    const today = new Date();
    const startDate = today.toISOString().split("T")[0] + "T00:00:00.000Z";
    const endDate = today.toISOString().split("T")[0] + "T23:59:59.999Z";
    return { startDate, endDate };
  }

  // Helper: Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  }

  // Helper: Format litres
  formatLitres(litres: number): string {
    return `${litres.toFixed(4)} L`;
  }

  // Helper: Format time
  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
}

export default new TransactionService();
