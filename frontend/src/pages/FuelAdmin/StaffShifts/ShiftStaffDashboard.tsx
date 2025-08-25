// import React, { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs/Tabs";
import {
  Users,
  UserPlus,
  Clock,
  BarChart2,
  Calendar,
  Shield,
} from "lucide-react";
import OperatorOnboarding from "./OperatorOnboarding";
import OperatorManagement from "./OperatorManagement";
import ManagerManagement from "./ManagerManagement";
import ShiftManagement from "./ShiftManagement";
import OperatorGroups from "./OperatorGroups";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

const ShiftStaffDashboard: React.FC = () => {
  const navigate = useNavigate();
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
      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="operators" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Operators</span>
          </TabsTrigger>
          <TabsTrigger value="managers" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Managers</span>
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Onboarding</span>
          </TabsTrigger>
          <TabsTrigger value="shifts" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Shifts</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Groups</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm"
                />
                <span className="text-sm text-gray-500">to</span>
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm"
                />
              </div>
              <select className="border rounded px-2 py-1 text-sm">
                <option>All Shifts</option>
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Night</option>
              </select>
              <select className="border rounded px-2 py-1 text-sm">
                <option>All Duties</option>
                <option>Cashier</option>
                <option>Attendant</option>
              </select>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Apply
              </Button>
            </div>
          </Card>

          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-xs text-gray-500">Total Shifts</div>
              <div className="text-2xl font-bold">0</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-500">Completed</div>
              <div className="text-2xl font-bold">0</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-500">Attendance Rate</div>
              <div className="text-2xl font-bold">0%</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-500">Absences</div>
              <div className="text-2xl font-bold">0</div>
            </Card>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4">
              <div className="font-medium mb-3">Shifts by Day</div>
              <div className="text-sm text-gray-500">Coming soon</div>
            </Card>
            <Card className="p-4">
              <div className="font-medium mb-3">Operator Attendance</div>
              <div className="text-sm text-gray-500">Coming soon</div>
            </Card>
          </div>
        </TabsContent>

        {/* Operators Tab */}
        <TabsContent value="operators" className="space-y-6">
          <OperatorManagement />
        </TabsContent>

        {/* Managers Tab */}
        <TabsContent value="managers" className="space-y-6">
          <ManagerManagement />
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

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-6">
          <OperatorGroups />
        </TabsContent>
      </Tabs>

      {/* Connection to Daily Operations */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-medium text-blue-800 mb-1">
              Daily assignments moved to Today's Setup
            </h3>
            <p className="text-blue-700 text-sm">
              Perform Shift & Staff assignments and Booths in Daily Operations →
              Today's Setup.
            </p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() =>
              navigate("/fuel-admin/operations/today-setup?tab=nozzles")
            }
          >
            Go to Booths
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShiftStaffDashboard;
