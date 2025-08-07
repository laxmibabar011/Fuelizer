import React, { useState } from "react";

interface FuelRequestForm {
  vehicleNumber: string;
  fuelType: string;
  quantity: number;
  purpose: string;
  requestedDate: string;
}

const FuelRequest: React.FC = () => {
  const [formData, setFormData] = useState<FuelRequestForm>({
    vehicleNumber: "",
    fuelType: "",
    quantity: 0,
    purpose: "",
    requestedDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fuelTypes = [
    { value: "petrol", label: "Petrol" },
    { value: "diesel", label: "Diesel" },
    { value: "cng", label: "CNG" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // TODO: Implement API call to submit fuel request
    // This will send the request to fuel-admin for approval
    
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      // Reset form after success
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          vehicleNumber: "",
          fuelType: "",
          quantity: 0,
          purpose: "",
          requestedDate: "",
        });
      }, 3000);
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Fuel Request
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Submit a fuel request for your organization vehicles
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Fuel request submitted successfully!
              </p>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                Your request has been sent to the fuel administrator for approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Number */}
          <div>
            <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vehicle Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="vehicleNumber"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter vehicle registration number"
            />
          </div>

          {/* Fuel Type */}
          <div>
            <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fuel Type <span className="text-red-500">*</span>
            </label>
            <select
              id="fuelType"
              name="fuelType"
              value={formData.fuelType}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select fuel type</option>
              {fuelTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity (Liters) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter quantity in liters"
            />
          </div>

          {/* Requested Date */}
          <div>
            <label htmlFor="requestedDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Requested Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="requestedDate"
              name="requestedDate"
              value={formData.requestedDate}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Purpose <span className="text-red-500">*</span>
            </label>
            <textarea
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
              placeholder="Describe the purpose of fuel requirement"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-brand-600 text-white font-medium rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>

      {/* Information */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              How it works
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc list-inside space-y-1">
                <li>Submit your fuel request with vehicle details and quantity</li>
                <li>Your request will be sent to the fuel administrator for approval</li>
                <li>You'll receive notification once the request is approved or rejected</li>
                <li>Approved requests will be processed and fuel will be allocated</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelRequest; 