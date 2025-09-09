/**
 * Transaction Status Popup Component
 * Overlay popup for transaction processing and completion status
 */

import React from "react";
import LoadingSpinner from "../../../../components/ui/spinner/Spinner";
import { CheckCircleIcon } from "../../../../icons";

interface TransactionStatusPopupProps {
  isProcessing: boolean;
  showConfirmation: boolean;
  onClose?: () => void;
}

const TransactionStatusPopup: React.FC<TransactionStatusPopupProps> = ({
  isProcessing,
  showConfirmation,
  onClose,
}) => {
  if (!isProcessing && !showConfirmation) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform transition-all duration-300 scale-100 animate-in zoom-in-95 duration-300">
        {showConfirmation ? (
          <div className="text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircleIcon className="h-12 w-12 text-green-600" />
            </div>

            {/* Success Message */}
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Transaction Successful!
            </h3>
            <p className="text-gray-600 mb-6">
              Your fuel transaction has been completed successfully.
            </p>

            {/* Countdown */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-green-800 font-medium">
                Resetting POS in 3 seconds...
              </div>
              <div className="w-full bg-green-200 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-green-600 h-2 rounded-full animate-pulse"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>

            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Close Now
              </button>
            )}
          </div>
        ) : isProcessing ? (
          <div className="text-center">
            {/* Loading Spinner */}
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <LoadingSpinner size="large" className="text-blue-600" />
            </div>

            {/* Processing Message */}
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Processing Transaction
            </h3>
            <p className="text-gray-600 mb-6">
              Please wait while we process your fuel transaction...
            </p>

            {/* Progress Bar */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800 font-medium mb-2">
                Processing payment and updating records
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full animate-pulse"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TransactionStatusPopup;
