/**
 * POS State Management Hook
 * Centralized state management for the POS interface
 */

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import StationService from "../../../../services/stationService";
import ProductMasterService from "../../../../services/productMasterService";
import staffshiftService from "../../../../services/staffshiftService";
import paymentMethodService from "../../../../services/paymentMethodService";
import type {
  POSState,
  AttendantOption,
  ProductInfo,
  NozzleInfo,
  BoothInfo,
  PaymentMethod,
  TransactionData,
} from "../types";

const INITIAL_STATE: POSState = {
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

  // Initialize POS data
  const initializePOS = useCallback(async () => {
    if (!authUser) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Load booth data, products, attendants, and payment methods in parallel
      const [boothsRes, productsRes, nozzlesRes, paymentMethodsRes] =
        await Promise.all([
          StationService.listBooths(),
          ProductMasterService.listProducts({ category_type: "Fuel" }),
          StationService.listNozzles(),
          paymentMethodService.getForPOS(),
        ]);

      // Process booth data
      const booths = boothsRes.data?.data || [];
      const products = productsRes.data?.data || [];
      const nozzles = nozzlesRes.data?.data || [];
      const paymentMethods = paymentMethodsRes || [];

      // Debug: Log product data to understand structure
      console.log("POS Debug - Products from backend:", products.slice(0, 2));
      if (products.length > 0) {
        console.log("POS Debug - First product structure:", products[0]);
        console.log("POS Debug - Price fields:", {
          sale_price: products[0]?.sale_price,
          mrp: products[0]?.mrp,
          uom: products[0]?.uom,
        });
      }

      // Find cashier's assigned booth (simplified - take first active booth)
      const assignedBooth =
        booths.find((booth: any) => booth.active) || booths[0];

      if (!assignedBooth) {
        throw new Error("No booth assigned to this cashier");
      }

      // Get nozzles for this booth
      const boothNozzles = nozzles.filter(
        (nozzle: any) =>
          nozzle.boothId === assignedBooth.id ||
          nozzle.boothId === assignedBooth.id?.toString()
      );

      const boothInfo: BoothInfo = {
        id: assignedBooth.id.toString(),
        name: assignedBooth.name,
        code: assignedBooth.code,
        isActive: assignedBooth.active,
        nozzles: boothNozzles.map((nozzle: any) => ({
          id: nozzle.id.toString(),
          code: nozzle.code,
          productId: nozzle.productId?.toString() || "",
          boothId: assignedBooth.id.toString(),
          isActive: nozzle.active !== false,
          isAvailable: true, // TODO: Get real-time status
        })),
      };

      // Process products
      const productList: ProductInfo[] = products.map((product: any) => {
        // Try to get price from sale_price, fallback to mrp, then default values
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
          isActive: product.status === "active",
          color: getProductColor(product.name),
        };
      });

      // Load attendants (cashier + operator group members)
      const attendants = await loadAttendants();

      // Debug: Log final processed data
      console.log("POS Debug - Final product list:", productList);
      console.log("POS Debug - Booth info:", boothInfo);
      console.log("POS Debug - Attendants:", attendants.length);
      console.log("POS Debug - Payment methods:", paymentMethods);

      setState((prev) => ({
        ...prev,
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
  }, [authUser]);

  // Load attendants (cashier + group members)
  const loadAttendants = useCallback(async (): Promise<AttendantOption[]> => {
    if (!authUser) return [];

    try {
      console.log("POS Debug - Loading attendants for user:", authUser);
      console.log(
        "POS Debug - User ID type:",
        typeof authUser.userId,
        "Value:",
        authUser.userId
      );
      console.log("POS Debug - User details:", authUser.details);

      // First, get all operator groups to find the one where this cashier is the cashier_id
      const operatorGroupsRes = await staffshiftService.listGroups();
      const operatorGroups = operatorGroupsRes.data?.data || [];

      console.log("POS Debug - All operator groups:", operatorGroups);

      // Find the group where this cashier is the cashier_id
      const cashierGroup = operatorGroups.find(
        (group: any) => group.cashier_id === String(authUser.userId)
      );

      console.log("POS Debug - Cashier group found:", cashierGroup);

      if (!cashierGroup) {
        console.warn("No operator group found for cashier:", authUser.userId);
        // Fallback to just cashier
        return [
          {
            id: String(authUser.userId),
            name: getDisplayNameFromAuthUser(),
            role: "cashier",
            isSelf: true,
            isActive: true,
          },
        ];
      }

      // Get the group members (attendants) for this group
      const groupAttendantsRes = await staffshiftService.getGroupAttendants(
        cashierGroup.id
      );
      const groupAttendants = groupAttendantsRes.data?.data || [];

      console.log("POS Debug - Group attendants:", groupAttendants);
      console.log("POS Debug - First attendant structure:", groupAttendants[0]);
      console.log(
        "POS Debug - Attendant data fields:",
        groupAttendants[0]
          ? {
              user_id: groupAttendants[0].user_id,
              id: groupAttendants[0].id,
              UserDetails: groupAttendants[0].UserDetails,
              User: groupAttendants[0].User,
              full_name: groupAttendants[0].full_name,
              name: groupAttendants[0].name,
              email: groupAttendants[0].User?.email,
            }
          : "No attendants"
      );

      const attendants: AttendantOption[] = [
        // Cashier (self) always first
        {
          id: String(authUser.userId),
          name: getDisplayNameFromAuthUser(),
          role: "cashier",
          isSelf: true,
          isActive: true,
        },
        // Operator group members (attendants)
        ...groupAttendants.map((attendant: any) => {
          console.log("POS Debug - Processing attendant:", attendant);

          // Extract name with priority: full_name > name > email (without domain) > fallback
          let displayName =
            attendant.UserDetails?.full_name ||
            attendant.full_name ||
            attendant.name;

          // If no name found, try to extract name from email
          if (!displayName && attendant.User?.email) {
            const email = attendant.User.email;
            const atIndex = email.indexOf("@");
            if (atIndex > 0) {
              displayName =
                email.substring(0, atIndex).charAt(0).toUpperCase() +
                email.substring(1, atIndex);
            } else {
              displayName = email;
            }
          }

          // Final fallback
          if (!displayName) {
            displayName = `Attendant ${attendant.id}`;
          }

          return {
            id: String(attendant.user_id || attendant.id),
            name: displayName,
            role: "attendant" as const,
            isSelf: false,
            employeeId: String(attendant.employee_id || attendant.id),
            isActive: attendant.is_active !== false,
          };
        }),
      ];

      console.log("POS Debug - Final attendants list:", attendants);
      return attendants;
    } catch (error) {
      console.error("Failed to load attendants:", error);
      // Fallback to just cashier
      return [
        {
          id: String(authUser.userId),
          name: getDisplayNameFromAuthUser(),
          role: "cashier",
          isSelf: true,
          isActive: true,
        },
      ];
    }
  }, [authUser]);

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
    loadAttendants,
  };
};
