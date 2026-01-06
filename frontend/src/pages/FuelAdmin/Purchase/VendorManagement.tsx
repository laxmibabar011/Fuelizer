import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import TextArea from "../../../components/form/input/TextArea";
import { Modal } from "../../../components/ui/modal";
import PurchaseService, { Vendor } from "../../../services/purchaseService";
import {
  Plus,
  Trash2,
  Search,
  Building,
  MapPin,
  Save,
  X,
  Eye,
  Edit,
} from "lucide-react";

// Local form type to support UI state (maps to backend Vendor on save)
type VendorForm = {
  name: string;
  gstNumber?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: "active" | "inactive";
  city?: string;
  state?: string;
  pincode?: string;
  customerId?: string;
  aadhaarNumber?: string;
  pan?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  chequeNumber?: string;
  areaRoute?: string;
  tin?: string;
};

interface VendorManagementProps {
  onRefresh?: () => void;
}

const VendorManagement: React.FC<VendorManagementProps> = ({ onRefresh }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [prefillHandled, setPrefillHandled] = useState(false);
  const handleViewVendor = (vendor: Vendor) => {
    // TODO: Implement vendor preview modal
    setSelectedVendor(vendor);
    setIsPreviewModalOpen(true);
    setSelectedVendor(vendor);
    setIsPreviewModalOpen(true);
  };
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<VendorForm>({
    name: "",
    gstNumber: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    status: "active",
    city: "",
    state: "",
    pincode: "",
    customerId: "",
    aadhaarNumber: "",
    pan: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    chequeNumber: "",
    areaRoute: "",
    tin: "",
  });

  useEffect(() => {
    loadVendors();
  }, []);

  // Auto-open Add Vendor modal with prefilled name from ?prefill=
  useEffect(() => {
    if (prefillHandled) return;
    const params = new URLSearchParams(location.search);
    const prefill = params.get("prefill");
    if (prefill && prefill.trim()) {
      setFormData((prev) => ({ ...prev, name: prefill }));
      setIsAddModalOpen(true);
      setPrefillHandled(true);
      // Clean up the URL to avoid re-triggering on re-mounts
      params.delete("prefill");
      const rest = params.toString();
      navigate({ pathname: location.pathname, search: rest ? `?${rest}` : "" }, { replace: true });
    }
  }, [location.search, location.pathname, navigate, prefillHandled]);

  // Auto-open Add Vendor modal with prefilled name from ?prefill=
  useEffect(() => {
    if (prefillHandled) return;
    const params = new URLSearchParams(location.search);
    const prefill = params.get("prefill");
    if (prefill && prefill.trim()) {
      setFormData((prev) => ({ ...prev, name: prefill }));
      setIsAddModalOpen(true);
      setPrefillHandled(true);
      // Clean up the URL to avoid re-triggering on re-mounts
      params.delete("prefill");
      const rest = params.toString();
      navigate({ pathname: location.pathname, search: rest ? `?${rest}` : "" }, { replace: true });
    }
  }, [location.search, location.pathname, navigate, prefillHandled]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await PurchaseService.listVendors();
      setVendors(response.data || []);
    } catch (error) {
      console.error('Failed to load vendors:', error);
      alert('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = () => {
    setFormData({
      name: "",
      gstNumber: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      status: "active",
      city: "",
      state: "",
      pincode: "",
      customerId: "",
      aadhaarNumber: "",
      pan: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      chequeNumber: "",
      areaRoute: "",
      tin: "",
    });
    setIsAddModalOpen(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    // Map backend vendor fields to form fields
    setFormData({
      name: vendor.name,
      gstNumber: vendor.gst_number || "",
      contactPerson: vendor.contact_person || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      address: vendor.address || "",
      status: vendor.status,
      city: vendor.city || "",
      state: vendor.state || "",
      pincode: vendor.pincode || "",
      customerId: vendor.customer_id || "",
      aadhaarNumber: vendor.aadhaar_number || "",
      pan: vendor.pan || "",
      bankName: vendor.bank_name || "",
      accountNumber: vendor.account_number || "",
      ifscCode: vendor.ifsc_code || "",
      chequeNumber: vendor.cheque_number || "",
      areaRoute: vendor.area_route || "",
      tin: vendor.tin || "",
    });
    // Map backend vendor fields to form fields
    setFormData({
      name: vendor.name,
      gstNumber: vendor.gst_number || "",
      contactPerson: vendor.contact_person || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      address: vendor.address || "",
      status: vendor.status,
      city: vendor.city || "",
      state: vendor.state || "",
      pincode: vendor.pincode || "",
      customerId: vendor.customer_id || "",
      aadhaarNumber: vendor.aadhaar_number || "",
      pan: vendor.pan || "",
      bankName: vendor.bank_name || "",
      accountNumber: vendor.account_number || "",
      ifscCode: vendor.ifsc_code || "",
      chequeNumber: vendor.cheque_number || "",
      areaRoute: vendor.area_route || "",
      tin: vendor.tin || "",
    });
    setSelectedVendor(vendor);
    setIsEditModalOpen(true);
  };

  const handleDeleteVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsDeleteModalOpen(true);
  };

  const handleSaveVendor = async () => {
    if (!formData.name) {
      alert('Vendor name is required');
      return;
    }

    if (!formData.state) {
      alert('Vendor state is required for GST calculations');
      return;
    }

    try {
      // Map form data to API payload shape (snake_case)
      const payload: Partial<Vendor> = {
        name: formData.name?.trim(),
        gst_number: formData.gstNumber?.trim() || undefined,
        contact_person: formData.contactPerson?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        status: formData.status || 'active',
        city: formData.city?.trim() || undefined,
        state: formData.state?.trim() || undefined,
        pincode: formData.pincode?.trim() || undefined,
        customer_id: formData.customerId?.trim() || undefined,
        aadhaar_number: formData.aadhaarNumber?.trim() || undefined,
        pan: formData.pan?.trim() || undefined,
        bank_name: formData.bankName?.trim() || undefined,
        account_number: formData.accountNumber?.trim() || undefined,
        ifsc_code: formData.ifscCode?.trim() || undefined,
        cheque_number: formData.chequeNumber?.trim() || undefined,
        area_route: formData.areaRoute?.trim() || undefined,
        tin: formData.tin?.trim() || undefined,
      };

      if (selectedVendor) {
        await PurchaseService.updateVendor(selectedVendor.id, payload);
        await PurchaseService.updateVendor(selectedVendor.id, payload);
        alert('Vendor updated successfully');
      } else {
        await PurchaseService.createVendor(payload);
        await PurchaseService.createVendor(payload);
        alert('Vendor created successfully');
      }


      await loadVendors();
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedVendor(null);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to save vendor:', error);
      alert('Failed to save vendor');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVendor) return;

    try {
      await PurchaseService.deleteVendor(selectedVendor.id);
      await loadVendors();
      setIsDeleteModalOpen(false);
      setSelectedVendor(null);
      alert('Vendor deleted successfully');
      onRefresh?.();
    } catch (error) {
      console.error('Failed to delete vendor:', error);
      alert('Failed to delete vendor');
    }
  };

  const handleInputChange = (field: keyof VendorForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredVendors = vendors.filter((vendor) => {
    const term = searchTerm.toLowerCase();
    return (
      vendor.name.toLowerCase().includes(term) ||
      (vendor.gst_number?.toLowerCase().includes(term) ?? false) ||
      (vendor.contact_person?.toLowerCase().includes(term) ?? false)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Vendor Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your vendors and suppliers
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
          <Button
            onClick={handleAddVendor}
            startIcon={<Plus className="h-4 w-4" />}
          >
            Add Vendor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map((vendor) => (
          <Card key={vendor.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {vendor.name}
                    </h3>
                    <button
                      className={`px-3 py-1 rounded-full font-semibold text-xs shadow-sm border-0 focus:outline-none ${vendor.status === 'active'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      disabled
                      style={{ cursor: 'default' }}
                    >
                      {vendor.status}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="p-1 h-7 w-7 bg-transparent"
                    onClick={() => handleViewVendor(vendor)}
                    startIcon={<Eye className="h-4 w-4 text-blue-500" />}
                  >
                    {""}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="p-1 h-7 w-7 bg-transparent"
                    onClick={() => handleEditVendor(vendor)}
                    startIcon={<Edit className="h-4 w-4 text-green-500" />}
                  >
                    {""}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="p-1 h-7 w-7 bg-transparent"
                    onClick={() => handleDeleteVendor(vendor)}
                    startIcon={<Trash2 className="h-4 w-4 text-red-500" />}
                  >
                    {""}
                  </Button>
                </div>
              </div>
              {vendor.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{vendor.address}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {searchTerm ? 'No vendors found' : 'No vendors yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first vendor'
            }
          </p>
          {!searchTerm && (
            <Button
              onClick={handleAddVendor}
              startIcon={<Plus className="h-4 w-4" />}
            >
              Add Vendor
            </Button>
          )}
        </div>
      )}

      {/* Add/Edit Vendor Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedVendor(null);
        }}
        className="max-w-3xl w-full"
      >
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            {selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Vendor Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter vendor name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  value={formData.gstNumber || ""}
                  onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                  placeholder="Enter GST number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson || ""}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  placeholder="Enter contact person name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <TextArea
                value={formData.address || ""}
                onChange={(value) => handleInputChange('address', value)}
                placeholder="Enter vendor address"
                rows={3}
              />
            </div>

            {/* Location fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city || ""}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
                <Input
                  id="state"
                  value={formData.state || ""}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Enter state (required for GST)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={formData.pincode || ""}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  placeholder="Enter pincode"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status || "active"}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Extended fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer ID</Label>
                <Input
                  id="customerId"
                  value={formData.customerId || ""}
                  onChange={(e) => handleInputChange('customerId', e.target.value)}
                  placeholder="Enter customer ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                <Input
                  id="aadhaarNumber"
                  value={formData.aadhaarNumber || ""}
                  onChange={(e) => handleInputChange('aadhaarNumber', e.target.value)}
                  placeholder="Enter Aadhaar number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan">PAN</Label>
                <Input
                  id="pan"
                  value={formData.pan || ""}
                  onChange={(e) => handleInputChange('pan', e.target.value)}
                  placeholder="Enter PAN"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bankName || ""}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  placeholder="Enter bank name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">A/C No</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber || ""}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  placeholder="Enter account number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  value={formData.ifscCode || ""}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                  placeholder="Enter IFSC code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chequeNumber">Cheque No</Label>
                <Input
                  id="chequeNumber"
                  value={formData.chequeNumber || ""}
                  onChange={(e) => handleInputChange('chequeNumber', e.target.value)}
                  placeholder="Enter cheque number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="areaRoute">Area/Route</Label>
                <Input
                  id="areaRoute"
                  value={formData.areaRoute || ""}
                  onChange={(e) => handleInputChange('areaRoute', e.target.value)}
                  placeholder="Enter area/route"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tin">TIN</Label>
                <Input
                  id="tin"
                  value={formData.tin || ""}
                  onChange={(e) => handleInputChange('tin', e.target.value)}
                  placeholder="Enter TIN"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 sticky bottom-0 bg-white dark:bg-gray-900 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedVendor(null);
              }}
              startIcon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveVendor}
              startIcon={<Save className="h-4 w-4" />}
            >
              {selectedVendor ? 'Update Vendor' : 'Add Vendor'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="max-w-md w-full"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Delete Vendor
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete vendor "{selectedVendor?.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              onClick={handleDeleteConfirm}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>
      {/* Vendor Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        className="max-w-lg w-full"
      >
        {selectedVendor && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Vendor Details
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {selectedVendor.name}</p>
              <p><span className="font-medium">Status:</span> {selectedVendor.status}</p>
              {selectedVendor.gst_number && (
                <p><span className="font-medium">GST:</span> {selectedVendor.gst_number}</p>
              )}
              {selectedVendor.contact_person && (
                <p><span className="font-medium">Contact:</span> {selectedVendor.contact_person}</p>
              )}
              {selectedVendor.phone && (
                <p><span className="font-medium">Phone:</span> {selectedVendor.phone}</p>
              )}
              {selectedVendor.email && (
                <p><span className="font-medium">Email:</span> {selectedVendor.email}</p>
              )}
              {selectedVendor.address && (
                <p><span className="font-medium">Address:</span> {selectedVendor.address}</p>
              )}
              {selectedVendor.city && (
                <p><span className="font-medium">City:</span> {selectedVendor.city}</p>
              )}
              {selectedVendor.state && (
                <p><span className="font-medium">State:</span> {selectedVendor.state}</p>
              )}
              {selectedVendor.pincode && (
                <p><span className="font-medium">Pincode:</span> {selectedVendor.pincode}</p>
              )}
              {selectedVendor.customer_id && (
                <p><span className="font-medium">Customer ID:</span> {selectedVendor.customer_id}</p>
              )}
              {selectedVendor.aadhaar_number && (
                <p><span className="font-medium">Aadhaar:</span> {selectedVendor.aadhaar_number}</p>
              )}
              {selectedVendor.pan && (
                <p><span className="font-medium">PAN:</span> {selectedVendor.pan}</p>
              )}
              {selectedVendor.bank_name && (
                <p><span className="font-medium">Bank:</span> {selectedVendor.bank_name}</p>
              )}
              {selectedVendor.account_number && (
                <p><span className="font-medium">A/C No:</span> {selectedVendor.account_number}</p>
              )}
              {selectedVendor.ifsc_code && (
                <p><span className="font-medium">IFSC:</span> {selectedVendor.ifsc_code}</p>
              )}
              {selectedVendor.cheque_number && (
                <p><span className="font-medium">Cheque No:</span> {selectedVendor.cheque_number}</p>
              )}
              {selectedVendor.area_route && (
                <p><span className="font-medium">Area/Route:</span> {selectedVendor.area_route}</p>
              )}
              {selectedVendor.tin && (
                <p><span className="font-medium">TIN:</span> {selectedVendor.tin}</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>);
};

export default VendorManagement;
