/**
 * Credit Modal (real customer picker)
 * Single-step: Select credit customer and confirm
 */

import React from "react";
import SalesService from "../../../../services/salesService";
import Button from "../../../../components/ui/button/Button";

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (payload: {
    creditCustomerId: string;
    creditCustomerName: string;
  }) => void;
  // Context from POS
  productName?: string | null;
  nozzleCode?: string | null;
  inputMode: "amount" | "litres";
  currentInput: string;
  unit?: string;
  price?: number;
}

const CreditModal: React.FC<CreditModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productName,
  nozzleCode,
  inputMode,
  currentInput,
  unit = "L",
  price,
}) => {
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [customers, setCustomers] = React.useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedId, setSelectedId] = React.useState<string>("");

  React.useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSelectedId("");
    }
  }, [isOpen]);

  // Fetch customers as user types
  React.useEffect(() => {
    if (!isOpen) return; // don't fetch when closed
    let active = true;
    const run = async () => {
      try {
        setLoading(true);
        const res = await SalesService.searchCreditCustomers({
          q: search,
          limit: 20,
        });
        if (!active) return;
        const list = (res.data || []).map((c: any) => ({
          id: String(c.id),
          name: c.name || c.company_name || c.display_name || "Unknown",
        }));
        setCustomers(list);
      } catch (e) {
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [search, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="text-base font-semibold text-gray-900">
            Credit Transaction
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Context summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
            <div className="flex flex-wrap items-center gap-3">
              {productName && (
                <div>
                  <span className="text-gray-500">Product:</span>{" "}
                  <span className="font-medium">{productName}</span>
                </div>
              )}
              {nozzleCode && (
                <div>
                  <span className="text-gray-500">Nozzle:</span>{" "}
                  <span className="font-medium">{nozzleCode}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Mode:</span>{" "}
                <span className="font-medium">
                  {inputMode === "amount" ? "Amount" : "Litres"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Value:</span>{" "}
                <span className="font-medium">
                  {currentInput || "0"}
                  {inputMode === "litres" ? unit : ""}
                </span>
              </div>
              {typeof price === "number" && (
                <div>
                  <span className="text-gray-500">Rate:</span>{" "}
                  <span className="font-medium">
                    ₹{price.toFixed(2)}/{unit}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Customer list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-800">
                Select Credit Customer
              </h3>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {loading && (
                <div className="col-span-2 text-sm text-gray-500">
                  Loading...
                </div>
              )}
              {!loading && customers.length === 0 && (
                <div className="col-span-2 text-sm text-gray-500">
                  No customers found
                </div>
              )}
              {customers.map((c) => {
                const isSelected = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`p-3 text-left rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium text-gray-900">{c.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Use for demo only • Mocked data
          </div>
          <div className="space-x-2">
            <Button
              size="sm"
              onClick={() => {
                const customer = customers.find((c) => c.id === selectedId);
                if (!customer) return;
                onConfirm &&
                  onConfirm({
                    creditCustomerId: customer.id,
                    creditCustomerName: customer.name,
                  });
                onClose();
              }}
              disabled={!selectedId}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditModal;
