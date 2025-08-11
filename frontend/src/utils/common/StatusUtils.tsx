import React from "react";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  MapPin,
  Clock,
  CheckCircle2,
} from "lucide-react";

/**
 * Common utility class for handling generic status-related operations
 * Shared across all modules - follows OOP principles and DRY concept
 */
export class StatusUtils {
  /**
   * Get color classes for generic status
   */
  static getGenericStatusColor(
    status: string,
    darkMode: boolean = false
  ): string {
    const statusMap: { [key: string]: string } = {
      online: "green",
      offline: "red",
      maintenance: "yellow",
      pending: "yellow",
      completed: "green",
      error: "red",
      active: "green",
      inactive: "gray",
      suspended: "red",
      available: "green",
      assigned: "blue",
      unavailable: "red",
      "on-break": "yellow",
      normal: "green",
      low: "yellow",
      critical: "red",
    };

    const color = statusMap[status.toLowerCase()] || "gray";
    return darkMode
      ? `bg-${color}-100 text-${color}-800 dark:bg-${color}-900 dark:text-${color}-300`
      : `bg-${color}-100 text-${color}-800`;
  }

  /**
   * Get generic icon for status
   */
  static getGenericStatusIcon(status: string): React.ReactElement {
    const statusLower = status.toLowerCase();

    if (
      statusLower.includes("available") ||
      statusLower.includes("online") ||
      statusLower.includes("active") ||
      statusLower.includes("completed") ||
      statusLower.includes("normal")
    ) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }

    if (statusLower.includes("assigned") || statusLower.includes("pending")) {
      return <MapPin className="h-4 w-4 text-blue-600" />;
    }

    if (
      statusLower.includes("break") ||
      statusLower.includes("maintenance") ||
      statusLower.includes("low")
    ) {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }

    if (
      statusLower.includes("unavailable") ||
      statusLower.includes("offline") ||
      statusLower.includes("error") ||
      statusLower.includes("critical") ||
      statusLower.includes("suspended")
    ) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }

    return <AlertCircle className="h-4 w-4 text-gray-600" />;
  }

  /**
   * Format status text for display
   */
  static formatStatusText(status: string): string {
    return status.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Check if status indicates an active/positive state
   */
  static isActiveStatus(status: string): boolean {
    const activeStatuses = [
      "available",
      "online",
      "completed",
      "active",
      "normal",
    ];
    return activeStatuses.includes(status.toLowerCase());
  }

  /**
   * Check if status indicates a warning state
   */
  static isWarningStatus(status: string): boolean {
    const warningStatuses = ["on-break", "maintenance", "pending", "low"];
    return warningStatuses.includes(status.toLowerCase());
  }

  /**
   * Check if status indicates an error/critical state
   */
  static isErrorStatus(status: string): boolean {
    const errorStatuses = [
      "unavailable",
      "offline",
      "error",
      "suspended",
      "critical",
    ];
    return errorStatuses.includes(status.toLowerCase());
  }

  /**
   * Get status priority for sorting
   */
  static getStatusPriority(status: string): number {
    if (this.isErrorStatus(status)) return 3; // High priority
    if (this.isWarningStatus(status)) return 2; // Medium priority
    if (this.isActiveStatus(status)) return 1; // Low priority
    return 0; // Default
  }
}
