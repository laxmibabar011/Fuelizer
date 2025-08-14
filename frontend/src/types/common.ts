// Common enums for status types
export enum OperatorStatus {
  AVAILABLE = "available",
  ASSIGNED = "assigned",
  ON_BREAK = "on-break",
  UNAVAILABLE = "unavailable",
}

export enum ShiftStatus {
  NOT_STARTED = "not-started",
  ACTIVE = "active",
  COMPLETED = "completed",
}

export enum TankStatus {
  NORMAL = "normal",
  LOW = "low",
  CRITICAL = "critical",
  MAINTENANCE = "maintenance",
}

export enum ProductStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum AssignmentType {
  BOOTH = "booth",
  NOZZLE = "nozzle",
  SHIFT = "shift",
  MAINTENANCE = "maintenance",
}

// Add global operator duty enum
export enum OperatorDuty {
  CASHIER = "cashier",
  ATTENDANT = "attendant",
}

// Base interface for all entities
export interface BaseEntity {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

// Operator interface
export interface Operator extends BaseEntity {
  photo?: string;
  phone: string;
  email: string;
  status: OperatorStatus;
  currentAssignment?: Assignment;
  shift: string;
  joinDate: string;
  duty?: OperatorDuty; // newly added for global duty configuration
}

// Assignment interface
export interface Assignment {
  type: AssignmentType;
  location: string;
  boothId?: string;
  nozzleId?: string;
  startTime: string;
}

// Shift interface
export interface Shift extends BaseEntity {
  timeRange: string;
  status: ShiftStatus;
  operators: string[];
  operatorCount: number;
  maxOperators: number;
  handoverNotes?: string;
}

// Tank interface
export interface Tank extends BaseEntity {
  fuelType: string;
  capacity: number;
  currentStock: number | null;
  previousStock: number;
  waterLevel: number | null;
  temperature: number | null;
  variance: number;
  status: TankStatus;
  lastRefill: string;
  qualityCheck: QualityCheck;
}

// Quality check interface
export interface QualityCheck {
  density: boolean;
  contamination: boolean;
  waterContent: boolean;
}

// Product interface
export interface Product extends BaseEntity {
  categoryId: string;
  currentRate: number;
  previousRate: number;
  status: ProductStatus;
  lastUpdated: string;
  change: number;
  unit: string;
}

// Category interface
export interface Category extends BaseEntity {
  icon: string;
  color: string;
}

// Pump interface
export interface Pump extends BaseEntity {
  status: "available" | "assigned" | "maintenance";
  assignedOperator?: string;
}

// Nozzle interface
export interface Nozzle {
  id: string;
  fuelType: string;
  previousReading: number;
  currentReading: number | null;
  variance: number;
  status: "pending" | "completed" | "error";
  // Backward compatibility: single assignment
  assignedOperator?: string;
  // New: support multiple operators per nozzle
  assignedOperators?: string[];
}

// Booth interface
export interface Booth extends BaseEntity {
  status: "online" | "offline" | "maintenance";
  nozzles: Nozzle[];
  lastMaintenance: string;
  assignedOperator?: string;
}
