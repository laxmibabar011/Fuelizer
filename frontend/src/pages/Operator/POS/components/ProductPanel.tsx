/**
 * Product Panel Component
 * Left panel showing fuel products mapped to booth nozzles
 */

import React from "react";
import { FuelIcon, BoltIcon } from "../../../../icons";
import type { BoothInfo, ProductInfo, NozzleInfo } from "../types";

interface ProductPanelProps {
  booth: BoothInfo | null;
  products: ProductInfo[];
  selectedProduct: ProductInfo | null;
  selectedNozzle: NozzleInfo | null;
  onProductSelect: (product: ProductInfo, nozzle: NozzleInfo) => void;
}

const ProductPanel: React.FC<ProductPanelProps> = ({
  booth,
  products,
  selectedProduct,
  selectedNozzle,
  onProductSelect,
}) => {
  // Group nozzles by product
  const getProductNozzles = (productId: string) => {
    if (!booth) return [];
    return booth.nozzles.filter((nozzle) => nozzle.productId === productId);
  };

  // Get product by ID
  const getProduct = (productId: string) => {
    return products.find((p) => p.id === productId);
  };

  // Get unique products available in this booth
  const availableProducts = React.useMemo(() => {
    if (!booth) return [];

    const productIds = [
      ...new Set(booth.nozzles.map((n) => n.productId).filter(Boolean)),
    ];
    return productIds
      .map((id) => getProduct(id))
      .filter(Boolean) as ProductInfo[];
  }, [booth, products]);

  // Product color mapping
  const getProductColorClasses = (
    product: ProductInfo,
    isSelected: boolean
  ) => {
    const baseClasses = "transition-all duration-200 transform hover:scale-105";

    if (isSelected) {
      return `${baseClasses} ring-4 ring-blue-400 ring-opacity-90 shadow-2xl scale-105 shadow-blue-500/25`;
    }

    switch (product.color) {
      case "green":
        return `${baseClasses} bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl`;
      case "blue":
        return `${baseClasses} bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl`;
      case "yellow":
        return `${baseClasses} bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg hover:shadow-xl`;
      case "gray":
        return `${baseClasses} bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 shadow-lg hover:shadow-xl`;
      default:
        return `${baseClasses} bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg hover:shadow-xl`;
    }
  };

  // Nozzle selection for product
  const handleProductClick = (product: ProductInfo) => {
    const nozzles = getProductNozzles(product.id);
    if (nozzles.length === 0) return;

    // For now, select the first available nozzle
    // TODO: Add nozzle selection modal if multiple nozzles
    const availableNozzle = nozzles.find((n) => n.isAvailable) || nozzles[0];
    onProductSelect(product, availableNozzle);
  };

  if (!booth) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-gray-500">
          <BoltIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Loading booth configuration...</p>
        </div>
      </div>
    );
  }

  if (availableProducts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-gray-500">
          <FuelIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No fuel products configured for this booth.</p>
          <p className="text-sm mt-2">Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header - Aligned with other sections */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-base font-semibold text-gray-900 flex items-center">
          <FuelIcon className="h-4 w-4 mr-2 text-blue-600" />
          Fuel Products
        </h2>
      </div>

      {/* Product Cards */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {availableProducts.map((product) => {
          const nozzles = getProductNozzles(product.id);
          const availableNozzles = nozzles.filter((n) => n.isAvailable);
          const isSelected = selectedProduct?.id === product.id;
          const isAvailable = availableNozzles.length > 0;

          return (
            <button
              key={product.id}
              onClick={() => isAvailable && handleProductClick(product)}
              disabled={!isAvailable}
              className={`
                w-full p-3 rounded-xl text-white text-left relative overflow-hidden
                ${isAvailable ? getProductColorClasses(product, isSelected) : "bg-gray-400 opacity-50 cursor-not-allowed"}
              `}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-20 h-20 transform translate-x-8 -translate-y-8">
                  <FuelIcon className="w-full h-full" />
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className={`text-lg font-bold ${isSelected ? "drop-shadow-xl text-white" : ""}`}
                  >
                    {product.name.toUpperCase()}
                  </h3>
                  <div
                    className={`w-3 h-3 rounded-full ${isAvailable ? "bg-white" : "bg-gray-300"}`}
                  />
                </div>

                <div
                  className={`text-xl font-mono font-bold mb-2 ${isSelected ? "drop-shadow-xl text-white" : ""}`}
                >
                  ₹{product.price.toFixed(2)}/{product.unit}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <BoltIcon className="h-4 w-4" />
                    <span
                      className={isSelected ? "drop-shadow-md text-white" : ""}
                    >
                      Nozzles: {nozzles.map((n) => n.code).join(", ")}
                    </span>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isAvailable
                        ? isSelected
                          ? "bg-blue-500 bg-opacity-90 text-white border border-blue-300"
                          : "bg-white bg-opacity-20 text-white"
                        : "bg-gray-500 text-gray-200"
                    }`}
                  >
                    {isAvailable ? "Available" : "Unavailable"}
                  </div>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-3 left-3 w-8 h-8 bg-white bg-opacity-95 rounded-full flex items-center justify-center shadow-xl border-2 border-blue-400">
                    <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 text-center">
          {booth.name} • {availableProducts.length} Products •{" "}
          {booth.nozzles.length} Nozzles
        </div>
      </div>
    </div>
  );
};

export default ProductPanel;
