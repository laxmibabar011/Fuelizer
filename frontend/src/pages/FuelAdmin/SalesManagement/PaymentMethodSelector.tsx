import React, { useState, useEffect } from "react";
import SalesService, { PaymentMethod } from "../../../services/salesService";

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (method: PaymentMethod) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  value,
  onChange,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await SalesService.getPaymentMethods();
      setPaymentMethods(response.data || []);
    } catch (error) {
      console.error("Failed to load payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMethodColor = (billMode: string) => {
    switch (billMode.toLowerCase()) {
      case "cash":
        return "bg-green-50 text-green-700 border-green-200";
      case "credit":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "card":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "cash_party":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 border rounded-lg bg-gray-100 animate-pulse"
          >
            <div className="h-4 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {paymentMethods.map((method) => (
        <button
          key={method.id}
          className={`p-4 border rounded-lg transition-colors ${getMethodColor(method.bill_mode)} ${
            value === method.bill_mode
              ? "ring-2 ring-primary border-primary"
              : ""
          }`}
          onClick={() => onChange(method)}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium">{method.name}</span>
            <span className="text-xs opacity-75">{method.bill_mode}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default PaymentMethodSelector;
