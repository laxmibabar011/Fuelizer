import React, { useState, useEffect } from "react";
import creditService from "../../../services/creditService";
import { useAuth } from "../../../context/AuthContext";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Modal } from "../../../components/ui/modal";
// Removed unused Table imports

// Types and Interfaces
interface Vehicle {
  id: number;
  vehicleNumber: string;
  type: string;
  model?: string;
  capacity?: string;
  fuelType: string;
  status: "Active" | "Inactive";
  consumption?: number;
  lastTransaction?: string;
}

interface Partner {
  id: number;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  creditLimit: number;
  currentBalance?: number;
  status: "Active" | "Inactive" | "Suspended";
  vehicles: Vehicle[];
}

interface VehicleStats {
  totalPartners: number;
  totalVehicles: number;
  unlinkedVehicles: number;
  totalConsumption: number;
}

// Constants
const VEHICLE_TYPES = ["Truck", "Car", "Bus", "Van", "Tempo", "Bike", "Other"];
const FUEL_TYPES = ["Diesel", "Petrol", "CNG", "Electric", "Other"];

// Utility Classes
class VehicleStatsCalculator {
  static calculateStats(partners: Partner[]): VehicleStats {
    const totalVehicles = partners.reduce(
      (sum, partner) => sum + partner.vehicles.length,
      0
    );
    const totalConsumption = partners.reduce(
      (sum, partner) =>
        sum +
        partner.vehicles.reduce(
          (vSum, vehicle) => vSum + (vehicle.consumption || 0),
          0
        ),
      0
    );

    return {
      totalPartners: partners.length,
      totalVehicles,
      unlinkedVehicles: 0, // Will be calculated separately
      totalConsumption,
    };
  }
}

class VehicleUtils {
  static formatCurrency(amount: number): string {
    return `₹${(amount / 1000).toFixed(0)}K`;
  }

  static getVehicleIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      Truck: "🚛",
      Car: "🚗",
      Bus: "🚌",
      Van: "🚐",
      Tempo: "🚚",
      Bike: "🏍️",
      Other: "🚗",
    };
    return iconMap[type] || iconMap.Other;
  }

  static getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
      case "suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  }
}

// Main Component
const VehicleGroupingManagement: React.FC = () => {
  // State Management
  const { accessToken } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [expandedPartners, setExpandedPartners] = useState<Set<number>>(
    new Set([1])
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [stats, setStats] = useState<VehicleStats>({
    totalPartners: 0,
    totalVehicles: 0,
    unlinkedVehicles: 0,
    totalConsumption: 0,
  });

  // Modal States
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);

  // Form States
  const [newVehicle, setNewVehicle] = useState({
    vehicleNumber: "",
    type: "Truck",
    model: "",
    capacity: "",
    fuelType: "Diesel",
    status: "Active" as const,
    partnerId: "",
  });

  // Data Fetching
  useEffect(() => {
    fetchPartnersWithVehicles();
  }, [accessToken]);

  const fetchPartnersWithVehicles = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await creditService.getAllPartners();
      if (res.data.success && Array.isArray(res.data.data)) {
        const partnersData = res.data.data;

        // Fetch vehicles for each partner
        const partnersWithVehicles = await Promise.all(
          partnersData.map(async (partner: any) => {
            try {
              const vehiclesRes = await creditService.getVehicles(
                String(partner.id)
              );
              const vehicles = vehiclesRes.data.success
                ? vehiclesRes.data.data
                : [];
              return { ...partner, vehicles };
            } catch (err) {
              console.warn(
                `Failed to fetch vehicles for partner ${partner.id}`
              );
              return { ...partner, vehicles: [] };
            }
          })
        );

        setPartners(partnersWithVehicles);
        setStats(VehicleStatsCalculator.calculateStats(partnersWithVehicles));
      } else {
        setError(res.data.message || "Failed to fetch partners");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Event Handlers
  const togglePartnerExpansion = (partnerId: number) => {
    const newExpanded = new Set(expandedPartners);
    if (newExpanded.has(partnerId)) {
      newExpanded.delete(partnerId);
    } else {
      newExpanded.add(partnerId);
    }
    setExpandedPartners(newExpanded);
  };

  const handleAddVehicle = () => {
    setNewVehicle({
      vehicleNumber: "",
      type: "Truck",
      model: "",
      capacity: "",
      fuelType: "Diesel",
      status: "Active",
      partnerId: "",
    });
    setShowAddVehicleModal(true);
  };

  const handleSaveVehicle = async () => {
    if (!newVehicle.vehicleNumber || !newVehicle.partnerId) {
      alert("Please fill in required fields");
      return;
    }

    try {
      await creditService.addVehicles(newVehicle.partnerId, [newVehicle]);
      setShowAddVehicleModal(false);
      fetchPartnersWithVehicles(); // Refresh data
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add vehicle");
    }
  };

  const handleVehicleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewVehicle((prev) => ({ ...prev, [name]: value }));
  };

  const calculatePartnerUtilization = (partner: Partner): number => {
    if (!partner.creditLimit) return 0;
    return ((partner.currentBalance || 0) / partner.creditLimit) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Loading vehicle data...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
          Error
        </h3>
        <p className="text-red-700 dark:text-red-400">{error}</p>
        <button
          onClick={fetchPartnersWithVehicles}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Vehicle Grouping Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Group vehicles under parent customers for consolidated credit
            tracking
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleAddVehicle}
            className="inline-flex items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
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
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Total Customers
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalPartners}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Active accounts
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Total Vehicles
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalVehicles}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Linked vehicles
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Unlinked Vehicles
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {stats.unlinkedVehicles}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Need assignment
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Total Consumption
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {VehicleUtils.formatCurrency(stats.totalConsumption)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Across all vehicles
          </div>
        </div>
      </div>

      {/* Customer-Vehicle Grouping */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Customer Vehicle Groups
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Vehicles grouped under parent customers with consolidated credit
            tracking
          </p>
        </div>

        <div className="space-y-4">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              {/* Partner Header - Collapsible */}
              <div
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => togglePartnerExpansion(partner.id)}
              >
                <div className="flex items-center space-x-3">
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      expandedPartners.has(partner.id)
                        ? "transform rotate-90"
                        : ""
                    }`}
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
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {partner.companyName}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {partner.contactEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Credit Limit:{" "}
                      {VehicleUtils.formatCurrency(partner.creditLimit)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Utilization:{" "}
                      {VehicleUtils.formatCurrency(partner.currentBalance || 0)}{" "}
                      ({calculatePartnerUtilization(partner).toFixed(1)}%)
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {partner.vehicles.length} vehicles
                  </Badge>
                </div>
              </div>

              {/* Vehicle Table - Collapsible Content */}
              {expandedPartners.has(partner.id) && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {partner.vehicles.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                              Vehicle Number
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase hidden sm:table-cell">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase hidden md:table-cell">
                              Model
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase hidden lg:table-cell">
                              Consumption
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                              Status
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {partner.vehicles.map((vehicle) => (
                            <tr
                              key={vehicle.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">
                                    {VehicleUtils.getVehicleIcon(vehicle.type)}
                                  </span>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {vehicle.vehicleNumber}
                                    </div>
                                    {/* Mobile: Show additional info */}
                                    <div className="sm:hidden text-xs text-gray-500 dark:text-gray-400">
                                      {vehicle.type} • {vehicle.fuelType}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 hidden sm:table-cell">
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {vehicle.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {vehicle.model || "N/A"}
                                </span>
                              </td>
                              <td className="px-4 py-3 hidden lg:table-cell">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {vehicle.consumption
                                    ? VehicleUtils.formatCurrency(
                                        vehicle.consumption
                                      )
                                    : "₹0"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant="outline"
                                  className={`${VehicleUtils.getStatusColor(vehicle.status)} text-xs`}
                                >
                                  {vehicle.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  <button
                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    title="View Details"
                                  >
                                    <svg
                                      className="w-4 h-4"
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
                                  </button>
                                  <button
                                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                    title="Unlink Vehicle"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        No vehicles assigned to this partner
                      </p>
                      <button
                        onClick={handleAddVehicle}
                        className="mt-2 text-brand-600 hover:text-brand-700 dark:text-brand-400 text-sm"
                      >
                        Add first vehicle
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <Modal
          isOpen={showAddVehicleModal}
          onClose={() => setShowAddVehicleModal(false)}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New Vehicle
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={newVehicle.vehicleNumber}
                    onChange={handleVehicleInputChange}
                    placeholder="e.g., MH12AB1234"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vehicle Type *
                  </label>
                  <select
                    name="type"
                    value={newVehicle.type}
                    onChange={handleVehicleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  >
                    {VEHICLE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vehicle Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={newVehicle.model}
                  onChange={handleVehicleInputChange}
                  placeholder="e.g., Tata 407"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacity
                  </label>
                  <input
                    type="text"
                    name="capacity"
                    value={newVehicle.capacity}
                    onChange={handleVehicleInputChange}
                    placeholder="e.g., 10 Tons"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fuel Type *
                  </label>
                  <select
                    name="fuelType"
                    value={newVehicle.fuelType}
                    onChange={handleVehicleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  >
                    {FUEL_TYPES.map((fuel) => (
                      <option key={fuel} value={fuel}>
                        {fuel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Link to Customer *
                </label>
                <select
                  name="partnerId"
                  value={newVehicle.partnerId}
                  onChange={handleVehicleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a customer...</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddVehicleModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveVehicle}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
              >
                Add Vehicle
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default VehicleGroupingManagement;
