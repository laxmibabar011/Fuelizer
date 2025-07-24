import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import creditService from "../../services/creditService";
// import { useAuth } from "../../context/AuthContext";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import { Modal } from "../../components/ui/modal";

interface PartnerUser {
  id: number;
  name: string;
  email: string;
  isApprover: boolean;
  createdAt: string;
}

interface Partner {
  id: number;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  creditLimit: number;
  currentBalance?: number;
  availableCredit?: number;
  status?: "Active" | "Inactive" | "Suspended";
  role?: string;
  createdAt?: string;
  CustomerUsers?: PartnerUser[];
}

const PartnerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // const { accessToken } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  // Add vehicle state
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleError, setVehicleError] = useState("");
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  // const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [setEditingVehicle] = useState<any | null>(null);

  useEffect(() => {
    const fetchPartner = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await creditService.getPartnerById(
          id || ""
        );
        if (res.data.success && res.data.data) {
          setPartner(res.data.data);
        } else {
          setError(res.data.message || "Partner not found");
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to fetch partner details"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPartner();
  }, [id]);

  // Fetch vehicles for this partner
  useEffect(() => {
    if (!partner) return;
    setVehicleLoading(true);
    setVehicleError("");
    creditService.getVehicles(String(partner.id))
      .then(res => {
        if (res.data.success && Array.isArray(res.data.data)) {
          setVehicles(res.data.data);
        } else {
          setVehicleError(res.data.message || "Failed to fetch vehicles");
        }
      })
      .catch(err => {
        setVehicleError(err.response?.data?.message || "Failed to fetch vehicles");
      })
      .finally(() => setVehicleLoading(false));
  }, [partner]);

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

  const getCreditUtilizationPercentage = () => {
    if (!partner || !partner.creditLimit || !partner.currentBalance) return 0;
    return Math.round((partner.currentBalance / partner.creditLimit) * 100);
  };

  const handleStatusChange = async (
    newStatus: "Active" | "Suspended" | "Inactive"
  ) => {
    if (!partner) return;
    setUpdating(true);
    try {
      await creditService.updatePartnerStatus(
        partner.id,
        newStatus
      );
      setPartner({ ...partner, status: newStatus });
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  // Vehicle status change handler
  const handleVehicleStatusChange = async (vehicleId: string, status: string) => {
    await creditService.setVehicleStatus(vehicleId, status);
    setVehicles(vs => vs.map(v => v.id === vehicleId ? { ...v, status } : v));
  };
  // Vehicle delete handler
  const handleDeleteVehicle = async (vehicleId: string) => {
    await creditService.deleteVehicle(vehicleId);
    setVehicles(vs => vs.filter(v => v.id !== vehicleId));
  };
  // Vehicle edit handler (open modal)
  const handleEditVehicle = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setShowVehicleModal(true);
  };
  // Add vehicle handler (open modal)
  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setShowVehicleModal(true);
  };
  // Save vehicle handler (from modal)
  // const handleSaveVehicle = async (vehicle: any) => {
  //   if (vehicle.id) {
  //     await creditService.updateVehicle(vehicle.id, vehicle);
  //     setVehicles(vs => vs.map(v => v.id === vehicle.id ? vehicle : v));
  //   } else {
  //     const res = await creditService.addVehicles(String(partner?.id), [vehicle]);
  //     if (res.data.success && Array.isArray(res.data.data)) {
  //       setVehicles(vs => [...vs, ...res.data.data]);
  //     }
  //   }
  //   setShowVehicleModal(false);
  // };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error}
          </h2>
          <button
            onClick={() => navigate("/fuel-admin/credit-partners")}
            className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            Back to Partners
          </button>
        </div>
      </div>
    );
  }

  if (!partner) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/fuel-admin/credit-partners")}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {partner.companyName}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Partner ID: {partner.id}{" "}
                  {partner.createdAt && `• Created: ${partner.createdAt}`}
                </p>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() =>
                navigate(`/fuel-admin/credit-partners/${partner.id}/edit`)
              }
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Partner
            </button>
            <button
              onClick={() => navigate("/fuel-admin/credit-onboarding")}
              className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
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
              Add User
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Company Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company Name
                </label>
                <p className="text-gray-900 dark:text-white">
                  {partner.companyName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Person
                </label>
                <p className="text-gray-900 dark:text-white">
                  {partner.contactName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Email
                </label>
                <p className="text-gray-900 dark:text-white">
                  {partner.contactEmail}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Phone
                </label>
                <p className="text-gray-900 dark:text-white">
                  {partner.contactPhone}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(partner.status)}`}
                >
                  {partner.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <p className="text-gray-900 dark:text-white">{partner.role}</p>
              </div>
            </div>
          </div>

          {/* Credit Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Credit Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Credit Limit
                </label>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{partner.creditLimit.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Balance
                </label>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ₹{partner.currentBalance?.toLocaleString() ?? "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Available Credit
                </label>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₹{partner.availableCredit?.toLocaleString() ?? "-"}
                </p>
              </div>
            </div>

            {/* Credit Utilization Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Credit Utilization</span>
                <span>{getCreditUtilizationPercentage()}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    getCreditUtilizationPercentage() > 80
                      ? "bg-red-500"
                      : getCreditUtilizationPercentage() > 60
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${getCreditUtilizationPercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Associated Vehicles */}
          {partner && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Associated Vehicles ({vehicles.length})
              </h3>
              <button
                onClick={handleAddVehicle}
                className="inline-flex items-center px-3 py-1 bg-brand-600 text-white rounded hover:bg-brand-700 text-sm"
              >
                + Add Vehicle
              </button>
            </div>
            {vehicleError && <div className="mb-2 text-red-600">{vehicleError}</div>}
            {vehicleLoading ? (
              <div className="text-gray-500">Loading vehicles...</div>
            ) : vehicles.length === 0 ? (
              <div className="text-gray-500">No vehicles found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>Number</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Fuel Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{v.vehicleNumber}</TableCell>
                      <TableCell>{v.type}</TableCell>
                      <TableCell>{v.model}</TableCell>
                      <TableCell>{v.capacity}</TableCell>
                      <TableCell>{v.fuelType}</TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${v.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {v.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <button onClick={() => handleEditVehicle(v)} className="text-brand-600 hover:text-brand-900 text-xs">Edit</button>
                          <button onClick={() => handleVehicleStatusChange(v.id, v.status === "Active" ? "Inactive" : "Active")} className="text-gray-600 hover:text-gray-900 text-xs">
                            Set {v.status === "Active" ? "Inactive" : "Active"}
                          </button>
                          <button onClick={() => handleDeleteVehicle(v.id)} className="text-red-600 hover:text-red-900 text-xs">Delete</button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {/* Vehicle Modal (for add/edit) - implement modal form as per your design system */}
            <Modal isOpen={showVehicleModal} onClose={() => setShowVehicleModal(false)}>
              {/* Vehicle form fields go here, prefill if editingVehicle, call handleSaveVehicle on save */}
              <div />
            </Modal>
          </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                  <span className="text-gray-900 dark:text-white">
                    Adjust Credit Limit
                  </span>
                </div>
              </button>

              <button className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-gray-900 dark:text-white">
                    Generate Report
                  </span>
                </div>
              </button>

              <button className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span className="text-gray-900 dark:text-white">
                    View Activity
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Status Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Status Actions
            </h3>
            <div className="space-y-3">
              {partner.status === "Active" && (
                <>
                  <button
                    onClick={() => handleStatusChange("Suspended")}
                    disabled={updating}
                    className="w-full p-3 text-left rounded-lg border border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 mb-2"
                  >
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-3 text-red-600 dark:text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                        />
                      </svg>
                      <span className="text-red-600 dark:text-red-400">
                        Suspend Partner
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleStatusChange("Inactive")}
                    disabled={updating}
                    className="w-full p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-200">
                        Inactivate Partner
                      </span>
                    </div>
                  </button>
                </>
              )}
              {partner.status === "Suspended" && (
                <button
                  onClick={() => handleStatusChange("Active")}
                  disabled={updating}
                  className="w-full p-3 text-left rounded-lg border border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-3 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-green-600 dark:text-green-400">
                      Activate Partner
                    </span>
                  </div>
                </button>
              )}
              {partner.status === "Inactive" && (
                <button
                  onClick={() => handleStatusChange("Active")}
                  disabled={updating}
                  className="w-full p-3 text-left rounded-lg border border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-3 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-green-600 dark:text-green-400">
                      Activate Partner
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerDetails;
