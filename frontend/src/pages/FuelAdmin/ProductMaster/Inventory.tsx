import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import {
  AlertTriangle,
  Package,
  TrendingDown,
  IndianRupee,
  Filter,
  Search,
} from "lucide-react";
type InventoryLevel = {
  id: number;
  product_id: number;
  quantity_on_hand: number;
  reorder_level?: number;
};

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
  status: string;
  ProductCategory?: any;
  UnitOfMeasure?: any;
  InventoryLevel?: any;
};

interface InventoryProps {
  inventoryLevels: InventoryLevel[];
  products: Product[];
  onRefresh: () => void;
}

type FilterType = "all" | "fuel" | "other" | "low-stock" | "out-of-stock";

const Inventory: React.FC<InventoryProps> = ({ inventoryLevels, products }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  // Create enhanced inventory data by combining products with their inventory levels
  const enhancedInventory = products.map(product => {
    const inventoryLevel = inventoryLevels.find(inv => inv.product_id === product.id);
    const quantityOnHand = inventoryLevel?.quantity_on_hand || 0;
    const reorderLevel = inventoryLevel?.reorder_level || 0;
    const stockValue = quantityOnHand * product.sales_price;
    
    return {
      ...product,
      quantityOnHand,
      reorderLevel,
      stockValue,
      isLowStock: quantityOnHand <= reorderLevel && reorderLevel > 0,
      isOutOfStock: quantityOnHand === 0,
      isFuel: product.ProductCategory?.category_type === 'Fuel' || false
    };
  });

  // Filter and search logic
  const filteredInventory = enhancedInventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.ProductCategory?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.ProductCategory?.category_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (filterType) {
      case "fuel":
        return item.isFuel;
      case "other":
        return !item.isFuel;
      case "low-stock":
        return item.isLowStock;
      case "out-of-stock":
        return item.isOutOfStock;
      default:
        return true;
    }
  });

  // Calculate summary statistics
  const totalItems = enhancedInventory.length;

  const getStockStatusColor = (item: any) => {
    if (item.isOutOfStock) return "text-red-600";
    if (item.isLowStock) return "text-orange-600";
    return "text-green-600";
  };

  const getStockStatusBg = (item: any) => {
    if (item.isOutOfStock) return "bg-red-50 dark:bg-red-900/20";
    if (item.isLowStock) return "bg-orange-50 dark:bg-orange-900/20";
    return "bg-green-50 dark:bg-green-900/20";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Inventory Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor stock levels across all products
          </p>
        </div>
        <Badge variant="outline" className="text-sm w-fit">
          {filteredInventory.length} of {totalItems} items
        </Badge>
      </div>


      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value as FilterType)}
            className="w-full sm:w-48 pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          >
            <option value="all">All Products</option>
            <option value="fuel">Fuel Products</option>
            <option value="other">Other Products</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredInventory.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {item.ProductCategory?.name || 'Uncategorized'}
                    </Badge>
                    {item.product_code && (
                      <Badge variant="outline" className="text-xs">
                        {item.product_code}
                      </Badge>
                    )}
                  </div>
                </div>
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Stock Quantity */}
                <div className={`p-3 rounded-lg ${getStockStatusBg(item)}`}>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Stock</span>
                  </div>
                  <p className={`text-xl font-bold ${getStockStatusColor(item)}`}>
                    {item.quantityOnHand}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.UnitOfMeasure?.name || 'units'}
                  </p>
                </div>
                
                {/* Stock Value */}
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Value</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    ₹{item.stockValue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    @ ₹{item.sales_price}/unit
                  </p>
                </div>
              </div>
              
              {/* Additional Info */}
              <div className="mt-4 space-y-2">
                {item.reorderLevel > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Reorder Level:</span>
                    <span className="font-medium">{item.reorderLevel} units</span>
                  </div>
                )}
                {item.hsn_code && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">HSN Code:</span>
                    <span className="font-medium">{item.hsn_code}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST Rate:</span>
                  <span className="font-medium">{item.gst_rate}%</span>
                </div>
              </div>
              
              {/* Status Alerts */}
              {item.isOutOfStock && (
                <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Out of Stock</span>
                </div>
              )}
              {item.isLowStock && !item.isOutOfStock && (
                <div className="mt-3 flex items-center gap-2 text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-sm">
                  <TrendingDown className="h-4 w-4" />
                  <span>Low Stock Alert</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredInventory.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-sm">
            {searchTerm || filterType !== "all" 
              ? "Try adjusting your search or filter criteria"
              : "No products available in inventory"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Inventory;
