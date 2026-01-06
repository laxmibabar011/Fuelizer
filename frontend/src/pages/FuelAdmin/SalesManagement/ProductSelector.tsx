import React, { useState, useEffect } from "react";
import SalesService, { Product } from "../../../services/salesService";

interface ProductSelectorProps {
  onProductSelect: (product: Product) => void;
  selectedProduct?: Product | null;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  onProductSelect,
  selectedProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await SalesService.getProductsForSale({
        status: "active",
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.item_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Select Product
      </label>

      {/* Selected Product Display */}
      {selectedProduct ? (
        <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">{selectedProduct.name}</div>
              <div className="text-sm text-gray-500">
                Code: {selectedProduct.item_code} | Rate: ₹
                {selectedProduct.sales_price} | Stock:{" "}
                {selectedProduct.InventoryLevel?.quantity_on_hand || 0}
              </div>
            </div>
            <button
              onClick={() => onProductSelect(null)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search products by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
              {loading ? (
                <div className="p-3 text-center text-gray-500">
                  Loading products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-3 text-center text-gray-500">
                  No products found
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">
                      Code: {product.item_code} | Rate: ₹{product.sales_price} |
                      Stock: {product.InventoryLevel?.quantity_on_hand || 0} |
                      GST: {product.gst_rate}%
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default ProductSelector;
