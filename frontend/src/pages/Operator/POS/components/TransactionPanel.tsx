/**
 * Transaction Panel Component
 * Center panel displaying transaction details and attendant selection
 */

import React from "react";
import AttendantSelector from "./AttendantSelector";
import { FuelIcon, GridIcon, AlertIcon } from "../../../../icons";
import type { ProductInfo, NozzleInfo, AttendantOption } from "../types";

interface TransactionPanelProps {
  selectedProduct: ProductInfo | null;
  selectedNozzle: NozzleInfo | null;
  attendants: AttendantOption[];
  selectedAttendant: AttendantOption | null;
  onAttendantSelect: (attendant: AttendantOption) => void;
  amount: number;
  litres: number;
  currentInput: string;
  inputMode: "amount" | "litres";
  onInputModeSwitch: (mode: "amount" | "litres") => void;
  error: string | null;
  calculations: any;
}

const TransactionPanel: React.FC<TransactionPanelProps> = ({
  selectedProduct,
  selectedNozzle,
  attendants,
  selectedAttendant,
  onAttendantSelect,
  amount,
  litres,
  currentInput,
  inputMode,
  onInputModeSwitch,
  error,
  calculations,
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header - Aligned with other sections */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-base font-semibold text-gray-900 flex items-center">
          <GridIcon className="h-4 w-4 mr-2 text-blue-600" />
          Transaction Details
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Product & Amount Section - Side by Side Layout */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Product & Amount
          </h3>

          {selectedProduct && selectedNozzle ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Left: Selected Product (Compact) */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div
                    className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm
                    ${
                      selectedProduct.color === "green"
                        ? "bg-green-500"
                        : selectedProduct.color === "blue"
                          ? "bg-blue-500"
                          : selectedProduct.color === "yellow"
                            ? "bg-yellow-500"
                            : selectedProduct.color === "gray"
                              ? "bg-gray-500"
                              : "bg-indigo-500"
                    }
                  `}
                  >
                    <FuelIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">
                      {selectedProduct.name.toUpperCase()}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {selectedNozzle.code} •{" "}
                      {calculations.formatCurrency(selectedProduct.price)}/
                      {selectedProduct.unit}
                    </p>
                    {/* Debug: Show raw price data */}
                    {process.env.NODE_ENV === "development" && (
                      <p className="text-xs text-blue-600">
                        Debug: Raw price = {selectedProduct.price}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Amount Input (Compact) */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                {/* Input Mode Toggle - Compact */}
                <div className="flex rounded-md border border-gray-300 overflow-hidden mb-2">
                  <button
                    onClick={() => onInputModeSwitch("amount")}
                    className={`
                      flex-1 px-2 py-1 text-xs font-medium transition-colors
                      ${
                        inputMode === "amount"
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }
                    `}
                  >
                    ₹
                  </button>
                  <button
                    onClick={() => onInputModeSwitch("litres")}
                    className={`
                      flex-1 px-2 py-1 text-xs font-medium transition-colors border-l border-gray-300
                      ${
                        inputMode === "litres"
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }
                    `}
                  >
                    L
                  </button>
                </div>

                {/* Current Input Display - Compact */}
                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">
                    {inputMode === "amount" ? "Amount" : "Litres"}
                  </div>
                  <div className="text-lg font-mono font-bold text-gray-900">
                    {inputMode === "amount"
                      ? `₹${currentInput || "0.00"}`
                      : `${currentInput || "0.00"}L`}
                  </div>

                  {/* Auto-calculated value */}
                  {selectedProduct &&
                    (currentInput || amount > 0 || litres > 0) && (
                      <div className="text-xs text-gray-600">
                        ≈{" "}
                        {inputMode === "amount"
                          ? calculations.formatLitres(litres)
                          : calculations.formatCurrency(amount)}
                      </div>
                    )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
              <FuelIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Please select a fuel product to continue</p>
            </div>
          )}
        </div>

        {/* Attendant Selection Section */}
        <div className="space-y-2">
          <AttendantSelector
            attendants={attendants}
            selectedAttendant={selectedAttendant}
            onSelect={onAttendantSelect}
          />
        </div>

        {/* Transaction Summary Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Transaction Summary
          </h3>

          {/* Calculation Summary */}
          {selectedProduct && (amount > 0 || litres > 0) && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold text-gray-900">
                      {calculations.formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-semibold text-gray-900">
                      {calculations.formatLitres(litres)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Rate:</span>
                    <span className="font-semibold text-gray-900">
                      {calculations.formatCurrency(selectedProduct.price)}/L
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Nozzle:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedNozzle?.code || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Amounts - More Compact */}
        {selectedProduct && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700">Quick Amounts</h4>
            <div className="grid grid-cols-4 gap-1">
              {calculations
                .getPresetAmounts(selectedProduct)
                .map((presetAmount: number) => (
                  <button
                    key={presetAmount}
                    onClick={() => {
                      // This would need to be handled by the parent component
                      // For now, just show the preset amounts
                    }}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {calculations.formatCurrency(presetAmount)}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800">
                  Transaction Error
                </h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionPanel;
