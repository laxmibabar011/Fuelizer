/**
 * Payment Method Service
 * Handles CRUD operations for payment methods
 */

import apiClient from "./apiClient";

export interface PaymentMethodDTO {
  id: number;
  name: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePaymentMethodRequest {
  name: string;
}

export interface UpdatePaymentMethodRequest {
  name?: string;
  is_active?: boolean;
}

class PaymentMethodService {
  private readonly basePath = "/api/tenant/payment-methods";

  /**
   * Create a new payment method
   */
  async create(data: CreatePaymentMethodRequest): Promise<PaymentMethodDTO> {
    const response = await apiClient.post(this.basePath, data);
    return response.data.data;
  }

  /**
   * Get all payment methods
   * @param includeInactive - Include inactive payment methods in the result
   */
  async list(includeInactive = false): Promise<PaymentMethodDTO[]> {
    const params = includeInactive ? { includeInactive: "true" } : {};
    const response = await apiClient.get(this.basePath, { params });
    return response.data.data;
  }

  /**
   * Get payment method by ID
   */
  async getById(id: number): Promise<PaymentMethodDTO> {
    const response = await apiClient.get(`${this.basePath}/${id}`);
    return response.data.data;
  }

  /**
   * Update payment method
   */
  async update(id: number, data: UpdatePaymentMethodRequest): Promise<void> {
    await apiClient.put(`${this.basePath}/${id}`, data);
  }

  /**
   * Delete payment method (soft delete - sets is_active to false)
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * Get active payment methods formatted for POS usage
   * Maps backend format to POS PaymentMethod interface
   */
  async getForPOS(): Promise<
    Array<{
      id: string;
      name: string;
      icon: string;
      isActive: boolean;
      requiresCustomer?: boolean;
    }>
  > {
    const paymentMethods = await this.list(false); // Only active methods

    return paymentMethods.map((method) => ({
      id: method.id.toString(),
      name: method.name,
      icon: this.getPaymentMethodIcon(method.name),
      isActive: method.is_active,
      requiresCustomer: method.name.toLowerCase().includes("credit"),
    }));
  }

  /**
   * Get appropriate icon for payment method based on name
   */
  private getPaymentMethodIcon(name: string): string {
    const lowerName = name.toLowerCase();

    if (lowerName.includes("cash")) return "💰";
    if (
      lowerName.includes("card") ||
      lowerName.includes("debit") ||
      lowerName.includes("credit card")
    )
      return "💳";
    if (
      lowerName.includes("upi") ||
      lowerName.includes("mobile") ||
      lowerName.includes("phone")
    )
      return "📱";
    if (lowerName.includes("credit") && !lowerName.includes("card"))
      return "🏪";
    if (
      lowerName.includes("wallet") ||
      lowerName.includes("paytm") ||
      lowerName.includes("gpay")
    )
      return "📱";
    if (lowerName.includes("bank") || lowerName.includes("transfer"))
      return "🏦";
    if (lowerName.includes("check") || lowerName.includes("cheque"))
      return "📄";

    // Default icon
    return "💳";
  }
}

// Export singleton instance
export default new PaymentMethodService();
