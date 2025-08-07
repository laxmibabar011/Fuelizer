import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Settings,
  Clock,
  Users,
  Shield,
  Bell,
  Save,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";

interface ShiftConfig {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  maxOperators: number;
  isActive: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
}

const defaultShifts: ShiftConfig[] = [
  {
    id: "1",
    name: "Morning Shift",
    startTime: "06:00",
    endTime: "14:00",
    maxOperators: 5,
    isActive: true,
  },
  {
    id: "2",
    name: "Afternoon Shift",
    startTime: "14:00",
    endTime: "22:00",
    maxOperators: 5,
    isActive: true,
  },
  {
    id: "3",
    name: "Night Shift",
    startTime: "22:00",
    endTime: "06:00",
    maxOperators: 4,
    isActive: true,
  },
];

const permissions: Permission[] = [
  {
    id: "1",
    name: "Operator Assignment",
    description: "Allow operators to be assigned to pumps and shifts",
    isEnabled: true,
  },
  {
    id: "2",
    name: "Shift Management",
    description: "Create, edit, and manage shift schedules",
    isEnabled: true,
  },
  {
    id: "3",
    name: "Performance Tracking",
    description: "Track operator performance and metrics",
    isEnabled: true,
  },
  {
    id: "4",
    name: "Break Management",
    description: "Manage operator breaks and time-off",
    isEnabled: false,
  },
  {
    id: "5",
    name: "Certification Tracking",
    description: "Track operator certifications and training",
    isEnabled: true,
  },
];

const StaffSettings: React.FC = () => {
  const [shifts, setShifts] = useState<ShiftConfig[]>(defaultShifts);
  const [permissionSettings, setPermissionSettings] =
    useState<Permission[]>(permissions);
  const [notifications, setNotifications] = useState({
    shiftReminders: true,
    certificationExpiry: true,
    performanceAlerts: false,
    systemUpdates: true,
  });

  const togglePermission = (id: string) => {
    setPermissionSettings((prev) =>
      prev.map((perm) =>
        perm.id === id ? { ...perm, isEnabled: !perm.isEnabled } : perm
      )
    );
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Staff Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure staff management settings and preferences
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Shift Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Shift Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Default Shifts
              </h3>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Shift
              </Button>
            </div>

            <div className="grid gap-4">
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {shift.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </div>
                    <Badge variant="outline">
                      Max: {shift.maxOperators} operators
                    </Badge>
                    <Badge
                      className={
                        shift.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                      }
                    >
                      {shift.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Permissions & Access</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Feature Permissions
            </h3>

            <div className="grid gap-4">
              {permissionSettings.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {permission.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {permission.description}
                    </div>
                  </div>
                  <Button
                    variant={permission.isEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePermission(permission.id)}
                    className={
                      permission.isEnabled
                        ? "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                        : ""
                    }
                  >
                    {permission.isEnabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              System Notifications
            </h3>

            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Shift Reminders
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Get notified before shift changes
                  </div>
                </div>
                <Button
                  variant={notifications.shiftReminders ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleNotification("shiftReminders")}
                  className={
                    notifications.shiftReminders
                      ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      : ""
                  }
                >
                  {notifications.shiftReminders ? "On" : "Off"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Certification Expiry
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Alert when operator certifications expire
                  </div>
                </div>
                <Button
                  variant={
                    notifications.certificationExpiry ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => toggleNotification("certificationExpiry")}
                  className={
                    notifications.certificationExpiry
                      ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      : ""
                  }
                >
                  {notifications.certificationExpiry ? "On" : "Off"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Performance Alerts
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Notify about operator performance issues
                  </div>
                </div>
                <Button
                  variant={
                    notifications.performanceAlerts ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => toggleNotification("performanceAlerts")}
                  className={
                    notifications.performanceAlerts
                      ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      : ""
                  }
                >
                  {notifications.performanceAlerts ? "On" : "Off"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    System Updates
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Receive system update notifications
                  </div>
                </div>
                <Button
                  variant={notifications.systemUpdates ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleNotification("systemUpdates")}
                  className={
                    notifications.systemUpdates
                      ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      : ""
                  }
                >
                  {notifications.systemUpdates ? "On" : "Off"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>System Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Current Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Active Operators:
                  </span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Shifts:
                  </span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    System Version:
                  </span>
                  <span className="font-medium">v2.1.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Last Updated:
                  </span>
                  <span className="font-medium">2 hours ago</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Export Operator Data
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Backup Shift Schedules
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Reset Permissions
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffSettings;
