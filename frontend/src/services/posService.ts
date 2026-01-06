/**
 * POS Service
 * API service for Point of Sale operations
 */

import apiClient from "./apiClient";
import type {
  TransactionData,
  TransactionResponse,
} from "../pages/Operator/POS/types";

class POSService {
  // Get booth configuration for cashier
  async getBoothConfig(cashierId: string) {
    return apiClient.get(`/api/tenant/pos/booth-config/${cashierId}`);
  }

  // Get attendants for operator group
  async getAttendants(operatorGroupId: string) {
    return apiClient.get(`/api/tenant/pos/attendants/${operatorGroupId}`);
  }

  // Get current fuel prices
  async getFuelPrices() {
    return apiClient.get("/api/tenant/pos/fuel-prices");
  }

  // Record transaction
  async recordTransaction(
    transactionData: TransactionData
  ): Promise<TransactionResponse> {
    const payload = {
      operatorId: transactionData.attendantId,
      operatorGroupId: transactionData.operatorGroupId,
      nozzleId: transactionData.nozzleId,
      // Send both amount and price in amount-mode; backend will prefer amount if present
      amount: transactionData.amount,
      litresSold: transactionData.litres,
      pricePerLitre: transactionData.pricePerLitre,
      paymentMethodId: transactionData.paymentMethodId,
      creditCustomerId: transactionData.creditCustomerId,
    };

    const response = await apiClient.post(
      "/api/tenant/transactions/cashier",
      payload
    );
    return response.data;
  }

  // Get transaction receipt
  async getReceipt(transactionId: string) {
    return apiClient.get(`/api/tenant/pos/receipt/${transactionId}`);
  }

  // Get shift summary
  async getShiftSummary(shiftLedgerId: string) {
    return apiClient.get(
      `/api/tenant/transactions/shift-summary/${shiftLedgerId}`
    );
  }
}

export default new POSService();
