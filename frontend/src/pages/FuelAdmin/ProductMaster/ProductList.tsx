import React, { useState } from "react";
import {
  Card,
  CardContent,
} from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import { Badge } from "../../../components/ui/badge";
import Switch from "../../../components/form/switch/Switch";
import Select from "../../../components/form/Select";
import Label from "../../../components/form/Label";
import ProductMasterService from "../../../services/productMasterService";
import {
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Check,
  Filter,
} from "lucide-react";

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

interface ProductListProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, categories, onRefresh }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showArchivedProducts, setShowArchivedProducts] = useState<boolean>(false);

  function handleDeleteProduct(product: Product) {
    if (
      !window.confirm(
        `Do you want to delete "${product.name}"?\nThis will archive the product.`
      )
    )
      return;
    ProductMasterService.deleteProduct(product.id)
      .then(() => {
        onRefresh();
        window.alert("Product deleted successfully");
      })
      .catch((err) => {
        console.error(err);
        window.alert("Failed to delete product");
      });
  }

  function ProductCard({ product }: { product: Product }) {
    const category = product.ProductCategory;
    const inventory = product.InventoryLevel;
    const isLowStock = inventory
      ? inventory.quantity_on_hand <= (inventory.reorder_level || 0)
      : false;

    return (
      <Card className="relative w-full max-w-sm border shadow-md bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/70">
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {showArchivedProducts && product.status === "inactive" ? (
            <Button
              size="sm"
              variant="outline"
              className="!h-7 !px-3 bg-green-600 hover:bg-green-700 text-white rounded-full text-xs font-medium border-green-600"
              onClick={() => {
                ProductMasterService.restoreProduct(product.id)
                  .then(() => {
                    onRefresh();
                    window.alert("Product restored");
                  })
                  .catch(() => window.alert("Failed to restore product"));
              }}
              aria-label="Restore product"
            >
              <Check className="h-3 w-3 mr-1 text-white" /> Restore
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="!h-7 !w-7 !p-0 !px-0 !py-0 bg-white/90 hover:bg-blue-50 shadow-sm border border-gray-200 rounded-full dark:bg-gray-800 dark:hover:bg-gray-700"
                onClick={() => {
                  // TODO: Implement edit functionality
                  window.alert("Edit functionality will be implemented");
                }}
                aria-label="Edit product"
              >
                <Edit className="h-3 w-3 text-blue-600" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="!h-7 !w-7 !p-0 !px-0 !py-0 bg-white/90 hover:bg-red-50 shadow-sm border border-gray-200 rounded-full dark:bg-gray-800 dark:hover:bg-gray-700"
                onClick={() => handleDeleteProduct(product)}
                aria-label="Delete product"
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </Button>
            </>
          )}
        </div>

        <CardContent className="p-4">
          <div className="relative mb-3 mt-6">
            <div className="w-full h-32 bg-white border-2 border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="h-8 w-8" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500 font-medium">
                ID: {product.id}
              </p>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                {product.name}
              </h3>
            </div>

            <div>
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {category?.name || "No Category"}
              </Badge>
              {product.product_code && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 ml-1">
                  {product.product_code}
                </Badge>
              )}
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Sales Price
                  </p>
                  <p className="font-bold text-green-700 dark:text-green-400">
                    ₹{product.sales_price}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    GST: {product.gst_rate}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    per {product.UnitOfMeasure?.name || "unit"}
                  </p>
                </div>
              </div>
            </div>

            {inventory && (
              <div className="flex justify-between items-center text-xs">
                <div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Stock:{" "}
                    <span
                      className={`font-semibold ${isLowStock ? "text-red-600" : "text-green-600"}`}
                    >
                      {inventory.quantity_on_hand}
                    </span>
                  </p>
                </div>
                {inventory.reorder_level && (
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Reorder:{" "}
                      <span className="font-semibold">
                        {inventory.reorder_level}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {isLowStock && inventory && (
              <div className="flex items-center gap-1 text-red-600 bg-red-50 dark:bg-red-900/20 p-1 rounded text-xs">
                <AlertTriangle className="h-3 w-3" />
                <span>Low Stock Alert</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter products based on selected category and archive status
  const filteredProducts = products.filter((product) => {
    // Filter by archive status
    const archiveMatch = showArchivedProducts 
      ? product.status === "inactive" 
      : product.status === "active";
    
    // Filter by category (compare with category_id; relation may be absent)
    const categoryMatch = selectedCategory === "all"
      ? true
      : product.category_id === parseInt(selectedCategory);
    
    return archiveMatch && categoryMatch;
  });

  // Group products by category for display
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const categoryName = product.ProductCategory?.name || "Uncategorized";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Label className="text-sm font-medium">Filter by Category:</Label>
          </div>
          <Select
            defaultValue={selectedCategory}
            onChange={(value) => setSelectedCategory(value)}
            options={[
              { value: "all", label: "All Categories" },
              ...categories.map((c) => ({
                value: String(c.id),
                label: c.name,
              }))
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            label="Show archived"
            defaultChecked={showArchivedProducts}
            onChange={(checked) => setShowArchivedProducts(checked)}
          />
        </div>
      </div>

      {/* Products Display */}
      <div className="space-y-6">
        {Object.keys(groupedProducts).length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            {showArchivedProducts ? "No archived products" : "No products found"}
          </div>
        ) : (
          Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
            <div key={categoryName} className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {categoryName}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductList;
