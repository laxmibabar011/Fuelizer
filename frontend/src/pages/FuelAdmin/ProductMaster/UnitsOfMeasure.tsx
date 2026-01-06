import React from "react";
import { Card } from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import { Badge } from "../../../components/ui/badge";
import ProductMasterService from "../../../services/productMasterService";
import { PlusCircle } from "lucide-react";

type UoM = {
  id: number;
  name: string;
  code: string;
};

interface UnitsOfMeasureProps {
  uoms: UoM[];
  onRefresh: () => void;
}

const UnitsOfMeasure: React.FC<UnitsOfMeasureProps> = ({ uoms, onRefresh }) => {
  const handleAddUom = () => {
    const name = prompt("Unit name (e.g., Litre):");
    const code = prompt("Unit code (e.g., LTR):");
    if (name && code) {
      ProductMasterService.createUom({ name, code })
        .then(() => {
          onRefresh();
          window.alert("Unit of Measure created successfully");
        })
        .catch(() =>
          window.alert("Failed to create Unit of Measure")
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Units of Measure
          </h2>
          <Badge variant="outline" className="text-sm">
            {uoms.length} units
          </Badge>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={handleAddUom}
          startIcon={<PlusCircle className="h-4 w-4" />}
        >
          Add Unit
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {uoms.map((uom) => (
          <Card key={uom.id} className="p-4">
            <div className="text-center">
              <h3 className="font-semibold text-lg">{uom.name}</h3>
              <p className="text-sm text-gray-500">Code: {uom.code}</p>
            </div>
          </Card>
        ))}
        {uoms.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-10">
            No units of measure found. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitsOfMeasure;
