// import React, { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs/Tabs";
import { Users, UserPlus, Clock, Settings } from "lucide-react";
import OperatorOnboarding from "./OperatorOnboarding";
import OperatorList from "./OperatorList";

const ShiftStaffDashboard: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Shift & Staff Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage fuel operators, shifts, and staff operations efficiently
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="operators">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="operators" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Operators</span>
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Onboarding</span>
          </TabsTrigger>
          <TabsTrigger value="shifts" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Shifts</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Operators Tab */}
        <TabsContent value="operators" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Fuel Operators
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all fuel operators in your station
            </p>
          </div>
          <OperatorList />
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Operator Onboarding
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Add new fuel operators to your station
            </p>
          </div>
          <OperatorOnboarding />
        </TabsContent>

        {/* Shifts Tab */}
        <TabsContent value="shifts" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Shift Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage shifts and operator assignments
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-gray-600 dark:text-gray-400">
              Shift management functionality coming soon...
            </p>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Staff Settings
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Configure staff management settings
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-gray-600 dark:text-gray-400">
              Settings functionality coming soon...
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShiftStaffDashboard;
