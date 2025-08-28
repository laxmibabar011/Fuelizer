import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Modal } from "../../../components/ui/modal";
import MultiSelect from "../../../components/form/MultiSelect";
import StaffShiftService from "../../../services/staffshiftService";

type SimpleUser = { id: string; name: string };

const OperatorGroups: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [cashiers, setCashiers] = useState<SimpleUser[]>([]);
  const [attendants, setAttendants] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [cashierId, setCashierId] = useState("");
  const [attendantIds, setAttendantIds] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    const loadInitialData = async () => {
      try {
        setLoading(true);
        // Load shifts and groups
        const [shiftsRes, groupsRes] = await Promise.all([
          StaffShiftService.listShifts(),
          StaffShiftService.listGroups().catch(
            () => ({ data: { data: [] } }) as any
          ),
        ]);
        if (mounted) {
          // Filter to only show WORKER shifts, not MANAGER shifts
          const workerShifts = ((shiftsRes as any)?.data?.data || []).filter(
            (s: any) => s.shift_type === "WORKER"
          );
          setShifts(workerShifts);
          setGroups((groupsRes as any)?.data?.data || []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadInitialData();
    return () => {
      mounted = false;
    };
  }, []);

  // Load operators filtered by selected shift
  useEffect(() => {
    if (!selectedShiftId) {
      setCashiers([]);
      setAttendants([]);
      return;
    }

    let mounted = true;
    const loadOperatorsByShift = async () => {
      try {
        // Get operators assigned to this specific shift
        const opsRes =
          await StaffShiftService.getOperatorsByShift(selectedShiftId);
        const shiftOperators = ((opsRes as any)?.data?.data || []) as any[];

        // Filter by duty type
        const c = shiftOperators
          .filter((o: any) => (o.duty || "attendant") === "cashier")
          .map((o: any) => ({
            id: o.user_id || o.User?.user_id || o.id,
            name:
              o.UserDetails?.full_name ||
              o.User?.UserDetails?.full_name ||
              o.User?.email ||
              o.email ||
              o.operator_id,
          }));
        const a = shiftOperators
          .filter((o: any) => (o.duty || "attendant") === "attendant")
          .map((o: any) => ({
            id: o.user_id || o.User?.user_id || o.id,
            name:
              o.UserDetails?.full_name ||
              o.User?.UserDetails?.full_name ||
              o.User?.email ||
              o.email ||
              o.operator_id,
          }));

        if (mounted) {
          setCashiers(c);
          setAttendants(a);
        }
      } catch (e) {
        // If no operators assigned to this shift, show empty lists
        if (mounted) {
          setCashiers([]);
          setAttendants([]);
        }
      }
    };

    loadOperatorsByShift();
    return () => {
      mounted = false;
    };
  }, [selectedShiftId]);

  const attendantOptions = useMemo(
    () => attendants.map((u) => ({ value: u.id, text: u.name })),
    [attendants]
  );

  const onCreate = async () => {
    if (!groupName || !selectedShiftId || !cashierId) return;
    setLoading(true);
    try {
      const create = await StaffShiftService.createGroup({
        name: groupName,
        cashierId,
        shiftId: selectedShiftId,
      });
      const groupId = (create as any)?.data?.data?.id;
      if (groupId && attendantIds.length > 0) {
        await StaffShiftService.setGroupAttendants(groupId, attendantIds);
      }
      const listRes = await StaffShiftService.listGroups().catch(
        () => ({ data: { data: [] } }) as any
      );
      setGroups((listRes as any)?.data?.data || []);
      setShowModal(false);
      setGroupName("");
      setSelectedShiftId("");
      setCashierId("");
      setAttendantIds([]);
    } finally {
      setLoading(false);
    }
  };

  const onDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }
    
    setDeletingGroupId(groupId);
    try {
      await StaffShiftService.deleteGroup(groupId);
      // Refresh the groups list
      const listRes = await StaffShiftService.listGroups().catch(
        () => ({ data: { data: [] } }) as any
      );
      setGroups((listRes as any)?.data?.data || []);
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group. Please try again.');
    } finally {
      setDeletingGroupId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Operator Groups
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create cashier-led teams and manage attendants.
          </p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowModal(true)}
        >
          New Group
        </Button>
      </div>

      <Card className="p-4">
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : groups.length === 0 ? (
          <div className="text-sm text-gray-500">
            No groups yet. Create your first group.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-400">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Shift</th>
                  <th className="py-2 pr-4">Cashier</th>
                  <th className="py-2 pr-4">Attendants</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g: any) => (
                  <tr
                    key={g.id}
                    className="border-t border-gray-200 dark:border-gray-700"
                  >
                    <td className="py-2 pr-4">{g.name}</td>
                    <td className="py-2 pr-4">
                      {g.Shift?.name || `Shift ${g.shift_id}`}
                    </td>
                    <td className="py-2 pr-4">
                      {g.Cashier?.UserDetails?.full_name ||
                        g.Cashier?.email ||
                        g.cashier_id}
                    </td>
                    <td className="py-2 pr-4">{g.Members?.length || 0}</td>
                    <td className="py-2 pr-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteGroup(g.id)}
                        disabled={deletingGroupId === g.id}
                      >
                        {deletingGroupId === g.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          className="max-w-lg w-full overflow-visible"
        >
          <div className="p-5 space-y-5">
            <h3 className="text-lg font-semibold">Create Group</h3>
            <div>
              <label className="block text-sm mb-1">Group name</label>
              <input
                className="w-full border rounded px-2 py-2 text-sm"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Front Counter Morning"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Shift</label>
              <select
                className="w-full border rounded px-2 py-2 text-sm"
                value={selectedShiftId}
                onChange={(e) => {
                  setSelectedShiftId(e.target.value);
                  setCashierId("");
                  setAttendantIds([]);
                }}
              >
                <option value="">Select shift first</option>
                {shifts.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.start_time} - {s.end_time})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Cashier</label>
              <select
                className="w-full border rounded px-2 py-2 text-sm"
                value={cashierId}
                onChange={(e) => setCashierId(e.target.value)}
                disabled={!selectedShiftId}
              >
                <option value="">Select cashier</option>
                {cashiers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {!selectedShiftId && (
                <p className="text-xs text-gray-500 mt-1">
                  Select a shift to see available cashiers
                </p>
              )}
              {selectedShiftId && cashiers.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  No cashiers assigned to this shift. Assign operators to this
                  shift first in the Operators tab.
                </p>
              )}
            </div>
            <MultiSelect
              label="Attendants"
              options={attendantOptions}
              defaultSelected={attendantIds}
              onChange={(ids) => setAttendantIds(ids)}
              disabled={!selectedShiftId}
            />
            {!selectedShiftId && (
              <p className="text-xs text-gray-500">
                Select a shift to see available attendants
              </p>
            )}
            {selectedShiftId && attendants.length === 0 && (
              <p className="text-xs text-orange-600">
                No attendants assigned to this shift. Assign operators to this
                shift first in the Operators tab.
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setGroupName("");
                  setSelectedShiftId("");
                  setCashierId("");
                  setAttendantIds([]);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!groupName || !selectedShiftId || !cashierId}
                onClick={onCreate}
              >
                Create
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OperatorGroups;
