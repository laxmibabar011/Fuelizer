/**
 * Payment Methods Configuration Page
 * Allows fuel-admin to manage payment methods (CRUD operations)
 */

import React, { useState, useEffect, useCallback } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Switch from "../../../components/form/switch/Switch";
import LoadingSpinner from "../../../components/ui/spinner/Spinner";
import {
  PencilIcon,
  TrashBinIcon,
  PlusIcon,
  CreditCardIcon,
} from "../../../icons";
import paymentMethodService, {
  PaymentMethodDTO,
} from "../../../services/paymentMethodService";

interface PaymentMethodRow extends PaymentMethodDTO {
  icon: string;
}

type BillMode = "cash" | "credit" | "card" | "cash_party";

const PaymentMethods: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodRow | null>(
    null
  );
  const [includeInactive, setIncludeInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    bill_mode: "cash" as BillMode,
    is_active: true,
    party_name_strategy: "fixed" as "fixed" | "credit_customer",
    default_party_name: "",
    party_name_uppercase: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Load payment methods
  const loadPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const methods = await paymentMethodService.list(includeInactive);

      // Add icons to payment methods
      const methodsWithIcons: PaymentMethodRow[] = methods.map((method) => ({
        ...method,
        icon: getPaymentMethodIcon(method.name),
      }));

      setPaymentMethods(methodsWithIcons);
    } catch (err: any) {
      setError(err.message || "Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  // Get appropriate icon for payment method
  const getPaymentMethodIcon = (name: string): string => {
    const lowerName = name.toLowerCase();

    if (lowerName.includes("cash")) return "💰";
    if (
      lowerName.includes("card") ||
      lowerName.includes("debit") ||
      lowerName.includes("credit card")
    )
      return "💳";
    if (
      lowerName.includes("upi") ||
      lowerName.includes("mobile") ||
      lowerName.includes("phone")
    )
      return "📱";
    if (lowerName.includes("credit") && !lowerName.includes("card"))
      return "🏪";
    if (
      lowerName.includes("wallet") ||
      lowerName.includes("paytm") ||
      lowerName.includes("gpay")
    )
      return "📱";
    if (lowerName.includes("bank") || lowerName.includes("transfer"))
      return "🏦";
    if (lowerName.includes("check") || lowerName.includes("cheque"))
      return "📄";

    return "💳";
  };

  // Load data on component mount
  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  // Filter payment methods based on search
  const filteredMethods = paymentMethods.filter((method) =>
    method.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      bill_mode: "cash" as BillMode,
      is_active: true,
      party_name_strategy: "fixed",
      default_party_name: "",
      party_name_uppercase: true,
    });
    setFormErrors({});
    setSelectedMethod(null);
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Payment method name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Payment method name must be at least 2 characters";
    } else if (formData.name.trim().length > 50) {
      errors.name = "Payment method name must be less than 50 characters";
    }

    // Check for duplicate names (excluding current method when editing)
    const isDuplicate = paymentMethods.some(
      (method) =>
        method.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        method.id !== selectedMethod?.id
    );

    if (isDuplicate) {
      errors.name = "A payment method with this name already exists";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create payment method
  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await paymentMethodService.create({
        name: formData.name.trim(),
        bill_mode: formData.bill_mode,
        party_name_strategy: formData.party_name_strategy,
        default_party_name: formData.default_party_name?.trim() || undefined,
        party_name_uppercase: formData.party_name_uppercase,
      });
      await loadPaymentMethods();
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setFormErrors({
        submit: err.message || "Failed to create payment method",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update payment method
  const handleUpdate = async () => {
    if (!validateForm() || !selectedMethod) return;

    try {
      setSubmitting(true);
      await paymentMethodService.update(selectedMethod.id, {
        name: formData.name.trim(),
        bill_mode: formData.bill_mode,
        is_active: formData.is_active,
        party_name_strategy: formData.party_name_strategy,
        default_party_name: formData.default_party_name?.trim() || undefined,
        party_name_uppercase: formData.party_name_uppercase,
      });
      await loadPaymentMethods();
      setShowEditModal(false);
      resetForm();
    } catch (err: any) {
      setFormErrors({
        submit: err.message || "Failed to update payment method",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete payment method
  const handleDelete = async () => {
    if (!selectedMethod) return;

    try {
      setSubmitting(true);
      await paymentMethodService.delete(selectedMethod.id);
      await loadPaymentMethods();
      setShowDeleteModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to delete payment method");
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (method: PaymentMethodRow) => {
    setSelectedMethod(method);
    setFormData({
      name: method.name,
      bill_mode: method.bill_mode,
      is_active: method.is_active,
      party_name_strategy: (method.party_name_strategy as any) || "fixed",
      default_party_name: method.default_party_name || "",
      party_name_uppercase: method.party_name_uppercase ?? true,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (method: PaymentMethodRow) => {
    setSelectedMethod(method);
    setShowDeleteModal(true);
  };

  // Open add modal
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <PageBreadcrumb pageTitle="Payment Methods" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <CreditCardIcon className="h-6 w-6 mr-2 text-blue-600" />
            Payment Methods
          </h1>
          <p className="text-gray-600 mt-1">
            Manage payment methods available for transactions
          </p>
        </div>
        <Button onClick={openAddModal} className="flex items-center">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search payment methods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              label=""
              defaultChecked={includeInactive}
              onChange={setIncludeInactive}
            />
            <label htmlFor="include-inactive" className="text-sm text-gray-700">
              Show inactive
            </label>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <LoadingSpinner size="large" />
            <span className="ml-3 text-gray-600">
              Loading payment methods...
            </span>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadPaymentMethods} variant="outline">
              Retry
            </Button>
          </div>
        ) : filteredMethods.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">💳</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm
                ? "No payment methods found"
                : "No payment methods yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? `No payment methods match "${searchTerm}"`
                : "Get started by adding your first payment method"}
            </p>
            {!searchTerm && (
              <Button onClick={openAddModal}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bill Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMethods.map((method) => (
                    <tr key={method.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-lg">{method.icon}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {method.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {method.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {method.bill_mode.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            method.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {method.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {method.createdAt
                          ? new Date(method.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {method.updatedAt
                          ? new Date(method.updatedAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(method)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(method)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                            title="Delete"
                          >
                            <TrashBinIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="border-t border-gray-200 px-6 py-4 text-sm text-gray-600">
              Showing {filteredMethods.length} of {paymentMethods.length}{" "}
              payment methods
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          </>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowAddModal(false)}
            ></div>
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">
                    Add Payment Method
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method Name{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="e.g., Cash, UPI, Credit Card"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        error={!!formErrors.name}
                        hint={formErrors.name}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill Mode <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.bill_mode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bill_mode: e.target.value as BillMode,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="cash">Cash</option>
                        <option value="credit">Credit</option>
                        <option value="card">Card Swipe</option>
                        <option value="cash_party">Cash Party</option>
                      </select>
                    </div>

                    {/* Party Name Strategy */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Party Name Strategy
                      </label>
                      <select
                        value={formData.party_name_strategy}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            party_name_strategy: e.target.value as
                              | "fixed"
                              | "credit_customer",
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="fixed">
                          Fixed (use default party name)
                        </option>
                        <option value="credit_customer">
                          Credit Customer (use selected customer name)
                        </option>
                      </select>
                    </div>

                    {formData.party_name_strategy === "fixed" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Default Party Name
                        </label>
                        <Input
                          placeholder="e.g., Cash, SALES BY PAYTM, SALES BY HP PAY"
                          value={formData.default_party_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              default_party_name: e.target.value,
                            })
                          }
                        />
                        <div className="mt-2 flex items-center space-x-2">
                          <Switch
                            label=""
                            defaultChecked={formData.party_name_uppercase}
                            onChange={(checked) =>
                              setFormData({
                                ...formData,
                                party_name_uppercase: checked,
                              })
                            }
                          />
                          <label className="text-sm text-gray-700">
                            Uppercase in Excel
                          </label>
                        </div>
                        {formData.default_party_name && (
                          <div className="mt-2 text-xs text-gray-600">
                            Preview:{" "}
                            <span className="font-semibold">
                              {formData.party_name_uppercase
                                ? formData.default_party_name.toUpperCase()
                                : formData.default_party_name}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {formErrors.submit && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        {formErrors.submit}
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddModal(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreate} disabled={submitting}>
                        {submitting ? (
                          <>
                            <LoadingSpinner size="small" className="mr-2" />
                            Creating...
                          </>
                        ) : (
                          "Create Payment Method"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowEditModal(false)}
            ></div>
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">
                    Edit Payment Method
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method Name{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="e.g., Cash, UPI, Credit Card"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        error={!!formErrors.name}
                        hint={formErrors.name}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill Mode <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.bill_mode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bill_mode: e.target.value as BillMode,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="cash">Cash</option>
                        <option value="credit">Credit</option>
                        <option value="card">Card</option>
                        <option value="cash_party">Cash Party</option>
                      </select>
                    </div>

                    {/* Party Name Strategy (Edit) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Party Name Strategy
                      </label>
                      <select
                        value={formData.party_name_strategy}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            party_name_strategy: e.target.value as
                              | "fixed"
                              | "credit_customer",
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="fixed">
                          Fixed (use default party name)
                        </option>
                        <option value="credit_customer">
                          Credit Customer (use selected customer name)
                        </option>
                      </select>
                    </div>

                    {formData.party_name_strategy === "fixed" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Default Party Name
                        </label>
                        <Input
                          placeholder="e.g., Cash, SALES BY PAYTM, SALES BY HP PAY"
                          value={formData.default_party_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              default_party_name: e.target.value,
                            })
                          }
                        />
                        <div className="mt-2 flex items-center space-x-2">
                          <Switch
                            label=""
                            defaultChecked={formData.party_name_uppercase}
                            onChange={(checked) =>
                              setFormData({
                                ...formData,
                                party_name_uppercase: checked,
                              })
                            }
                          />
                          <label className="text-sm text-gray-700">
                            Uppercase in Excel
                          </label>
                        </div>
                        {formData.default_party_name && (
                          <div className="mt-2 text-xs text-gray-600">
                            Preview:{" "}
                            <span className="font-semibold">
                              {formData.party_name_uppercase
                                ? formData.default_party_name.toUpperCase()
                                : formData.default_party_name}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch
                        label=""
                        defaultChecked={formData.is_active}
                        onChange={(checked) =>
                          setFormData({ ...formData, is_active: checked })
                        }
                      />
                      <label
                        htmlFor="is-active"
                        className="text-sm text-gray-700"
                      >
                        Active (available for transactions)
                      </label>
                    </div>

                    {formErrors.submit && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        {formErrors.submit}
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowEditModal(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleUpdate} disabled={submitting}>
                        {submitting ? (
                          <>
                            <LoadingSpinner size="small" className="mr-2" />
                            Updating...
                          </>
                        ) : (
                          "Update Payment Method"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowDeleteModal(false)}
            ></div>
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">
                    Delete Payment Method
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl">⚠️</div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Confirm Deletion
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Are you sure you want to delete "
                          {selectedMethod?.name}"? This will deactivate the
                          payment method and prevent it from being used in new
                          transactions.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteModal(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleDelete}
                        disabled={submitting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {submitting ? (
                          <>
                            <LoadingSpinner size="small" className="mr-2" />
                            Deleting...
                          </>
                        ) : (
                          "Delete Payment Method"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;
