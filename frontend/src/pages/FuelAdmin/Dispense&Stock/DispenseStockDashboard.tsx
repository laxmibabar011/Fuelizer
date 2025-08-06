import React from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs/Tabs";
import { Gauge, Database } from "lucide-react";

const DispenseStockDashboard: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dispense & Stock Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Monitor meter readings and manage fuel stock in tanks
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="meter-readings">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="meter-readings"
            className="flex items-center gap-2"
          >
            <Gauge className="h-4 w-4" />
            <span className="hidden sm:inline">Meter Readings</span>
          </TabsTrigger>
          <TabsTrigger
            value="stock-management"
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Stock Management</span>
          </TabsTrigger>
        </TabsList>

        {/* Meter Readings Tab */}
        <TabsContent value="meter-readings" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Meter Readings
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor and manage dispenser meter readings
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-gray-600 dark:text-gray-400">
              Meter readings functionality coming soon...
            </p>
          </div>
        </TabsContent>

        {/* Stock Management Tab */}
        <TabsContent value="stock-management" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Stock Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor fuel stock levels in tanks
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-gray-600 dark:text-gray-400">
              Stock management functionality coming soon...
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DispenseStockDashboard;
