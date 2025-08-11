import React, { useState } from "react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    // For now, just log the data
    try {
      console.log("Operator Data:", form);
      setSuccess(true);
      setForm(initialForm);
    } catch (err) {
      setError("Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8 p-6">
      <h2 className="text-xl font-bold mb-4">Onboard New Fuel Operator</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter operator name"
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
            placeholder="Enter operator email"
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
          <div className="text-green-600 text-sm">
            Operator onboarded successfully!
          </div>
        )}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Submitting..." : "Onboard Operator"}
        </Button>
      </form>
    </Card>
  );
};

export default OperatorOnboarding;
