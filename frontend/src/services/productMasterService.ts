import api from "./apiClient";

export type CategoryType = "Fuel" | "Other Product";

export type ProductCategoryDTO = {
  id?: string;
  category_type: CategoryType;
  name?: string;
  description?: string;
  is_active?: boolean;
};

export type ProductMasterDTO = {
  id?: string;
  category_type: CategoryType;
  category_id?: string;
  name: string;
  supplier?: string;
  uom: string;
  hsn?: string;
  description?: string;
  image_url?: string;
  mrp?: number;
  sale_price?: number;
  stock?: number;
  reorder_level?: number;
  discount?: number;
  cgst?: number;
  igst?: number;
  sgst?: number;
  vat?: number;
  sac?: string;
  status?: "active" | "inactive";
};

const ProductMasterService = {
  // Categories
  listCategories(params?: {
    category_type?: CategoryType;
    is_active?: boolean | "true" | "false";
  }) {
    return api.get("/api/tenant/product-master/categories", { params });
  },
  createCategory(payload: ProductCategoryDTO) {
    return api.post("/api/tenant/product-master/categories", payload);
  },
  updateCategory(id: string, payload: Partial<ProductCategoryDTO>) {
    return api.put(`/api/tenant/product-master/categories/${id}`, payload);
  },
  deleteCategory(id: string) {
    return api.delete(`/api/tenant/product-master/categories/${id}`);
  },

  // Products
  listProducts(params?: {
    category_type?: CategoryType;
    category_id?: string;
    status?: "active" | "inactive";
  }) {
    return api.get("/api/tenant/product-master/products", { params });
  },
  getProduct(id: string) {
    return api.get(`/api/tenant/product-master/products/${id}`);
  },
  createProduct(payload: ProductMasterDTO) {
    return api.post("/api/tenant/product-master/products", payload);
  },
  createProductMultipart(formData: FormData) {
    return api.post("/api/tenant/product-master/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  updateProduct(id: string, payload: Partial<ProductMasterDTO>) {
    return api.put(`/api/tenant/product-master/products/${id}`, payload);
  },
  updateProductMultipart(id: string, formData: FormData) {
    return api.put(`/api/tenant/product-master/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteProduct(id: string) {
    return api.delete(`/api/tenant/product-master/products/${id}`);
  },
};

export default ProductMasterService;
