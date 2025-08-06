import React, { useState } from "react";
import { useNavigate } from "react-router";
import Form from "../../../components/form/Form";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import creditService from "../../../services/creditService";
// import { useAuth } from "../../context/AuthContext";
import VehicleOnboardingStep from "./VehicleOnboardingStep";

interface FormData {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  creditLimit: string;
  userName: string;
  userEmail: string;
  userPassword: string;
}

const CreditOnboarding: React.FC = () => {
  const navigate = useNavigate();
  // const { authUser, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Add state for step and newPartnerId
  const [step, setStep] = useState<1 | 2>(1);
  const [newPartnerId, setNewPartnerId] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    creditLimit: "",
    userName: "",
    userEmail: "",
    userPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Special handling for credit limit to prevent decimals
    if (name === "creditLimit") {
      // Only allow digits
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = (): boolean => {
    if (
      !formData.companyName ||
      !formData.contactName ||
      !formData.contactEmail ||
      !formData.contactPhone ||
      !formData.creditLimit ||
      !formData.userName ||
      !formData.userEmail ||
      !formData.userPassword
    ) {
      setError("All fields are required");
      return false;
    }

    if (!formData.contactEmail.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }

    // Check if credit limit contains decimal point
    if (formData.creditLimit.includes(".")) {
      setError("Credit limit must be a whole number (no decimals allowed)");
      return false;
    }

    if (
      isNaN(Number(formData.creditLimit)) ||
      Number(formData.creditLimit) <= 0
    ) {
      setError("Please enter a valid positive number for credit limit");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await creditService.onboardPartner({
        ...formData,
        creditLimit: Math.floor(Number(formData.creditLimit)),
      });

      setSuccess("Credit customer onboarded successfully!");
      // Use the correct path to the new partner's ID
      const newId =
        response.data.data?.creditAccount?.id ||
        response.data.data?.id ||
        response.data.data?.partnerId ||
        "";
      setNewPartnerId(newId);
      setStep(2);
      setFormData({
        companyName: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        creditLimit: "",
        userName: "",
        userEmail: "",
        userPassword: "",
      });

      // DO NOT navigate away here!
      // The UI will now show the VehicleOnboardingStep as intended.
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to onboard credit partner"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
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
                  Onboard Customer
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Onboard Credit Customer
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Add a new credit customer to your system
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {step === 1 && (
          <Form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Company Information
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    type="text"
                    id="companyName"
                    name="companyName"
                    placeholder="Enter company name"
                    value={formData.companyName}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    type="text"
                    id="contactName"
                    name="contactName"
                    placeholder="Enter contact person name"
                    value={formData.contactName}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    placeholder="Enter contact email"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="contactPhone">Contact Phone *</Label>
                  <Input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    placeholder="Enter contact phone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="creditLimit">Credit Limit *</Label>
                  <Input
                    type="text"
                    id="creditLimit"
                    name="creditLimit"
                    placeholder="Enter credit limit (whole numbers only)"
                    value={formData.creditLimit}
                    onChange={handleInputChange}
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Only whole numbers allowed (e.g., 100000)
                  </p>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                User Information
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="userName">User Name *</Label>
                  <Input
                    type="text"
                    id="userName"
                    name="userName"
                    placeholder="Enter user name"
                    value={formData.userName}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="userEmail">User Email *</Label>
                  <Input
                    type="email"
                    id="userEmail"
                    name="userEmail"
                    placeholder="Enter user email"
                    value={formData.userEmail}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="userPassword">User Password *</Label>
                  <Input
                    type="password"
                    id="userPassword"
                    name="userPassword"
                    placeholder="Enter user password"
                    value={formData.userPassword}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/fuel-admin-dashboard")}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? "Onboarding..." : "Onboard Customer"}
              </button>
            </div>
          </Form>
        )}

        {step === 2 && newPartnerId && (
          <VehicleOnboardingStep
            partnerId={newPartnerId}
            onComplete={() =>
              navigate(`/fuel-admin/credit-partners/${newPartnerId}`)
            }
            onSkip={() =>
              navigate(`/fuel-admin/credit-partners/${newPartnerId}`)
            }
          />
        )}
      </div>
    </div>
  );
};

export default CreditOnboarding;
