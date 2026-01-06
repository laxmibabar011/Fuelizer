/**
 * POS Interface - Main Point of Sale Component
 * Landscape-optimized tablet interface for fuel transactions
 */

import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { usePOSState } from "./hooks/usePOSState";
import { usePOSCalculations } from "./hooks/usePOSCalculations";
import ProductPanel from "./components/ProductPanel";
import TransactionPanel from "./components/TransactionPanel";
import ControlPanel from "./components/ControlPanel";
import POSHeader from "./components/POSHeader";
import TransactionStatusPopup from "./components/TransactionStatusPopup";
import CreditModal from "./components/CreditModal";
import LoadingSpinner from "../../../components/ui/spinner/Spinner";
import Button from "../../../components/ui/button/Button";
import type {
  ProductInfo,
  NozzleInfo,
  AttendantOption,
  PaymentMethod,
  TransactionData,
} from "./types";

interface POSInterfaceProps {
  onExitPOS?: () => void;
  isFullscreen?: boolean;
  onEnterFullscreen?: () => void;
}

const POSInterface: React.FC<POSInterfaceProps> = ({
  onExitPOS,
  isFullscreen = false,
  onEnterFullscreen,
}) => {
  const navigate = useNavigate();
  const { authUser } = useAuth();
  const { state, setState } = usePOSState();
  const calculations = usePOSCalculations();

  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  // Product Selection Handler
  const handleProductSelect = useCallback(
    (product: ProductInfo, nozzle: NozzleInfo) => {
      setState((prev) => ({
        ...prev,
        selectedProduct: product,
        selectedNozzle: nozzle,
        // Reset transaction state when product changes
        currentInput: "",
        amount: 0,
        litres: 0,
        selectedPaymentMethod: null,
        error: null,
      }));
    },
    [setState]
  );

  // Attendant Selection Handler
  const handleAttendantSelect = useCallback(
    (attendant: AttendantOption) => {
      setState((prev) => ({
        ...prev,
        selectedAttendant: attendant,
        error: null,
      }));
    },
    [setState]
  );

  // Number Input Handler
  const handleNumberInput = useCallback(
    (value: string) => {
      const { currentInput, inputMode, selectedProduct } = state;

      let newInput: string;

      if (value === "clear") {
        newInput = "";
      } else if (value === "backspace") {
        newInput = currentInput.slice(0, -1);
      } else {
        newInput = currentInput + value;
      }

      // Format and validate input
      const formattedInput = calculations.formatNumberInput(newInput);
      const { amount, litres } = calculations.getCalculationResult(
        formattedInput,
        inputMode,
        selectedProduct
      );

      setState((prev) => ({
        ...prev,
        currentInput: formattedInput,
        amount,
        litres,
      }));
    },
    [state, calculations, setState]
  );

  // Input Mode Switch Handler
  const handleInputModeSwitch = useCallback(
    (mode: "amount" | "litres") => {
      const { currentInput, selectedProduct } = state;

      setState((prev) => ({
        ...prev,
        inputMode: mode,
      }));

      // Recalculate with new mode
      const { amount, litres } = calculations.getCalculationResult(
        currentInput,
        mode,
        selectedProduct
      );

      setState((prev) => ({
        ...prev,
        amount,
        litres,
      }));
    },
    [state, calculations, setState]
  );

  // Payment Method Selection Handler
  const handlePaymentMethodSelect = useCallback(
    (method: PaymentMethod) => {
      setState((prev) => ({
        ...prev,
        selectedPaymentMethod: method,
        error: null,
      }));

      // Open Credit modal when selecting Credit
      if (method.name.toLowerCase() === "credit") {
        setShowCreditModal(true);
      }
    },
    [setState]
  );

  // Transaction Completion Handler
  const handleCompleteTransaction = useCallback(async () => {
    const {
      selectedProduct,
      selectedNozzle,
      selectedAttendant,
      selectedPaymentMethod,
      amount,
      litres,
    } = state;

    // If credit payment is selected, force customer selection first
    if (selectedPaymentMethod?.name?.toLowerCase() === "credit") {
      setShowCreditModal(true);
      return;
    }

    // Validate transaction
    const validation = calculations.validateTransaction(
      amount,
      litres,
      selectedProduct,
      selectedAttendant,
      selectedPaymentMethod
    );

    if (!validation.isValid) {
      setState((prev) => ({
        ...prev,
        error: validation.errors.join(", "),
      }));
      return;
    }

    setIsProcessingTransaction(true);

    try {
      // Validate we have all required context
      if (!state.cashierContext) {
        throw new Error("Cashier context not loaded");
      }

      // Prepare transaction data with full context
      const transactionData: TransactionData = {
        nozzleId: selectedNozzle!.id,
        productId: selectedProduct!.id,
        attendantId: selectedAttendant!.id,
        operatorGroupId: state.cashierContext.operatorGroup.id.toString(),
        amount,
        litres,
        pricePerLitre: selectedProduct!.price,
        paymentMethodId: selectedPaymentMethod!.id,
      };

      console.log("Processing transaction with full context:", transactionData);

      // Call real transaction API
      const posService = (await import("../../../services/posService")).default;
      const result = await posService.recordTransaction(transactionData);

      console.log("Transaction completed successfully:", result);

      // Show success and reset
      setState((prev) => ({
        ...prev,
        showConfirmation: true,
        error: null,
      }));

      // Auto-reset after 3 seconds
      setTimeout(() => {
        handleResetTransaction();
      }, 3000);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || "Transaction failed. Please try again.",
      }));
    } finally {
      setIsProcessingTransaction(false);
    }
  }, [state, calculations, setState]);

  // Transaction Reset Handler (define before dependent callbacks)
  const handleResetTransaction = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedProduct: null,
      selectedNozzle: null,
      selectedAttendant: null,
      selectedPaymentMethod: null,
      currentInput: "",
      amount: 0,
      litres: 0,
      error: null,
      showConfirmation: false,
    }));
  }, [setState]);

  // Variant: complete with credit customer id
  const handleCompleteTransactionWithCustomer = useCallback(
    async (creditCustomerId: string) => {
      const {
        selectedProduct,
        selectedNozzle,
        selectedAttendant,
        selectedPaymentMethod,
        amount,
        litres,
      } = state;

      const validation = calculations.validateTransaction(
        amount,
        litres,
        selectedProduct,
        selectedAttendant,
        selectedPaymentMethod
      );
      if (!validation.isValid) {
        setState((prev) => ({ ...prev, error: validation.errors.join(", ") }));
        return;
      }
      setIsProcessingTransaction(true);
      try {
        if (!state.cashierContext)
          throw new Error("Cashier context not loaded");
        const posService = (await import("../../../services/posService"))
          .default;
        await posService.recordTransaction({
          nozzleId: selectedNozzle!.id,
          productId: selectedProduct!.id,
          attendantId: selectedAttendant!.id,
          operatorGroupId: state.cashierContext.operatorGroup.id.toString(),
          amount,
          litres,
          pricePerLitre: selectedProduct!.price,
          paymentMethodId: selectedPaymentMethod!.id,
          creditCustomerId,
        });
        setState((prev) => ({ ...prev, showConfirmation: true, error: null }));
        setTimeout(() => {
          handleResetTransaction();
        }, 3000);
      } catch (e: any) {
        setState((p) => ({ ...p, error: e.message || "Transaction failed" }));
      } finally {
        setIsProcessingTransaction(false);
      }
    },
    [state, calculations, setState, handleResetTransaction]
  );

  // Manual close confirmation handler
  const handleCloseConfirmation = useCallback(() => {
    handleResetTransaction();
  }, [handleResetTransaction]);

  // Cancel Transaction Handler
  const handleCancelTransaction = useCallback(() => {
    if (state.currentInput || state.selectedProduct) {
      // Ask for confirmation if transaction is in progress
      if (window.confirm("Are you sure you want to cancel this transaction?")) {
        handleResetTransaction();
      }
    }
  }, [state, handleResetTransaction]);

  // Exit POS Handler
  const handleExitPOS = useCallback(() => {
    if (window.confirm("Are you sure you want to exit POS mode?")) {
      if (onExitPOS) {
        onExitPOS(); // Use custom exit handler (handles fullscreen)
      } else {
        navigate("/operator"); // Fallback
      }
    }
  }, [navigate, onExitPOS]);

  // Loading State
  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Initializing POS System...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (state.error && !state.booth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            POS Initialization Failed
          </h2>
          <p className="text-gray-600 mb-4">{state.error}</p>
          <div className="space-x-3">
            <Button onClick={() => window.location.reload()} variant="primary">
              Retry
            </Button>
            <Button onClick={handleExitPOS} variant="outline">
              Exit POS
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 ${isFullscreen ? "pos-fullscreen" : ""}`}
    >
      {/* POS Header */}
      <POSHeader
        booth={state.booth}
        cashier={authUser}
        onExit={handleExitPOS}
        isFullscreen={isFullscreen}
        onEnterFullscreen={onEnterFullscreen}
      />

      {/* Main POS Interface - Landscape Layout */}
      <div className="flex h-[calc(100vh-60px)]">
        {/* Left Panel - Product Selection */}
        <div className="w-[320px] bg-white border-r border-gray-200">
          <ProductPanel
            booth={state.booth}
            products={state.products}
            selectedProduct={state.selectedProduct}
            selectedNozzle={state.selectedNozzle}
            onProductSelect={handleProductSelect}
          />
        </div>

        {/* Center Panel - Transaction Details */}
        <div className="flex-1 bg-white border-r border-gray-200">
          <TransactionPanel
            selectedProduct={state.selectedProduct}
            selectedNozzle={state.selectedNozzle}
            attendants={state.attendants}
            selectedAttendant={state.selectedAttendant}
            onAttendantSelect={handleAttendantSelect}
            amount={state.amount}
            litres={state.litres}
            currentInput={state.currentInput}
            inputMode={state.inputMode}
            onInputModeSwitch={handleInputModeSwitch}
            error={state.error}
            calculations={calculations}
          />
        </div>

        {/* Right Panel - Controls */}
        <div className="w-[274px] bg-white">
          <ControlPanel
            currentInput={state.currentInput}
            onNumberInput={handleNumberInput}
            paymentMethods={state.paymentMethods}
            selectedPaymentMethod={state.selectedPaymentMethod}
            onPaymentMethodSelect={handlePaymentMethodSelect}
            onCompleteTransaction={handleCompleteTransaction}
            onCancelTransaction={handleCancelTransaction}
            onResetTransaction={handleResetTransaction}
            isProcessing={isProcessingTransaction}
            canComplete={
              !!(
                state.selectedProduct &&
                state.selectedAttendant &&
                state.selectedPaymentMethod &&
                state.amount > 0
              )
            }
            showConfirmation={state.showConfirmation}
          />
        </div>
      </div>

      {/* Transaction Status Popup */}
      <TransactionStatusPopup
        isProcessing={isProcessingTransaction}
        showConfirmation={state.showConfirmation}
        onClose={handleCloseConfirmation}
      />

      {/* Credit Modal (mock) */}
      <CreditModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        onConfirm={({ creditCustomerId }) => {
          // Store chosen customer and immediately complete
          setState((prev) => ({ ...prev }));
          setShowCreditModal(false);
          // attach creditCustomerId to next record call via posService
          (async () => {
            await handleCompleteTransactionWithCustomer(creditCustomerId);
          })();
        }}
        productName={state.selectedProduct?.name}
        nozzleCode={state.selectedNozzle?.code}
        inputMode={state.inputMode}
        currentInput={state.currentInput}
        unit={state.selectedProduct?.unit}
        price={state.selectedProduct?.price}
      />
    </div>
  );
};

export default POSInterface;
