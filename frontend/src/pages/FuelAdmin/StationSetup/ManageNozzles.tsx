import React, { useMemo, useState } from "react";
import { useLocation, useParams } from "react-router";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Modal } from "../../../components/ui/modal";
import Select from "../../../components/form/Select";
import Switch from "../../../components/form/switch/Switch";
import { PencilIcon, TrashBinIcon, PlusIcon } from "../../../icons";

interface NozzleRow {
  id: string;
  code: string;
  fuel: string;
  status: "active" | "inactive";
  updatedAt: string;
}

const sampleRows: NozzleRow[] = [
  { id: "1", code: "P1", fuel: "Petrol", status: "active", updatedAt: "2025-01-10 14:22" },
  { id: "2", code: "D2", fuel: "Diesel", status: "inactive", updatedAt: "2025-01-08 09:10" },
  { id: "3", code: "PP3", fuel: "Power Petrol", status: "active", updatedAt: "2025-01-05 18:35" },
];

const fuelOptions = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "power-petrol", label: "Power Petrol" },
];

const ManageNozzles: React.FC = () => {
  // Read booth info from router
  const { boothId } = useParams();
  const location = useLocation();
  const boothName = (location.state as any)?.boothName || `Booth ${boothId}`;

  const [rows, setRows] = useState<NozzleRow[]>(sampleRows);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<{ code: string; fuel: string; active: boolean }>({
    code: "",
    fuel: "",
    active: true,
  });

  const modalTitle = useMemo(
    () => (isEdit ? `Edit Nozzle ${form.code}` : `Add New Nozzle to ${boothName}`),
    [isEdit, form.code, boothName]
  );

  const openAdd = () => {
    setIsEdit(false);
    setForm({ code: "", fuel: "", active: true });
    setIsModalOpen(true);
  };

  const openEdit = (row: NozzleRow) => {
    setIsEdit(true);
    setForm({ code: row.code, fuel: row.fuel.toLowerCase().replace(" ", "-"), active: row.status === "active" });
    setIsModalOpen(true);
  };

  const saveNozzle = () => {
    if (isEdit) {
      setRows((prev) =>
        prev.map((r) =>
          r.code === form.code
            ? {
                ...r,
                fuel:
                  fuelOptions.find((f) => f.value === form.fuel)?.label || r.fuel,
                status: form.active ? "active" : "inactive",
                updatedAt: new Date().toLocaleString(),
              }
            : r
        )
      );
    } else {
      setRows((prev) => [
        ...prev,
        {
          id: String(prev.length + 1),
          code: form.code || `NZ${prev.length + 1}`,
          fuel: fuelOptions.find((f) => f.value === form.fuel)?.label || "",
          status: form.active ? "active" : "inactive",
          updatedAt: new Date().toLocaleString(),
        },
      ]);
    }
    setIsModalOpen(false);
  };

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div>
        <PageBreadcrumb pageTitle={`Configuration Hub / Station Setup / ${boothName}`} />
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nozzles for {boothName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage mapping and status for nozzles under this booth.
          </p>
        </div>
        <Button startIcon={<PlusIcon className="h-4 w-4" />} onClick={openAdd}>
          Add Nozzle
        </Button>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <Table className="">
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800">
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nozzle Code
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mapped Fuel Product
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {row.code}
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {row.fuel}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {row.status === "active" ? (
                    <Badge className="bg-green-500 text-white border-transparent">Active</Badge>
                  ) : (
                    <Badge className="bg-gray-300 text-gray-900 dark:bg-gray-700 dark:text-gray-100 border-transparent">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {row.updatedAt}
                </TableCell>
                <TableCell className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-3">
                    <button
                      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Edit"
                      onClick={() => openEdit(row)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600"
                      aria-label="Delete"
                      onClick={() => removeRow(row.id)}
                    >
                      <TrashBinIcon className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Nozzle Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-xl w-full">
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{modalTitle}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Configure the nozzle code, mapped fuel product, and active status.
          </p>

          <div className="space-y-5">
            {/* Nozzle Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nozzle Code
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
                placeholder="e.g., P1, D2"
                disabled={isEdit}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>

            {/* Fuel Mapping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Map to Fuel Product
              </label>
              <Select
                options={fuelOptions}
                placeholder="Select fuel product"
                defaultValue={form.fuel}
                onChange={(value) => setForm((s) => ({ ...s, fuel: value }))}
              />
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nozzle Status
              </span>
              <Switch
                label={form.active ? "Active" : "Inactive"}
                defaultChecked={form.active}
                onChange={(checked) => setForm((s) => ({ ...s, active: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNozzle}>{isEdit ? "Update Nozzle" : "Save Nozzle"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageNozzles;
