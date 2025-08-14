import {
  Operator,
  Shift,
  Tank,
  Product,
  Category,
  Pump,
  Booth,
  Nozzle,
  OperatorStatus,
  ShiftStatus,
  TankStatus,
  ProductStatus,
  AssignmentType,
  OperatorDuty,
} from "../../types/common";

/**
 * Common mock data for the application
 * Shared across all modules - follows DRY principle by eliminating data duplication
 */
export class MockData {
  /**
   * Mock operators data
   */
  static readonly operators: Operator[] = [
    {
      id: "OP001",
      name: "Rajesh Kumar",
      phone: "+91 98765 43210",
      email: "rajesh.kumar@fuelstation.com",
      status: OperatorStatus.ASSIGNED,
      currentAssignment: {
        type: AssignmentType.BOOTH,
        location: "Booth 1",
        boothId: "B001",
        startTime: "06:00",
      },
      shift: "Morning",
      joinDate: "2022-03-15",
      duty: OperatorDuty.CASHIER,
    },
    {
      id: "OP002",
      name: "Priya Sharma",
      phone: "+91 87654 32109",
      email: "priya.sharma@fuelstation.com",
      status: OperatorStatus.AVAILABLE,
      shift: "Afternoon",
      joinDate: "2021-11-08",
      duty: OperatorDuty.ATTENDANT,
    },
    {
      id: "OP003",
      name: "Amit Singh",
      phone: "+91 76543 21098",
      email: "amit.singh@fuelstation.com",
      status: OperatorStatus.ASSIGNED,
      currentAssignment: {
        type: AssignmentType.NOZZLE,
        location: "Booth 2 - Diesel Nozzle",
        boothId: "B002",
        nozzleId: "N003",
        startTime: "06:00",
      },
      shift: "Morning",
      joinDate: "2023-01-20",
      duty: OperatorDuty.ATTENDANT,
    },
    {
      id: "OP004",
      name: "Sunita Devi",
      phone: "+91 65432 10987",
      email: "sunita.devi@fuelstation.com",
      status: OperatorStatus.ON_BREAK,
      shift: "Afternoon",
      joinDate: "2022-08-12",
      duty: OperatorDuty.ATTENDANT,
    },
    {
      id: "OP005",
      name: "Vikram Yadav",
      phone: "+91 54321 09876",
      email: "vikram.yadav@fuelstation.com",
      status: OperatorStatus.ASSIGNED,
      currentAssignment: {
        type: AssignmentType.SHIFT,
        location: "Supervisor - Morning",
        startTime: "06:00",
      },
      shift: "Morning",
      joinDate: "2020-05-10",
      duty: OperatorDuty.ATTENDANT,
    },
    {
      id: "OP006",
      name: "Meera Patel",
      phone: "+91 43210 98765",
      email: "meera.patel@fuelstation.com",
      status: OperatorStatus.AVAILABLE,
      shift: "Afternoon",
      joinDate: "2023-04-03",
      duty: OperatorDuty.ATTENDANT,
    },
  ];

  /**
   * Mock shifts data
   */
  static readonly shifts: Shift[] = [
    {
      id: "1",
      name: "Morning Shift",
      timeRange: "6:00 AM - 2:00 PM",
      status: ShiftStatus.ACTIVE,
      operators: ["OP001", "OP003", "OP005", "OP007"],
      operatorCount: 4,
      maxOperators: 5,
      handoverNotes:
        "Pump 3 nozzle needs attention. Tank 2 refilled at 5:30 AM.",
    },
    {
      id: "2",
      name: "Afternoon Shift",
      timeRange: "2:00 PM - 10:00 PM",
      status: ShiftStatus.NOT_STARTED,
      operators: ["OP002", "OP004", "OP006"],
      operatorCount: 3,
      maxOperators: 5,
    },
    {
      id: "3",
      name: "Night Shift",
      timeRange: "10:00 PM - 6:00 AM",
      status: ShiftStatus.COMPLETED,
      operators: ["OP008", "OP009", "OP010"],
      operatorCount: 3,
      maxOperators: 4,
      handoverNotes:
        "All systems normal. Security patrol completed at 3:00 AM.",
    },
  ];

  /**
   * Mock tanks data
   */
  static readonly tanks: Tank[] = [
    {
      id: "T001",
      name: "Tank 1",
      fuelType: "Petrol (Regular)",
      capacity: 50000,
      currentStock: 42500,
      previousStock: 38200,
      waterLevel: 2.5,
      temperature: 28.5,
      variance: 4300,
      status: TankStatus.NORMAL,
      lastRefill: "2024-01-14 05:30",
      qualityCheck: { density: true, contamination: true, waterContent: true },
    },
    {
      id: "T002",
      name: "Tank 2",
      fuelType: "Petrol (Premium)",
      capacity: 30000,
      currentStock: null,
      previousStock: 18500,
      waterLevel: null,
      temperature: null,
      variance: 0,
      status: TankStatus.NORMAL,
      lastRefill: "2024-01-12 14:20",
      qualityCheck: {
        density: false,
        contamination: false,
        waterContent: false,
      },
    },
    {
      id: "T003",
      name: "Tank 3",
      fuelType: "Diesel",
      capacity: 40000,
      currentStock: 8500,
      previousStock: 12800,
      waterLevel: 5.2,
      temperature: 29.8,
      variance: -4300,
      status: TankStatus.LOW,
      lastRefill: "2024-01-10 09:15",
      qualityCheck: { density: true, contamination: true, waterContent: false },
    },
    {
      id: "T004",
      name: "Tank 4",
      fuelType: "CNG",
      capacity: 25000,
      currentStock: 22800,
      previousStock: 24100,
      waterLevel: 0,
      temperature: 25.2,
      variance: -1300,
      status: TankStatus.NORMAL,
      lastRefill: "2024-01-13 16:45",
      qualityCheck: { density: true, contamination: true, waterContent: true },
    },
    {
      id: "T005",
      name: "Tank 5",
      fuelType: "LPG",
      capacity: 20000,
      currentStock: 3200,
      previousStock: 5800,
      waterLevel: 0,
      temperature: 26.8,
      variance: -2600,
      status: TankStatus.CRITICAL,
      lastRefill: "2024-01-08 11:30",
      qualityCheck: { density: true, contamination: false, waterContent: true },
    },
  ];

  /**
   * Mock categories data
   */
  static readonly categories: Category[] = [
    {
      id: "CAT001",
      name: "Petrol",
      icon: "⛽",
      color: "bg-blue-500",
    },
    {
      id: "CAT002",
      name: "Diesel",
      icon: "🛢️",
      color: "bg-green-500",
    },
    {
      id: "CAT003",
      name: "CNG",
      icon: "💨",
      color: "bg-purple-500",
    },
    {
      id: "CAT004",
      name: "LPG",
      icon: "🔥",
      color: "bg-orange-500",
    },
  ];

  /**
   * Mock products data
   */
  static readonly products: Product[] = [
    {
      id: "PROD001",
      name: "Petrol Regular",
      categoryId: "CAT001",
      currentRate: 96.72,
      previousRate: 95.5,
      status: ProductStatus.ACTIVE,
      lastUpdated: "2024-01-15 08:00",
      change: 1.22,
      unit: "per liter",
    },
    {
      id: "PROD002",
      name: "Petrol Premium",
      categoryId: "CAT001",
      currentRate: 102.5,
      previousRate: 101.25,
      status: ProductStatus.ACTIVE,
      lastUpdated: "2024-01-15 08:00",
      change: 1.25,
      unit: "per liter",
    },
    {
      id: "PROD003",
      name: "Diesel",
      categoryId: "CAT002",
      currentRate: 89.62,
      previousRate: 88.3,
      status: ProductStatus.ACTIVE,
      lastUpdated: "2024-01-15 08:00",
      change: 1.32,
      unit: "per liter",
    },
    {
      id: "PROD004",
      name: "CNG",
      categoryId: "CAT003",
      currentRate: 75.0,
      previousRate: 74.5,
      status: ProductStatus.ACTIVE,
      lastUpdated: "2024-01-15 08:00",
      change: 0.5,
      unit: "per kg",
    },
    {
      id: "PROD005",
      name: "LPG",
      categoryId: "CAT004",
      currentRate: 1050.0,
      previousRate: 1040.0,
      status: ProductStatus.ACTIVE,
      lastUpdated: "2024-01-15 08:00",
      change: 10.0,
      unit: "per cylinder",
    },
  ];

  /**
   * Mock booths data with operator assignments
   */
  static readonly booths: Booth[] = [
    {
      id: "B001",
      name: "Booth 1",
      status: "online",
      assignedOperator: undefined, // No booth-level assignment, only nozzle-level
      nozzles: [
        {
          id: "N001",
          fuelType: "Petrol Regular",
          previousReading: 12500,
          currentReading: 13200,
          variance: 700,
          status: "completed",
          assignedOperator: "OP001", // Rajesh Kumar assigned to this nozzle
          assignedOperators: ["OP001", "OP002"],
        },
        {
          id: "N002",
          fuelType: "Petrol Premium",
          previousReading: 8900,
          currentReading: null,
          variance: 0,
          status: "pending",
          assignedOperator: "OP002", // Priya Sharma assigned to this nozzle
          assignedOperators: ["OP002"],
        },
        {
          id: "N003",
          fuelType: "Diesel",
          previousReading: 15600,
          currentReading: 16200,
          variance: 600,
          status: "completed",
          assignedOperator: "OP003", // Amit Singh assigned to this nozzle
          assignedOperators: ["OP003"],
        },
        {
          id: "N004",
          fuelType: "CNG",
          previousReading: 4500,
          currentReading: null,
          variance: 0,
          status: "pending",
          assignedOperator: undefined, // Available for assignment
          assignedOperators: [],
        },
      ],
      lastMaintenance: "2024-01-10",
    },
    {
      id: "B002",
      name: "Booth 2",
      status: "online",
      assignedOperator: undefined, // No booth-level assignment
      nozzles: [
        {
          id: "N005",
          fuelType: "Petrol Regular",
          previousReading: 9800,
          currentReading: 10500,
          variance: 700,
          status: "completed",
          assignedOperator: "OP004", // Sunita Devi assigned to this nozzle
          assignedOperators: ["OP004"],
        },
        {
          id: "N006",
          fuelType: "Diesel",
          previousReading: 12000,
          currentReading: null,
          variance: 0,
          status: "pending",
          assignedOperator: "OP005", // Vikram Yadav assigned to this nozzle
          assignedOperators: ["OP005", "OP001"],
        },
      ],
      lastMaintenance: "2024-01-12",
    },
    {
      id: "B003",
      name: "Booth 3",
      status: "maintenance",
      assignedOperator: undefined,
      nozzles: [
        {
          id: "N007",
          fuelType: "Petrol Premium",
          previousReading: 7500,
          currentReading: null,
          variance: 0,
          status: "error",
          assignedOperator: undefined, // No assignment during maintenance
          assignedOperators: [],
        },
      ],
      lastMaintenance: "2024-01-15",
    },
  ];

  /**
   * Generic getter methods
   */
  static getOperatorById(id: string): Operator | undefined {
    return this.operators.find((op) => op.id === id);
  }

  static getShiftById(id: string): Shift | undefined {
    return this.shifts.find((shift) => shift.id === id);
  }

  static getTankById(id: string): Tank | undefined {
    return this.tanks.find((tank) => tank.id === id);
  }

  static getProductById(id: string): Product | undefined {
    return this.products.find((product) => product.id === id);
  }

  static getCategoryById(id: string): Category | undefined {
    return this.categories.find((category) => category.id === id);
  }

  static getProductsByCategory(categoryId: string): Product[] {
    return this.products.filter((product) => product.categoryId === categoryId);
  }

  static getOperatorsByShift(shiftName: string): Operator[] {
    return this.operators.filter((operator) => operator.shift === shiftName);
  }
}
