import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
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
import Button from "../../../components/ui/button/Button";
import { Badge } from "../../../components/ui/badge";
import { Modal } from "../../../components/ui/modal";
import PurchaseService, { Purchase as PurchaseDTO, Vendor } from "../../../services/purchaseService";
import PurchaseOrderForm from "./PurchaseOrderForm";
import VendorManagement from "./VendorManagement";
import {
  AlertTriangle,
  PlusCircle,
  Plus,
  Users,
  FileText,
  Eye,
  Trash2,
  TrendingUp,
  Package,
} from "lucide-react";

const PurchaseDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [allPurchaseOrders, setAllPurchaseOrders] = useState<PurchaseDTO[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPO, setSelectedPO] = useState<PurchaseDTO | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'deleted'>('active'); // Toggle between active and deleted POs

  // Filter purchase orders based on view mode
  const purchaseOrders = useMemo(() => {
    if (viewMode === 'active') {
      return allPurchaseOrders.filter(po => po.status !== 'Deleted');
    } else {
      return allPurchaseOrders.filter(po => po.status === 'Deleted');
    }
  }, [allPurchaseOrders, viewMode]);

  // Statistics from all purchase orders
  const totalPOs = allPurchaseOrders.filter(po => po.status !== 'Deleted').length;
  const draftPOs = allPurchaseOrders.filter(po => po.status === 'Draft').length;
  const stockUpdatedPOs = allPurchaseOrders.filter(po => po.status === 'Stock Updated').length;
  const deletedPOs = allPurchaseOrders.filter(po => po.status === 'Deleted').length;
  // Sum only relevant POs and coerce amounts to numbers to avoid string concatenation
  const totalValue: number = allPurchaseOrders
    .filter(po => po.status !== 'Cancelled' && po.status !== 'Deleted')
    .reduce((sum, po) => sum + Number((po as any).total_amount ?? 0), 0);
  const formattedTotalValue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalValue);

  const [activeTab, setActiveTab] = useState('purchase-orders');

  useEffect(() => {
    loadData();
  }, []);

  // Handle view mode changes - no reload needed since we filter client-side
  const handleViewModeChange = useCallback((mode: 'active' | 'deleted') => {
    setViewMode(mode);
    if (mode === 'deleted') setActiveTab('purchase-orders');
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [poResponse, vendorResponse] = await Promise.all([
        PurchaseService.listPurchases({}), // Load all purchases
        PurchaseService.listVendors()
      ]);

      setAllPurchaseOrders(poResponse.data || []);
      setVendors(vendorResponse.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Don't show alert for now to prevent UI disruption
      // alert('Failed to load purchase data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleViewPO = (po: PurchaseDTO) => {
    setSelectedPO(po);
    setIsViewModalOpen(true);
  };

  // Removed update/edit functionality for purchase orders

  const handleDeletePO = (po: PurchaseDTO) => {
    setSelectedPO(po);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateStockPO = async (po: PurchaseDTO) => {
    try {
      await PurchaseService.updateStockPurchase(po.id);
      
      // Immediately update local state to reflect the stock update
      setAllPurchaseOrders(prev => 
        prev.map(p => 
          Number(p.id) === Number(po.id) 
            ? { ...p, status: 'Stock Updated' as const } 
            : p
        )
      );
      
      // Refresh data in background for consistency
      loadData();
      
      alert('Purchase stock updated successfully');
    } catch (error: any) {
      console.error('Failed to update stock PO:', error);
      const message = error?.response?.data?.error || 'Failed to update stock';
      alert(message);
    }
  };

  const handleRestorePO = async (po: PurchaseDTO) => {
    try {
      setLoading(true);
      await PurchaseService.restorePurchase(po.id);
      
      // Immediately update local state to reflect the restoration
      setAllPurchaseOrders(prev => 
        prev.map(p => 
          Number(p.id) === Number(po.id) 
            ? { ...p, status: 'Draft' as const } 
            : p
        )
      );
      
      // Refresh data in background for consistency
      loadData();
      
      alert('Purchase restored successfully');
    } catch (error: any) {
      console.error('Failed to restore PO:', error);
      const message = error?.response?.data?.error || 'Failed to restore purchase';
      alert(message);
    } finally {
      setLoading(false);
    }
  };



  const handleDeleteConfirm = async () => {
    if (!selectedPO) return;

    try {
      setLoading(true);
      await PurchaseService.softDeletePurchase(selectedPO.id);
      
      // Immediately update local state to reflect the deletion
      setAllPurchaseOrders(prev =>
        prev.map(po =>
          Number(po.id) === Number(selectedPO.id)
            ? { ...po, status: 'Deleted' as const }
            : po
        )
      );
      
      // Refresh data in background for consistency
      loadData();
      
      setIsDeleteModalOpen(false);
      setSelectedPO(null);
      alert('Purchase deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete PO:', error);
      const message = error?.response?.data?.error || 'Failed to delete purchase';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
      'Stock Updated': { variant: 'secondary' as const, className: 'bg-green-100 text-green-800' },
      Cancelled: { variant: 'secondary' as const, className: 'bg-red-100 text-red-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const getPaymentModeBadge = (mode: string) => {
    const modeConfig = {
      Cash: { className: 'bg-green-100 text-green-800' },
      Credit: { className: 'bg-blue-100 text-blue-800' },
      'Bank Transfer': { className: 'bg-indigo-100 text-indigo-800' },
    };
    
    const config = modeConfig[mode as keyof typeof modeConfig] || modeConfig.Cash;
    return (
      <Badge variant="secondary" className={config.className}>
        {mode}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Purchase Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage purchase orders, vendors, and inventory
        </p>
      </div>

      <Tabs value={activeTab} defaultValue="purchase-orders" onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="purchase-orders" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Purchase Orders</span>
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Vendors</span>
          </TabsTrigger>
          <TabsTrigger value="new-purchase" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">New Purchase</span>
          </TabsTrigger>
        </TabsList>



        <TabsContent value="purchase-orders" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total Purchase Orders
                    </p>
                    <p className="text-2xl font-bold">{totalPOs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Draft Orders
                    </p>
                    <p className="text-2xl font-bold">{draftPOs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Stock Updated
                    </p>
                    <p className="text-2xl font-bold">{stockUpdatedPOs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Deleted Orders
                    </p>
                    <p className="text-2xl font-bold">{deletedPOs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total Value
                    </p>
                    <p className="text-2xl font-bold break-words leading-tight">{formattedTotalValue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Purchases
            </h2>
              <div className="flex items-center gap-4">
                {/* Switch toggle styled like Product Master "Show archived" with labels on both sides */}
                <label className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${viewMode === 'active' ? 'text-gray-900' : 'text-gray-500'}`} aria-hidden>
                    Active POs
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={viewMode === 'deleted'}
                      onChange={(e) => handleViewModeChange(e.target.checked ? 'deleted' : 'active')}
                      aria-label="Toggle Active / Deleted Purchases"
                    />
                    <div className={`w-12 h-7 rounded-full transition-colors duration-200 ${viewMode === 'deleted' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-200 ${viewMode === 'deleted' ? 'translate-x-5' : ''}`}></div>
                  </div>
                  <span className={`text-sm font-medium ${viewMode === 'deleted' ? 'text-gray-900' : 'text-gray-500'}`} aria-hidden>
                    Deleted POs
                  </span>
                </label>

                <Button
                  onClick={() => navigate('/fuel-admin/purchase/new')}
                  startIcon={<Plus className="h-4 w-4" />}
                >
                  Add Purchase
                </Button>
              </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        PO Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {purchaseOrders.map((po: PurchaseDTO) => (
                      <tr key={po.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Purchase #{po.id}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {po.invoice_number || 'No Invoice'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {po.Vendor?.name || 'Unknown Vendor'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {getPaymentModeBadge(po.payment_mode)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {new Date(po.invoice_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          ₹{Number(po.total_amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(po.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewPO(po)}
                              title="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {viewMode === 'active' ? (
                              <>
                                {po.status === 'Draft' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateStockPO(po)}
                                    title="Update Stock"
                                  >
                                    <Package className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeletePO(po)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestorePO(po)}
                                title="Restore"
                                className="text-green-600 hover:text-green-700"
                              >
                                Restore
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {purchaseOrders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No purchase orders found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <VendorManagement onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="new-purchase" className="space-y-6">
          <PurchaseOrderForm
            onSave={() => {
              loadData();
              setActiveTab('purchase-orders');
            }}
            onCancel={() => setActiveTab('purchase-orders')}
          />
        </TabsContent>
      </Tabs>

      {/* View Purchase Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        className="max-w-4xl w-full"
      >
        {selectedPO && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Purchase #{selectedPO.id}
              </h3>
            </div>
            <div className="flex items-center gap-2 mb-4">
              {getStatusBadge(selectedPO.status)}
              {getPaymentModeBadge(selectedPO.payment_mode)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Vendor Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedPO.Vendor?.name}</p>
                  {selectedPO.Vendor?.gst_number && (
                    <p><span className="font-medium">GST:</span> {selectedPO.Vendor.gst_number}</p>
                  )}
                  {selectedPO.Vendor?.contact_person && (
                    <p><span className="font-medium">Contact:</span> {selectedPO.Vendor.contact_person}</p>
                  )}
                  {selectedPO.Vendor?.phone && (
                    <p><span className="font-medium">Phone:</span> {selectedPO.Vendor.phone}</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Order Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Invoice Date:</span> {new Date(selectedPO.invoice_date).toLocaleDateString()}</p>
                  {selectedPO.stock_received_date && (
                    <p><span className="font-medium">Receive Date:</span> {new Date(selectedPO.stock_received_date).toLocaleDateString()}</p>
                  )}
                  {selectedPO.invoice_number && (
                    <p><span className="font-medium">Invoice No:</span> {selectedPO.invoice_number}</p>
                  )}
                </div>
              </div>
            </div>

            {selectedPO.items && selectedPO.items.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left">Product</th>
                        <th className="px-3 py-2 text-left">Qty</th>
                        <th className="px-3 py-2 text-left">Rate</th>
                        <th className="px-3 py-2 text-left">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedPO.items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-3 py-2">{item.product_name_at_purchase}</td>
                          <td className="px-3 py-2">{item.quantity}</td>
                          <td className="px-3 py-2">₹{item.purchase_rate}</td>
                          <td className="px-3 py-2">₹{Number((item.taxable_amount || 0) + (item.cgst_amount || 0) + (item.sgst_amount || 0) + (item.igst_amount || 0)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Subtotal: ₹{Number(selectedPO.subtotal || 0).toLocaleString()}</p>
                  <p>Tax: ₹{Number((selectedPO.cgst_amount || 0) + (selectedPO.sgst_amount || 0) + (selectedPO.igst_amount || 0)).toLocaleString()}</p>
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Total: ₹{Number(selectedPO.total_amount || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="max-w-md w-full"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Delete Purchase Order
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete purchase order #{selectedPO?.id}? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="!bg-red-600 hover:!bg-red-700 !text-white !border-red-600"
              onClick={handleDeleteConfirm}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PurchaseDashboard;
