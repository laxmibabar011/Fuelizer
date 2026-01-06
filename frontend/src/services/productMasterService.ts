import api from "./apiClient";

export type CategoryType = "Fuel" | "Other Product";

export type ProductCategoryDTO = {
  id?: number;
  name: string;
  category_type: "Fuel" | "Non-Fuel";
  description?: string;
  is_active?: boolean;
};

export type UnitOfMeasureDTO = {
  id?: number;
  name: string;
  code: string;
};

export type ProductMasterDTO = {
  id?: number;
  name: string;
  item_code: string; // Primary product code like "D", "H2", "P", "AP31"
  product_code?: string; // Legacy field for compatibility
  hsn_code?: string;
  description?: string;
  image_url?: string;
  category_id: number;
  uom_id: number;
  sales_price: number; // Sale Rate
  cost_price: number; // Cost Price for purchase
  // Enhanced tax fields for detailed GST breakdown
  taxability?: "taxable" | "exempt" | "nil_rated" | "non_gst";
  gst_rate: number; // Total GST rate for display
  cgst_rate?: number; // CGST rate (half of total GST for intra-state)
  sgst_rate?: number; // SGST rate (half of total GST for intra-state)
  igst_rate?: number; // IGST rate (for inter-state transactions)
  cess_rate?: number; // Cess percentage
  tcs_rate?: number; // TCS (Tax Collected at Source) rate
  status?: "active" | "inactive";
  // Inventory fields
  opening_stock?: number;
  reorder_level?: number;
};

export type InventoryLevelDTO = {
  id?: number;
  product_id: number;
  quantity_on_hand: number;
  opening_stock: number;
  stock_value: number;
  opening_stock_value: number;
  reorder_level?: number;
  reorder_value?: number;
};

export type ProductWithRelationsDTO = ProductMasterDTO & {
  ProductCategory?: ProductCategoryDTO;
  UnitOfMeasure?: UnitOfMeasureDTO;
  InventoryLevel?: InventoryLevelDTO;
};

const ProductMasterService = {
  // Categories
  listCategories(params?: { is_active?: boolean | "true" | "false" }) {
    return api.get("/api/tenant/categories", { params });
  },
  createCategory(payload: ProductCategoryDTO) {
    return api.post("/api/tenant/categories", payload);
  },
  updateCategory(id: number, payload: Partial<ProductCategoryDTO>) {
    return api.put(`/api/tenant/categories/${id}`, payload);
  },
  deleteCategory(id: number) {
    return api.delete(`/api/tenant/categories/${id}`);
  },

  // Units of Measure
  listUoms() {
    return api.get("/api/tenant/uom");
  },
  createUom(payload: UnitOfMeasureDTO) {
    return api.post("/api/tenant/uom", payload);
  },

  // Products
  listProducts(params?: {
    category_id?: number;
    status?: "active" | "inactive";
  }) {
    return api.get("/api/tenant/products", { params });
  },
  // New method specifically for purchase module
  getProductsForPurchase(params?: {
    category_id?: number;
    status?: "active" | "inactive";
  }) {
    return api.get("/api/tenant/products/purchase", { params });
  },
  getProduct(id: number) {
    return api.get(`/api/tenant/products/${id}`);
  },
  createProduct(payload: ProductMasterDTO) {
    return api.post("/api/tenant/products", payload);
  },
  createProductMultipart(formData: FormData) {
    return api.post("/api/tenant/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  updateProduct(id: number, payload: Partial<ProductMasterDTO>) {
    return api.put(`/api/tenant/products/${id}`, payload);
  },
  updateProductMultipart(id: number, formData: FormData) {
    return api.put(`/api/tenant/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteProduct(id: number) {
    return api.delete(`/api/tenant/products/${id}`);
  },
  restoreProduct(id: number) {
    return api.patch(`/api/tenant/products/${id}/restore`);
  },

  // Inventory Management
  getInventoryLevels() {
    return api.get("/api/tenant/inventory");
  },
  adjustInventory(productId: number, newQuantity: number, reason?: string) {
    return api.post("/api/tenant/inventory/adjust", {
      product_id: productId,
      new_quantity: newQuantity,
      reason: reason || "Manual Adjustment",
    });
  },
};

export default ProductMasterService;
