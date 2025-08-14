import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import { PlusIcon, ChevronDownIcon, ChevronUpIcon } from "../../../icons";
import { Modal } from "../../../components/ui/modal";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import Switch from "../../../components/form/switch/Switch";
import { Badge } from "../../../components/ui/badge";
import StationService from "../../../services/stationService";

interface Nozzle {
  id: string;
  code: string;
  productId: string;
  productName?: string;
}

interface Booth {
  id: string;
  name: string;
  code: string;
  active: boolean;
  nozzles: Nozzle[];
}

const StationSetup: React.FC = () => {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBooth, setExpandedBooth] = useState<string | null>(null);
  const [fuelOptions, setFuelOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // Booth modal state
  const [boothModal, setBoothModal] = useState({
    open: false,
    editing: false,
    data: { name: "", code: "" },
    boothId: "",
  });

  // Nozzle modal state
  const [nozzleModal, setNozzleModal] = useState({
    open: false,
    editing: false,
    data: { code: "", productId: "" },
    nozzleId: "",
    boothId: "",
  });

  // Load data
  useEffect(() => {
    loadBooths();
    loadFuelOptions();
  }, []);

  const loadBooths = async () => {
    setLoading(true);
    try {
      const res = await StationService.listBooths();
      const data = res.data?.data || [];

      const mappedBooths: Booth[] = data.map((b: any) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        active: !!b.active,
        nozzles: (b.Nozzles || []).map((n: any) => ({
          id: n.id,
          code: n.code,
          productId: n.Product?.id ? String(n.Product.id) : "",
          productName: n.Product?.name || "",
        })),
      }));

      setBooths(mappedBooths);
    } catch (err) {
      console.error("Failed to load booths:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadFuelOptions = async () => {
    try {
      const { default: ProductMasterService } = await import(
        "../../../services/productMasterService"
      );
      const res = await ProductMasterService.listProducts({
        category_type: "Fuel",
      });
      const products = res.data?.data || [];
      const options = products.map((p: any) => ({
        value: String(p.id),
        label: p.name,
      }));
      setFuelOptions(options);
    } catch (err) {
      console.error("Failed to load fuel options:", err);
      setFuelOptions([
        { value: "1", label: "Petrol" },
        { value: "2", label: "Diesel" },
      ]);
    }
  };

  // Booth operations
  const openBoothModal = (editing = false, booth?: Booth) => {
    setBoothModal({
      open: true,
      editing,
      data: booth
        ? { name: booth.name, code: booth.code }
        : { name: "", code: "" },
      boothId: booth?.id || "",
    });
  };

  const saveBooth = async () => {
    const { name, code } = boothModal.data;
    if (!name.trim() || !code.trim()) return;

    try {
      if (boothModal.editing) {
        await StationService.updateBooth(boothModal.boothId, { name, code });
      } else {
        await StationService.createBooth({ name, code, active: true });
      }
      await loadBooths();
      setBoothModal({
        open: false,
        editing: false,
        data: { name: "", code: "" },
        boothId: "",
      });
    } catch (err) {
      console.error("Failed to save booth:", err);
    }
  };

  const deleteBooth = async (boothId: string) => {
    if (!window.confirm("Are you sure you want to delete this booth?")) return;
    try {
      await StationService.deleteBooth(boothId);
      await loadBooths();
      if (expandedBooth === boothId) setExpandedBooth(null);
    } catch (err) {
      console.error("Failed to delete booth:", err);
    }
  };

  const toggleBoothStatus = async (boothId: string, active: boolean) => {
    try {
      await StationService.updateBooth(boothId, { active });
      setBooths((prev) =>
        prev.map((b) => (b.id === boothId ? { ...b, active } : b))
      );
    } catch (err) {
      console.error("Failed to update booth status:", err);
    }
  };

  // Nozzle operations
  const openNozzleModal = (
    editing = false,
    nozzle?: Nozzle,
    boothId?: string
  ) => {
    setNozzleModal({
      open: true,
      editing,
      data: nozzle
        ? { code: nozzle.code, productId: nozzle.productId }
        : { code: "", productId: "" },
      nozzleId: nozzle?.id || "",
      boothId: boothId || "",
    });
  };

  const saveNozzle = async () => {
    const { code, productId } = nozzleModal.data;
    if (!code.trim() || !productId) return;

    try {
      if (nozzleModal.editing) {
        await StationService.updateNozzle(nozzleModal.nozzleId, {
          code,
          productId: Number(productId),
        });
      } else {
        await StationService.createNozzle({
          boothId: Number(nozzleModal.boothId),
          code,
          productId: Number(productId),
        });
      }
      await loadBooths();
      setNozzleModal({
        open: false,
        editing: false,
        data: { code: "", productId: "" },
        nozzleId: "",
        boothId: "",
      });
    } catch (err) {
      console.error("Failed to save nozzle:", err);
    }
  };

  const deleteNozzle = async (nozzleId: string) => {
    if (!window.confirm("Are you sure you want to delete this nozzle?")) return;
    try {
      await StationService.deleteNozzle(nozzleId);
      await loadBooths();
    } catch (err) {
      console.error("Failed to delete nozzle:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Station Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage dispensing units and their nozzles
          </p>
        </div>
        <Button
          onClick={() => openBoothModal(false)}
          startIcon={<PlusIcon className="h-3 w-3" />}
        >
          + Add Booth
        </Button>
      </div>

      {/* Booths Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {booths.map((booth) => {
          const isExpanded = expandedBooth === booth.id;

          return (
            <Card
              key={booth.id}
              className={`transition-all duration-200 ${isExpanded ? "ring-2 ring-blue-500" : "hover:shadow-md"} ${booth.active ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800" : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800"}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{booth.name}</CardTitle>
                    <CardDescription>Code: {booth.code}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        className={
                          booth.active ? "bg-green-500" : "bg-gray-500"
                        }
                      >
                        {booth.active ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {booth.nozzles.length} nozzle
                        {booth.nozzles.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openBoothModal(true, booth)}
                  >
                    Edit
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4">
                  {/* Booth Status Toggle */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm font-medium">Booth Status</span>
                    <Switch
                      label={booth.active ? "Active" : "Inactive"}
                      defaultChecked={booth.active}
                      onChange={(checked) =>
                        toggleBoothStatus(booth.id, checked)
                      }
                    />
                  </div>

                  {/* Nozzles Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Nozzles
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          openNozzleModal(false, undefined, booth.id)
                        }
                      >
                        <PlusIcon className="h-3 w-3 mr-1" />
                        Add Nozzle
                      </Button>
                    </div>

                    {booth.nozzles.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No nozzles configured</p>
                        <p className="text-xs">
                          Click "Add Nozzle" to get started
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {booth.nozzles.map((nozzle) => (
                          <div
                            key={nozzle.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {nozzle.code}
                              </div>
                              <div className="text-xs text-gray-500">
                                {nozzle.productName ||
                                  (nozzle as any).Product?.name ||
                                  fuelOptions.find(
                                    (f) =>
                                      String(f.value) ===
                                      String(nozzle.productId)
                                  )?.label ||
                                  "Unknown Fuel"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openNozzleModal(true, nozzle, booth.id)
                                }
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteNozzle(nozzle.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}

              <CardFooter className="justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setExpandedBooth(isExpanded ? null : booth.id)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUpIcon className="h-4 w-4 mr-1" />
                      Hide Nozzles
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon className="h-4 w-4 mr-1" />
                      Manage Nozzles
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteBooth(booth.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Booth Modal */}
      <Modal
        isOpen={boothModal.open}
        onClose={() =>
          setBoothModal({
            open: false,
            editing: false,
            data: { name: "", code: "" },
            boothId: "",
          })
        }
        className="max-w-md w-full"
      >
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">
            {boothModal.editing ? "Edit Booth" : "Add New Booth"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Booth Name
              </label>
              <Input
                value={boothModal.data.name}
                onChange={(e) =>
                  setBoothModal((prev) => ({
                    ...prev,
                    data: { ...prev.data, name: e.target.value },
                  }))
                }
                placeholder="e.g., Frontage - Unit 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Booth Code
              </label>
              <Input
                value={boothModal.data.code}
                onChange={(e) =>
                  setBoothModal((prev) => ({
                    ...prev,
                    data: { ...prev.data, code: e.target.value },
                  }))
                }
                placeholder="e.g., F-001"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() =>
                setBoothModal({
                  open: false,
                  editing: false,
                  data: { name: "", code: "" },
                  boothId: "",
                })
              }
            >
              Cancel
            </Button>
            <Button onClick={saveBooth}>
              {boothModal.editing ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Nozzle Modal */}
      <Modal
        isOpen={nozzleModal.open}
        onClose={() =>
          setNozzleModal({
            open: false,
            editing: false,
            data: { code: "", productId: "" },
            nozzleId: "",
            boothId: "",
          })
        }
        className="max-w-md w-full"
      >
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">
            {nozzleModal.editing ? "Edit Nozzle" : "Add New Nozzle"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nozzle Code
              </label>
              <Input
                value={nozzleModal.data.code}
                onChange={(e) =>
                  setNozzleModal((prev) => ({
                    ...prev,
                    data: { ...prev.data, code: e.target.value },
                  }))
                }
                placeholder="e.g., NO1, NO2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Fuel Type
              </label>
              <Select
                options={fuelOptions}
                defaultValue={nozzleModal.data.productId}
                onChange={(value) =>
                  setNozzleModal((prev) => ({
                    ...prev,
                    data: { ...prev.data, productId: value },
                  }))
                }
                placeholder="Select fuel type"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() =>
                setNozzleModal({
                  open: false,
                  editing: false,
                  data: { code: "", productId: "" },
                  nozzleId: "",
                  boothId: "",
                })
              }
            >
              Cancel
            </Button>
            <Button onClick={saveNozzle}>
              {nozzleModal.editing ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StationSetup;
