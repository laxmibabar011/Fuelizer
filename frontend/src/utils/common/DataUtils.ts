/**
 * Common utility class for generic data operations and calculations
 * Shared across all modules - follows OOP principles and DRY concept
 */
export class DataUtils {
  /**
   * Calculate percentage with safety checks
   */
  static calculatePercentage(current: number | null, total: number): number {
    if (current === null || total === 0) return 0;
    return Math.round((current / total) * 100);
  }

  /**
   * Format currency values
   */
  static formatCurrency(amount: number, currency: string = "₹"): string {
    if (amount >= 1000000) {
      return `${currency}${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${currency}${(amount / 1000).toFixed(0)}K`;
    }
    return `${currency}${amount.toFixed(0)}`;
  }

  /**
   * Format large numbers
   */
  static formatNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  }

  /**
   * Calculate variance between two values
   */
  static calculateVariance(current: number | null, previous: number): number {
    if (current === null) return 0;
    return current - previous;
  }

  /**
   * Get percentage color based on value
   */
  static getPercentageColor(percentage: number): string {
    if (percentage >= 70) return "text-green-600";
    if (percentage >= 30) return "text-yellow-600";
    return "text-red-600";
  }

  /**
   * Sort entities by name
   */
  static sortByName<T extends { name: string }>(entities: T[]): T[] {
    return [...entities].sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Sort entities by date (newest first)
   */
  static sortByDate<T extends { createdAt?: string }>(entities: T[]): T[] {
    return [...entities].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  /**
   * Group entities by a key
   */
  static groupBy<T, K extends keyof T>(entities: T[], key: K): Map<T[K], T[]> {
    const groups = new Map<T[K], T[]>();

    entities.forEach((entity) => {
      const groupKey = entity[key];
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(entity);
    });

    return groups;
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
  }

  /**
   * Generate unique ID
   */
  static generateId(prefix: string = "ID"): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `${prefix}${timestamp}${randomStr}`.toUpperCase();
  }

  /**
   * Format date for display
   */
  static formatDate(
    dateString: string,
    options: Intl.DateTimeFormatOptions = {}
  ): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...options,
    };

    try {
      return new Date(dateString).toLocaleDateString("en-US", defaultOptions);
    } catch {
      return dateString;
    }
  }

  /**
   * Format time for display
   */
  static formatTime(timeString: string): string {
    try {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  }

  /**
   * Calculate experience years from join date
   */
  static calculateExperienceYears(joinDate: string): number {
    try {
      const join = new Date(joinDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - join.getTime());
      const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
      return diffYears;
    } catch {
      return 0;
    }
  }

  /**
   * Filter entities by status
   */
  static filterByStatus<T extends { status: string }>(
    entities: T[],
    status: string
  ): T[] {
    return entities.filter((entity) => entity.status === status);
  }

  /**
   * Count entities by status
   */
  static countByStatus<T extends { status: string }>(
    entities: T[],
    status: string
  ): number {
    return this.filterByStatus(entities, status).length;
  }

  /**
   * Calculate total from array of numbers
   */
  static calculateTotal(values: (number | null)[]): number {
    return values.reduce((total, value) => total + (value || 0), 0);
  }

  /**
   * Calculate average from array of numbers
   */
  static calculateAverage(values: (number | null)[]): number {
    const validValues = values.filter((v) => v !== null) as number[];
    if (validValues.length === 0) return 0;
    return (
      Math.round(
        (validValues.reduce((sum, v) => sum + v, 0) / validValues.length) * 10
      ) / 10
    );
  }
}
