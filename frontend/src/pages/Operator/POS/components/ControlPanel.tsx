/**
 * Control Panel Component
 * Right panel with number pad, payment methods, and action buttons
 */

import React from "react";
import Button from "../../../../components/ui/button/Button";
import LoadingSpinner from "../../../../components/ui/spinner/Spinner";
import { CheckCircleIcon, CloseIcon, ArrowRightIcon } from "../../../../icons";
import type { PaymentMethod } from "../types";

interface ControlPanelProps {
  currentInput: string;
  onNumberInput: (value: string) => void;
  paymentMethods: PaymentMethod[];
  selectedPaymentMethod: PaymentMethod | null;
  onPaymentMethodSelect: (method: PaymentMethod) => void;
  onCompleteTransaction: () => void;
  onCancelTransaction: () => void;
  onResetTransaction: () => void;
  isProcessing: boolean;
  canComplete: boolean;
  showConfirmation: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentInput,
  onNumberInput,
  paymentMethods,
  selectedPaymentMethod,
  onPaymentMethodSelect,
  onCompleteTransaction,
  onCancelTransaction,
  onResetTransaction,
  isProcessing,
  canComplete,
  showConfirmation,
}) => {
  // Number pad layout
  const numberPadButtons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "backspace"],
  ];

  // Handle number pad click
  const handleNumberPadClick = (value: string) => {
    onNumberInput(value);
  };

  // Get payment method icon
  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method.icon) {
      case "💰":
        return "💰";
      case "💳":
        return "💳";
      case "📱":
        return "📱";
      case "🏪":
        return "🏪";
      default:
        return "💳";
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header - More Compact */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <h2 className="text-base font-semibold text-gray-900">Controls</h2>
      </div>

      {/* Number Pad Section - More Compact */}
      <div className="p-3 bg-white border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Enter Amount</h3>

        {/* Current Input Display - Compact */}
        <div className="mb-3 p-2 bg-gray-900 text-white rounded-lg text-center">
          <div className="text-base font-mono">{currentInput || "0"}</div>
        </div>

        {/* Number Pad Grid - Compact */}
        <div className="grid grid-cols-3 gap-1.5">
          {numberPadButtons.flat().map((button, index) => (
            <button
              key={index}
              onClick={() => handleNumberPadClick(button)}
              className={`
                h-10 rounded-lg font-semibold text-base transition-colors
                ${
                  button === "backspace"
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : button === "." || button === "0"
                      ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                }
                active:scale-95 transform transition-transform
              `}
            >
              {button === "backspace" ? "⌫" : button}
            </button>
          ))}
        </div>

        {/* Clear Button - Compact */}
        <button
          onClick={() => onNumberInput("clear")}
          className="w-full mt-2 h-8 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors text-sm"
        >
          Clear
        </button>
      </div>

      {/* Payment Methods Section - More Compact */}
      <div className="p-3 bg-white border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </h3>

        <div className="grid grid-cols-2 gap-1.5">
          {paymentMethods.map((method) => {
            const isSelected = selectedPaymentMethod?.id === method.id;
            const isActive = method.isActive;

            return (
              <button
                key={method.id}
                onClick={() => isActive && onPaymentMethodSelect(method)}
                disabled={!isActive}
                className={`
                  p-2 rounded-lg border-2 text-center transition-all
                  ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : isActive
                        ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                        : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                  }
                `}
              >
                <div className="text-lg mb-1">{getPaymentIcon(method)}</div>
                <div className="text-xs font-medium">{method.name}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Payment Method - Compact */}
        {selectedPaymentMethod && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <div className="text-xs text-blue-700">
              {getPaymentIcon(selectedPaymentMethod)}{" "}
              {selectedPaymentMethod.name} Selected
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Section - More Compact */}
      <div className="flex-1 p-3 flex flex-col justify-end space-y-2">
        {/* Primary Actions */}
        <div className="space-y-2">
          <Button
            onClick={onCompleteTransaction}
            disabled={!canComplete || isProcessing || showConfirmation}
            variant="primary"
            size="md"
            className="w-full h-10 text-base font-semibold"
          >
            {isProcessing ? (
              <LoadingSpinner size="small" className="mr-2" />
            ) : (
              <CheckCircleIcon className="h-4 w-4 mr-2" />
            )}
            {isProcessing ? "Processing..." : "Complete Transaction"}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={onCancelTransaction}
              disabled={isProcessing || showConfirmation}
              variant="outline"
              size="sm"
              className="h-8 text-sm"
            >
              <CloseIcon className="h-3 w-3 mr-1" />
              Cancel
            </Button>

            <Button
              onClick={onResetTransaction}
              disabled={isProcessing || showConfirmation}
              variant="outline"
              size="sm"
              className="h-8 text-sm"
            >
              <ArrowRightIcon className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 text-center">
          {!canComplete ? (
            <div className="text-yellow-600">
              ⚠️ Please complete all fields to proceed
            </div>
          ) : (
            <div>✓ Ready to process transaction</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
