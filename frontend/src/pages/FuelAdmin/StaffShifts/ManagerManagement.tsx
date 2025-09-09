import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import Avatar from "../../../components/ui/avatar/Avatar";
// import { Badge } from "../../../components/ui/badge";
import { Mail, Phone, Clock } from "lucide-react";
import staffshiftService from "../../../services/staffshiftService";

interface ManagerItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isSelf?: boolean;
  // Optional: backend includes DefaultManagerShift
  DefaultManagerShift?: { id: number; name: string; start_time: string; end_time: string; shift_type: string } | null;
}

const ManagerManagement: React.FC = () => {
  const [managers, setManagers] = useState<ManagerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [shiftOptions, setShiftOptions] = useState<{ id: string; label: string }[]>([]);
  const [selection, setSelection] = useState<Record<string, string>>( {} ); // managerId -> shiftId | ""
  const [currentAssignments, setCurrentAssignments] = useState<Record<string, { id: string; shift_id: string }>>({}); // managerId -> assignment

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const res = await staffshiftService.listManagers();
      const data = (res.data?.data || []) as any[];
      const mapped: ManagerItem[] = data.map((u: any) => ({
        id: String(u.user_id),
        name: u.UserDetails?.full_name || u.email,
        email: u.email,
        phone: u.UserDetails?.phone,
        DefaultManagerShift: u.DefaultManagerShift || null,
      }));
      setManagers(mapped);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to load managers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const loadManagerShifts = async () => {
    // Use all MANAGER shifts
    const res = await staffshiftService.listShifts();
    const shifts = (res.data?.data || []) as any[];
    const opts = shifts
      .filter((s: any) => s.shift_type === "MANAGER")
      .map((s: any) => ({ id: String(s.id), label: `${s.name} (${s.start_time?.slice(0,5)} - ${s.end_time?.slice(0,5)})` }));
    setShiftOptions(opts);
    return opts;
  };

  const loadTomorrowAssignments = async (opts?: { id: string; label: string }[]) => {
    // Deprecated: daily assignments no longer used for managers
    setCurrentAssignments({});
    // Initialize selection from permanent mapping exposed by backend
    setSelection(prev => {
      const next: Record<string,string> = { ...prev };
      managers.forEach((m: any) => {
        // @ts-ignore: backend now includes DefaultManagerShift
        const dm = (m as any).DefaultManagerShift?.id || '';
        next[m.id] = dm ? String(dm) : '';
      });
      return next;
    });
  };

  // Keep labels fresh even outside edit mode
  useEffect(() => {
    const run = async () => {
      const opts = await loadManagerShifts();
      await loadTomorrowAssignments(opts);
    };
    void run();
  }, [managers.length]);

  const handleSaveAll = async () => {
    try {
      setAssigning(true);
      setAssignError(null);
      // Permanently set/clear default_manager_shift_id by calling new endpoints
      for (const m of managers) {
        const selectedShiftId = selection[m.id] || "";
        if (selectedShiftId) {
          await staffshiftService.assignManagerShift({ user_id: m.id, shift_id: selectedShiftId });
        } else {
          // Unassign
          await staffshiftService.unassignManagerShift({ user_id: m.id, shift_id: 0 });
        }
      }
      setIsEditing(false);
      const opts = await loadManagerShifts();
      await loadTomorrowAssignments(opts);
    } catch (e: any) {
      setAssignError(e?.response?.data?.error || e?.message || "Failed to save assignments");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div className="p-4 text-sm text-gray-600">Loading managers...</div>;
  if (error) return <div className="p-4 text-sm text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manager Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Assign manager shifts</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              {assignError && <div className="text-sm text-red-600 mr-2">{assignError}</div>}
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveAll} disabled={assigning}>{assigning ? "Saving..." : "Save"}</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managers.map((m) => (
          <Card key={m.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar src="" alt={m.name} size="large" status="online" />
                  {/* Self indicator can be wired from auth later */}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{m.name}</h3>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Mail className="h-3 w-3" /> {m.email}
                  </div>
                  {m.phone && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Phone className="h-3 w-3" /> {m.phone}
                    </div>
                  )}
                  {!isEditing ? (
                    <div className="mt-2 text-xs text-gray-500">
                      Assigned: {m.DefaultManagerShift?.id
                        ? (shiftOptions.find(o => o.id === String(m.DefaultManagerShift?.id))?.label
                          || `${m.DefaultManagerShift?.name} (${String(m.DefaultManagerShift?.start_time).slice(0,5)} - ${String(m.DefaultManagerShift?.end_time).slice(0,5)})`)
                        : 'Unassigned'}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Shift</label>
                      <select
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        value={selection[m.id] ?? ''}
                        onChange={(e) => setSelection(prev => ({ ...prev, [m.id]: e.target.value }))}
                      >
                        <option value="">Unassigned</option>
                        {shiftOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Clock className="h-4 w-4 mr-1" /> Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
};

export default ManagerManagement;