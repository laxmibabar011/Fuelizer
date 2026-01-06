/**
 * POS System Type Definitions
 * Comprehensive types for the Point of Sale interface
 */

export interface AttendantOption {
  id: string;
  name: string;
  role: "cashier" | "attendant";
  isSelf: boolean;
  employeeId?: string;
  isActive: boolean;
  avatar?: string;
  email?: string;
  phone?: string;
}

export interface ProductInfo {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  isActive: boolean;
  color?: string;
}

export interface NozzleInfo {
  id: string;
  code: string;
  productId: string;
  boothId: string;
  isActive: boolean;
  isAvailable: boolean;
}

export interface BoothInfo {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  nozzles: NozzleInfo[];
}

export interface TransactionData {
  nozzleId: string;
  productId: string;
  attendantId: string;
  operatorGroupId: string;
  amount: number;
  litres: number;
  pricePerLitre: number;
  paymentMethodId: string;
  creditCustomerId?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
  requiresCustomer?: boolean; // For credit payments
}

export interface CashierPOSContext {
  operatorGroup: {
    id: number;
    name: string;
    shift_id: number;
    shift: {
      id: number;
      name: string;
      start_time: string;
      end_time: string;
      shift_type: string;
    };
  };
  cashier: {
    user_id: string;
    email: string;
    full_name?: string;
    phone?: string;
  };
  assignedBooths: Array<{
    id: number;
    name: string;
    nozzles: Array<{
      id: number;
      code: string;
      productId: number;
      boothId: number;
      status: string;
      product: {
        id: number;
        name: string;
        category_type: string;
        sale_price: number;
        mrp: number;
        uom: string;
      } | null;
    }>;
  }>;
  teamMembers: Array<{
    id: string;
    email: string;
    full_name?: string;
    phone?: string;
    role: string;
  }>;
}

export interface ActiveShiftInfo {
  id: number;
  fuel_admin_id: string;
  operational_day_id: number;
  status: "ACTIVE";
  started_at: string;
}

export interface POSState {
  // Context Data
  cashierContext: CashierPOSContext | null;
  activeShift: ActiveShiftInfo | null;

  // Data
  booth: BoothInfo | null;
  products: ProductInfo[];
  attendants: AttendantOption[];
  paymentMethods: PaymentMethod[];

  // Current Transaction
  selectedProduct: ProductInfo | null;
  selectedNozzle: NozzleInfo | null;
  selectedAttendant: AttendantOption | null;
  selectedPaymentMethod: PaymentMethod | null;

  // Input State
  currentInput: string;
  inputMode: "amount" | "litres";

  // Calculated Values
  amount: number;
  litres: number;

  // UI State
  loading: boolean;
  error: string | null;
  showConfirmation: boolean;
}

export interface POSActions {
  // Product Selection
  selectProduct: (product: ProductInfo, nozzle: NozzleInfo) => void;

  // Attendant Selection
  selectAttendant: (attendant: AttendantOption) => void;

  // Input Handling
  handleNumberInput: (value: string) => void;
  switchInputMode: (mode: "amount" | "litres") => void;
  clearInput: () => void;

  // Payment
  selectPaymentMethod: (method: PaymentMethod) => void;

  // Transaction
  completeTransaction: () => Promise<void>;
  cancelTransaction: () => void;
  resetTransaction: () => void;
}

export interface POSContextType extends POSState, POSActions {}

// API Response Types
export interface TransactionResponse {
  success: boolean;
  data: {
    id: string;
    transactionTime: string;
    receiptNumber: string;
  };
  message: string;
}
