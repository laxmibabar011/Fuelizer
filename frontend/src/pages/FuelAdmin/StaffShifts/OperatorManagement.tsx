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
  Booth,
  Nozzle,
} from "../../../types/common";
import { StatusUtils } from "../../../utils/common/StatusUtils";
import { DataUtils } from "../../../utils/common/DataUtils";
import staffshiftService from "../../../services/staffshiftService";
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
  const [showBoothAssignmentModal, setShowBoothAssignmentModal] =
    useState(false);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShiftBoothModal, setShowShiftBoothModal] = useState(false);
  // NEW: deletion state
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  // NEW: duty update state
  const [selectedDuty, setSelectedDuty] = useState<string>("attendant");
  const [savingDuty, setSavingDuty] = useState<boolean>(false);

  // NEW: operators state loaded from API
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState<boolean>(false);

  const fetchOperators = async (includeInactive: boolean) => {
    try {
      setLoading(true);
      const res = await staffshiftService.listOperators({ includeInactive });
      const apiOperators = (res.data?.data || []) as any[];
      const mapped: Operator[] = apiOperators.map((op: any) => ({
        id: String(op.id || op.operator_id),
        name: op.UserDetails?.full_name || op.User?.email || op.operator_id,
        email: op.User?.email || "",
        phone: op.UserDetails?.phone || "",
        status: (op.status as OperatorStatus) || OperatorStatus.AVAILABLE,
        shift: "",
        joinDate: op.join_date
          ? new Date(op.join_date).toISOString()
          : new Date().toISOString(),
        // mark archived in a custom field for UI badge
        // @ts-ignore
        _archived: op.is_active === false,
        // duty from backend
        // @ts-ignore
        duty: op.duty,
      }));
      setOperators(mapped);
      setLoadError(null);
    } catch (e: any) {
      setLoadError(
        e?.response?.data?.error || e?.message || "Failed to load operators"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators(showArchived);
  }, [showArchived]);

  // Initialize duty when opening edit modal/operator changes
  useEffect(() => {
    if (showShiftBoothModal && selectedOperator) {
      setSelectedDuty(
        ((selectedOperator as any).duty as string) || "attendant"
      );
    }
  }, [showShiftBoothModal, selectedOperator]);

  // Placeholder booths until real API wired
  const booths: Booth[] = [];

  // Use utility methods instead of repeated calculations
  const availableOperators = OperatorUtils.getAvailableOperatorsCount(
    operators as any
  );
  const assignedOperators = OperatorUtils.getAssignedOperatorsCount(
    operators as any
  );
  const averagePerformance = OperatorUtils.calculateAveragePerformance(
    operators as any
  );

  /**
   * Handle operator assignment to booth/nozzle
   * Demonstrates encapsulation
   */
  const handleOperatorAssignment = (
    operatorId: string,
    boothName: string,
    nozzleId?: string
  ) => {
    console.log(
      `Assigned operator ${operatorId} to ${boothName}${nozzleId ? ` - Nozzle ${nozzleId}` : ""}`
    );
    setShowBoothAssignmentModal(false);
    setSelectedBooth(null);
  };

  /**
   * Handle booth click for assignment
   */
  const handleBoothClick = (booth: Booth) => {
    if (booth.status === "online") {
      setSelectedBooth(booth);
      setShowBoothAssignmentModal(true);
    }
  };

  /**
   * Handle edit operator details
   */
  const handleEditOperatorDetails = () => {
    setShowEditModal(true);
  };

  /**
   * Handle edit shift and booth assignment
   */
  const handleEditShiftBooth = () => {
    setShowShiftBoothModal(true);
  };

  // Handlers
  const handleDeleteOperator = async () => {
    if (!selectedOperator) return;
    if (!window.confirm(`Delete operator "${selectedOperator.name}"?`)) return;
    try {
      setDeleting(true);
      setActionError(null);
      const pk = Number(selectedOperator.id);
      if (Number.isNaN(pk)) {
        throw new Error("Invalid operator id");
      }
      await staffshiftService.deleteOperator(pk);
      setOperators((prev) => prev.filter((op) => op.id !== String(pk)));
      setSelectedOperator(null);
    } catch (e: any) {
      setActionError(
        e?.response?.data?.error || e?.message || "Failed to delete operator"
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleRestoreOperator = async () => {
    if (!selectedOperator) return;
    try {
      setRestoring(true);
      setActionError(null);
      const pk = Number(selectedOperator.id);
      if (Number.isNaN(pk)) throw new Error("Invalid operator id");
      await staffshiftService.updateOperator(pk, { is_active: true });
      await fetchOperators(showArchived);
      setSelectedOperator(null);
    } catch (e: any) {
      setActionError(
        e?.response?.data?.error || e?.message || "Failed to restore operator"
      );
    } finally {
      setRestoring(false);
    }
  };

  const handleSaveDuty = async () => {
    if (!selectedOperator) return;
    try {
      setSavingDuty(true);
      setActionError(null);
      const pk = Number(selectedOperator.id);
      if (Number.isNaN(pk)) throw new Error("Invalid operator id");
      await staffshiftService.updateOperator(pk, { duty: selectedDuty });
      await fetchOperators(showArchived);
      setShowShiftBoothModal(false);
    } catch (e: any) {
      setActionError(
        e?.response?.data?.error || e?.message || "Failed to update duty"
      );
    } finally {
      setSavingDuty(false);
    }
  };

  /**
   * Render operator card using the factory pattern
   */
  const renderOperatorCard = (operator: Operator & { _archived?: boolean }) => {
    const cardProps: BaseEntityCardProps<Operator> = {
      entity: operator,
      title: operator.name,
      subtitle: `${operator.id}${operator._archived ? " • archived" : ""}`,
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
              setShowShiftBoothModal(true);
            }}
            title="Edit Shift & Booth Assignment"
          >
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-600">Loading operators...</div>
    );
  }
  if (loadError) {
    return <div className="p-6 text-sm text-red-600">{loadError}</div>;
  }

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
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            <span>Show archived</span>
          </label>
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

      {/* Operator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {operators.map((operator) => renderOperatorCard(operator))}
      </div>

      {/* Operator Details Modal */}
      {selectedOperator && (
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
                  {selectedOperator.id}
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
                <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    No Current Assignment
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    This operator is available for new assignments.
                  </p>
                </div>
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
                    {/* Placeholder until we track experience */}0
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

            {actionError && (
              <div className="mt-4 text-sm text-red-600">{actionError}</div>
            )}
            {/* Action Buttons */}
            <div className="flex justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                {(selectedOperator as any)?._archived ? (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleRestoreOperator}
                    disabled={restoring}
                  >
                    {restoring ? "Restoring..." : "Restore Operator"}
                  </Button>
                ) : (
                  <Button
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleDeleteOperator}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete Operator"}
                  </Button>
                )}
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedOperator(null)}
                >
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
                    setShowShiftBoothModal(true);
                    setSelectedOperator(selectedOperator);
                  }}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Edit Shift & Pump
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Operator Details Modal */}
      {showEditModal && selectedOperator && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          className="max-w-2xl mx-4"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Edit Operator Details
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Update operator information and settings
            </p>
            {/* Add edit form here */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Shift & Booth Assignment Modal */}
      {showShiftBoothModal && selectedOperator && (
        <Modal
          isOpen={showShiftBoothModal}
          onClose={() => {
            setShowShiftBoothModal(false);
          }}
          className="max-w-2xl mx-4 max-h-[95vh] overflow-hidden"
        >
          <div className="p-4 max-h-[calc(95vh-4rem)] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Manage Shift & Booth Assignment: {selectedOperator.name}
            </h2>

            <div className="space-y-4">
              {/* Shift & Booth Management */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Shift & Booth Management</span>
                </h3>

                {/* Shift Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Shift
                  </label>
                  <select
                    defaultValue={selectedOperator.shift}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="Morning">Morning Shift</option>
                    <option value="Afternoon">Afternoon Shift</option>
                    <option value="Night">Night Shift</option>
                  </select>
                </div>

                {/* Duty Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Duty
                  </label>
                  <select
                    value={selectedDuty}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    onChange={(e) => setSelectedDuty(e.target.value)}
                  >
                    <option value="cashier">cashier</option>
                    <option value="attendant">attendant</option>
                  </select>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Current duty: {selectedDuty}
                  </div>
                </div>

                {/* Current Assignment Info */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current Assignment
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-900/20 p-2 rounded-lg">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      No Current Assignment
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      Available for assignment
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="p-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowShiftBoothModal(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              onClick={handleSaveDuty}
            >
              {savingDuty ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OperatorManagement;
