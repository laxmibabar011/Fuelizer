import React from "react";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Shift, ShiftStatus } from "../../../types/common";
import { StatusUtils } from "../../common/StatusUtils";
import { DataUtils } from "../../common/DataUtils";

/**
 * Module-specific utility class for shift-related operations
 * Shift&Staff module specific - extends common utilities
 */
export class ShiftUtils {
  /**
   * Get shift status color using common StatusUtils
   */
  static getShiftStatusColor(
    status: ShiftStatus,
    darkMode: boolean = false
  ): string {
    return StatusUtils.getGenericStatusColor(status, darkMode);
  }

  /**
   * Get shift status icon using common StatusUtils
   */
  static getShiftStatusIcon(status: ShiftStatus): React.ReactElement {
    return StatusUtils.getGenericStatusIcon(status);
  }

  /**
   * Get active shifts count
   */
  static getActiveShiftsCount(shifts: Shift[]): number {
    return DataUtils.countByStatus(shifts, ShiftStatus.ACTIVE);
  }

  /**
   * Get completed shifts count
   */
  static getCompletedShiftsCount(shifts: Shift[]): number {
    return DataUtils.countByStatus(shifts, ShiftStatus.COMPLETED);
  }

  /**
   * Get not started shifts count
   */
  static getNotStartedShiftsCount(shifts: Shift[]): number {
    return DataUtils.countByStatus(shifts, ShiftStatus.NOT_STARTED);
  }

  /**
   * Filter shifts by status
   */
  static filterShiftsByStatus(shifts: Shift[], status: ShiftStatus): Shift[] {
    return DataUtils.filterByStatus(shifts, status);
  }

  /**
   * Get shifts with operator capacity issues
   */
  static getShiftsWithCapacityIssues(shifts: Shift[]): Shift[] {
    return shifts.filter((shift) => shift.operatorCount >= shift.maxOperators);
  }

  /**
   * Get shifts with low operator count
   */
  static getShiftsWithLowOperators(shifts: Shift[]): Shift[] {
    return shifts.filter((shift) => shift.operatorCount < 2);
  }

  /**
   * Calculate shift utilization percentage
   */
  static calculateShiftUtilization(shift: Shift): number {
    return DataUtils.calculatePercentage(
      shift.operatorCount,
      shift.maxOperators
    );
  }

  /**
   * Get shift utilization color
   */
  static getShiftUtilizationColor(utilization: number): string {
    if (utilization >= 80) return "text-red-600";
    if (utilization >= 60) return "text-yellow-600";
    return "text-green-600";
  }

  /**
   * Sort shifts by start time
   */
  static sortShiftsByTime(shifts: Shift[]): Shift[] {
    return [...shifts].sort((a, b) => {
      const timeA = this.extractStartTime(a.timeRange);
      const timeB = this.extractStartTime(b.timeRange);
      return timeA - timeB;
    });
  }

  /**
   * Extract start time from time range string
   */
  private static extractStartTime(timeRange: string): number {
    const startTime = timeRange.split(" - ")[0];
    const [time, period] = startTime.split(" ");
    const [hours, minutes] = time.split(":").map(Number);

    let hour24 = hours;
    if (period === "PM" && hours !== 12) hour24 += 12;
    if (period === "AM" && hours === 12) hour24 = 0;

    return hour24 * 60 + minutes;
  }

  /**
   * Get current shift based on time
   */
  static getCurrentShift(shifts: Shift[]): Shift | null {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    return (
      shifts.find((shift) => {
        const startTime = this.extractStartTime(shift.timeRange);
        const endTime = this.extractEndTime(shift.timeRange);

        // Handle overnight shifts
        if (endTime < startTime) {
          return currentTime >= startTime || currentTime <= endTime;
        }

        return currentTime >= startTime && currentTime <= endTime;
      }) || null
    );
  }

  /**
   * Extract end time from time range string
   */
  private static extractEndTime(timeRange: string): number {
    const endTime = timeRange.split(" - ")[1];
    const [time, period] = endTime.split(" ");
    const [hours, minutes] = time.split(":").map(Number);

    let hour24 = hours;
    if (period === "PM" && hours !== 12) hour24 += 12;
    if (period === "AM" && hours === 12) hour24 = 0;

    return hour24 * 60 + minutes;
  }

  /**
   * Get next shift
   */
  static getNextShift(shifts: Shift[]): Shift | null {
    const sortedShifts = this.sortShiftsByTime(shifts);
    const currentShift = this.getCurrentShift(shifts);

    if (!currentShift) return sortedShifts[0] || null;

    const currentIndex = sortedShifts.findIndex(
      (shift) => shift.id === currentShift.id
    );
    const nextIndex = (currentIndex + 1) % sortedShifts.length;

    return sortedShifts[nextIndex] || null;
  }

  /**
   * Validate shift data
   */
  static validateShift(shift: Partial<Shift>): string[] {
    const errors: string[] = [];

    if (!shift.name || shift.name.trim().length < 2) {
      errors.push("Shift name must be at least 2 characters long");
    }

    if (!shift.timeRange || !shift.timeRange.includes(" - ")) {
      errors.push("Valid time range is required (e.g., '6:00 AM - 2:00 PM')");
    }

    if (shift.maxOperators && shift.maxOperators < 1) {
      errors.push("Maximum operators must be at least 1");
    }

    if (shift.operatorCount && shift.operatorCount < 0) {
      errors.push("Operator count cannot be negative");
    }

    if (
      shift.maxOperators &&
      shift.operatorCount &&
      shift.operatorCount > shift.maxOperators
    ) {
      errors.push("Operator count cannot exceed maximum operators");
    }

    return errors;
  }

  /**
   * Format shift display name
   */
  static formatShiftName(shift: Shift): string {
    return `${shift.name} (${shift.timeRange})`;
  }

  /**
   * Get shift summary
   */
  static getShiftSummary(shift: Shift): string {
    return `${shift.operatorCount}/${shift.maxOperators} operators - ${shift.status}`;
  }

  /**
   * Check if shift is currently active
   */
  static isShiftActive(shift: Shift): boolean {
    return shift.status === ShiftStatus.ACTIVE;
  }

  /**
   * Check if shift is completed
   */
  static isShiftCompleted(shift: Shift): boolean {
    return shift.status === ShiftStatus.COMPLETED;
  }

  /**
   * Check if shift is not started
   */
  static isShiftNotStarted(shift: Shift): boolean {
    return shift.status === ShiftStatus.NOT_STARTED;
  }
}
