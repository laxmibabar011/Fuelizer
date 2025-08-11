import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import Avatar from "../../../components/ui/avatar/Avatar";
import { Modal } from "../../../components/ui/modal";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Plus,
  Users,
  Calendar,
  Award,
  Edit,
} from "lucide-react";

// Import the new OOP and DRY utilities
import {
  Operator,
  OperatorStatus,
  AssignmentType,
  Pump,
} from "../../../types/common";
import { StatusUtils } from "../../../utils/common/StatusUtils";
import { DataUtils } from "../../../utils/common/DataUtils";
import { MockData } from "../../../utils/common/MockData";
import { OperatorUtils } from "../../../utils/modules/shift-staff/OperatorUtils";
import {
  EntityCardFactory,
  BaseEntityCardProps,
} from "../../../components/base/BaseEntityCard";

/**
 * Operator Management Component
 * Demonstrates OOP and DRY principles
 */
const OperatorManagement: React.FC = () => {
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(
    null
  );
  const [draggedOperator, setDraggedOperator] = useState<string | null>(null);
  const [showPumpAssignmentModal, setShowPumpAssignmentModal] = useState(false);
  const [selectedPump, setSelectedPump] = useState<Pump | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShiftPumpModal, setShowShiftPumpModal] = useState(false);

  // Use centralized data and utilities
  const operators = MockData.operators;
  const pumps = MockData.pumps;

  // Use utility methods instead of repeated calculations
  const availableOperators =
    OperatorUtils.getAvailableOperatorsCount(operators);
  const assignedOperators = OperatorUtils.getAssignedOperatorsCount(operators);
  const averagePerformance =
    OperatorUtils.calculateAveragePerformance(operators);

  /**
   * Handle operator assignment to pump
   * Demonstrates encapsulation
   */
  const handleOperatorAssignment = (operatorId: string, pumpName: string) => {
    console.log(`Assigned operator ${operatorId} to ${pumpName}`);
    // In a real application, this would update the state and make an API call
    setShowPumpAssignmentModal(false);
    setSelectedPump(null);
  };

  /**
   * Handle pump click for assignment
   */
  const handlePumpClick = (pump: Pump) => {
    if (pump.status === "available") {
      setSelectedPump(pump);
      setShowPumpAssignmentModal(true);
    }
  };

  /**
   * Handle edit operator details
   */
  const handleEditOperatorDetails = () => {
    setShowEditModal(true);
  };

  /**
   * Handle edit shift and pump assignment
   */
  const handleEditShiftPump = () => {
    setShowShiftPumpModal(true);
  };

  /**
   * Render operator card using the factory pattern
   */
  const renderOperatorCard = (operator: Operator) => {
    const cardProps: BaseEntityCardProps<Operator> = {
      entity: operator,
      title: operator.name,
      subtitle: `${operator.id} • ${operator.shift} Shift`,
      status: operator.status,
      statusType: "operator",
      onClick: () => setSelectedOperator(operator),
      className: "hover:shadow-lg transition-shadow cursor-move relative",
    };

    return (
      <div
        key={operator.id}
        draggable
        onDragStart={() => setDraggedOperator(operator.id)}
        onDragEnd={() => setDraggedOperator(null)}
        className="relative"
      >
        {EntityCardFactory.createCard("operator", cardProps)}

        {/* Edit Shift & Pump Button */}
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOperator(operator);
              setShowShiftPumpModal(true);
            }}
            title="Edit Shift & Pump Assignment"
          >
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Render pump assignment interface
   */
  const renderPumpAssignment = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Pump Assignment Interface</span>
          </CardTitle>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Click on available pumps to assign operators, or drag and drop
            operators to pumps
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {pumps.map((pump) => (
              <div
                key={pump.id}
                className={`p-4 border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer ${
                  pump.status === "available"
                    ? "border-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40"
                    : pump.status === "assigned"
                      ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 bg-gray-50 dark:bg-gray-900/20"
                }`}
                onClick={() => handlePumpClick(pump)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedOperator && pump.status === "available") {
                    handleOperatorAssignment(draggedOperator, pump.name);
                  }
                }}
              >
                <div className="font-medium text-sm">{pump.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {pump.status}
                </div>
                {pump.status === "assigned" && pump.assignedOperator && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {
                      MockData.getOperatorById(
                        pump.assignedOperator
                      )?.name.split(" ")[0]
                    }
                  </div>
                )}
                {pump.status === "available" && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Click to assign
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  /**
   * Render operator details modal
   */
  const renderOperatorModal = () => {
    if (!selectedOperator) return null;

    return (
      <Modal
        isOpen={!!selectedOperator}
        onClose={() => setSelectedOperator(null)}
        className="max-w-2xl mx-4"
      >
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <Avatar
              src={selectedOperator.photo || ""}
              alt={selectedOperator.name}
              size="xlarge"
              status={
                selectedOperator.status === OperatorStatus.AVAILABLE
                  ? "online"
                  : selectedOperator.status === OperatorStatus.ASSIGNED
                    ? "busy"
                    : "offline"
              }
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedOperator.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedOperator.id} • {selectedOperator.shift} Shift
              </p>
              <div className="flex items-center space-x-2 mt-2">
                {OperatorUtils.getOperatorStatusIcon(selectedOperator.status)}
                <Badge
                  className={OperatorUtils.getOperatorStatusColor(
                    selectedOperator.status,
                    true
                  )}
                >
                  {selectedOperator.status
                    .replace("-", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedOperator.phone}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedOperator.email}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Joined: {DataUtils.formatDate(selectedOperator.joinDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Assignment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Assignment Details</span>
              </h3>
              {selectedOperator.currentAssignment ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                    Current Assignment
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Type:
                      </span>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {selectedOperator.currentAssignment.type}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Location:
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {selectedOperator.currentAssignment.location}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Since:
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {DataUtils.formatTime(
                          selectedOperator.currentAssignment.startTime
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    No Current Assignment
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    This operator is available for new assignments.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Performance & Certifications */}
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Performance & Certifications</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {averagePerformance}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Performance Rating
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {DataUtils.calculateExperienceYears(
                    selectedOperator.joinDate
                  )}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Years Experience
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  3
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  Active Certifications
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => setSelectedOperator(null)}>
              Close
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              onClick={() => {
                setShowEditModal(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
            <Button
              className="bg-gray-100 text-blue-700 hover:bg-blue-100"
              onClick={() => {
                setShowShiftPumpModal(true);
                setSelectedOperator(selectedOperator);
              }}
            >
              <Clock className="h-4 w-4 mr-2" />
              Edit Shift & Pump
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fuel Operator Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage operator assignments, certifications, and performance
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">Bulk Assignment</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Add New Operator
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {availableOperators}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Available Operators
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {assignedOperators}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Currently Assigned
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              3
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Certifications Expiring
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {averagePerformance}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Avg Performance Score
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operator Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {operators.map(renderOperatorCard)}
      </div>

      {/* Pump Assignment Interface */}
      {renderPumpAssignment()}

      {/* Operator Details Modal */}
      {renderOperatorModal()}

      {/* Edit Operator Details Modal */}
      {showEditModal && selectedOperator && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
          }}
          className="max-w-md mx-4"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Edit Operator Details: {selectedOperator.name}
            </h2>

            <div className="space-y-4">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedOperator.name}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={selectedOperator.email}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      defaultValue={selectedOperator.phone}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                }}
              >
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Shift & Pump Assignment Modal */}
      {showShiftPumpModal && selectedOperator && (
        <Modal
          isOpen={showShiftPumpModal}
          onClose={() => {
            setShowShiftPumpModal(false);
          }}
          className="max-w-2xl mx-4"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Manage Shift & Pump Assignment: {selectedOperator.name}
            </h2>

            <div className="space-y-6">
              {/* Shift & Pump Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Shift & Pump Management</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shift Assignment */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Shift Assignment
                    </label>
                    <select
                      defaultValue={selectedOperator.shift}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="Morning">
                        Morning Shift (6:00 AM - 2:00 PM)
                      </option>
                      <option value="Afternoon">
                        Afternoon Shift (2:00 PM - 10:00 PM)
                      </option>
                      <option value="Night">
                        Night Shift (10:00 PM - 6:00 AM)
                      </option>
                    </select>

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Current shift: {selectedOperator.shift} Shift
                    </div>
                  </div>

                  {/* Current Assignment Status */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Assignment
                    </label>
                    {selectedOperator.currentAssignment ? (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          {selectedOperator.currentAssignment.location}
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-400">
                          Since: {selectedOperator.currentAssignment.startTime}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          No Current Assignment
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Available for assignment
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pump Assignment */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Pump Assignment</span>
                </h3>

                <div className="space-y-4">
                  {/* Quick Assignment Info */}
                  <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quick Assignment Guide:
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Available Pumps</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Assigned Pumps</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        <span>Maintenance</span>
                      </div>
                    </div>
                  </div>

                  {/* Pump Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {pumps.map((pump) => (
                      <div
                        key={pump.id}
                        className={`p-3 border-2 rounded-lg text-center cursor-pointer transition-colors ${
                          pump.status === "available"
                            ? "border-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40"
                            : pump.status === "assigned"
                              ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-300 bg-gray-50 dark:bg-gray-900/20"
                        } ${
                          selectedOperator.currentAssignment?.location ===
                          pump.name
                            ? "ring-2 ring-blue-500"
                            : ""
                        }`}
                        onClick={() => {
                          if (
                            pump.status === "available" ||
                            selectedOperator.currentAssignment?.location ===
                              pump.name
                          ) {
                            handleOperatorAssignment(
                              selectedOperator.id,
                              pump.name
                            );
                          }
                        }}
                      >
                        <div className="font-medium text-sm">{pump.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                          {pump.status}
                        </div>
                        {pump.status === "assigned" &&
                          pump.assignedOperator && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              {
                                MockData.getOperatorById(
                                  pump.assignedOperator
                                )?.name.split(" ")[0]
                              }
                            </div>
                          )}
                        {selectedOperator.currentAssignment?.location ===
                          pump.name && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                            Current Assignment
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedOperator.currentAssignment && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Current Assignment:{" "}
                        {selectedOperator.currentAssignment.location}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">
                        Since: {selectedOperator.currentAssignment.startTime}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowShiftPumpModal(false);
                }}
              >
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Pump Assignment Modal */}
      {showPumpAssignmentModal && selectedPump && (
        <Modal
          isOpen={showPumpAssignmentModal}
          onClose={() => {
            setShowPumpAssignmentModal(false);
            setSelectedPump(null);
          }}
          className="max-w-md mx-4"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Assign Operator to {selectedPump.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Select an available operator to assign to this pump
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {operators
                .filter(
                  (operator) => operator.status === OperatorStatus.AVAILABLE
                )
                .map((operator) => (
                  <div
                    key={operator.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() =>
                      handleOperatorAssignment(operator.id, selectedPump.name)
                    }
                  >
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
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
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {operator.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {operator.id} • {operator.shift} Shift
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Available
                    </Badge>
                  </div>
                ))}
            </div>

            {operators.filter(
              (operator) => operator.status === OperatorStatus.AVAILABLE
            ).length === 0 && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                No available operators at the moment
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPumpAssignmentModal(false);
                  setSelectedPump(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OperatorManagement;
