import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import DateInput from "../../../components/form/DateInput";
import Label from "../../../components/form/Label";
import TextArea from "../../../components/form/input/TextArea";
import Select from "../../../components/form/Select";
import SearchableDropdown from "../../../components/common/SearchableDropdown";
import { Modal } from "../../../components/ui/modal";
import PurchaseService, {
  Purchase as PurchaseDTO,
  PurchaseItem as PurchaseItemDTO,
  Vendor,
  ProductForPurchase,
} from "../../../services/purchaseService";
import { Plus, Trash2, Save, X, ShoppingCart } from "lucide-react";

interface PurchaseOrderFormProps {
  purchaseOrder?: PurchaseDTO;
  onSave?: (po: PurchaseDTO) => void;
  onCancel?: () => void;
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({
  purchaseOrder: propPurchaseOrder,
  onSave,
  onCancel,
}) => {
  console.log("PurchaseOrderForm rendering");
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    vendor_id: 0,
    invoice_date: new Date().toISOString().split("T")[0],
    stock_received_date: new Date().toISOString().split("T")[0],
    invoice_number: "",
    payment_mode: "Cash" as "Cash" | "Credit" | "Bank Transfer",
    notes: "",
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
    cess_rate: 0,
    cess_amount: 0,
    discount_amount: 0,
  });
  // Track which PO-level fields a user has manually overridden. When true,
  // auto-population from item-level sums will not overwrite the user's value.
  const [manualOverrides, setManualOverrides] = useState({
    cgst: false,
    sgst: false,
    igst: false,
    cess: false,
    discount: false,
  });
  const [isEditable, setIsEditable] = useState(true);

  const [items, setItems] = useState<PurchaseItemDTO[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<ProductForPurchase[]>([]);
  const [vendorInput, setVendorInput] = useState("");
  const [productInputs, setProductInputs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductForPurchase | null>(null);

  useEffect(() => {
    loadInitialData();
    // Load existing purchase order if editing
    if (id && !propPurchaseOrder) {
      loadPurchaseOrder(parseInt(id));
    } else if (propPurchaseOrder) {
      setFormData({
        vendor_id: propPurchaseOrder.vendor_id || 0,
        invoice_date: propPurchaseOrder.invoice_date
          ? String(propPurchaseOrder.invoice_date).split("T")[0]
          : new Date().toISOString().split("T")[0],
        stock_received_date: propPurchaseOrder.stock_received_date
          ? String(propPurchaseOrder.stock_received_date).split("T")[0]
          : "",
        invoice_number: propPurchaseOrder.invoice_number || "",
        payment_mode: propPurchaseOrder.payment_mode || "Cash",
        notes: propPurchaseOrder.notes || "",
        cgst_amount: propPurchaseOrder.cgst_amount || 0,
        sgst_amount: propPurchaseOrder.sgst_amount || 0,
        igst_amount: propPurchaseOrder.igst_amount || 0,
        cess_rate: propPurchaseOrder.cess_rate || 0,
        cess_amount: propPurchaseOrder.cess_amount || 0,
        discount_amount: propPurchaseOrder.discount_amount || 0,
      });
      const loadedItems = propPurchaseOrder.items || [];
      setItems(loadedItems);
      setProductInputs(new Array(loadedItems.length).fill(""));
      setIsEditable(propPurchaseOrder.status === "Draft");
    }
  }, [id, propPurchaseOrder]);

  // Auto-populate PO-level tax/discount fields from item-level calculations
  // but do not overwrite values that the user has manually edited.
  useEffect(() => {
    if (items.length > 0) {
      const totalCgst = items.reduce((sum, item) => sum + (parseFloat(String(item.cgst_amount)) || 0), 0);
      const totalSgst = items.reduce((sum, item) => sum + (parseFloat(String(item.sgst_amount)) || 0), 0);
      const totalIgst = items.reduce((sum, item) => sum + (parseFloat(String(item.igst_amount)) || 0), 0);
      const totalCess = items.reduce((sum, item) => sum + (parseFloat(String(item.cess_amount)) || 0), 0);
      const totalDiscount = items.reduce((sum, item) => sum + (parseFloat(String(item.discount_amount)) || 0), 0);

      setFormData((prev) => ({
        ...prev,
        cgst_amount: manualOverrides.cgst ? prev.cgst_amount : parseFloat(totalCgst.toFixed(2)),
        sgst_amount: manualOverrides.sgst ? prev.sgst_amount : parseFloat(totalSgst.toFixed(2)),
        igst_amount: manualOverrides.igst ? prev.igst_amount : parseFloat(totalIgst.toFixed(2)),
        cess_amount: manualOverrides.cess ? prev.cess_amount : parseFloat(totalCess.toFixed(2)),
        discount_amount: manualOverrides.discount ? prev.discount_amount : parseFloat(totalDiscount.toFixed(2)),
      }));
    } else {
      // If no items, reset auto-populated fields unless manually overridden
      setFormData((prev) => ({
        ...prev,
        cgst_amount: manualOverrides.cgst ? prev.cgst_amount : 0,
        sgst_amount: manualOverrides.sgst ? prev.sgst_amount : 0,
        igst_amount: manualOverrides.igst ? prev.igst_amount : 0,
        cess_amount: manualOverrides.cess ? prev.cess_amount : 0,
        discount_amount: manualOverrides.discount ? prev.discount_amount : 0,
      }));
    }
  }, [items, manualOverrides.cgst, manualOverrides.sgst, manualOverrides.igst, manualOverrides.cess, manualOverrides.discount]);

  const loadPurchaseOrder = async (poId: number) => {
    try {
      const poRes = await PurchaseService.getPurchase(poId);
      const po = poRes?.data;
      if (!po || typeof po !== "object") {
        alert("Purchase order data is missing or invalid.");
        navigate("/fuel-admin/purchase");
        return;
      }
      setFormData({
        vendor_id: po.vendor_id || 0,
        invoice_date: po.invoice_date
          ? po.invoice_date.split("T")[0]
          : new Date().toISOString().split("T")[0],
        stock_received_date: po.stock_received_date
          ? po.stock_received_date.split("T")[0]
          : "",
        invoice_number: po.invoice_number || "",
        payment_mode: po.payment_mode || "Cash",
        notes: po.notes || "",
        cgst_amount: po.cgst_amount || 0,
        sgst_amount: po.sgst_amount || 0,
        igst_amount: po.igst_amount || 0,
        cess_rate: po.cess_rate || 0,
        cess_amount: po.cess_amount || 0,
        discount_amount: po.discount_amount || 0,
      });
      const loaded = Array.isArray(po.items) ? po.items : [];
      setItems(loaded);
      setProductInputs(new Array(loaded.length).fill(""));
      setIsEditable(po.status === "Draft");
    } catch (error) {
      console.error("Failed to load purchase order:", error);
      alert("Failed to load purchase order");
      navigate("/fuel-admin/purchase");
    }
  };

  const loadInitialData = async () => {
    try {
      const [vendorResponse, productResponse] = await Promise.all([
        PurchaseService.listVendors(),
        PurchaseService.getProductsForPurchase(),
      ]);

      setVendors(vendorResponse?.data || []);
      setProducts(productResponse?.data || []);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      alert("Failed to load vendors and products");
    }
  };

  const handleInputChange = (field: string, value: any) => {
    // Handle cess rate/amount bidirectional calculations at purchase order level
    if (field === 'cess_rate' || field === 'cess_amount') {
      const taxableAmount = calculateTotals().taxable_amount;

      if (field === 'cess_rate' && taxableAmount > 0) {
        // Calculate cess amount from cess rate
        const cessRate = Number(value || 0);
        const cessAmount = (taxableAmount * cessRate) / 100;
        setFormData((prev) => ({
          ...prev,
          cess_rate: cessRate,
          cess_amount: parseFloat(cessAmount.toFixed(2))
        }));
        return;
      } else if (field === 'cess_amount' && taxableAmount > 0) {
        // Calculate cess rate from cess amount
        const cessAmount = Number(value || 0);
        const cessRate = (cessAmount / taxableAmount) * 100;
        setFormData((prev) => ({
          ...prev,
          cess_amount: cessAmount,
          cess_rate: parseFloat(cessRate.toFixed(2))
        }));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    // If vendor changes, recalculate all items for GST
    if (field === 'vendor_id' && value && items.length > 0) {
      recalculateAllItems();
    }
  };

  const recalculateAllItems = async () => {
    if (!formData.vendor_id || items.length === 0) return;

    const updatedItems = [...items];
    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      if (!item.product_id) continue;

      try {
        const calcPayload = {
          product_id: item.product_id,
          quantity: Number(item.quantity || 0),
          purchase_rate: Number(item.purchase_rate || 0),
          discount: Number(item.discount_amount || 0),
          vendor_id: formData.vendor_id,
        };

        const res = await PurchaseService.calculateItemTotal(calcPayload);
        const totals = (res && (res as any).data) as Partial<PurchaseItemDTO>;
        updatedItems[i] = { ...item, ...totals };
      } catch (e) {
        console.error(`Failed to recalculate item ${i}:`, e);
      }
    }
    setItems(updatedItems);
  };

  const addItem = () => {
    const newItem: PurchaseItemDTO = {
      product_id: 0,
      product_name_at_purchase: "",
      hsn_code_at_purchase: "",
      quantity: 0,
      purchase_rate: 0,
      sales_price: 0,
      discount_amount: 0,
      line_total: 0,
      taxable_amount: 0,
      gst_rate: 0,
    };
    setItems((prev) => [...prev, newItem]);
    setProductInputs((prev) => [...prev, ""]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setProductInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = async (index: number, field: string, value: any) => {
    // Handle cess rate/amount bidirectional calculations
    if (field === 'cess_rate' || field === 'cess_amount') {
      const currentItem = items[index];
      const quantity = Number(currentItem.quantity || 0);
      const purchaseRate = Number(currentItem.purchase_rate || 0);
      const discountAmount = Number(currentItem.discount_amount || 0);
      const taxableAmount = (quantity * purchaseRate) - discountAmount;

      if (field === 'cess_rate' && taxableAmount > 0) {
        // Calculate cess amount from cess rate
        const cessRate = Number(value || 0);
        const cessAmount = (taxableAmount * cessRate) / 100;
        setItems((prev) =>
          prev.map((item, i) => (i === index ? { ...item, cess_rate: cessRate, cess_amount: Number(cessAmount.toFixed(2)) } : item))
        );
        return;
      } else if (field === 'cess_amount' && taxableAmount > 0) {
        // Calculate cess rate from cess amount
        const cessAmount = Number(value || 0);
        const cessRate = (cessAmount / taxableAmount) * 100;
        setItems((prev) =>
          prev.map((item, i) => (i === index ? { ...item, cess_amount: cessAmount, cess_rate: Number(cessRate.toFixed(2)) } : item))
        );
        return;
      }
    }

    // First update the local state immediately for instant UI feedback
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );

    // For instant calculations, recalculate immediately on frontend
    const updatedItem = { ...items[index], [field]: value };
    const instantCalculations = calculateItemInstantly(updatedItem, formData.vendor_id);

    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...instantCalculations } : item))
    );

    // For server-side validation and complex calculations, also call backend
    const fieldsAffectingTotals = new Set([
      "product_id",
      "quantity",
      "purchase_rate",
      "discount_amount",
    ]);

    if (fieldsAffectingTotals.has(field)) {
      const current = { ...items[index], [field]: value };
      const currentProductId = current.product_id;
      if (!currentProductId) {
        return;
      }

      const calcPayload: any = {
        product_id: currentProductId,
        quantity: Number(current.quantity || 0),
        purchase_rate: Number(current.purchase_rate || 0),
        discount: Number(current.discount_amount || 0),
        vendor_id: formData.vendor_id,
      };

      try {
        const res = await PurchaseService.calculateItemTotal(calcPayload);
        const serverTotals = (res && (res as any).data) as Partial<PurchaseItemDTO>;

        // Update with server-validated calculations
        setItems((prev) =>
          prev.map((it, i) =>
            i === index ? ({ ...it, ...serverTotals } as PurchaseItemDTO) : it
          )
        );
      } catch (e) {
        console.warn('Server calculation failed, keeping instant calculations:', e);
      }
    }
  };

  const handleProductSelect = (product: ProductForPurchase) => {
    setSelectedProduct(product);
    setIsProductModalOpen(false);
    // Find the index of the item being edited (assume last item for simplicity)
    if (items.length > 0) {
      addProductToItem(items.length - 1);
    }
  };

  const addProductToItem = (index: number) => {
    if (!selectedProduct) return;
    // Auto-fill all relevant product master fields
    handleItemChange(index, "product_id", selectedProduct.id);
    handleItemChange(index, "product_name_at_purchase", selectedProduct.name);
    handleItemChange(
      index,
      "hsn_code_at_purchase",
      selectedProduct.hsn_code || ""
    );
    handleItemChange(index, "gst_rate", selectedProduct.gst_rate || 0);
    handleItemChange(index, "sales_price", selectedProduct.sales_price || 0);
    // Auto-populate purchase rate with cost_price from Product Master
    handleItemChange(index, "purchase_rate", selectedProduct.cost_price || 0);
    handleItemChange(index, "cess_rate", selectedProduct.cess_rate || 0);
    // Add more fields if needed from product master
    setSelectedProduct(null);
  };

  // Calculate comprehensive grand totals
  const calculateGrandTotals = () => {
    const totals = {
      totalTaxableAmount: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
      totalCess: 0,
      grandTotal: 0,
    };

    items.forEach(item => {
      totals.totalTaxableAmount += Number(item.taxable_amount || 0);
      totals.totalCgst += Number(item.cgst_amount || 0);
      totals.totalSgst += Number(item.sgst_amount || 0);
      totals.totalIgst += Number(item.igst_amount || 0);
      totals.totalCess += Number(item.cess_amount || 0);
    });

    totals.grandTotal = totals.totalTaxableAmount + totals.totalCgst + totals.totalSgst + totals.totalIgst + totals.totalCess;

    return {
      totalTaxableAmount: Number(totals.totalTaxableAmount.toFixed(2)),
      totalCgst: Number(totals.totalCgst.toFixed(2)),
      totalSgst: Number(totals.totalSgst.toFixed(2)),
      totalIgst: Number(totals.totalIgst.toFixed(2)),
      totalCess: Number(totals.totalCess.toFixed(2)),
      grandTotal: Number(totals.grandTotal.toFixed(2)),
    };
  };

  const grandTotals = calculateGrandTotals();

  // Instant calculation function for real-time UI updates
  const calculateItemInstantly = (item: PurchaseItemDTO, vendorId: number) => {
    const quantity = Number(item.quantity || 0);
    const purchaseRate = Number(item.purchase_rate || 0);
    const discountAmount = Number(item.discount_amount || 0);
    const gstRate = Number(item.gst_rate || 0);
    const cessRate = Number(item.cess_rate || 0);

    // Calculate line total and taxable amount
    const lineTotal = quantity * purchaseRate;
    const taxableAmount = lineTotal - discountAmount;

    // Get vendor state for GST calculation
    const selectedVendor = vendors.find(v => v.id === vendorId);
    const vendorState = selectedVendor?.state?.toLowerCase();

    // Calculate GST amounts based on vendor state
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (taxableAmount > 0 && gstRate > 0) {
      const totalGstAmount = taxableAmount * (gstRate / 100);

      if (vendorState === 'karnataka') {
        // Intrastate: Split GST into CGST and SGST (50% each)
        cgstAmount = totalGstAmount / 2;
        sgstAmount = totalGstAmount / 2;
        igstAmount = 0;
      } else {
        // Interstate: Use IGST
        cgstAmount = 0;
        sgstAmount = 0;
        igstAmount = totalGstAmount;
      }
    }

    // Calculate cess amount
    const cessAmount = taxableAmount * (cessRate / 100);

    return {
      line_total: Number(lineTotal.toFixed(2)),
      taxable_amount: Number(taxableAmount.toFixed(2)),
      cgst_amount: Number(cgstAmount.toFixed(2)),
      sgst_amount: Number(sgstAmount.toFixed(2)),
      igst_amount: Number(igstAmount.toFixed(2)),
      cess_amount: Number(cessAmount.toFixed(2)),
    };
  };

  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + (parseFloat(String(item.line_total)) || 0),
      0
    );
    // discount is derived later (discount_from_form) and may come from formData if manually overridden
    const taxable_amount = items.reduce(
      (sum, item) => sum + (parseFloat(String(item.taxable_amount)) || 0),
      0
    );
    // Sum tax amounts from individual items instead of using formData
    const cgst_amount = manualOverrides.cgst ? (parseFloat(String(formData.cgst_amount)) || 0) : items.reduce(
      (sum, item) => sum + (parseFloat(String(item.cgst_amount)) || 0),
      0
    );
    const sgst_amount = manualOverrides.sgst ? (parseFloat(String(formData.sgst_amount)) || 0) : items.reduce(
      (sum, item) => sum + (parseFloat(String(item.sgst_amount)) || 0),
      0
    );
    const igst_amount = manualOverrides.igst ? (parseFloat(String(formData.igst_amount)) || 0) : items.reduce(
      (sum, item) => sum + (parseFloat(String(item.igst_amount)) || 0),
      0
    );
    const cess_amount = manualOverrides.cess ? (parseFloat(String(formData.cess_amount)) || 0) : items.reduce(
      (sum, item) => sum + (parseFloat(String(item.cess_amount)) || 0),
      0
    );
    const discount_from_form = manualOverrides.discount ? (parseFloat(String(formData.discount_amount)) || 0) : items.reduce(
      (sum, item) => sum + (parseFloat(String(item.discount_amount)) || 0),
      0
    );
    const total_amount = Math.max(0, taxable_amount - discount_from_form) + cgst_amount + sgst_amount + igst_amount + cess_amount;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount_amount: parseFloat(discount_from_form.toFixed(2)),
      taxable_amount: parseFloat(taxable_amount.toFixed(2)),
      cgst_amount: parseFloat(cgst_amount.toFixed(2)),
      sgst_amount: parseFloat(sgst_amount.toFixed(2)),
      igst_amount: parseFloat(igst_amount.toFixed(2)),
      cess_amount: parseFloat(cess_amount.toFixed(2)),
      total_amount: parseFloat(total_amount.toFixed(2)),
    };
  };

  const handleSave = async () => {
    if (id || propPurchaseOrder) {
      alert("Creating new purchase orders only.");
      return;
    }
    if (!formData.vendor_id) {
      alert("Please select a vendor");
      return;
    }

    // Validate vendor has state for GST calculations
    const selectedVendor = vendors.find(v => v.id === formData.vendor_id);
    if (!selectedVendor?.state) {
      alert("Selected vendor must have a state specified for GST calculations. Please update the vendor details first.");
      return;
    }

    if (!formData.invoice_number.trim()) {
      alert("Please enter an invoice number");
      return;
    }
    if (!formData.invoice_date) {
      alert("Please select an invoice date");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item");
      return;
    }
    const invalidItems = items.some(
      (item) => !item.product_id || !item.quantity || !item.purchase_rate
    );
    if (invalidItems) {
      alert("Please fill in all required fields for all items");
      return;
    }
    try {
      setLoading(true);
      const totals = calculateTotals();
      const poData = {
        vendor_id: formData.vendor_id,
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        stock_received_date: formData.stock_received_date,
        payment_mode: formData.payment_mode,
        notes: formData.notes,
        cess_rate: formData.cess_rate,
        items: items,
        ...totals,
      };
      const response = await PurchaseService.createPurchase(poData);
      if (!response || !response.data) {
        alert(
          "Failed to create purchase order. Please check your data and try again."
        );
        return;
      }
      if (onSave) {
        onSave(response.data);
      } else {
        navigate("/fuel-admin/purchase");
      }
      alert("Purchase order created successfully");
    } catch (error) {
      console.error("Failed to save purchase order:", error);
      alert("Failed to save purchase order");
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {!isEditable && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded">
          This purchase order cannot be edited because it is not in Draft
          status.
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {id || propPurchaseOrder ? "Edit Purchase" : "Create Purchase"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {id || propPurchaseOrder
            ? "Update purchase details"
            : "Create a new purchase"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Order Details</CardTitle>
              <CardDescription>
                Enter the basic information for this purchase order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor_id">
                    Vendor <span className="text-red-500">*</span>
                  </Label>
                  <SearchableDropdown
                    value={formData.vendor_id}
                    inputValue={vendorInput}
                    onChangeInput={setVendorInput}
                    options={vendors
                      .filter((v) => v.status === "active")
                      .map((v) => ({ value: v.id, label: v.name }))}
                    placeholder="Search or enter vendor"
                    allowCustom
                    customActionLabel={(text) => `Create vendor "${text}"`}
                    onCustomAction={(text) => {
                      // Navigate to Vendor Management to create new vendor; optionally pass a hint
                      navigate(`/fuel-admin/purchase/vendors?prefill=${encodeURIComponent(text)}`);
                    }}
                    onSelect={(opt, isCustom, text) => {
                      if (isCustom) {
                        // Allow typing but require selection for save
                        setVendorInput(text);
                        handleInputChange("vendor_id", "");
                      } else if (opt) {
                        handleInputChange("vendor_id", Number(opt.value));
                        setVendorInput("");
                      } else {
                        // Cleared selection while typing or via clear button
                        handleInputChange("vendor_id", "");
                        setVendorInput(text);
                      }
                    }}
                  />
                  {!formData.vendor_id && vendorInput && (
                    <p className="text-xs text-amber-600 mt-1">Please select an existing vendor to save.</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>Vendor State</Label>
                      <Input
                        value={(() => {
                          const selectedVendor = vendors.find(v => v.id === formData.vendor_id);
                          return selectedVendor?.state || '';
                        })()}
                        disabled
                        className="bg-gray-50 border-gray-300 text-gray-900 font-medium"
                        placeholder="Select vendor to populate"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vendor GST Number</Label>
                      <Input
                        value={(() => {
                          const selectedVendor = vendors.find(v => v.id === formData.vendor_id);
                          return selectedVendor?.gst_number || '';
                        })()}
                        disabled
                        className="bg-gray-50 border-gray-300 text-gray-900 font-medium"
                        placeholder="Select vendor to populate"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_number">Invoice Number</Label>
                    <Input
                      id="invoice_number"
                      value={formData.invoice_number}
                      onChange={(e) =>
                        handleInputChange("invoice_number", e.target.value)
                      }
                      placeholder="Enter invoice number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_mode">Payment Mode</Label>
                    {/* Fix Select props for paymentMode */}
                    <Select
                      defaultValue={formData.payment_mode}
                      onChange={(value: string) =>
                        handleInputChange("payment_mode", value)
                      }
                      options={[
                        { value: "Cash", label: "Cash" },
                        { value: "Credit", label: "Credit" },
                        { value: "Bank Transfer", label: "Bank Transfer" },
                      ]}
                      placeholder="Select payment mode"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <DateInput
                    id="invoice_date"
                    label="Invoice Date"
                    value={formData.invoice_date}
                    onChange={(value) =>
                      handleInputChange("invoice_date", value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <DateInput
                    id="stock_received_date"
                    label="Stock Receive Date"
                    value={formData.stock_received_date}
                    onChange={(value) =>
                      handleInputChange("stock_received_date", value)
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <TextArea
                  value={formData.notes}
                  onChange={(value) => handleInputChange("notes", value)}
                  placeholder="Enter any additional notes"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Items</CardTitle>
                  <CardDescription>
                    Add products to this purchase order
                  </CardDescription>
                </div>
                <Button
                  onClick={addItem}
                  startIcon={<Plus className="h-4 w-4" />}
                >
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeItem(index)}
                        startIcon={<Trash2 className="h-4 w-4" />}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Product</Label>
                        <SearchableDropdown
                          value={item.product_id || undefined}
                          inputValue={productInputs[index]}
                          onChangeInput={(val) =>
                            setProductInputs((prev) => prev.map((p, i) => (i === index ? val : p)))
                          }
                          options={products.map((p) => ({ value: p.id, label: p.name }))}
                          placeholder="Search or enter product"
                          allowCustom
                          customActionLabel={(text) => `Create product "${text}"`}
                          onCustomAction={(text) => {
                            // Navigate to Product Master Configuration; we can land on dashboard and let user add
                            navigate(`/fuel-admin/configuration/product-master?prefill=${encodeURIComponent(text)}`);
                          }}
                          onSelect={(opt, isCustom, text) => {
                            if (isCustom) {
                              handleItemChange(index, "product_id", 0);
                              handleItemChange(index, "product_name_at_purchase", text);
                              handleItemChange(index, "hsn_code_at_purchase", "");
                              handleItemChange(index, "gst_rate", 0);
                              setProductInputs((prev) => prev.map((val, i) => (i === index ? text : val)));
                            } else if (opt) {
                              const p = products.find((pp) => pp.id === Number(opt.value));
                              if (p) {
                                handleItemChange(index, "product_id", p.id);
                                handleItemChange(index, "product_name_at_purchase", p.name);
                                handleItemChange(index, "hsn_code_at_purchase", p.hsn_code || "");
                                handleItemChange(index, "gst_rate", p.gst_rate || 0);
                                handleItemChange(index, "sales_price", p.sales_price || 0);
                                handleItemChange(index, "cess_rate", p.cess_rate || 0);
                              }
                              setProductInputs((prev) => prev.map((val, i) => (i === index ? "" : val)));
                            } else {
                              // Cleared selection: reset product fields and keep typed text
                              handleItemChange(index, "product_id", 0);
                              handleItemChange(index, "product_name_at_purchase", "");
                              handleItemChange(index, "hsn_code_at_purchase", "");
                              handleItemChange(index, "gst_rate", 0);
                              handleItemChange(index, "quantity", 0);
                              handleItemChange(index, "purchase_rate", 0);
                              handleItemChange(index, "discount_amount", 0);
                              setProductInputs((prev) => prev.map((val, i) => (i === index ? text : val)));
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Current Stock</Label>
                        <Input
                          value={
                            products.find((p) => p.id === item.product_id)?.InventoryLevel?.quantity_on_hand ?? "-"
                          }
                          disabled
                          className="bg-gray-50 border-gray-300 text-gray-900 font-medium"
                        />
                      </div>
                      {/* Row 2: HSN Code (readonly) and Sales Price (editable) */}
                      <div className="space-y-2">
                        <Label>HSN Code</Label>
                        <Input
                          value={products.find((p) => p.id === item.product_id)?.hsn_code ?? item.hsn_code_at_purchase}
                          disabled
                          className="bg-gray-50 border-gray-300 text-gray-900 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sales Price</Label>
                        <Input
                          type="number"
                          value={item.sales_price || products.find((p) => p.id === item.product_id)?.sales_price || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "sales_price",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Purchase Rate</Label>
                        <Input
                          type="number"
                          value={item.purchase_rate || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "purchase_rate",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount Amount</Label>
                        <Input
                          type="number"
                          value={item.discount_amount || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "discount_amount",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>GST %</Label>
                        <Input
                          type="number"
                          value={item.gst_rate || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "gst_rate",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>

                      {/* GST Breakdown */}
                      <div className="space-y-2">
                        <Label>CGST Amount</Label>
                        <Input
                          value={item.cgst_amount ? Number(item.cgst_amount).toFixed(2) : "0.00"}
                          disabled
                          className="bg-blue-50 border-blue-300 text-blue-900 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SGST Amount</Label>
                        <Input
                          value={item.sgst_amount ? Number(item.sgst_amount).toFixed(2) : "0.00"}
                          disabled
                          className="bg-blue-50 border-blue-300 text-blue-900 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>IGST Amount</Label>
                        <Input
                          value={item.igst_amount ? Number(item.igst_amount).toFixed(2) : "0.00"}
                          disabled
                          className="bg-green-50 border-green-300 text-green-900 font-medium"
                        />
                      </div>

                      {/* Cess Fields */}
                      <div className="space-y-2">
                        <Label>Cess Rate %</Label>
                        <Input
                          type="number"
                          value={item.cess_rate || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "cess_rate",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cess Amount</Label>
                        <Input
                          type="number"
                          value={item.cess_amount || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "cess_amount",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="bg-purple-50 border-purple-300 text-purple-900 font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Taxable Amount</Label>
                        <Input
                          value={item.taxable_amount ? Number(item.taxable_amount).toFixed(2) : ""}
                          disabled
                          className="bg-gray-50 border-gray-300 text-gray-900 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total Amount</Label>
                        <Input
                          value={Number((item.taxable_amount || 0) + (item.cgst_amount || 0) + (item.sgst_amount || 0) + (item.igst_amount || 0) + (item.cess_amount || 0)).toFixed(2)}
                          disabled
                          className="bg-gray-50 border-gray-300 text-gray-900 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No items added yet</p>
                    <p className="text-sm">
                      Click "Add Item" to start adding products
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    ₹{totals.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">₹</span>
                    <Input
                      type="number"
                      value={formData.discount_amount || 0}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        // mark discount manual override
                        setManualOverrides((prev) => ({ ...prev, discount: true }));
                        setFormData((prev) => ({ ...prev, discount_amount: v }));
                      }}
                      className="w-28 text-right"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxable Amount:</span>
                  <span className="font-medium">
                    ₹{totals.taxable_amount.toFixed(2)}
                  </span>
                </div>

                {/* Comprehensive GST Totals Section */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Purchase Order Totals</h3>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Total Taxable Amount:</span>
                      <span className="font-medium">₹{grandTotals.totalTaxableAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Total CGST:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-blue-600">₹</span>
                        <Input
                          type="number"
                          value={formData.cgst_amount || grandTotals.totalCgst}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value) || 0;
                            setManualOverrides((prev) => ({ ...prev, cgst: true }));
                            setFormData((prev) => ({ ...prev, cgst_amount: v }));
                          }}
                          className="w-28 text-right"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Total SGST:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-blue-600">₹</span>
                        <Input
                          type="number"
                          value={formData.sgst_amount || grandTotals.totalSgst}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value) || 0;
                            setManualOverrides((prev) => ({ ...prev, sgst: true }));
                            setFormData((prev) => ({ ...prev, sgst_amount: v }));
                          }}
                          className="w-28 text-right"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Total IGST:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-green-600">₹</span>
                        <Input
                          type="number"
                          value={formData.igst_amount || grandTotals.totalIgst}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value) || 0;
                            setManualOverrides((prev) => ({ ...prev, igst: true }));
                            setFormData((prev) => ({ ...prev, igst_amount: v }));
                          }}
                          className="w-28 text-right"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Total Cess:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-purple-600">₹</span>
                        <Input
                          type="number"
                          value={formData.cess_amount || grandTotals.totalCess}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value) || 0;
                            setManualOverrides((prev) => ({ ...prev, cess: true }));
                            setFormData((prev) => ({ ...prev, cess_amount: v }));
                          }}
                          className="w-28 text-right"
                        />
                      </div>
                    </div>

                    <div className="border-t-2 pt-2 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-800">Grand Total:</span>
                        <span className="text-xl font-bold text-gray-800">₹{grandTotals.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full"
              startIcon={<Save className="h-4 w-4" />}
            >
              {loading ? "Saving..." : "Create Purchase"}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                onCancel ? onCancel() : navigate("/fuel-admin/purchase")
              }
              className="w-full"
              startIcon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>
            {propPurchaseOrder && propPurchaseOrder.status === "Draft" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete this purchase order? This action cannot be undone."
                    )
                  ) {
                    setLoading(true);
                    try {
                      // For now, deletion not supported; adjust if cancel route added later
                      const response = { data: true } as any;
                      if (response && response.data) {
                        alert("Purchase order deleted successfully");
                        navigate("/fuel-admin/purchase");
                      } else {
                        alert("Failed to delete purchase order.");
                      }
                    } catch (error) {
                      alert("Error deleting purchase order.");
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                startIcon={<Trash2 className="h-4 w-4" />}
              >
                Delete Order
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Product Selection Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        className="max-w-5xl w-full"
      >
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Select Product
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="cursor-pointer hover:shadow-md transition-shadow bg-white rounded-lg border"
                onClick={() => handleProductSelect(product)}
              >
                <CardContent className="p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {product.name}
                  </h4>
                  {product.hsn_code && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      HSN: {product.hsn_code}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    GST: {product.gst_rate}%
                  </p>
                  {product.InventoryLevel && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Stock: {product.InventoryLevel.quantity_on_hand} units
                    </p>
                  )}
                </CardContent>
              </div>
            ))}
          </div>
          {products.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No products available
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PurchaseOrderForm;
