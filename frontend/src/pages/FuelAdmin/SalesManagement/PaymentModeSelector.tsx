interface PaymentModeSelectorProps {
  value: string;
  onChange: (mode: string) => void;
}

const paymentModes = [
  { id: "cash", label: "Cash", color: "bg-green-50 text-green-700 border-green-200" },
  { id: "cash-party", label: "Cash Party", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "credit", label: "Credit", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "card-swipe", label: "Card Swipe", color: "bg-orange-50 text-orange-700 border-orange-200" },
];

const PaymentModeSelector: React.FC<PaymentModeSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {paymentModes.map((mode) => (
        <button
          key={mode.id}
          className={`p-4 border rounded-lg ${mode.color} ${value === mode.id ? "ring-2 ring-primary border-primary" : ""}`}
          onClick={() => onChange(mode.id)}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium">{mode.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default PaymentModeSelector;


