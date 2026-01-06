import apiClient from "./apiClient";

export interface Vendor {
  id: number;
  name: string;
  gst_number?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: "active" | "inactive";
  city?: string;
  state?: string;
  pincode?: string;
  customer_id?: string;
  aadhaar_number?: string;
  pan?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  cheque_number?: string;
  area_route?: string;
  tin?: string;
}

export interface PurchaseItem {
  id?: number;
  product_id: number;
  product_name_at_purchase: string;
  hsn_code_at_purchase?: string;
  quantity: number;
  purchase_rate: number;
  sales_price?: number;
  discount_amount: number;
  line_total: number;
  taxable_amount: number;
  gst_rate: number;
  cess_rate?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  cess_amount?: number;
}

export interface Purchase {
  id: number;
  vendor_id: number;
  invoice_number: string;
  invoice_date: string;
  stock_received_date: string;
  payment_mode: "Cash" | "Credit" | "Bank Transfer";
  notes?: string;
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  other_charges: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_rate?: number;
  cess_amount: number;
  total_amount: number;
  status: "Draft" | "Confirmed" | "Received" | "Cancelled" | "Deleted" | "Stock Updated";
  deleted_at?: string;
  created_by_id?: number;
  createdAt: string;
  updatedAt: string;
  Vendor?: Vendor;
  items?: PurchaseItem[];
}

export interface ProductForPurchase {
  id: number;
  name: string;
  item_code?: string;
  product_code?: string;
  hsn_code?: string;
  sales_price?: number;
  cost_price?: number;
  taxability?: 'taxable' | 'exempt' | 'nil_rated' | 'non_gst';
  gst_rate: number;
  cgst_rate?: number;
  sgst_rate?: number;
  igst_rate?: number;
  cess_rate?: number;
  tcs_rate?: number;
  InventoryLevel?: {
    quantity_on_hand: number;
    opening_stock?: number;
    stock_value?: number;
    opening_stock_value?: number;
    reorder_level?: number;
    reorder_value?: number;
  };
}

class PurchaseService {
  // Vendor methods
  async listVendors(params?: any) {
    const response = await apiClient.get("/api/tenant/vendors", { params });
    return response.data;
  }

  async createVendor(vendor: Partial<Vendor>) {
    const response = await apiClient.post("/api/tenant/vendors", vendor);
    return response.data;
  }

  async getVendor(id: number) {
    const response = await apiClient.get(`/api/tenant/vendors/${id}`);
    return response.data;
  }

  async updateVendor(id: number, vendor: Partial<Vendor>) {
    const response = await apiClient.put(`/api/tenant/vendors/${id}`, vendor);
    return response.data;
  }

  async deleteVendor(id: number) {
    const response = await apiClient.delete(`/api/tenant/vendors/${id}`);
    return response.data;
  }

  // Purchase methods
  async listPurchases(params?: any) {
    console.log('PurchaseService.listPurchases called with params:', params);
    const response = await apiClient.get("/api/tenant/purchases", { params });
    console.log('PurchaseService.listPurchases response:', response);
    return response.data;
  }

  async createPurchase(purchase: Partial<Purchase>) {
    const response = await apiClient.post("/api/tenant/purchases", purchase);
    return response.data;
  }

  async getPurchase(id: number) {
    const response = await apiClient.get(`/api/tenant/purchases/${id}`);
    return response.data;
  }

  async updatePurchase(id: number, purchase: Partial<Purchase>) {
    const response = await apiClient.put(
      `/api/tenant/purchases/${id}`,
      purchase
    );
    return response.data;
  }

  async receivePurchase(id: number) {
    const response = await apiClient.post(
      `/api/tenant/purchases/${id}/receive`
    );
    return response.data;
  }

  // Utility methods
  async getProductsForPurchase() {
    const response = await apiClient.get("/api/tenant/purchase-products");
    return response.data;
  }

  async calculateItemTotal(item: Partial<PurchaseItem>) {
    const response = await apiClient.post(
      "/api/tenant/purchase-calculate-item",
      item
    );
    return response.data;
  }

  async updateStockPurchase(id: number) {
    const response = await apiClient.post(`/api/tenant/purchases/${id}/update-stock`);
    return response.data;
  }

  async softDeletePurchase(id: number) {
    const response = await apiClient.delete(`/api/tenant/purchases/${id}`);
    return response.data;
  }

  async restorePurchase(id: number) {
    const response = await apiClient.post(`/api/tenant/purchases/${id}/restore`);
    return response.data;
  }
}

export default new PurchaseService();
