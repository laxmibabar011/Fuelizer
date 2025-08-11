import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { BaseEntity } from "../../types/common";
import { StatusUtils } from "../../utils/common/StatusUtils";

/**
 * Base interface for entity card props
 * Demonstrates OOP principles with interfaces
 */
export interface BaseEntityCardProps<T extends BaseEntity> {
  entity: T;
  title?: string;
  subtitle?: string;
  status?: string;
  statusType?: "operator" | "shift" | "tank" | "product" | "generic";
  darkMode?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Base component for entity cards
 * Demonstrates OOP principles with inheritance and polymorphism
 */
export abstract class BaseEntityCard<
  T extends BaseEntity,
> extends React.Component<BaseEntityCardProps<T>> {
  /**
   * Abstract method that must be implemented by subclasses
   * Demonstrates polymorphism
   */
  protected abstract renderEntityContent(): React.ReactNode;

  /**
   * Template method pattern - defines the structure
   */
  protected renderCardHeader(): React.ReactNode {
    const {
      entity,
      title,
      subtitle,
      status,
      statusType = "generic",
      darkMode = false,
    } = this.props;

    return (
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">
              {title || entity.name}
            </CardTitle>
            {subtitle && (
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {subtitle}
              </div>
            )}
          </div>
          {status && (
            <div className="flex items-center space-x-1 flex-shrink-0">
              <Badge
                className={StatusUtils.getGenericStatusColor(status, darkMode)}
              >
                {StatusUtils.formatStatusText(status)}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
    );
  }

  /**
   * Template method pattern - defines the structure
   */
  protected renderCardContent(): React.ReactNode {
    const { children } = this.props;

    return (
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          {this.renderEntityContent()}
          {children}
        </div>
      </CardContent>
    );
  }

  /**
   * Template method pattern - main render method
   */
  public render(): React.ReactNode {
    const { onClick, className = "" } = this.props;

    return (
      <div
        className={`h-full flex flex-col hover:shadow-lg transition-shadow ${onClick ? "cursor-pointer" : ""} ${className}`}
        onClick={onClick}
      >
        <Card className="h-full flex flex-col">
          {this.renderCardHeader()}
          {this.renderCardContent()}
        </Card>
      </div>
    );
  }
}

/**
 * Concrete implementation for Operator cards
 * Demonstrates inheritance and polymorphism
 */
export class OperatorCard extends BaseEntityCard<any> {
  protected renderEntityContent(): React.ReactNode {
    const { entity, darkMode = false } = this.props;

    return (
      <>
        {/* Current Assignment */}
        {entity.currentAssignment ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Current Assignment
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-400">
              {entity.currentAssignment.location} • Since{" "}
              {entity.currentAssignment.startTime}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              No Current Assignment
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              Available for assignment
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="truncate">{entity.phone}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="truncate">{entity.email}</span>
          </div>
        </div>
      </>
    );
  }

  /**
   * Override the card header to include profile icon
   */
  protected renderCardHeader(): React.ReactNode {
    const {
      entity,
      title,
      subtitle,
      status,
      statusType = "generic",
      darkMode = false,
    } = this.props;

    return (
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Profile Avatar */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">
                {title || entity.name}
              </CardTitle>
              {subtitle && (
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          {status && (
            <div className="flex items-center space-x-1 flex-shrink-0">
              <Badge
                className={StatusUtils.getGenericStatusColor(status, darkMode)}
              >
                {StatusUtils.formatStatusText(status)}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
    );
  }
}

/**
 * Concrete implementation for Tank cards
 * Demonstrates inheritance and polymorphism
 */
export class TankCard extends BaseEntityCard<any> {
  protected renderEntityContent(): React.ReactNode {
    const { entity } = this.props;

    const stockPercentage = entity.currentStock
      ? Math.round((entity.currentStock / entity.capacity) * 100)
      : 0;

    return (
      <>
        {/* Stock Information */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Stock Level
            </span>
            <span className="font-medium">
              {entity.currentStock ? `${stockPercentage}%` : "N/A"}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${stockPercentage}%` }}
            />
          </div>
        </div>

        {/* Tank Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
            <span>{entity.capacity.toLocaleString()} L</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Current:</span>
            <span>
              {entity.currentStock
                ? `${entity.currentStock.toLocaleString()} L`
                : "N/A"}
            </span>
          </div>
          {entity.temperature && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Temperature:
              </span>
              <span>{entity.temperature}°C</span>
            </div>
          )}
        </div>
      </>
    );
  }
}

/**
 * Concrete implementation for Shift cards
 * Demonstrates inheritance and polymorphism
 */
export class ShiftCard extends BaseEntityCard<any> {
  protected renderEntityContent(): React.ReactNode {
    const { entity } = this.props;

    return (
      <>
        {/* Shift Details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Time Range</span>
            <span className="font-medium">{entity.timeRange}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Operators</span>
            <span className="font-medium">
              {entity.operatorCount}/{entity.maxOperators}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{
              width: `${(entity.operatorCount / entity.maxOperators) * 100}%`,
            }}
          />
        </div>

        {/* Handover Notes */}
        {entity.handoverNotes && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
              Handover Notes:
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-400">
              {entity.handoverNotes}
            </div>
          </div>
        )}
      </>
    );
  }
}

/**
 * Factory class for creating entity cards
 * Demonstrates Factory pattern
 */
export class EntityCardFactory {
  /**
   * Factory method to create appropriate card based on entity type
   */
  static createCard<T extends BaseEntity>(
    entityType: "operator" | "tank" | "shift",
    props: BaseEntityCardProps<T>
  ): React.ReactElement {
    switch (entityType) {
      case "operator":
        return React.createElement(OperatorCard, props);
      case "tank":
        return React.createElement(TankCard, props);
      case "shift":
        return React.createElement(ShiftCard, props);
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }
}
