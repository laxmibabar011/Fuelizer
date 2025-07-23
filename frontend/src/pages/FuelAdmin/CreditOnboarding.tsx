import React, { useState } from "react";
import { useNavigate } from "react-router";
import Form from "../../components/form/Form";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import creditService from "../../services/creditService";
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    if (
      isNaN(Number(formData.creditLimit)) ||
      Number(formData.creditLimit) <= 0
    ) {
      setError("Please enter a valid credit limit");
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
      const response = await creditService.onboardPartner(
        {
          ...formData,
          creditLimit: Number(formData.creditLimit),
        }
      );
  
      setSuccess("Credit partner onboarded successfully!");
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Onboard Credit Partner
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Add a new credit partner to your system
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
                    type="number"
                    id="creditLimit"
                    name="creditLimit"
                    placeholder="Enter credit limit"
                    value={formData.creditLimit}
                    onChange={handleInputChange}
                    min="0"
                    step={0.01}
                  />
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
                {loading ? "Onboarding..." : "Onboard Partner"}
              </button>
            </div>
          </Form>
        )}

        {step === 2 && newPartnerId && (
          <VehicleOnboardingStep partnerId={newPartnerId} onComplete={() => navigate(`/fuel-admin/credit-partners/${newPartnerId}`)} onSkip={() => navigate(`/fuel-admin/credit-partners/${newPartnerId}`)} />
        )}
      </div>
    </div>
  );
};

export default CreditOnboarding;
