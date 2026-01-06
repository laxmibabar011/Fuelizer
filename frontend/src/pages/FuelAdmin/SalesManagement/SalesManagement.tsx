import { useState, useEffect } from "react";
import ItemsTable from "./ItemsTable.tsx";
import TaxSummary from "./TaxSummary.tsx";
import TransactionsView from "./TransactionsView.tsx";
import LiveTransactions from "./live/LiveTransactions.tsx";
import SalesTabs from "./SalesTabs.tsx";
import ProductSelector from "./ProductSelector.tsx";
import CreditCustomerSelect from "./CreditCustomerSelect.tsx";
import PaymentMethodSelector from "./PaymentMethodSelector.tsx";
import POSExport from "./POSExport.tsx";
import SalesService, {
  SalesData,
  PaymentMethod,
  Product,
} from "../../../services/salesService";

interface SalesItem {
  id: string;
  itemCode: string;
  itemName: string;
  curStock: number;
  inLtr: number;
  quantity: number;
  rate: number;
  gst: number;
  cgst: number;
  sgst: number;
  amount: number;
  cess: number;
}

interface SalesData {
  paymentMode: string;
  partyName: string;
  vehicleNo: string;
  gstin: string;
  items: SalesItem[];
}

const SalesManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("sales-entry");
  const [salesData, setSalesData] = useState<SalesData>({
    paymentMode: "",
    partyName: "",
    vehicleNo: "",
    gstin: "",
    items: [],
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [selectedCreditCustomer, setSelectedCreditCustomer] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [currentItem, setCurrentItem] = useState<Omit<SalesItem, "id">>({
    itemCode: "",
    itemName: "",
    curStock: 0,
    inLtr: 0,
    quantity: 0,
    rate: 0,
    gst: 0,
    cgst: 0,
    sgst: 0,
    amount: 0,
    cess: 0,
  });

  const calculateAmount = () => {
    const baseAmount = currentItem.quantity * currentItem.rate;
    const gstAmount = (baseAmount * currentItem.gst) / 100;
    const cessAmount = (baseAmount * currentItem.cess) / 100;
    return baseAmount + gstAmount + cessAmount;
  };

  const addItem = () => {
    if (selectedProduct && currentItem.quantity > 0) {
      const newItem: SalesItem = {
        ...currentItem,
        id: Date.now().toString(),
        itemCode: selectedProduct.item_code,
        itemName: selectedProduct.name,
        rate: selectedProduct.sales_price,
        gst: selectedProduct.gst_rate,
        cgst:
          ((selectedProduct.cgst_rate || 0) *
            currentItem.quantity *
            selectedProduct.sales_price) /
          100,
        sgst:
          ((selectedProduct.sgst_rate || 0) *
            currentItem.quantity *
            selectedProduct.sales_price) /
          100,
        cess: selectedProduct.cess_rate || 0,
        amount: calculateAmount(),
      };
      setSalesData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
      setCurrentItem({
        itemCode: "",
        itemName: "",
        curStock: 0,
        inLtr: 0,
        quantity: 0,
        rate: 0,
        gst: 0,
        cgst: 0,
        sgst: 0,
        amount: 0,
        cess: 0,
      });
      setSelectedProduct(null);
    }
  };

  // React to payment method strategy
  useEffect(() => {
    if (!selectedPaymentMethod) return;
    const strat = selectedPaymentMethod.party_name_strategy;
    if (strat === "fixed") {
      const name = selectedPaymentMethod.default_party_name || "";
      const upper = selectedPaymentMethod.party_name_uppercase
        ? name.toUpperCase()
        : name;
      setSalesData((p) => ({ ...p, partyName: upper }));
      setSelectedCreditCustomer(null);
    } else if (strat === "credit_customer") {
      setSalesData((p) => ({ ...p, partyName: "" }));
    }
  }, [selectedPaymentMethod]);

  // When credit customer changes, sync party name
  useEffect(() => {
    if (!selectedPaymentMethod) return;
    if (selectedPaymentMethod.party_name_strategy !== "credit_customer") return;
    const name = selectedCreditCustomer?.name || "";
    const upper = selectedPaymentMethod.party_name_uppercase
      ? name.toUpperCase()
      : name;
    setSalesData((p) => ({ ...p, partyName: upper }));
  }, [selectedCreditCustomer, selectedPaymentMethod]);

  const saveSales = async () => {
    if (!selectedPaymentMethod || salesData.items.length === 0) {
      alert("Please select payment method and add at least one item");
      return;
    }

    try {
      setSaving(true);

      // Convert frontend data to backend format
      const salesRecords = salesData.items.map((item) => ({
        Date: new Date().toISOString().split("T")[0],
        "Bill Mode": selectedPaymentMethod.bill_mode,
        "Party Name": salesData.partyName || "Cash",
        "Registration Type": "unregistered/consumer",
        GSTIN: salesData.gstin || null,
        "Item Name": item.itemName,
        Qty: item.quantity,
        Rate: item.rate,
        Amount: item.quantity * item.rate,
        "GST Rate": item.gst,
        "Taxable Value": item.quantity * item.rate,
        SGST: item.sgst,
        CGST: item.cgst,
        IGST: 0, // Assuming intra-state for now
        "Cess Rate": item.cess,
        "Cess Amt": (item.cess * item.quantity * item.rate) / 100,
        "TCS Rate": 0,
        "TCS Amt": 0,
        "Invoice Value": item.amount,
        payment_method_id: selectedPaymentMethod.id,
        product_id: selectedProduct?.id,
        autoSplit: getTotalAmount() > 30000,
      }));

      // Create sales records
      for (const record of salesRecords) {
        await SalesService.createManualSale(record);
      }

      alert(`Successfully created ${salesRecords.length} sales record(s)`);

      // Reset form
      setSalesData({
        paymentMode: "",
        partyName: "",
        vehicleNo: "",
        gstin: "",
        items: [],
      });
      setSelectedPaymentMethod(null);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Failed to save sales:", error);
      alert("Failed to save sales");
    } finally {
      setSaving(false);
    }
  };

  const removeItem = (id: string) => {
    setSalesData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const getTotalAmount = () =>
    salesData.items.reduce((sum, item) => sum + item.amount, 0);
  const getTotalTax = () =>
    salesData.items.reduce((sum, item) => sum + (item.cgst + item.sgst), 0);

  const renderTabContent = () => {
    switch (activeTab) {
      case "sales-entry":
        return renderSalesEntry();
      case "pos-export":
        return <POSExport />;
      case "all-sales":
        return <TransactionsView />;
      case "transactions":
        return <LiveTransactions />;
      default:
        return renderSalesEntry();
    }
  };

  const renderSalesEntry = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Payment Mode */}
        <div className="border rounded-lg bg-white dark:bg-gray-900">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Payment Mode</h2>
          </div>
          <div className="p-4">
            <PaymentMethodSelector
              value={selectedPaymentMethod?.bill_mode || ""}
              onChange={setSelectedPaymentMethod}
            />
          </div>
        </div>

        {/* Party Details */}
        <div className="border rounded-lg bg-white dark:bg-gray-900">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Party Details</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="partyName" className="text-sm text-gray-600">
                  Party Name
                </label>
                <input
                  id="partyName"
                  value={salesData.partyName}
                  onChange={(e) =>
                    setSalesData((prev) => ({
                      ...prev,
                      partyName: e.target.value,
                    }))
                  }
                  placeholder="Enter party name"
                  className="w-full px-3 py-2 border rounded-md bg-transparent"
                  disabled={
                    selectedPaymentMethod?.party_name_strategy === "fixed"
                  }
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="vehicleNo" className="text-sm text-gray-600">
                  Vehicle Number
                </label>
                <input
                  id="vehicleNo"
                  value={salesData.vehicleNo}
                  onChange={(e) =>
                    setSalesData((prev) => ({
                      ...prev,
                      vehicleNo: e.target.value,
                    }))
                  }
                  placeholder="Enter vehicle number"
                  className="w-full px-3 py-2 border rounded-md bg-transparent"
                />
              </div>
            </div>
            {selectedPaymentMethod?.party_name_strategy ===
              "credit_customer" && (
              <CreditCustomerSelect
                value={selectedCreditCustomer}
                onChange={setSelectedCreditCustomer}
              />
            )}
            <div className="space-y-1">
              <label htmlFor="gstin" className="text-sm text-gray-600">
                GSTIN
              </label>
              <input
                id="gstin"
                value={salesData.gstin}
                onChange={(e) =>
                  setSalesData((prev) => ({ ...prev, gstin: e.target.value }))
                }
                placeholder="Enter GSTIN"
                className="w-full px-3 py-2 border rounded-md bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* Add Item */}
        <div className="border rounded-lg bg-white dark:bg-gray-900">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Add Item</h2>
          </div>
          <div className="p-4 space-y-4">
            <ProductSelector
              onProductSelect={setSelectedProduct}
              selectedProduct={selectedProduct}
            />

            {selectedProduct && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label htmlFor="quantity" className="text-sm text-gray-600">
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={currentItem.quantity}
                    onChange={(e) =>
                      setCurrentItem((prev) => ({
                        ...prev,
                        quantity: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="Qty"
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">
                    Rate (Auto-filled)
                  </label>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md font-semibold">
                    ₹{selectedProduct.sales_price.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">
                    Calculated Amount
                  </label>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md font-semibold">
                    ₹{calculateAmount().toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={addItem}
              disabled={!selectedProduct || currentItem.quantity <= 0}
              className="w-full px-3 py-2 bg-primary text-white rounded-md disabled:opacity-50"
            >
              Add Item
            </button>
          </div>
        </div>

        <ItemsTable items={salesData.items} onRemoveItem={removeItem} />
      </div>

      <div className="space-y-6">
        <TaxSummary
          items={salesData.items}
          totalAmount={getTotalAmount()}
          totalTax={getTotalTax()}
        />

        <div className="border rounded-lg bg-white dark:bg-gray-900">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-3">
            <button
              onClick={saveSales}
              disabled={saving || salesData.items.length === 0}
              className="w-full px-3 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Sales"}
            </button>
            <button className="w-full px-3 py-2 border rounded-md">
              Generate Receipt
            </button>
            <button className="w-full px-3 py-2 border rounded-md">
              Print Statement
            </button>
            <button className="w-full px-3 py-2 bg-red-600 text-white rounded-md">
              Clear All
            </button>
          </div>
        </div>

        <div className="border rounded-lg bg-white dark:bg-gray-900">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Transaction Info</h2>
          </div>
          <div className="p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Date:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Time:</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">User:</span>
              <span>ADMIN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Items:</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800">
                {salesData.items.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sales Management
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Petroleum Sales & Transaction System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <SalesTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SalesManagement;
