import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ClientService from "../../services/clientService";

const initialState = {
  client_key: "",
  client_name: "",
  client_owner_name: "",
  client_address: "",
  client_city: "",
  client_state: "",
  client_country: "",
  client_pincode: "",
  gst_number: "",
  client_phone: "",
  client_email: "",
  client_password: "",
  db_name: "",
};

export default function CreateClient() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  // Removed accessToken as it is no longer needed

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await ClientService.createClient(form);
      const data = res.data;
      if (data.success) {
        setSuccess("Client registered successfully!");
        setForm(initialState);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err: any) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-900 rounded-lg shadow">
      <PageMeta
        title="Create Client | FUELIZER"
        description="Onboard a new client"
      />
      <h1 className="text-2xl font-bold mb-6 text-brand-600">
        Create New Client
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {Object.entries(initialState).map(([key, _]) => (
          <div key={key}>
            <label className="block font-medium mb-1 capitalize" htmlFor={key}>
              {key.replace(/_/g, " ")}
            </label>
            <input
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-brand-500"
              type={key.includes("password") ? "password" : "text"}
              id={key}
              name={key}
              value={form[key as keyof typeof form]}
              onChange={handleChange}
              required
            />
          </div>
        ))}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
        <button
          type="submit"
          className="w-full py-3 px-6 rounded bg-brand-500 text-white font-semibold hover:bg-brand-600 transition"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register Client"}
        </button>
      </form>
    </div>
  );
} 