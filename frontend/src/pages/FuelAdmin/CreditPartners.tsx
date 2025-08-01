import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import creditService from "../../services/creditService";
import { useAuth } from "../../context/AuthContext";

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

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
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
                      ₹{partner.creditLimit.toLocaleString()}
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
    </div>
  );
};

export default CreditPartners;
