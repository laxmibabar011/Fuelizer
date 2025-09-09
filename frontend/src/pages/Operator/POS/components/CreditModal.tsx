/**
 * Credit Modal (UI-only, mocked data)
 * Three-step wizard: Company → Vehicle → Review & Confirm
 */

import React from "react";
import Button from "../../../../components/ui/button/Button";

interface CreditCompany {
  id: string;
  name: string;
  limit: number; // total limit
  outstanding: number; // used amount
}

interface CreditVehicle {
  id: string;
  companyId: string;
  plate: string;
  alias?: string;
}

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (payload: { companyId: string; vehicleId: string }) => void;
  // Context from POS
  productName?: string | null;
  nozzleCode?: string | null;
  inputMode: "amount" | "litres";
  currentInput: string;
  unit?: string;
  price?: number;
}

const MOCK_COMPANIES: CreditCompany[] = [
  { id: "c1", name: "Acme Logistics", limit: 50000, outstanding: 18000 },
  { id: "c2", name: "BlueFleet Pvt Ltd", limit: 75000, outstanding: 25000 },
  { id: "c3", name: "Green Movers", limit: 30000, outstanding: 12000 },
];

const MOCK_VEHICLES: CreditVehicle[] = [
  { id: "v1", companyId: "c1", plate: "KA 05 AB 1234", alias: "Truck-12" },
  { id: "v2", companyId: "c1", plate: "KA 03 XX 5621" },
  { id: "v3", companyId: "c2", plate: "TN 11 AA 9988", alias: "Bolero" },
  { id: "v4", companyId: "c2", plate: "TN 11 AZ 1111" },
  { id: "v5", companyId: "c3", plate: "KA 19 CD 0007" },
];

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
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [search, setSearch] = React.useState("");
  const [companyId, setCompanyId] = React.useState<string>("");
  const [vehicleId, setVehicleId] = React.useState<string>("");

  React.useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSearch("");
      setCompanyId("");
      setVehicleId("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const companies = MOCK_COMPANIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const vehicles = MOCK_VEHICLES.filter((v) => v.companyId === companyId);

  const selectedCompany = MOCK_COMPANIES.find((c) => c.id === companyId);
  const selectedVehicle = MOCK_VEHICLES.find((v) => v.id === vehicleId);

  const available = selectedCompany
    ? Math.max(0, selectedCompany.limit - selectedCompany.outstanding)
    : 0;

  const canNextFromStep1 = !!companyId;
  const canNextFromStep2 = !!vehicleId;
  const canConfirm = !!(companyId && vehicleId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="text-base font-semibold text-gray-900">
            Credit Transaction
            <span className="ml-2 text-sm text-gray-500">
              • Step {step} of 3
            </span>
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

          {step === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-800">
                  Select Credit Company
                </h3>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search companies..."
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {companies.map((c) => {
                  const isSelected = c.id === companyId;
                  const availableAmt = Math.max(0, c.limit - c.outstanding);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCompanyId(c.id)}
                      className={`p-3 text-left rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-gray-100 rounded px-2 py-1">
                          Limit
                          <br />
                          <span className="font-semibold">
                            ₹{c.limit.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-gray-100 rounded px-2 py-1">
                          Outstanding
                          <br />
                          <span className="font-semibold">
                            ₹{c.outstanding.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-green-100 rounded px-2 py-1">
                          Available
                          <br />
                          <span className="font-semibold">
                            ₹{availableAmt.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-800">
                Select Vehicle
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {vehicles.length === 0 && (
                  <div className="col-span-2 text-sm text-gray-500">
                    No vehicles for this company (mock data)
                  </div>
                )}
                {vehicles.map((v) => {
                  const isSelected = v.id === vehicleId;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setVehicleId(v.id)}
                      className={`p-3 text-left rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium text-gray-900">{v.plate}</div>
                      {v.alias && (
                        <div className="text-xs text-gray-600">{v.alias}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-800">
                Review & Confirm
              </h3>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-600">Company:</span>{" "}
                    <span className="font-medium">{selectedCompany?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Vehicle:</span>{" "}
                    <span className="font-medium">
                      {selectedVehicle?.plate}
                    </span>
                  </div>
                  {productName && (
                    <div>
                      <span className="text-gray-600">Product:</span>{" "}
                      <span className="font-medium">{productName}</span>
                    </div>
                  )}
                  {nozzleCode && (
                    <div>
                      <span className="text-gray-600">Nozzle:</span>{" "}
                      <span className="font-medium">{nozzleCode}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Mode:</span>{" "}
                    <span className="font-medium">
                      {inputMode === "amount" ? "Amount" : "Litres"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Value:</span>{" "}
                    <span className="font-medium">
                      {currentInput || "0"}
                      {inputMode === "litres" ? unit : ""}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-700">
                  This is a UI-only mock. No data will be saved.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Use for demo only • Mocked data
          </div>
          <div className="space-x-2">
            {step > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => (s === 2 ? 1 : 2))}
              >
                Back
              </Button>
            )}
            {step < 3 && (
              <Button
                size="sm"
                onClick={() =>
                  setStep((s) =>
                    s === 1
                      ? canNextFromStep1
                        ? 2
                        : 1
                      : canNextFromStep2
                        ? 3
                        : 2
                  )
                }
                disabled={
                  (step === 1 && !canNextFromStep1) ||
                  (step === 2 && !canNextFromStep2)
                }
              >
                Next
              </Button>
            )}
            {step === 3 && (
              <Button
                size="sm"
                onClick={() => {
                  if (canConfirm) {
                    onConfirm && onConfirm({ companyId, vehicleId });
                    onClose();
                  }
                }}
                disabled={!canConfirm}
              >
                Confirm
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditModal;
