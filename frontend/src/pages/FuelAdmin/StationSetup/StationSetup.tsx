import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  CardContent,
} from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import { PlusIcon } from "../../../icons";
import { Modal } from "../../../components/ui/modal";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import Switch from "../../../components/form/switch/Switch";
import { Badge } from "../../../components/ui/badge";
import StationService from "../../../services/stationService";

const StationSetup: React.FC = () => {
  type Nozzle = { id: string; code: string; fuel: string };
  type Booth = {
    id: string;
    name: string;
    code: string;
    active: boolean;
    nozzles: Nozzle[];
  };

  const [booths, setBooths] = useState<Booth[]>([]);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add / Edit Booth Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<{ name: string; code: string; id?: string }>({
    name: "",
    code: "",
  });

  const modalTitle = useMemo(
    () => (isEdit ? `Edit Dispensing Unit` : `Add New Dispensing Unit`),
    [isEdit]
  );

  // Load booths
  useEffect(() => {
    StationService.listBooths().then((res) => {
      const data = (res.data?.data || []) as any[];
      const mapped: Booth[] = data.map((b: any) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        active: !!b.active,
        nozzles: (b.Nozzles || b.nozzles || []).map((n: any) => ({
          id: n.id,
          code: n.code,
          fuel: n.Product?.name ? n.Product.name.toLowerCase().replace(" ", "-") : "",
        })),
      }));
      setBooths(mapped);
    });
  }, []);

  const openAdd = () => {
    setIsEdit(false);
    setForm({ name: "", code: "" });
    setIsModalOpen(true);
  };

  const openEdit = (booth: { id: string; name: string; code: string }) => {
    setIsEdit(true);
    setForm({ id: booth.id, name: booth.name, code: booth.code });
    setIsModalOpen(true);
  };

  const saveBooth = () => {
    if (!form.name.trim() || !form.code.trim()) return;
    if (isEdit && form.id) {
      StationService.updateBooth(form.id, { name: form.name, code: form.code }).then(() => {
        setBooths((prev) => prev.map((b) => (b.id === form.id ? { ...b, name: form.name, code: form.code } : b)));
        setIsModalOpen(false);
      });
    } else {
      StationService.createBooth({ name: form.name, code: form.code, active: true }).then((res) => {
        const b = res.data?.data;
        setBooths((prev) => [
          ...prev,
          { id: b.id, name: b.name, code: b.code, active: b.active, nozzles: [] },
        ]);
        setIsModalOpen(false);
      });
    }
  };

  // Inline management handlers
  const toggleActive = (boothId: string, active: boolean) => {
    StationService.updateBooth(boothId, { active }).then(() => {
      setBooths((prev) => prev.map((b) => (b.id === boothId ? { ...b, active } : b)));
    });
  };

  const addNozzle = (boothId: string) => {
    const newNozzle = { id: `temp-${Date.now()}`, code: "", fuel: "" };
    setBooths((prev) =>
      prev.map((b) =>
        b.id === boothId
          ? { ...b, nozzles: [...b.nozzles, newNozzle] }
          : b
      )
    );
  };

  const updateNozzle = (
    boothId: string,
    nozzleId: string,
    patch: Partial<Nozzle>
  ) => {
    // Update local state immediately for better UX
    setBooths((prev) =>
      prev.map((b) =>
        b.id === boothId
          ? {
              ...b,
              nozzles: b.nozzles.map((n) => (n.id === nozzleId ? { ...n, ...patch } : n)),
            }
          : b
      )
    );

    // If this is a temporary nozzle (starts with 'temp-'), save it to backend
    if (typeof nozzleId === 'string' && nozzleId.startsWith('temp-')) {
      const nozzle = booths.find(b => b.id === boothId)?.nozzles.find(n => n.id === nozzleId);
      if (nozzle && nozzle.code && nozzle.fuel) {
        StationService.addNozzle(boothId, { 
          code: nozzle.code, 
          productId: nozzle.fuel ? 1 : null // Placeholder - will need proper product mapping
        }).then((res) => {
          const savedNozzle = res.data?.data;
          // Replace temporary nozzle with saved one
          setBooths((prev) =>
            prev.map((b) =>
              b.id === boothId
                ? {
                    ...b,
                    nozzles: b.nozzles.map((n) => 
                      n.id === nozzleId ? { ...n, id: savedNozzle.id } : n
                    ),
                  }
                : b
            )
          );
        });
      }
    } else {
      // Update existing nozzle
      const payload: any = {};
      if (patch.code !== undefined) payload.code = patch.code;
      if (patch.fuel !== undefined)
        payload.productId = patch.fuel ? 1 : null; // Placeholder - will need proper product mapping
      
      StationService.updateNozzle(nozzleId, payload);
    }
  };

  const removeNozzle = (boothId: string, nozzleId: string) => {
    // Remove from local state immediately
    setBooths((prev) =>
      prev.map((b) =>
        b.id === boothId ? { ...b, nozzles: b.nozzles.filter((n) => n.id !== nozzleId) } : b
      )
    );

    // Only call API if it's not a temporary nozzle
    if (!nozzleId.toString().startsWith('temp-')) {
      StationService.deleteNozzle(nozzleId);
    }
  };

  const deleteBooth = (boothId: string) => {
    StationService.deleteBooth(boothId).then(() => {
      setBooths((prev) => prev.filter((b) => b.id !== boothId));
      if (expandedId === boothId) setExpandedId(null);
    });
  };

  const fuelOptions = [
    { value: "petrol", label: "Petrol" },
    { value: "diesel", label: "Diesel" },
    { value: "power-petrol", label: "Power Petrol" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Station Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all dispensing units (booths) in your station.
          </p>
        </div>
        <Button startIcon={<PlusIcon className="h-4 w-4" />} onClick={openAdd}>
          Add Booth
        </Button>
      </div>

      {/* Booths Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {booths.map((booth) => {
          const isExpanded = expandedId === booth.id;
          const statusBadge = booth.active ? (
            <Badge className="bg-green-500 text-white border-transparent">Active</Badge>
          ) : (
            <Badge className="bg-gray-300 text-gray-900 dark:bg-gray-700 dark:text-gray-100 border-transparent">Inactive</Badge>
          );

          const cardTone = booth.active
            ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
            : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800";

          return (
            <Card key={booth.id} className={cardTone}>
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{booth.name}</CardTitle>
                    <CardDescription>Code: {booth.code}</CardDescription>
                  </div>
                  <div className="mt-1">{statusBadge}</div>
                </div>
            </CardHeader>
              {isExpanded && (
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Booth Status
                    </span>
                    <Switch
                      label={booth.active ? "Active" : "Inactive"}
                      defaultChecked={booth.active}
                      onChange={(checked) => toggleActive(booth.id, checked)}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">
                        Nozzles
                      </h4>
                      <Button size="sm" variant="outline" onClick={() => addNozzle(booth.id)}>
                        Add Nozzle
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {booth.nozzles.length === 0 && (
                        <p className="text-sm text-gray-500">No nozzles configured.</p>
                      )}
                      {booth.nozzles.map((nz) => (
                        <div
                          key={nz.id}
                          className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800"
                        >
                          <Input
                            placeholder="Nozzle Code"
                            value={nz.code}
                            onChange={(e) =>
                              updateNozzle(booth.id, nz.id, { code: e.target.value })
                            }
                          />
                          <Select
                            options={fuelOptions}
                            placeholder="Map to Fuel Product"
                            defaultValue={nz.fuel}
                            onChange={(value) => updateNozzle(booth.id, nz.id, { fuel: value })}
                          />
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeNozzle(booth.id, nz.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            <CardFooter className="justify-end gap-3">
                {!isExpanded ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => openEdit(booth)}>
                      Edit
                    </Button>
                    <Button size="sm" onClick={() => setExpandedId(booth.id)}>
                      Manage Nozzles
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setExpandedId(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteBooth(booth.id)}>
                      Delete
                    </Button>
                    <Button size="sm" onClick={() => setExpandedId(null)}>
                      Save
                    </Button>
                  </>
                )}
            </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Booth Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-lg w-full">
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{modalTitle}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Define the unit name and unique code for this dispensing unit.
          </p>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Booth Name</label>
              <Input
                placeholder="e.g., Frontage - Unit 1"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Booth Code</label>
              <Input
                placeholder="e.g., F-001"
                value={form.code}
                onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveBooth}>{isEdit ? "Save Changes" : "Save Booth"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StationSetup;
