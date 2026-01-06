import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Clock,
  Users,
  Plus,
  Edit,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import staffshiftService from "../../../services/staffshiftService";
import { Modal } from "../../../components/ui/modal";
import Input from "../../../components/form/input/InputField";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs/Tabs";
import Label from "../../../components/form/Label";

interface UiShift {
  id: string;
  name: string;
  timeRange: string;
  status: "not-started" | "active" | "completed";
  operators: string[];
  operatorCount: number;
  maxOperators: number;
  handoverNotes?: string;
  shiftType?: "MANAGER" | "WORKER";
}

const ShiftManagement: React.FC = () => {
  // const [ setSelectedShift] = useState<UiShift | null>(null);
  const [shifts, setShifts] = useState<UiShift[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Create shift modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"MANAGER" | "WORKER">("MANAGER");
  const [form, setForm] = useState({
    name: "",
    start_time: "06:00",
    end_time: "14:00",
    max_operators: 5,
    description: "",
    shift_type: "MANAGER" as "MANAGER" | "WORKER",
  });

  // Edit shift modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    start_time: "06:00",
    end_time: "14:00",
    max_operators: 5,
    description: "",
    shift_type: "MANAGER" as "MANAGER" | "WORKER",
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case "not-started":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "not-started":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // Load shifts from backend
  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await staffshiftService.listShifts();
      const apiShifts = (res.data?.data || []) as any[];
      const mapped: UiShift[] = apiShifts
        .filter((s: any) =>
          activeTab === "MANAGER"
            ? s.shift_type === "MANAGER"
            : s.shift_type === "WORKER"
        )
        .map((s: any) => ({
          id: String(s.id),
          name: s.name,
          timeRange: `${s.start_time?.slice(0, 5)} - ${s.end_time?.slice(0, 5)}`,
          status: "not-started",
          operators: [],
          operatorCount: 0,
          maxOperators: Number(s.max_operators) || 0,
          handoverNotes: s.description || undefined,
          shiftType: s.shift_type,
        }));
      setShifts(mapped);
      setLoadError(null);
    } catch (e: any) {
      setLoadError(
        e?.response?.data?.error || e?.message || "Failed to load shifts"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setCreateError(null);
      await staffshiftService.createShift({
        name: form.name,
        start_time: form.start_time,
        end_time: form.end_time,
        max_operators: Number(form.max_operators),
        description: form.description || undefined,
        shift_type: form.shift_type,
      });
      setShowCreateModal(false);
      setForm({
        name: "",
        start_time: "06:00",
        end_time: "14:00",
        max_operators: 5,
        description: "",
        shift_type: activeTab,
      });
      await fetchShifts();
    } catch (e: any) {
      setCreateError(
        e?.response?.data?.error || e?.message || "Failed to create shift"
      );
    } finally {
      setCreating(false);
    }
  };

  // Open edit modal with selected shift values
  const openEdit = (s: UiShift) => {
    // setSelectedShift(s);
    setEditForm({
      id: s.id,
      name: s.name,
      start_time: s.timeRange.split(" - ")[0],
      end_time: s.timeRange.split(" - ")[1],
      max_operators: s.maxOperators,
      description: s.handoverNotes || "",
      shift_type: s.shiftType || "MANAGER",
    });
    setShowEditModal(true);
  };

  const handleUpdateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdating(true);
      setUpdateError(null);
      const payload: any = {
        name: editForm.name,
        start_time: editForm.start_time,
        end_time: editForm.end_time,
        description: editForm.description || undefined,
      };
      if (editForm.shift_type === "WORKER") {
        payload.max_operators = Number(editForm.max_operators);
      }
      await staffshiftService.updateShift(editForm.id, payload);
      setShowEditModal(false);
      await fetchShifts();
    } catch (e: any) {
      setUpdateError(
        e?.response?.data?.error || e?.message || "Failed to update shift"
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading shifts...</div>;
  }
  if (loadError) {
    return <div className="p-6 text-sm text-red-600">{loadError}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header + Tabs */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Shift Management System
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage manager and worker shifts
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Shift
            </Button>
          </div>
        </div>
        <Tabs
          defaultValue={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
        >
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="MANAGER">Manager Shifts</TabsTrigger>
            <TabsTrigger value="WORKER">Worker Shifts</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Shift Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Shift Timeline - Today</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                6:00 AM
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                2:00 PM
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                10:00 PM
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                6:00 AM
              </span>
            </div>
            <div className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-1/3 bg-green-500 opacity-80"></div>
              <div className="absolute left-1/3 top-0 h-full w-1/3 bg-yellow-500 opacity-60"></div>
              <div className="absolute left-2/3 top-0 h-full w-1/3 bg-blue-500 opacity-80"></div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                Morning (Active)
              </span>
              <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                Afternoon (Pending)
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Night (Completed)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shift Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shifts.map((shift) => (
          <Card key={shift.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(shift.status)}
                  <div>
                    <CardTitle className="text-lg">{shift.name}</CardTitle>
                    <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{shift.timeRange}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(shift.status)}>
                    {shift.status.replace("-", " ")}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => openEdit(shift)}
                    aria-label="Edit shift"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Operator Count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Operators
                    </span>
                  </div>
                  <div className="text-sm font-medium">
                    {shift.operatorCount}/{shift.maxOperators}
                  </div>
                </div>

                {/* Operator Assignment Progress */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(shift.operatorCount / Math.max(shift.maxOperators || 1, 1)) * 100}%`,
                    }}
                  ></div>
                </div>

                {/* Handover Notes */}
                {shift.handoverNotes && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="text-xs font-medium text-blue-800 dark;text-blue-300 mb-1">
                      Handover Notes:
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-200">
                      {shift.handoverNotes}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Shift Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          className="max-w-md mx-4"
        >
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Create New Shift</h3>
            <div>
              <Label>Shift Type</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={
                    form.shift_type === "MANAGER" ? undefined : "outline"
                  }
                  onClick={() => setForm({ ...form, shift_type: "MANAGER" })}
                >
                  Manager
                </Button>
                <Button
                  type="button"
                  variant={form.shift_type === "WORKER" ? undefined : "outline"}
                  onClick={() => setForm({ ...form, shift_type: "WORKER" })}
                >
                  Worker
                </Button>
              </div>
            </div>
            <form onSubmit={handleCreateShift} className="space-y-4">
              <div>
                <Label htmlFor="name">Shift Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Morning Shift"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    name="start_time"
                    type="time"
                    value={form.start_time}
                    onChange={(e) =>
                      setForm({ ...form, start_time: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    name="end_time"
                    type="time"
                    value={form.end_time}
                    onChange={(e) =>
                      setForm({ ...form, end_time: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {form.shift_type === "WORKER" && (
                  <div>
                    <Label htmlFor="max_operators">Max Operators</Label>
                    <Input
                      id="max_operators"
                      name="max_operators"
                      type="number"
                      min={1 as unknown as string}
                      value={String(form.max_operators)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          max_operators: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>
              {createError && (
                <div className="text-sm text-red-600">{createError}</div>
              )}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Shift"}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Edit Shift Modal */}
      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          className="max-w-md mx-4"
        >
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Edit Shift</h3>
            <form onSubmit={handleUpdateShift} className="space-y-4">
              <div>
                <Label htmlFor="edit_name">Shift Name</Label>
                <Input
                  id="edit_name"
                  name="edit_name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Shift Type</Label>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {editForm.shift_type}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit_start_time">Start Time</Label>
                  <Input
                    id="edit_start_time"
                    name="edit_start_time"
                    type="time"
                    value={editForm.start_time}
                    onChange={(e) =>
                      setEditForm({ ...editForm, start_time: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_end_time">End Time</Label>
                  <Input
                    id="edit_end_time"
                    name="edit_end_time"
                    type="time"
                    value={editForm.end_time}
                    onChange={(e) =>
                      setEditForm({ ...editForm, end_time: e.target.value })
                    }
                  />
                </div>
              </div>
              {editForm.shift_type === "WORKER" && (
                <div>
                  <Label htmlFor="edit_max_operators">Max Operators</Label>
                  <Input
                    id="edit_max_operators"
                    name="edit_max_operators"
                    type="number"
                    min={1 as unknown as string}
                    value={String(editForm.max_operators)}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        max_operators: Number(e.target.value),
                      })
                    }
                  />
                </div>
              )}
              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Input
                  id="edit_description"
                  name="edit_description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />
              </div>
              {updateError && (
                <div className="text-sm text-red-600">{updateError}</div>
              )}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={updating}
                >
                  {updating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ShiftManagement;
