import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Modal } from "../../../components/ui/modal";
import {
  MapPin,
  Users,
  Plus,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

import { Booth } from "../../../types/common";
import StationService from "../../../services/stationService";
import StaffShiftService from "../../../services/staffshiftService";

const BoothManagement: React.FC = () => {
  // Load booths from Station Setup APIs
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Shift-based group assignment
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [shifts, setShifts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  // Team assignment modal state
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamBooth, setTeamBooth] = useState<Booth | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  // Local in-memory assignment view until backend endpoints are added
  const [boothAssignments, setBoothAssignments] = useState<
    Record<
      string,
      {
        groupId?: string;
        groupName?: string;
        cashierName?: string;
        attendantsCount?: number;
      }
    >
  >({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [boothsRes, shiftsRes] = await Promise.all([
          StationService.listBooths(),
          StaffShiftService.listShifts(),
        ]);

        const boothsData = ((boothsRes as any)?.data?.data || []) as any[];
        const mapped: Booth[] = boothsData.map((b: any) => ({
          id: String(b.id),
          name: b.name || b.code || `Booth ${b.id}`,
          status: b.active ? "online" : "offline",
          lastMaintenance:
            b.lastMaintenance || new Date().toISOString().slice(0, 10),
          nozzles: ((b.Nozzles || b.nozzles || []) as any[]).map((n: any) => ({
            id: String(n.id),
            fuelType: n.Product?.name || n.product?.name || "",
            previousReading: 0,
            currentReading: null,
            variance: 0,
            status: "pending",
            assignedOperators: [],
          })),
        }));

        // Filter to only show WORKER shifts, not MANAGER shifts
        const workerShifts = ((shiftsRes as any)?.data?.data || []).filter(
          (s: any) => s.shift_type === "WORKER"
        );

        if (mounted) {
          setBooths(mapped);
          setShifts(workerShifts);
          setLoadError(null);
        }
      } catch (e: any) {
        if (mounted) setLoadError(e?.message || "Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Load groups when shift is selected
  useEffect(() => {
    if (!selectedShiftId) {
      setGroups([]);
      return;
    }

    let mounted = true;
    const loadGroupsForShift = async () => {
      try {
        // Call backend with shift filter
        const groupsRes = await StaffShiftService.listGroups(
          selectedShiftId
        ).catch(() => ({ data: { data: [] } }) as any);
        const shiftGroups = (groupsRes as any)?.data?.data || [];
        if (mounted) {
          setGroups(shiftGroups);
        }
      } catch (e) {
        // best-effort
      }
    };

    loadGroupsForShift();
    return () => {
      mounted = false;
    };
  }, [selectedShiftId]);

  // Load booth assignments for selected shift
  useEffect(() => {
    if (!selectedShiftId) {
      setBoothAssignments({});
      return;
    }

    let mounted = true;
    const loadBoothAssignments = async () => {
      try {
        // Load booth assignments from backend
        const assignmentsRes = await StaffShiftService.listBoothAssignments(
          selectedShiftId
        ).catch(() => ({ data: { data: [] } }) as any);
        const assignments = (assignmentsRes as any)?.data?.data || [];

        const assignmentMap: Record<string, any> = {};
        assignments.forEach((a: any) => {
          assignmentMap[a.booth_id] = {
            groupId: a.operator_group_id,
            groupName: a.OperatorGroup?.name,
            cashierName: a.OperatorGroup?.Cashier?.UserDetails?.full_name,
            attendantsCount: a.OperatorGroup?.Members?.length || 0,
          };
        });

        if (mounted) {
          setBoothAssignments(assignmentMap);
        }
      } catch (e) {
        // best-effort
      }
    };

    loadBoothAssignments();
    return () => {
      mounted = false;
    };
  }, [selectedShiftId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "offline":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "maintenance":
        return <Settings className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleSaveTeamAssignment = async () => {
    if (!teamBooth || !selectedGroupId || !selectedShiftId) return;

    try {
      // Save the assignment to backend
      await StaffShiftService.mapGroupToBooths(selectedGroupId, [
        parseInt(teamBooth.id),
      ]);

      // Reload booth assignments to get updated data from backend
      const assignmentsRes = await StaffShiftService.listBoothAssignments(
        selectedShiftId
      ).catch(() => ({ data: { data: [] } }) as any);
      const assignments = (assignmentsRes as any)?.data?.data || [];

      const assignmentMap: Record<string, any> = {};
      assignments.forEach((a: any) => {
        assignmentMap[a.booth_id] = {
          groupId: a.operator_group_id,
          groupName: a.OperatorGroup?.name,
          cashierName: a.OperatorGroup?.Cashier?.UserDetails?.full_name,
          attendantsCount: a.OperatorGroup?.Members?.length || 0,
        };
      });

      setBoothAssignments(assignmentMap);
      setShowTeamModal(false);
      setTeamBooth(null);
      setSelectedGroupId("");
    } catch (e) {
      console.error("Failed to save team assignment:", e);
    }
  };

  // Calculate booth statistics
  const totalBooths = booths.length;
  const onlineBooths = booths.filter(
    (booth) => booth.status === "online"
  ).length;
  const totalNozzles = booths.reduce(
    (sum, booth) => sum + booth.nozzles.length,
    0
  );
  const assignedBooths = Object.keys(boothAssignments).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Booth & Team Assignment
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Loading booths...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Booth & Team Assignment
            </h2>
            <p className="text-red-600 dark:text-red-400">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Booth & Team Assignment
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Assign operator groups to booths for each shift
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          Add New Booth
        </Button>
      </div>

      {/* Shift Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Select Shift:</label>
          <select
            className="border rounded px-3 py-2 text-sm min-w-48"
            value={selectedShiftId}
            onChange={(e) => setSelectedShiftId(e.target.value)}
          >
            <option value="">Choose a shift to manage assignments</option>
            {shifts.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.start_time} - {s.end_time})
              </option>
            ))}
          </select>
          {selectedShiftId && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {shifts.find((s) => s.id === selectedShiftId)?.name} Configuration
            </Badge>
          )}
        </div>
      </Card>

      {!selectedShiftId ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Select a Shift</h3>
            <p className="text-sm">
              Choose a shift above to view and manage booth assignments for that
              shift.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Booths
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalBooths}
                    </p>
                  </div>
                  <MapPin className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Online Booths
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {onlineBooths}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Nozzles
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalNozzles}
                    </p>
                  </div>
                  <Settings className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Assigned Booths
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {assignedBooths}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booth Assignment Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Booth & Team Assignment</span>
              </CardTitle>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Click Assign Team on a booth to choose an operator group for
                this shift
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Individual Booth Cards - two per row on xl screens */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {booths.map((booth) => (
                    <div
                      key={booth.id}
                      className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 shadow-sm h-full"
                    >
                      {/* Booth Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <span className="text-xl">🏬</span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {booth.name}
                              </h3>
                              <div
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  booth.status === "online"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                    : booth.status === "offline"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                }`}
                              >
                                {getStatusIcon(booth.status)}
                                <span className="ml-1 capitalize">
                                  {booth.status}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {booth.nozzles.length} nozzle
                              {booth.nozzles.length !== 1 ? "s" : ""} • Last
                              maintenance: {booth.lastMaintenance}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {boothAssignments[booth.id]?.groupName
                              ? `Group: ${boothAssignments[booth.id]?.groupName}`
                              : "Group: Unassigned"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {boothAssignments[booth.id]?.cashierName
                              ? `Cashier: ${boothAssignments[booth.id]?.cashierName}`
                              : "Cashier: None"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {`Attendants: ${boothAssignments[booth.id]?.attendantsCount || 0}`}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTeamBooth(booth);
                              setSelectedGroupId(
                                boothAssignments[booth.id]?.groupId || ""
                              );
                              setShowTeamModal(true);
                            }}
                            disabled={!selectedShiftId}
                          >
                            Assign Team
                          </Button>
                        </div>
                      </div>

                      {/* Nozzles Section */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-base">⛽</span>
                          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Nozzles in {booth.name}
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {booth.nozzles.map((nozzle) => (
                            <div
                              key={nozzle.id}
                              className="relative p-3 border-2 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-gray-200"
                            >
                              {/* Nozzle Icon */}
                              <div className="absolute top-2 right-2">
                                <span className="text-base">⛽</span>
                              </div>

                              {/* Nozzle ID Badge */}
                              <div className="mb-2">
                                <div className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                  {nozzle.id}
                                </div>
                              </div>

                              {/* Fuel Type */}
                              <div className="mb-2">
                                <div className="text-[13px] font-medium text-gray-900 dark:text-white">
                                  {nozzle.fuelType}
                                </div>
                              </div>

                              {/* Assignment Status */}
                              <div className="space-y-2">
                                <Badge className="w-full justify-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-[11px] font-medium">
                                  {boothAssignments[booth.id]?.groupName
                                    ? "Team Assigned"
                                    : "Available"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Assignment Instructions */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">💡</span>
                    <div className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                      How to assign teams:
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700 dark:text-blue-400">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">1️⃣</span>
                      <span>Select a shift from the dropdown above</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">2️⃣</span>
                      <span>Click "Assign Team" on any booth</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">3️⃣</span>
                      <span>Choose an operator group for that shift</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">4️⃣</span>
                      <span>Configuration stays until you change it</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Team Assignment Modal */}
      {showTeamModal && teamBooth && (
        <Modal
          isOpen={showTeamModal}
          onClose={() => {
            setShowTeamModal(false);
            setTeamBooth(null);
            setSelectedGroupId("");
          }}
          className="max-w-lg mx-4"
        >
          <div className="p-5 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Assign Team for {teamBooth.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose an operator group for{" "}
                {shifts.find((s) => s.id === selectedShiftId)?.name} shift
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Operator Group
              </label>
              <select
                className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                <option value="">Select group</option>
                {groups.map((g: any) => (
                  <option key={g.id} value={g.id}>
                    {g.name} -{" "}
                    {g.Cashier?.UserDetails?.full_name || g.Cashier?.email} (
                    {g.Members?.length || 0} attendants)
                  </option>
                ))}
              </select>
              {groups.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No groups created for this shift yet. Create groups in Staff &
                  Shifts → Groups tab.
                </p>
              )}
            </div>

            {selectedGroupId && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Group Preview</h4>
                {(() => {
                  const group = groups.find((g) => g.id === selectedGroupId);
                  return group ? (
                    <div className="text-xs space-y-1">
                      <div>
                        Cashier:{" "}
                        {group.Cashier?.UserDetails?.full_name ||
                          group.Cashier?.email}
                      </div>
                      <div>Attendants: {group.Members?.length || 0}</div>
                      <div>
                        Shift:{" "}
                        {group.Shift?.name ||
                          shifts.find((s) => s.id === selectedShiftId)?.name}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTeamModal(false);
                  setTeamBooth(null);
                  setSelectedGroupId("");
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!selectedGroupId}
                onClick={handleSaveTeamAssignment}
              >
                Save Assignment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BoothManagement;
