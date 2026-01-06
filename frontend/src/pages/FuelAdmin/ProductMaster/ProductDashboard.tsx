import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs/Tabs";
import {
  Card,
  CardContent,
} from "../../../components/ui/card";
import ProductMasterService from "../../../services/productMasterService";
import {
  Package,
  ShoppingCart,
  TrendingDown,
  XCircle,
  List,
  Layers,
  PlusCircle,
} from "lucide-react";

// Import tab components
import ProductList from "./ProductList";
import AddProduct from "./AddProduct";
import ProductCategories from "./ProductCategories";
import UnitsOfMeasure from "./UnitsOfMeasure";
import Inventory from "./Inventory";

type ProductStatus = "active" | "inactive";

type Product = {
  id: number;
  name: string;
  product_code?: string;
  hsn_code?: string;
  description?: string;
  image_url?: string;
  category_id: number;
  uom_id: number;
  sales_price: number;
  gst_rate: number;
  status: ProductStatus;
  // Relations from backend includes
  ProductCategory?: Category;
  UnitOfMeasure?: UoM;
  InventoryLevel?: InventoryLevel;
};

type Category = {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
};

type UoM = {
  id: number;
  name: string;
  code: string;
};

type InventoryLevel = {
  id: number;
  product_id: number;
  quantity_on_hand: number;
  reorder_level?: number;
};

const ProductDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [prefillName, setPrefillName] = useState<string>("");
  const [defaultTab, setDefaultTab] = useState<string>("products");
  const [tabsKey, setTabsKey] = useState<number>(0);
  const apiBase = (import.meta as any).env.VITE_API_BASE_URL || "";
  const resolveImageUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return `${apiBase}${url}`;
    return url;
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [uoms, setUoms] = useState<UoM[]>([]);
  const [inventoryLevels, setInventoryLevels] = useState<InventoryLevel[]>([]);

  const totalProducts = products.length;
  const lowStockProducts = useMemo(
    () =>
      products.filter((p) => {
        const inventory = p.InventoryLevel;
        if (!inventory) return false;
        return inventory.quantity_on_hand <= (inventory.reorder_level || 0) && inventory.quantity_on_hand > 0;
      }).length,
    [products]
  );

  const outOfStockProducts = useMemo(
    () =>
      products.filter((p) => {
        const inventory = p.InventoryLevel;
        if (!inventory) return true; // No inventory record means out of stock
        return inventory.quantity_on_hand === 0;
      }).length,
    [products]
  );

  // Helper functions to load data from API
  function mapApiCategory(c: any): Category {
    return {
      id: c.id,
      name: c.name || "",
      description: c.description || "",
      is_active: c.is_active ?? true,
    };
  }

  function mapApiProduct(p: any): Product {
    return {
      id: p.id,
      name: p.name || "",
      product_code: p.product_code,
      hsn_code: p.hsn_code,
      description: p.description || "",
      image_url: resolveImageUrl(p.image_url || ""),
      category_id: p.category_id,
      uom_id: p.uom_id,
      sales_price: p.sales_price || 0,
      gst_rate: p.gst_rate || 0,
      status: p.status || "active",
      // Include relations
      ProductCategory: p.ProductCategory,
      UnitOfMeasure: p.UnitOfMeasure,
      InventoryLevel: p.InventoryLevel,
    };
  }

  function mapApiUom(u: any): UoM {
    return {
      id: u.id,
      name: u.name || "",
      code: u.code || "",
    };
  }

  function refreshCategories() {
    ProductMasterService.listCategories({ is_active: true })
      .then((res) => {
        const list = (res.data?.data || []) as any[];
        setCategories(list.map(mapApiCategory));
      })
      .catch((err) => console.error(err));
  }

  function refreshProducts() {
    ProductMasterService.listProducts({ status: "active" })
      .then((res) => {
        const list = (res.data?.data || []) as any[];
        setProducts(list.map(mapApiProduct));
      })
      .catch((err) => console.error(err));
  }

  function refreshUoms() {
    ProductMasterService.listUoms()
      .then((res) => {
        const list = (res.data?.data || []) as any[];
        setUoms(list.map(mapApiUom));
      })
      .catch((err) => console.error(err));
  }

  function refreshInventoryLevels() {
    ProductMasterService.getInventoryLevels()
      .then((res) => {
        const list = (res.data?.data || []) as any[];
        setInventoryLevels(list);
      })
      .catch((err) => console.error(err));
  }

  const refreshAll = () => {
    refreshCategories();
    refreshProducts();
    refreshUoms();
    refreshInventoryLevels();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Handle ?prefill= to auto-open Add Product tab and prefill name
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prefill = params.get("prefill");
    if (prefill && prefill.trim()) {
      setDefaultTab("add-product");
      setPrefillName(prefill);
      // remove prefill from URL to avoid repeated triggers
      params.delete("prefill");
      const rest = params.toString();
      navigate({ pathname: location.pathname, search: rest ? `?${rest}` : "" }, { replace: true });
      // force Tabs re-mount to honor new defaultValue
      setTabsKey((k) => k + 1);
    }
  }, [location.search, location.pathname, navigate]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Product Master Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your fuel station products and categories
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Categories
                </p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Products
                </p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Low Stock
                </p>
                <p className="text-2xl font-bold">{lowStockProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Out of Stock
                </p>
                <p className="text-2xl font-bold">{outOfStockProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

  <Tabs key={tabsKey} defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="add-product" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Add Product</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="uom" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Units</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Inventory</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <ProductList 
            products={products}
            categories={categories}
            onRefresh={refreshProducts}
          />
        </TabsContent>

        <TabsContent value="add-product" className="space-y-6">
          <AddProduct 
            categories={categories}
            uoms={uoms}
            onProductAdded={refreshAll}
            prefillName={prefillName}
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <ProductCategories 
            categories={categories}
            products={products}
            onRefresh={refreshCategories}
          />
        </TabsContent>

        <TabsContent value="uom" className="space-y-6">
          <UnitsOfMeasure 
            uoms={uoms}
            onRefresh={refreshUoms}
          />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Inventory 
            inventoryLevels={inventoryLevels}
            products={products}
            onRefresh={refreshInventoryLevels}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductDashboard;
