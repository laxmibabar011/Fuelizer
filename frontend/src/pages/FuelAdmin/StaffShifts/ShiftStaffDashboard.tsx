import React, { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs/Tabs";
import { Users, UserPlus, Clock, Settings } from "lucide-react";
import OperatorOnboarding from "./OperatorOnboarding";
import OperatorManagement from "./OperatorManagement";
import ShiftManagement from "./ShiftManagement";
import StaffSettings from "./StaffSettings";

const ShiftStaffDashboard: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Staff & Shifts Configuration
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure staff onboarding, shift definitions, and management settings
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
          <OperatorManagement />
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
          <ShiftManagement />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <StaffSettings />
        </TabsContent>
      </Tabs>

      {/* Connection to Daily Operations */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            Connected to Daily Operations
          </h3>
          <p className="text-blue-700">
            Staff and shifts configured here will be available for daily
            assignments in Daily Operations → Today's Setup.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShiftStaffDashboard;
