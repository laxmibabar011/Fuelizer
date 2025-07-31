import React, { useState } from "react";
import Form from "../../components/form/Form";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import creditService from "../../services/creditService";

interface Vehicle {
  vehicleNumber: string;
  type: string;
  model: string;
  capacity: string;
  fuelType: string;
  status: "Active" | "Inactive";
}

interface VehicleOnboardingStepProps {
  partnerId: string;
  onComplete: () => void;
  onSkip: () => void;
}

const VEHICLE_TYPES = ["Truck", "Car", "Bus", "Van", "Other"];
const FUEL_TYPES = ["Diesel", "Petrol", "CNG", "Electric", "Other"];

const VehicleOnboardingStep: React.FC<VehicleOnboardingStepProps> = ({ partnerId, onComplete, onSkip }) => {
  const [vehicle, setVehicle] = useState<Vehicle>({
    vehicleNumber: "",
    type: "Truck",
    model: "",
    capacity: "",
    fuelType: "Diesel",
    status: "Active",
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVehicle((prev) => ({ ...prev, [name]: value }));
  };

  const validateVehicle = () => {
    if (!vehicle.vehicleNumber) {
      setError("Vehicle Number is required");
      return false;
    }
    if (!vehicle.type) {
      setError("Vehicle Type is required");
      return false;
    }
    if (!vehicle.fuelType) {
      setError("Fuel Type is required");
      return false;
    }
    return true;
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateVehicle()) return;
    setVehicles((prev) => [...prev, vehicle]);
    setVehicle({
      vehicleNumber: "",
      type: "Truck",
      model: "",
      capacity: "",
      fuelType: "Diesel",
      status: "Active",
    });
  };

  const handleRemoveVehicle = (idx: number) => {
    setVehicles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleOnboardVehicles = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await creditService.addVehicles(partnerId, vehicles);
      setSuccess("Vehicles onboarded successfully!");
      setVehicles([]);
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to onboard vehicles");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Onboard Vehicles</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Add vehicles for this partner. You can add multiple vehicles now or skip and add later.</p>
      </div>
      <Form onSubmit={handleAddVehicle} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
          <Input
            type="text"
            id="vehicleNumber"
            name="vehicleNumber"
            placeholder="Enter vehicle number"
            value={vehicle.vehicleNumber}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="type">Type *</Label>
          <select
            id="type"
            name="type"
            value={vehicle.type}
            onChange={handleInputChange}
            className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
          >
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Input
            type="text"
            id="model"
            name="model"
            placeholder="Enter model"
            value={vehicle.model}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            type="number"
            id="capacity"
            name="capacity"
            placeholder="Enter capacity"
            value={vehicle.capacity}
            onChange={handleInputChange}
            min="0"
            step={0.01}
          />
        </div>
        <div>
          <Label htmlFor="fuelType">Fuel Type *</Label>
          <select
            id="fuelType"
            name="fuelType"
            value={vehicle.fuelType}
            onChange={handleInputChange}
            className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
          >
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            value={vehicle.status}
            onChange={handleInputChange}
            className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="md:col-span-3 flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            disabled={loading}
          >
            Add Vehicle
          </button>
        </div>
      </Form>
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-400">{success}</div>
      )}
      {/* Vehicles Table */}
      {vehicles.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Vehicles to be onboarded</h3>
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
              {vehicles.map((v, idx) => (
                <TableRow key={idx}>
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
                    <button
                      onClick={() => handleRemoveVehicle(idx)}
                      className="text-red-600 hover:text-red-900 text-xs"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={onSkip}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          disabled={loading}
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={handleOnboardVehicles}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={loading || vehicles.length === 0}
        >
          {loading ? "Onboarding..." : "Onboard Vehicles"}
        </button>
      </div>
    </div>
  );
};

export default VehicleOnboardingStep; 