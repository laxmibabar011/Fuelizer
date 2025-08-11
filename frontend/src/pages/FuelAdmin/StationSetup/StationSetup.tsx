import React from "react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { BuildingIcon, PlusIcon } from "../../../icons";

const StationSetup: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Station Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure booths, nozzles, and fuel mapping
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Booth
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booths/Dispensing Units */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <BuildingIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">Booths/Dispensing Units</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Frontage - Unit 1</h3>
              <p className="text-sm text-gray-600">Code: F-001</p>
              <div className="mt-2 flex space-x-2">
                <Button size="sm" variant="outline">
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  Manage Nozzles
                </Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Backyard - Unit 2</h3>
              <p className="text-sm text-gray-600">Code: B-002</p>
              <div className="mt-2 flex space-x-2">
                <Button size="sm" variant="outline">
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  Manage Nozzles
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Nozzles & Fuel Mapping */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <BuildingIcon className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold">Nozzles & Fuel Mapping</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Nozzle P1</h3>
              <p className="text-sm text-gray-600">Booth: Frontage - Unit 1</p>
              <p className="text-sm text-gray-600">Fuel: Petrol</p>
              <div className="mt-2 flex space-x-2">
                <Button size="sm" variant="outline">
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  Change Fuel
                </Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Nozzle P2</h3>
              <p className="text-sm text-gray-600">Booth: Frontage - Unit 1</p>
              <p className="text-sm text-gray-600">Fuel: Diesel</p>
              <div className="mt-2 flex space-x-2">
                <Button size="sm" variant="outline">
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  Change Fuel
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Coming Soon Notice */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="text-center">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Configuration Hub - Station Setup
          </h3>
          <p className="text-yellow-700">
            This page will allow you to configure booths, nozzles, and fuel
            mapping. Full functionality coming soon.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default StationSetup;
