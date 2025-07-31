import PageMeta from "../components/common/PageMeta";
import { useNavigate } from "react-router-dom";

export default function Blank() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      <PageMeta
        title="Home | FUELIZER"
        description="Discover FUELIZER, the platform to power your business"
      />
      {/* Subtle background shape with brand color */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-[rgba(70,95,255,0.1)] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[rgba(70,95,255,0.1)] rounded-full blur-3xl"></div>
      </div>
      <div className="max-w-md w-full mx-4 p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
        <h3 className="mb-4 font-bold text-gray-800 text-3xl text-center sm:text-4xl">
          Empower Your Future with FUELIZER
        </h3>
        <p className="text-center text-gray-600 mb-8">
          Unlock seamless business solutions with our powerful platform.
        </p>
        <div className="flex justify-center">
          <button
            className="px-8 py-3 rounded-lg bg-[#465fff] text-white text-lg font-semibold shadow hover:bg-[#3b4ed8] transition"
            onClick={() => navigate("/signin")}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}