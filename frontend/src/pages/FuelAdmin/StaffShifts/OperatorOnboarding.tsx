import React, { useState } from "react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import apiClient from "../../../services/apiClient";
import { useNavigate } from "react-router-dom";

interface OperatorForm {
  name: string;
  email: string;
  password: string;
  phone: string;
}

const initialForm: OperatorForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
};

const OperatorOnboarding: React.FC = () => {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [onboardingType, setOnboardingType] = useState<"MANAGER" | "WORKER">(
    "WORKER"
  );
  const navigate = useNavigate();
  const [createdUser, setCreatedUser] = useState<{
    name: string;
    email: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      if (onboardingType === "MANAGER") {
        // Onboard a Fuel Admin (Manager)
        await apiClient.post("/api/tenant/staffshift/admins/onboard", form);
        setCreatedUser({ name: form.name, email: form.email });
      } else {
        // Onboard a Worker (Operator)
        await apiClient.post("/api/tenant/staffshift/operators/onboard", form);
        setCreatedUser({ name: form.name, email: form.email });
      }
      setSuccess(true);
      setForm(initialForm);
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || "Failed to submit.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8 p-6 space-y-4">
      <h2 className="text-xl font-bold mb-4">Onboarding</h2>
      <div className="mb-4">
        <Label>Onboarding Type</Label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={onboardingType === "MANAGER" ? undefined : "outline"}
            onClick={() => setOnboardingType("MANAGER")}
          >
            Manager (Fuel Admin)
          </Button>
          <Button
            type="button"
            variant={onboardingType === "WORKER" ? undefined : "outline"}
            onClick={() => setOnboardingType("WORKER")}
          >
            Worker (Operator)
          </Button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder={
              onboardingType === "MANAGER"
                ? "Enter manager name"
                : "Enter operator name"
            }
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder={
              onboardingType === "MANAGER"
                ? "Enter manager email"
                : "Enter operator email"
            }
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Set a password"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && (
          <div className="space-y-3">
            <div className="text-green-600 text-sm">
              {onboardingType === "MANAGER"
                ? "Manager onboarded successfully!"
                : "Operator onboarded successfully!"}
            </div>
            <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {createdUser?.name} ({createdUser?.email}) has been added.
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    navigate("/fuel-admin/configuration/staff-shifts")
                  }
                >
                  Assign to Shift
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    navigate("/fuel-admin/configuration/staff-shifts")
                  }
                >
                  Add to Operator Group
                </Button>
              </div>
            </div>
          </div>
        )}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting
            ? "Submitting..."
            : onboardingType === "MANAGER"
              ? "Onboard Manager"
              : "Onboard Operator"}
        </Button>
      </form>
    </Card>
  );
};

export default OperatorOnboarding;
