/**
 * POS State Management Hook
 * Centralized state management for the POS interface
 */

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import staffshiftService from "../../../../services/staffshiftService";
import paymentMethodService from "../../../../services/paymentMethodService";
import type {
  POSState,
  AttendantOption,
  ProductInfo,
  BoothInfo,
  CashierPOSContext,
} from "../types";

const INITIAL_STATE: POSState = {
  cashierContext: null,
  activeShift: null,

  booth: null,
  products: [],
  attendants: [],
  paymentMethods: [],

  selectedProduct: null,
  selectedNozzle: null,
  selectedAttendant: null,
  selectedPaymentMethod: null,

  currentInput: "",
  inputMode: "amount",

  amount: 0,
  litres: 0,

  loading: false,
  error: null,
  showConfirmation: false,
};

// Payment methods will be loaded from backend

export const usePOSState = () => {
  const [state, setState] = useState<POSState>(INITIAL_STATE);
  const { authUser } = useAuth();

  // Helper: Derive a friendly display name from user details/email
  const getDisplayNameFromAuthUser = useCallback((): string => {
    if (!authUser) return "";
    const fullName = (authUser as any).full_name || authUser.details?.full_name;
    if (
      fullName &&
      typeof fullName === "string" &&
      fullName.trim().length > 0
    ) {
      return fullName.trim();
    }
    // Fallback: Extract name from email (before @) and capitalize
    const email = authUser.email || "";
    const atIndex = email.indexOf("@");
    if (atIndex > 0) {
      const base = email.substring(0, atIndex);
      return base.charAt(0).toUpperCase() + base.substring(1);
    }
    return "Cashier";
  }, [authUser]);

  // Helper: Extract display name from email
  const humanizeEmail = useCallback((email: string): string => {
    const atIndex = email.indexOf("@");
    if (atIndex > 0) {
      const base = email.substring(0, atIndex);
      return base.charAt(0).toUpperCase() + base.substring(1);
    }
    return email;
  }, []);

  // Initialize POS data
  const initializePOS = useCallback(async () => {
    if (!authUser) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // 1. Get cashier's POS context - independent of shift status
      console.log("POS Debug - Loading cashier context...");
      const [cashierContextRes, paymentMethodsRes] = await Promise.all([
        staffshiftService.getCashierPOSContext(),
        paymentMethodService.getForPOS(),
      ]);

      const cashierContext: CashierPOSContext = cashierContextRes.data?.data;
      const paymentMethods = paymentMethodsRes || [];

      console.log("POS Debug - Cashier context:", cashierContext);

      if (!cashierContext) {
        throw new Error(
          "You are not assigned to any operator group. Please contact your administrator."
        );
      }

      // 2. Process assigned booths from context
      if (!cashierContext.assignedBooths.length) {
        throw new Error("No booths assigned to your operator group.");
      }

      // Use first assigned booth as default (can be enhanced later for multi-booth support)
      const primaryBooth = cashierContext.assignedBooths[0];
      const boothInfo: BoothInfo = {
        id: primaryBooth.id.toString(),
        name: primaryBooth.name,
        code: primaryBooth.name, // Using name as code for now
        isActive: true,
        nozzles: primaryBooth.nozzles.map((nozzle) => ({
          id: nozzle.id.toString(),
          code: nozzle.code,
          productId: nozzle.productId?.toString() || "",
          boothId: nozzle.boothId.toString(),
          isActive: nozzle.status === "active",
          isAvailable: true, // TODO: Get real-time status
        })),
      };

      // 3. Process products from nozzles
      const productMap = new Map<number, any>();
      cashierContext.assignedBooths.forEach((booth) => {
        booth.nozzles.forEach((nozzle) => {
          if (nozzle.product) {
            productMap.set(nozzle.product.id, nozzle.product);
          }
        });
      });

      const productList: ProductInfo[] = Array.from(productMap.values()).map(
        (product) => {
          // Get price from sale_price, fallback to mrp, then default values
          let price = 0;
          if (product.sale_price && product.sale_price > 0) {
            price = parseFloat(product.sale_price);
          } else if (product.mrp && product.mrp > 0) {
            price = parseFloat(product.mrp);
          } else {
            // Default prices for common fuel types if no price is set
            const name = product.name?.toLowerCase() || "";
            if (name.includes("petrol") || name.includes("gasoline"))
              price = 95.5;
            else if (name.includes("diesel")) price = 87.2;
            else if (name.includes("premium")) price = 102.3;
            else if (name.includes("cng")) price = 75.0;
            else price = 90.0; // Default fuel price
          }

          return {
            id: product.id.toString(),
            name: product.name,
            category: product.category_type || "Fuel",
            price: price,
            unit: product.uom || "L",
            isActive: true,
            color: getProductColor(product.name),
          };
        }
      );

      // 4. Process team members as attendants
      // Filter out cashier from team members since we add them separately
      const teamMembersOnly = cashierContext.teamMembers.filter(
        (member) => member.role !== "cashier"
      );

      const attendants: AttendantOption[] = [
        // Add cashier themselves
        {
          id: cashierContext.cashier.user_id,
          name:
            cashierContext.cashier.full_name || getDisplayNameFromAuthUser(),
          role: "cashier" as const,
          isSelf: true,
          isActive: true,
          email: cashierContext.cashier.email,
          phone: cashierContext.cashier.phone,
        },
        // Add only attendants (not cashier)
        ...teamMembersOnly.map((member) => ({
          id: member.id,
          name: member.full_name || humanizeEmail(member.email),
          role: "attendant" as const,
          isSelf: false,
          isActive: true,
          email: member.email,
          phone: member.phone,
        })),
      ];

      // Debug: Log final processed data
      console.log("POS Debug - Final product list:", productList);
      console.log("POS Debug - Booth info:", boothInfo);
      console.log("POS Debug - Attendants:", attendants.length);
      console.log("POS Debug - Payment methods:", paymentMethods);

      setState((prev) => ({
        ...prev,
        cashierContext,
        activeShift: null, // Will be set by backend during transaction validation
        booth: boothInfo,
        products: productList,
        attendants,
        paymentMethods,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || "Failed to initialize POS",
        loading: false,
      }));
    }
  }, [authUser, humanizeEmail, getDisplayNameFromAuthUser]);

  // Product color mapping
  const getProductColor = (productName: string): string => {
    const name = productName.toLowerCase();
    if (name.includes("petrol") || name.includes("gasoline")) return "green";
    if (name.includes("diesel")) return "blue";
    if (name.includes("premium")) return "yellow";
    if (name.includes("cng")) return "gray";
    return "indigo";
  };

  // Initialize on mount
  useEffect(() => {
    initializePOS();
  }, [initializePOS]);

  return {
    state,
    setState,
    initializePOS,
  };
};
