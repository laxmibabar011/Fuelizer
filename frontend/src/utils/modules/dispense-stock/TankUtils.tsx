import React from "react";
import { Tank, TankStatus } from "../../../types/common";
import { StatusUtils } from "../../common/StatusUtils";
import { DataUtils } from "../../common/DataUtils";

/**
 * Module-specific utility class for tank-related operations
 * Dispense&Stock module specific - extends common utilities
 */
export class TankUtils {
  /**
   * Get tank status color using common StatusUtils
   */
  static getTankStatusColor(
    status: TankStatus,
    darkMode: boolean = false
  ): string {
    return StatusUtils.getGenericStatusColor(status, darkMode);
  }

  /**
   * Get tank status icon using common StatusUtils
   */
  static getTankStatusIcon(status: TankStatus): React.ReactElement {
    return StatusUtils.getGenericStatusIcon(status);
  }

  /**
   * Get normal tanks count
   */
  static getNormalTanksCount(tanks: Tank[]): number {
    return DataUtils.countByStatus(tanks, TankStatus.NORMAL);
  }

  /**
   * Get low stock tanks count
   */
  static getLowStockTanksCount(tanks: Tank[]): number {
    return DataUtils.countByStatus(tanks, TankStatus.LOW);
  }

  /**
   * Get critical tanks count
   */
  static getCriticalTanksCount(tanks: Tank[]): number {
    return DataUtils.countByStatus(tanks, TankStatus.CRITICAL);
  }

  /**
   * Get maintenance tanks count
   */
  static getMaintenanceTanksCount(tanks: Tank[]): number {
    return DataUtils.countByStatus(tanks, TankStatus.MAINTENANCE);
  }

  /**
   * Filter tanks by status
   */
  static filterTanksByStatus(tanks: Tank[], status: TankStatus): Tank[] {
    return DataUtils.filterByStatus(tanks, status);
  }

  /**
   * Get stock percentage for tank
   */
  static getStockPercentage(tank: Tank): number {
    return DataUtils.calculatePercentage(tank.currentStock, tank.capacity);
  }

  /**
   * Get stock color based on percentage
   */
  static getStockColor(percentage: number): string {
    return DataUtils.getPercentageColor(percentage);
  }

  /**
   * Calculate total capacity
   */
  static calculateTotalCapacity(tanks: Tank[]): number {
    return DataUtils.calculateTotal(tanks.map((tank) => tank.capacity));
  }

  /**
   * Calculate total current stock
   */
  static calculateTotalCurrentStock(tanks: Tank[]): number {
    return DataUtils.calculateTotal(tanks.map((tank) => tank.currentStock));
  }

  /**
   * Calculate overall stock percentage
   */
  static calculateOverallStockPercentage(tanks: Tank[]): number {
    const totalCapacity = this.calculateTotalCapacity(tanks);
    const totalCurrentStock = this.calculateTotalCurrentStock(tanks);
    return DataUtils.calculatePercentage(totalCurrentStock, totalCapacity);
  }

  /**
   * Get tanks requiring refill
   */
  static getTanksRequiringRefill(tanks: Tank[]): Tank[] {
    return tanks.filter((tank) => {
      const stockPercentage = this.getStockPercentage(tank);
      return stockPercentage <= 20; // 20% or less
    });
  }

  /**
   * Get tanks with quality issues
   */
  static getTanksWithQualityIssues(tanks: Tank[]): Tank[] {
    return tanks.filter((tank) => {
      const qualityCheck = tank.qualityCheck;
      return (
        !qualityCheck.density ||
        !qualityCheck.contamination ||
        !qualityCheck.waterContent
      );
    });
  }

  /**
   * Get tanks with high water level
   */
  static getTanksWithHighWaterLevel(tanks: Tank[]): Tank[] {
    return tanks.filter((tank) => tank.waterLevel && tank.waterLevel > 5);
  }

  /**
   * Get tanks with temperature issues
   */
  static getTanksWithTemperatureIssues(tanks: Tank[]): Tank[] {
    return tanks.filter((tank) => {
      if (!tank.temperature) return false;
      return tank.temperature > 35 || tank.temperature < 15;
    });
  }

  /**
   * Calculate tank variance
   */
  static calculateTankVariance(tank: Tank): number {
    if (tank.currentStock === null) return 0;
    return DataUtils.calculateVariance(tank.currentStock, tank.previousStock);
  }

  /**
   * Get variance color
   */
  static getVarianceColor(variance: number): string {
    if (variance > 0) return "text-green-600";
    if (variance < 0) return "text-red-600";
    return "text-gray-600";
  }

  /**
   * Sort tanks by stock percentage
   */
  static sortTanksByStockPercentage(tanks: Tank[]): Tank[] {
    return [...tanks].sort((a, b) => {
      const percentageA = this.getStockPercentage(a);
      const percentageB = this.getStockPercentage(b);
      return percentageA - percentageB; // Ascending order (lowest first)
    });
  }

  /**
   * Sort tanks by status priority
   */
  static sortTanksByStatusPriority(tanks: Tank[]): Tank[] {
    return [...tanks].sort((a, b) => {
      const priorityA = StatusUtils.getStatusPriority(a.status);
      const priorityB = StatusUtils.getStatusPriority(b.status);
      return priorityB - priorityA; // Descending order (highest priority first)
    });
  }

  /**
   * Get tanks by fuel type
   */
  static getTanksByFuelType(tanks: Tank[], fuelType: string): Tank[] {
    return tanks.filter((tank) =>
      tank.fuelType.toLowerCase().includes(fuelType.toLowerCase())
    );
  }

  /**
   * Validate tank data
   */
  static validateTank(tank: Partial<Tank>): string[] {
    const errors: string[] = [];

    if (!tank.name || tank.name.trim().length < 2) {
      errors.push("Tank name must be at least 2 characters long");
    }

    if (!tank.fuelType || tank.fuelType.trim().length < 2) {
      errors.push("Fuel type is required");
    }

    if (tank.capacity && tank.capacity <= 0) {
      errors.push("Capacity must be greater than 0");
    }

    if (tank.currentStock && tank.currentStock < 0) {
      errors.push("Current stock cannot be negative");
    }

    if (
      tank.currentStock &&
      tank.capacity &&
      tank.currentStock > tank.capacity
    ) {
      errors.push("Current stock cannot exceed capacity");
    }

    if (tank.waterLevel && (tank.waterLevel < 0 || tank.waterLevel > 100)) {
      errors.push("Water level must be between 0 and 100");
    }

    return errors;
  }

  /**
   * Format tank display name
   */
  static formatTankName(tank: Tank): string {
    return `${tank.name} (${tank.fuelType})`;
  }

  /**
   * Get tank summary
   */
  static getTankSummary(tank: Tank): string {
    const stockPercentage = this.getStockPercentage(tank);
    return `${stockPercentage}% full - ${tank.status}`;
  }

  /**
   * Check if tank needs refill
   */
  static needsRefill(tank: Tank): boolean {
    const stockPercentage = this.getStockPercentage(tank);
    return stockPercentage <= 20;
  }

  /**
   * Check if tank is critical
   */
  static isCritical(tank: Tank): boolean {
    const stockPercentage = this.getStockPercentage(tank);
    return stockPercentage <= 10;
  }

  /**
   * Check if tank has quality issues
   */
  static hasQualityIssues(tank: Tank): boolean {
    const qualityCheck = tank.qualityCheck;
    return (
      !qualityCheck.density ||
      !qualityCheck.contamination ||
      !qualityCheck.waterContent
    );
  }
}
