/**
 * POS Calculations Hook
 * Handles amount/litres calculations and input formatting
 */

import { useCallback } from "react";
import type { ProductInfo } from "../types";

export const usePOSCalculations = () => {
  // Calculate litres from amount
  const calculateLitres = useCallback(
    (amount: number, pricePerLitre: number): number => {
      if (pricePerLitre <= 0) return 0;
      return Math.round((amount / pricePerLitre) * 100) / 100; // Round to 2 decimal places
    },
    []
  );

  // Calculate amount from litres
  const calculateAmount = useCallback(
    (litres: number, pricePerLitre: number): number => {
      return Math.round(litres * pricePerLitre * 100) / 100; // Round to 2 decimal places
    },
    []
  );

  // Format currency
  const formatCurrency = useCallback((amount: number): string => {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, []);

  // Format litres
  const formatLitres = useCallback((litres: number): string => {
    return `${litres.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}L`;
  }, []);

  // Validate and format number input
  const formatNumberInput = useCallback((input: string): string => {
    // Remove any non-numeric characters except decimal point
    let cleaned = input.replace(/[^\d.]/g, "");

    // Ensure only one decimal point
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }

    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      cleaned = parts[0] + "." + parts[1].substring(0, 2);
    }

    return cleaned;
  }, []);

  // Parse number from input string
  const parseInputNumber = useCallback(
    (input: string): number => {
      const cleaned = formatNumberInput(input);
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    },
    [formatNumberInput]
  );

  // Get calculation result based on input mode
  const getCalculationResult = useCallback(
    (
      input: string,
      inputMode: "amount" | "litres",
      product: ProductInfo | null
    ) => {
      // Debug logging
      console.log("POS Calculation Debug:", {
        input,
        inputMode,
        productPrice: product?.price,
        productName: product?.name,
      });

      if (!product || product.price <= 0) {
        console.warn("POS Calculation: No product or invalid price", {
          product,
        });
        return { amount: 0, litres: 0 };
      }

      const inputValue = parseInputNumber(input);
      console.log("POS Calculation: Parsed input value:", inputValue);

      if (inputMode === "amount") {
        const result = {
          amount: inputValue,
          litres: calculateLitres(inputValue, product.price),
        };
        console.log("POS Calculation: Amount mode result:", result);
        return result;
      } else {
        const result = {
          amount: calculateAmount(inputValue, product.price),
          litres: inputValue,
        };
        console.log("POS Calculation: Litres mode result:", result);
        return result;
      }
    },
    [parseInputNumber, calculateLitres, calculateAmount]
  );

  // Validate transaction data
  const validateTransaction = useCallback(
    (
      amount: number,
      litres: number,
      selectedProduct: ProductInfo | null,
      selectedAttendant: any,
      selectedPaymentMethod: any
    ) => {
      const errors: string[] = [];

      if (!selectedProduct) {
        errors.push("Please select a fuel product");
      }

      if (!selectedAttendant) {
        errors.push("Please select an attendant");
      }

      if (!selectedPaymentMethod) {
        errors.push("Please select a payment method");
      }

      if (amount <= 0) {
        errors.push("Please enter a valid amount");
      }

      if (litres <= 0) {
        errors.push("Please enter a valid quantity");
      }

      // Minimum transaction amount
      if (amount > 0 && amount < 10) {
        errors.push("Minimum transaction amount is ₹10");
      }

      // Maximum transaction amount (safety check)
      if (amount > 50000) {
        errors.push("Maximum transaction amount is ₹50,000");
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    []
  );

  // Generate preset amounts based on product price
  const getPresetAmounts = useCallback(
    (product: ProductInfo | null): number[] => {
      if (!product) return [100, 500, 1000, 2000];

      const price = product.price;

      // Generate round amounts that result in nice litre values
      return [
        Math.ceil(price * 5), // ~5 litres
        Math.ceil(price * 10), // ~10 litres
        Math.ceil(price * 20), // ~20 litres
        Math.ceil(price * 50), // ~50 litres
      ].map((amount) => Math.round(amount / 10) * 10); // Round to nearest 10
    },
    []
  );

  return {
    calculateLitres,
    calculateAmount,
    formatCurrency,
    formatLitres,
    formatNumberInput,
    parseInputNumber,
    getCalculationResult,
    validateTransaction,
    getPresetAmounts,
  };
};
