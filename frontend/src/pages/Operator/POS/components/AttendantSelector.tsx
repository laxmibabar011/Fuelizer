/**
 * Attendant Selector Component
 * Adaptive UI: Card view for ≤4 attendants, Dropdown for >4 attendants
 * Includes cashier as self-service option
 */

import React from "react";
import { UserCircleIcon, ChevronDownIcon } from "../../../../icons";
import type { AttendantOption } from "../types";

interface AttendantSelectorProps {
  attendants: AttendantOption[];
  selectedAttendant: AttendantOption | null;
  onSelect: (attendant: AttendantOption) => void;
  className?: string;
}

const AttendantSelector: React.FC<AttendantSelectorProps> = ({
  attendants,
  selectedAttendant,
  onSelect,
  className = "",
}) => {
  const totalCount = attendants.length;

  // Card View Component (≤4 attendants)
  const CardView: React.FC = () => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Attendant:
      </label>
      <div
        className={`grid gap-3 ${totalCount <= 2 ? "grid-cols-1" : "grid-cols-2"}`}
      >
        {attendants.map((attendant) => {
          const isSelected = selectedAttendant?.id === attendant.id;
          const isActive = attendant.isActive;

          return (
            <button
              key={attendant.id}
              onClick={() => isActive && onSelect(attendant)}
              disabled={!isActive}
              className={`
                p-3 rounded-lg border-2 text-left transition-all duration-200
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : isActive
                      ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                }
              `}
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold
                  ${
                    attendant.role === "cashier"
                      ? "bg-blue-500"
                      : isActive
                        ? "bg-green-500"
                        : "bg-gray-400"
                  }
                `}
                >
                  {attendant.role === "cashier" ? "👤" : "⛽"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900 truncate">
                      {attendant.name}
                    </h4>
                    {attendant.isSelf && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Self
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {attendant.role === "cashier"
                      ? "Cashier"
                      : `ID: ${attendant.employeeId || attendant.id}`}
                  </p>
                </div>

                {/* Status Indicator */}
                <div
                  className={`
                  w-3 h-3 rounded-full
                  ${isActive ? "bg-green-400" : "bg-gray-300"}
                `}
                />
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="mt-2 flex items-center text-blue-600 text-sm font-medium">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2" />
                  Selected
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Dropdown View Component (>4 attendants)
  const DropdownView: React.FC = () => (
    <div className="space-y-2">
      <label
        htmlFor="attendant-select"
        className="block text-sm font-medium text-gray-700"
      >
        Select Attendant:
      </label>
      <div className="relative">
        <select
          id="attendant-select"
          value={selectedAttendant?.id || ""}
          onChange={(e) => {
            const selected = attendants.find((a) => a.id === e.target.value);
            if (selected) onSelect(selected);
          }}
          className="
            w-full pl-4 pr-10 py-3 text-base border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            bg-white appearance-none cursor-pointer
          "
        >
          <option value="">Choose an attendant...</option>
          {attendants.map((attendant) => (
            <option
              key={attendant.id}
              value={attendant.id}
              disabled={!attendant.isActive}
            >
              {attendant.role === "cashier" ? "👤" : "⛽"} {attendant.name}
              {attendant.isSelf
                ? " (Self)"
                : attendant.employeeId
                  ? ` (ID: ${attendant.employeeId})`
                  : ""}
              {!attendant.isActive ? " - Unavailable" : ""}
            </option>
          ))}
        </select>

        {/* Custom Dropdown Arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Selected Attendant Display */}
      {selectedAttendant && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div
              className={`
              w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold
              ${selectedAttendant.role === "cashier" ? "bg-blue-500" : "bg-green-500"}
            `}
            >
              {selectedAttendant.role === "cashier" ? "👤" : "⛽"}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {selectedAttendant.name}
                {selectedAttendant.isSelf && (
                  <span className="ml-2 text-blue-600 text-sm">(Self)</span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {selectedAttendant.role === "cashier"
                  ? "Cashier"
                  : `Attendant • ID: ${selectedAttendant.employeeId || selectedAttendant.id}`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Error State
  if (attendants.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <UserCircleIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No attendants available</p>
      </div>
    );
  }

  // Adaptive Rendering
  return (
    <div className={className}>
      {totalCount <= 4 ? <CardView /> : <DropdownView />}

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          {totalCount} attendant{totalCount !== 1 ? "s" : ""} •{" "}
          {totalCount <= 4 ? "Card View" : "Dropdown View"}
        </div>
      )}
    </div>
  );
};

export default AttendantSelector;
