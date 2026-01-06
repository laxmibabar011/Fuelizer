import api from "./apiClient";

// Types matching backend Sales model
export interface SalesData {
  id?: number;
  Date: string;
  BillNo: string;
  "Bill Mode": string;
  "Party Name": string;
  "Registration Type"?: string;
  GSTIN?: string;
  "Item Name": string;
  Qty: number;
  Rate: number;
  Amount: number;
  "GST Rate": number;
  "Taxable Value": number;
  SGST: number;
  CGST: number;
  IGST: number;
  "Cess Rate": number;
  "Cess Amt": number;
  "TCS Rate": number;
  "TCS Amt": number;
  "Invoice Value": number;

  // System fields
  source?: "POS" | "Manual" | "Import";
  status?: "Draft" | "Posted" | "Adjusted" | "Cancelled";
  payment_method_id?: number;
  product_id?: number;
  product_type?: "Fuel" | "NonFuel";
  autoSplit?: boolean;
}

export interface PaymentMethod {
  id: number;
  name: string;
  bill_mode: string;
  is_active: boolean;
  // New config fields for party name strategies
  party_name_strategy?: "fixed" | "credit_customer";
  default_party_name?: string;
  party_name_uppercase?: boolean;
}

export interface CreditCustomer {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  item_code: string;
  sales_price: number;
  cost_price: number;
  gst_rate: number;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cess_rate: number;
  tcs_rate: number;
  ProductCategory?: {
    name: string;
  };
  InventoryLevel?: {
    quantity_on_hand: number;
  };
}

export interface POSGroup {
  product_id: number;
  product_name: string;
  payment_method_id: number;
  payment_method_name: string;
  bill_mode: string;
  is_fuel?: boolean;
  total_qty: number;
  total_amount: number;
  avg_rate: number;
  needs_split: boolean;
  // Optional credit-context fields returned by backend
  credit_customer_id?: number;
  credit_customer_name?: string;
  // Party name resolution hints from payment method
  party_name_strategy?: "fixed" | "credit_customer";
  default_party_name?: string;
  party_name_uppercase?: boolean;
  transactions: any[];
}

export interface POSPreview {
  groups: POSGroup[];
  threshold: number;
  total_transactions: number;
  total_groups: number;
  groups_needing_split: number;
}

class SalesService {
  // Sales CRUD operations
  async listSales(params?: {
    date_from?: string;
    date_to?: string;
    date?: string;
    bill_mode?: string;
    item_name?: string;
    status?: string;
    limit?: number;
  }) {
    const response = await api.get("/api/tenant/sales", { params });
    return response.data;
  }

  async createManualSale(salesData: SalesData) {
    const response = await api.post("/api/tenant/sales", salesData);
    return response.data;
  }

  // Payment methods
  async getPaymentMethods() {
    const response = await api.get("/api/tenant/sales/payment-methods");
    return response.data;
  }

  // POS integration
  async previewPosGroups(params: {
    date?: string;
    shift_id?: number;
    threshold?: number;
  }) {
    const response = await api.get("/api/tenant/sales/pos-preview", { params });
    return response.data;
  }

  async exportPosGroups(data: { groups: POSGroup[]; threshold?: number }) {
    const response = await api.post("/api/tenant/sales/pos-export", data);
    return response.data;
  }

  // Product integration (using existing ProductMasterService)
  async getProductsForSale(params?: {
    category_id?: number;
    status?: "active" | "inactive";
  }) {
    const response = await api.get("/api/tenant/products", { params });
    return response.data;
  }

  // Credit customers (search) - adjust endpoint to your credit module
  async searchCreditCustomers(params: { q: string; limit?: number }) {
    const response = await api.get("/api/tenant/credit/customers", { params });
    return response.data;
  }
}

export default new SalesService();
