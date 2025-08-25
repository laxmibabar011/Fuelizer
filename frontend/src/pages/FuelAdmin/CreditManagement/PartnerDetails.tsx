import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import VehicleOnboardingStep from "./VehicleOnboardingStep";
import creditService from "../../../services/creditService";
import { Modal } from "../../../components/ui/modal";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
// import { useAuth } from "../../context/AuthContext";

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
  utilisedBod?: number;
  adhocAddition?: number;
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

  // Edit vehicle modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

  // Adjust credit limit modal state
  const [showAdjustLimit, setShowAdjustLimit] = useState(false);
  const [newCreditLimit, setNewCreditLimit] = useState<string>("");
  const [adhocAddition, setAdhocAddition] = useState<string>("");
  const [utilisedBod, setUtilisedBod] = useState<string>("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState<string>("");
  // Display states for credit info (adhoc + utilised) to reflect wizard entries
  const [displayAdhoc, setDisplayAdhoc] = useState<number>(0);
  const [displayUtilised, setDisplayUtilised] = useState<number>(0);

  useEffect(() => {
    const fetchPartner = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await creditService.getPartnerById(id || "");
                 if (res.data.success && res.data.data) {
           setPartner(res.data.data);
           setDisplayUtilised(Number(res.data.data.utilisedBod || 0));
           setDisplayAdhoc(Number(res.data.data.adhocAddition || 0));
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
    creditService
      .getVehicles(String(partner.id))
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.data)) {
          setVehicles(res.data.data);
        } else {
          setVehicleError(res.data.message || "Failed to fetch vehicles");
        }
      })
      .catch((err) => {
        setVehicleError(
          err.response?.data?.message || "Failed to fetch vehicles"
        );
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
    if (!partner) return 0;
    const sanctioned = Number(partner.creditLimit || 0);
    const utilised = Number(partner.utilisedBod || 0);
    const adhoc = Number(partner.adhocAddition || 0);
    const denominator = sanctioned + adhoc;
    if (denominator <= 0) return 0;
    return Math.round((utilised / denominator) * 100);
  };

  const getVehicleTypeIcon = (vehicleType: string) => {
    const type = vehicleType.toLowerCase();
    switch (type) {
      case "truck":
        return (
          <svg
            className="h-5 w-5 text-blue-600 dark:text-blue-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h4c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
          </svg>
        );
      case "car":
        return (
          <svg
            className="h-5 w-5 text-green-600 dark:text-green-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
          </svg>
        );
      case "bus":
        return (
          <svg
            className="h-5 w-5 text-purple-600 dark:text-purple-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm5.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6h-5V6h5v5z" />
          </svg>
        );
      case "van":
        return (
          <svg
            className="h-5 w-5 text-orange-600 dark:text-orange-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17 5H3c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zM7 16c-.83 0-1.5-.67-1.5-1.5S6.17 13 7 13s1.5.67 1.5 1.5S7.83 16 7 16zm10 0c-.83 0-1.5-.67-1.5-1.5S16.17 13 17 13s1.5.67 1.5 1.5S17.83 16 17 16z" />
            <path d="M17 7h-2v2h2V7z" />
          </svg>
        );
      default:
        return (
          <svg
            className="h-5 w-5 text-gray-600 dark:text-gray-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
    }
  };

  const handleStatusChange = async (
    newStatus: "Active" | "Suspended" | "Inactive"
  ) => {
    if (!partner) return;
    setUpdating(true);
    try {
      await creditService.updatePartnerStatus(partner.id, newStatus);
      setPartner({ ...partner, status: newStatus });
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  // Vehicle status change handler
  const handleVehicleStatusChange = async (
    vehicleId: string,
    status: string
  ) => {
    await creditService.setVehicleStatus(vehicleId, status);
    setVehicles((vs) =>
      vs.map((v) => (v.id === vehicleId ? { ...v, status } : v))
    );
  };
  // Vehicle delete handler
  const handleDeleteVehicle = async (vehicleId: string) => {
    await creditService.deleteVehicle(vehicleId);
    setVehicles((vs) => vs.filter((v) => v.id !== vehicleId));
  };
  // Vehicle edit handler - open modal with pre-filled data
  const handleEditVehicle = (vehicle: any) => {
    setEditingVehicle({
      id: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      type: vehicle.type,
      model: vehicle.model,
      capacity: vehicle.capacity,
      fuelType: vehicle.fuelType,
      status: vehicle.status,
    });
    setShowEditModal(true);
  };

  // Handle save vehicle
  const handleSaveVehicle = async (vehicle: any) => {
    try {
      await creditService.updateVehicle(editingVehicle.id, vehicle);
      // Update the vehicle in the local state
      setVehicles((vs) =>
        vs.map((v) => (v.id === editingVehicle.id ? { ...v, ...vehicle } : v))
      );
      setShowEditModal(false);
      setEditingVehicle(null);
    } catch (err: any) {
      console.error("Failed to update vehicle:", err);
    }
  };

  // Close edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingVehicle(null);
  };

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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
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
                  <button
                    onClick={() => navigate("/fuel-admin/credit-partners")}
                    className="ml-1 text-sm font-medium text-gray-700 hover:text-brand-600 md:ml-2 dark:text-gray-400 dark:hover:text-brand-400"
                  >
                    Credit Customers
                  </button>
                </div>
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
                    {partner.companyName}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
          <div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate("/fuel-admin/credit-partners")}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 p-1"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
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
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  {partner.companyName}
                </h1>
                {/* <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 truncate">
                  Partner ID: {partner.id}{" "}
                  {partner.createdAt && `• Created: ${partner.createdAt}`}
                </p> */}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() =>
                navigate(`/fuel-admin/credit-partners/${partner.id}/edit`)
              }
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm sm:text-base"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"
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
              <span className="hidden sm:inline">Edit Credit Customer</span>
              <span className="sm:hidden">Edit</span>
            </button>
            {/* <button
              onClick={() => navigate("/fuel-admin/credit-onboarding")}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm sm:text-base"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"
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
              <span className="hidden sm:inline">Add User</span>
              <span className="sm:hidden">Add</span>
            </button> */}
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
                     {/* Company Information */}
           <div className="xl:col-span-4 space-y-4 sm:space-y-6">
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
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                     Sanctioned Limit
                   </label>
                   <p className="text-2xl font-bold text-gray-900 dark:text-white">
                     ₹{Number(partner.creditLimit || 0).toLocaleString("en-IN")}
                   </p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                     Utilised (BOD)
                   </label>
                   <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                     ₹{Number(partner.utilisedBod || 0).toLocaleString("en-IN")}
                   </p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                     Adhoc (Today)
                   </label>
                   <p className="text-2xl font-bold text-gray-900 dark:text-white">
                     ₹{Number(partner.adhocAddition || 0).toLocaleString("en-IN")}
                   </p>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                     Available Balance
                   </label>
                   <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                     ₹{(
                       Number(partner.creditLimit || 0) - Number(partner.utilisedBod || 0) + Number(partner.adhocAddition || 0)
                     ).toLocaleString("en-IN")}
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
               <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0 mb-4 sm:mb-6">
                   <div>
                     <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                       Associated Vehicles
                     </h3>
                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                       {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}{" "}
                       registered
                     </p>
                   </div>
                   <button
                     onClick={() =>
                       navigate(`/fuel-admin/vehicle-onboarding/${partner.id}`)
                     }
                     className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium transition-colors w-full sm:w-auto"
                   >
                     <svg
                       className="w-4 h-4 mr-1 sm:mr-2"
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
                     Add Vehicle
                   </button>
                 </div>

                 {vehicleError && (
                   <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                     {vehicleError}
                   </div>
                 )}

                 {vehicleLoading ? (
                   <div className="flex items-center justify-center py-12">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                     <span className="ml-3 text-gray-600 dark:text-gray-400">
                       Loading vehicles...
                     </span>
                   </div>
                 ) : vehicles.length === 0 ? (
                   <div className="text-center py-12">
                     <svg
                       className="mx-auto h-12 w-12 text-gray-400 mb-4"
                       fill="none"
                       stroke="currentColor"
                       viewBox="0 0 24 24"
                     >
                       <path
                         strokeLinecap="round"
                         strokeLinejoin="round"
                         strokeWidth={2}
                         d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-6 6m6-6l6 6"
                       />
                     </svg>
                     <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                       No vehicles found
                     </h3>
                     <p className="text-gray-600 dark:text-gray-400 mb-4">
                       This partner doesn't have any vehicles registered yet.
                     </p>
                     <button
                       onClick={() =>
                         navigate(`/fuel-admin/vehicle-onboarding/${partner.id}`)
                       }
                       className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
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
                           d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                         />
                       </svg>
                       Add First Vehicle
                     </button>
                   </div>
                 ) : (
                   <div className="w-full">
                     <div className="overflow-x-auto">
                       <table className="w-full table-auto border-collapse">
                         <thead className="bg-gray-50 dark:bg-gray-700">
                           <tr>
                             <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider sm:px-4 w-auto">
                               Vehicle Number
                             </th>
                             <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider sm:px-4 w-auto">
                               Type
                             </th>
                             <th className="hidden sm:table-cell px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider sm:px-4 w-auto">
                               Model Year
                             </th>
                             <th className="hidden md:table-cell px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider sm:px-4 w-auto">
                               Capacity
                             </th>
                             <th className="hidden lg:table-cell px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider sm:px-4 w-auto">
                               Fuel Type
                             </th>
                             <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider sm:px-4 w-auto">
                               Status
                             </th>
                             <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider sm:px-4 w-auto">
                               Actions
                             </th>
                           </tr>
                         </thead>
                         <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                           {vehicles.map((v) => (
                             <tr
                               key={v.id}
                               className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                             >
                               <td className="px-2 py-3 sm:px-4">
                                 <div className="flex items-center">
                                   <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                     {getVehicleTypeIcon(v.type)}
                                   </div>
                                   <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                                     <div className="text-sm font-semibold text-gray-900 dark:text-white break-words">
                                       {v.vehicleNumber}
                                     </div>
                                   </div>
                                 </div>
                               </td>
                               <td className="px-2 py-3 sm:px-4">
                                 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                   {v.type}
                                 </span>
                               </td>
                               <td className="hidden sm:table-cell px-2 py-3 text-sm text-gray-900 dark:text-white sm:px-4">
                                 {v.model}
                               </td>
                               <td className="hidden md:table-cell px-2 py-3 text-sm text-gray-900 dark:text-white sm:px-4">
                                 {v.capacity} L
                               </td>
                               <td className="hidden lg:table-cell px-2 py-3 sm:px-4">
                                 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                   {v.fuelType}
                                 </span>
                               </td>
                               <td className="px-2 py-3 sm:px-4">
                                 <span
                                   className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                     v.status === "Active"
                                       ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                       : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                   }`}
                                 >
                                   <span
                                     className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 sm:mr-1.5 ${
                                       v.status === "Active"
                                         ? "bg-green-400 dark:bg-green-300"
                                         : "bg-gray-400 dark:bg-gray-300"
                                     }`}
                                   ></span>
                                   {v.status}
                                 </span>
                               </td>
                               <td className="px-2 py-3 text-sm font-medium sm:px-4">
                                 <div className="flex flex-col space-y-1">
                                   <button
                                     onClick={() => handleEditVehicle(v)}
                                     className="inline-flex items-center justify-center px-2 py-1 sm:px-2.5 sm:py-1.5 border border-transparent text-xs font-medium rounded text-brand-700 bg-brand-100 hover:bg-brand-200 dark:bg-brand-900 dark:text-brand-300 dark:hover:bg-brand-800 transition-colors w-full"
                                     title="Edit Vehicle"
                                   >
                                     <svg
                                       className="w-3 h-3 sm:mr-1"
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
                                     <span className="hidden sm:inline">Edit</span>
                                   </button>
                                   <button
                                     onClick={() =>
                                       handleVehicleStatusChange(
                                         v.id,
                                         v.status === "Active" ? "Inactive" : "Active"
                                       )
                                     }
                                     className="inline-flex items-center justify-center px-2 py-1 sm:px-2.5 sm:py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors w-full"
                                     title={
                                       v.status === "Active"
                                         ? "Deactivate"
                                         : "Activate"
                                     }
                                   >
                                     <svg
                                       className="w-3 h-3 sm:mr-1"
                                       fill="none"
                                       stroke="currentColor"
                                       viewBox="0 0 24 24"
                                     >
                                       <path
                                         strokeLinecap="round"
                                         strokeLinejoin="round"
                                         strokeWidth={2}
                                         d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                       />
                                       <path
                                         strokeLinecap="round"
                                         strokeLinejoin="round"
                                         strokeWidth={2}
                                         d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                       />
                                     </svg>
                                     <span className="hidden sm:inline">
                                       {v.status === "Active"
                                         ? "Deactivate"
                                         : "Activate"}
                                     </span>
                                   </button>
                                   <button
                                     onClick={() => handleDeleteVehicle(v.id)}
                                     className="inline-flex items-center justify-center px-2 py-1 sm:px-2.5 sm:py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-colors w-full"
                                     title="Delete Vehicle"
                                   >
                                     <svg
                                       className="w-3 h-3 sm:mr-1"
                                       fill="none"
                                       stroke="currentColor"
                                       viewBox="0 0 24 24"
                                     >
                                       <path
                                         strokeLinecap="round"
                                         strokeLinejoin="round"
                                         strokeWidth={2}
                                         d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                       />
                                     </svg>
                                     <span className="hidden sm:inline">Delete</span>
                                   </button>
                                 </div>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>
                 )}
               </div>
             )}
           </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-brand-600 dark:text-brand-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Quick Actions
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Manage partner operations
              </p>
            </div>
            <div className="p-3 space-y-2">
              <button onClick={() => {
                setAdjustError("");
                setNewCreditLimit(partner?.creditLimit ? String(partner.creditLimit) : "");
                setAdhocAddition(partner?.adhocAddition ? String(partner.adhocAddition) : "");
                setUtilisedBod(partner?.utilisedBod ? String(partner.utilisedBod) : "");
                setShowAdjustLimit(true);
              }} className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 hover:from-brand-50 hover:to-brand-100 dark:hover:from-brand-900/20 dark:hover:to-brand-800/20 hover:border-brand-200 dark:hover:border-brand-700 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md">
                <div className="flex items-center p-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex items-center justify-center group-hover:bg-brand-200 dark:group-hover:bg-brand-800/50 transition-colors shadow-sm">
                    <svg
                      className="w-4 h-4 text-brand-600 dark:text-brand-400"
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
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                      Adjust Credit Limit
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Modify partner's credit limit
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>

              <button className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 hover:from-brand-50 hover:to-brand-100 dark:hover:from-brand-900/20 dark:hover:to-brand-800/20 hover:border-brand-200 dark:hover:border-brand-700 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md">
                <div className="flex items-center p-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex items-center justify-center group-hover:bg-brand-200 dark:group-hover:bg-brand-800/50 transition-colors shadow-sm">
                    <svg
                      className="w-4 h-4 text-brand-600 dark:text-brand-400"
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
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                      Generate Report
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Create detailed reports
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          {/* Status Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Status Actions
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Manage partner status
              </p>
            </div>
            <div className="p-3 space-y-2">
              {partner?.status === "Active" && (
                <>
                  <button
                    onClick={() => handleStatusChange("Suspended")}
                    disabled={updating}
                    className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700 hover:from-red-100 hover:to-red-200 dark:hover:from-red-800/30 dark:hover:to-red-700/30 hover:border-red-300 dark:hover:border-red-600 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center p-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-800/60 transition-colors shadow-sm">
                        <svg
                          className="w-4 h-4 text-red-600 dark:text-red-400"
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
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-700 dark:text-red-300 group-hover:text-red-800 dark:group-hover:text-red-200 transition-colors">
                          Suspend Partner
                        </p>
                        <p className="text-xs text-red-500 dark:text-red-400">
                          Temporarily disable access
                        </p>
                      </div>
                      {updating && (
                        <svg
                          className="w-4 h-4 text-red-500 animate-spin"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => handleStatusChange("Inactive")}
                    disabled={updating}
                    className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center p-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors shadow-sm">
                        <svg
                          className="w-4 h-4 text-gray-600 dark:text-gray-400"
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
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors">
                          Inactivate Partner
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Permanently disable account
                        </p>
                      </div>
                      {updating && (
                        <svg
                          className="w-4 h-4 text-gray-500 animate-spin"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                </>
              )}

              {partner?.status === "Suspended" && (
                <button
                  onClick={() => handleStatusChange("Active")}
                  disabled={updating}
                  className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center p-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/60 transition-colors shadow-sm">
                      <svg
                        className="w-5 h-5 text-green-600 dark:text-green-400"
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
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-300 group-hover:text-green-800 dark:group-hover:text-green-200 transition-colors">
                        Activate Partner
                      </p>
                      <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                        Restore full access
                      </p>
                    </div>
                    {updating && (
                      <svg
                        className="w-5 h-5 text-green-500 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              )}

              {partner?.status === "Inactive" && (
                <button
                  onClick={() => handleStatusChange("Active")}
                  disabled={updating}
                  className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center p-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/60 transition-colors shadow-sm">
                      <svg
                        className="w-4 h-4 text-green-600 dark:text-green-400"
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
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 group-hover:text-green-800 dark:group-hover:text-green-200 transition-colors">
                        Activate Partner
                      </p>
                      <p className="text-xs text-green-500 dark:text-green-400">
                        Restore full access
                      </p>
                    </div>
                    {updating && (
                      <svg
                        className="w-4 h-4 text-green-500 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>

      

      {/* Edit Vehicle Modal */}
      {showEditModal && editingVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit Vehicle
                </h3>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <VehicleOnboardingStep
                partnerId={partner?.id?.toString()}
                isEditMode={true}
                editingVehicle={editingVehicle}
                onSave={handleSaveVehicle}
                onCancel={handleCloseEditModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Adjust Credit Limit Wizard Modal */}
      {showAdjustLimit && partner && (
        <Modal isOpen={showAdjustLimit} onClose={() => setShowAdjustLimit(false)} className="max-w-xl w-full p-0">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Adjust Credit Limit</h3>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Sanctioned Limit</Label>
                <Input type="text" value={newCreditLimit} onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  setNewCreditLimit(val);
                }} />
              </div>
              <div>
                <Label>Utilised (BOD)</Label>
                <Input type="text" value={utilisedBod} onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  setUtilisedBod(val || "0");
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
                // Update all credit information
                await creditService.updateCreditLimit(
                  partner.id, 
                  limitNum, 
                  Number(utilisedBod || 0), 
                  Number(adhocAddition || 0)
                );
                // Locally update state & display metrics
                setPartner({ 
                  ...partner, 
                  creditLimit: limitNum,
                  utilisedBod: Number(utilisedBod || 0),
                  adhocAddition: Number(adhocAddition || 0)
                });
                setDisplayAdhoc(Number(adhocAddition || 0));
                setDisplayUtilised(Number(utilisedBod || 0));
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

export default PartnerDetails;
