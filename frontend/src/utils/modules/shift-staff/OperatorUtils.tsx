import React from "react";
// import { CheckCircle, MapPin, Clock, XCircle } from "lucide-react";
import { Operator, OperatorStatus } from "../../../types/common";
import { StatusUtils } from "../../common/StatusUtils";
import { DataUtils } from "../../common/DataUtils";

/**
 * Module-specific utility class for operator-related operations
 * Shift&Staff module specific - extends common utilities
 */
export class OperatorUtils {
  /**
   * Get operator status color using common StatusUtils
   */
  static getOperatorStatusColor(
    status: OperatorStatus,
    darkMode: boolean = false
  ): string {
    return StatusUtils.getGenericStatusColor(status, darkMode);
  }

  /**
   * Get operator status icon using common StatusUtils
   */
  static getOperatorStatusIcon(status: OperatorStatus): React.ReactElement {
    return StatusUtils.getGenericStatusIcon(status);
  }

  /**
   * Get available operators count
   */
  static getAvailableOperatorsCount(operators: Operator[]): number {
    return DataUtils.countByStatus(operators, OperatorStatus.AVAILABLE);
  }

  /**
   * Get assigned operators count
   */
  static getAssignedOperatorsCount(operators: Operator[]): number {
    return DataUtils.countByStatus(operators, OperatorStatus.ASSIGNED);
  }

  /**
   * Get operators on break count
   */
  static getOnBreakOperatorsCount(operators: Operator[]): number {
    return DataUtils.countByStatus(operators, OperatorStatus.ON_BREAK);
  }

  /**
   * Get unavailable operators count
   */
  static getUnavailableOperatorsCount(operators: Operator[]): number {
    return DataUtils.countByStatus(operators, OperatorStatus.UNAVAILABLE);
  }

  /**
   * Filter operators by status
   */
  static filterOperatorsByStatus(
    operators: Operator[],
    status: OperatorStatus
  ): Operator[] {
    return DataUtils.filterByStatus(operators, status);
  }

  /**
   * Calculate average performance score for operators
   */
  static calculateAveragePerformance(operators: Operator[]): number {
    if (operators.length === 0) return 0;

    // Mock performance calculation based on status and join date
    const totalScore = operators.reduce((sum, operator) => {
      let score = 4.0; // Base score

      // Adjust based on status
      if (operator.status === OperatorStatus.AVAILABLE) score += 0.5;
      if (operator.status === OperatorStatus.ASSIGNED) score += 0.3;
      if (operator.status === OperatorStatus.ON_BREAK) score -= 0.2;
      if (operator.status === OperatorStatus.UNAVAILABLE) score -= 0.5;

      // Adjust based on experience (join date)
      const experienceYears = DataUtils.calculateExperienceYears(
        operator.joinDate
      );
      if (experienceYears > 2) score += 0.3;
      else if (experienceYears > 1) score += 0.1;

      return sum + Math.min(5, Math.max(1, score));
    }, 0);

    return Math.round((totalScore / operators.length) * 10) / 10;
  }

  /**
   * Get operators by shift
   */
  static getOperatorsByShift(
    operators: Operator[],
    shiftName: string
  ): Operator[] {
    return operators.filter((operator) => operator.shift === shiftName);
  }

  /**
   * Get operators with current assignments
   */
  static getOperatorsWithAssignments(operators: Operator[]): Operator[] {
    return operators.filter((operator) => operator.currentAssignment);
  }

  /**
   * Get operators without assignments
   */
  static getOperatorsWithoutAssignments(operators: Operator[]): Operator[] {
    return operators.filter((operator) => !operator.currentAssignment);
  }

  /**
   * Sort operators by performance (mock calculation)
   */
  static sortOperatorsByPerformance(operators: Operator[]): Operator[] {
    return [...operators].sort((a, b) => {
      const scoreA = this.calculateOperatorPerformanceScore(a);
      const scoreB = this.calculateOperatorPerformanceScore(b);
      return scoreB - scoreA; // Descending order
    });
  }

  /**
   * Calculate individual operator performance score
   */
  private static calculateOperatorPerformanceScore(operator: Operator): number {
    let score = 4.0; // Base score

    // Adjust based on status
    if (operator.status === OperatorStatus.AVAILABLE) score += 0.5;
    if (operator.status === OperatorStatus.ASSIGNED) score += 0.3;
    if (operator.status === OperatorStatus.ON_BREAK) score -= 0.2;
    if (operator.status === OperatorStatus.UNAVAILABLE) score -= 0.5;

    // Adjust based on experience
    const experienceYears = DataUtils.calculateExperienceYears(
      operator.joinDate
    );
    if (experienceYears > 2) score += 0.3;
    else if (experienceYears > 1) score += 0.1;

    return Math.min(5, Math.max(1, score));
  }

  /**
   * Validate operator data
   */
  static validateOperator(operator: Partial<Operator>): string[] {
    const errors: string[] = [];

    if (!operator.name || operator.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    }

    if (!operator.email || !DataUtils.isValidEmail(operator.email)) {
      errors.push("Valid email is required");
    }

    if (!operator.phone || !DataUtils.isValidPhone(operator.phone)) {
      errors.push("Valid phone number is required");
    }

    if (!operator.shift) {
      errors.push("Shift assignment is required");
    }

    return errors;
  }

  /**
   * Format operator display name
   */
  static formatOperatorName(operator: Operator): string {
    return `${operator.name} (${operator.id})`;
  }

  /**
   * Get operator assignment summary
   */
  static getAssignmentSummary(operator: Operator): string {
    if (!operator.currentAssignment) {
      return "No current assignment";
    }

    return `${operator.currentAssignment.type} - ${operator.currentAssignment.location}`;
  }
}
