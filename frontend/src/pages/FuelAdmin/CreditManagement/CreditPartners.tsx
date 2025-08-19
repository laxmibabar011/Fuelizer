import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import creditService from "../../../services/creditService";
import { useAuth } from "../../../context/AuthContext";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";

interface Partner {
  id: number;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  creditLimit: number;
  currentBalance?: number;
  status?: "Active" | "Inactive" | "Suspended";
  createdAt?: string;
}

const CreditPartners: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [error, setError] = useState<string>("");

  // Adjust limit modal state
  const [showAdjustLimit, setShowAdjustLimit] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [newCreditLimit, setNewCreditLimit] = useState<string>("");
  const [adhocAddition, setAdhocAddition] = useState<string>("");
  const [utilisedBod, setUtilisedBod] = useState<string>("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState<string>("");

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await creditService.getAllPartners();
        if (res.data.success && Array.isArray(res.data.data)) {
          setPartners(res.data.data);
        } else {
          setError(res.data.message || "Failed to fetch partners");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch partners");
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, [accessToken]);

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      partner.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (partner.status &&
        partner.status.toLowerCase() === statusFilter.toLowerCase());
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "Suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleViewDetails = (partnerId: number) => {
    navigate(`/fuel-admin/credit-partners/${partnerId}`);
  };

  const handleEditPartner = (partnerId: number) => {
    navigate(`/fuel-admin/credit-partners/${partnerId}/edit`);
  };

  const handleOpenAdjust = (partner: Partner) => {
    setSelectedPartner(partner);
    setNewCreditLimit(String(partner.creditLimit ?? ""));
    setAdhocAddition("");
    setUtilisedBod(partner.currentBalance ? String(partner.currentBalance) : "");
    setAdjustError("");
    setShowAdjustLimit(true);
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <button
                  onClick={() => navigate("/fuel-admin/credit")}
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Credit Management
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">
                    Credit Customers
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Credit Customers
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage and monitor all credit customers
            </p>
          </div>
          <button
            onClick={() => navigate("/fuel-admin/credit-onboarding")}
            className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add New Customer
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search Customers</Label>
            <Input
              type="text"
              id="search"
              placeholder="Search by company name, contact name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="status">Filter by Status</Label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading partners...
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Customers ({filteredPartners.length})
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredPartners.length} of {partners.length} customers
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Credit Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Current Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPartners.map((partner) => (
                  <tr
                    key={partner.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {partner.companyName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {partner.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {partner.contactName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {partner.contactEmail}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {partner.contactPhone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ₹{Number(partner.creditLimit).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ₹{partner.currentBalance?.toLocaleString() ?? "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(partner.status)}`}
                      >
                        {partner.status || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(partner.id)}
                          className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditPartner(partner.id)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleOpenAdjust(partner)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          Adjust Limit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPartners.length === 0 && (
            <div className="px-6 py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No customers found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by adding your first credit customer."}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <div className="mt-6">
                  <button
                    onClick={() => navigate("/fuel-admin/credit-onboarding")}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add New Customer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Adjust Credit Limit Wizard Modal */}
      {showAdjustLimit && selectedPartner && (
        <Modal isOpen={showAdjustLimit} onClose={() => setShowAdjustLimit(false)} className="max-w-xl w-full p-0">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Adjust Credit Limit</h3>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Sanctioned Limit</Label>
                <Input type="number" value={newCreditLimit} onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  setNewCreditLimit(val);
                }} />
              </div>
              <div>
                <Label>Utilised (BOD)</Label>
                <Input type="text" value={utilisedBod} onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  setUtilisedBod(val);
                }} />
              </div>
              <div>
                <Label>Available Balance</Label>
                <Input type="text" value={(Number(newCreditLimit || 0) - Number(utilisedBod || 0) + Number(adhocAddition || 0)).toString()} disabled />
              </div>
            </div>
            <div>
              <Label>Adhoc Addition during the day</Label>
              <Input type="text" value={adhocAddition} onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                setAdhocAddition(val);
              }} />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This temporary amount increases available balance for the day. It won't persist as sanctioned limit.</p>
            </div>
            {adjustError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{adjustError}</div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAdjustLimit(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                setAdjustError("");
                setAdjustLoading(true);
                const limitNum = Number(newCreditLimit);
                if (Number.isNaN(limitNum) || limitNum <= 0) {
                  setAdjustError("Please enter a valid sanctioned limit.");
                  setAdjustLoading(false);
                  return;
                }
                await creditService.updateCreditLimit(selectedPartner.id, limitNum);
                // update local partner list
                setPartners((prev) => prev.map((p) => p.id === selectedPartner.id ? { ...p, creditLimit: limitNum } : p));
                setShowAdjustLimit(false);
              } catch (err: any) {
                setAdjustError(err?.response?.data?.message || "Failed to update credit limit");
              } finally {
                setAdjustLoading(false);
              }
            }} disabled={adjustLoading}>{adjustLoading ? "Updating..." : "Update"}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CreditPartners;
