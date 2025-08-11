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
  Clock,
  Users,
  Plus,
  Edit,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";

interface Shift {
  id: string;
  name: string;
  timeRange: string;
  status: "not-started" | "active" | "completed";
  operators: string[];
  operatorCount: number;
  maxOperators: number;
  handoverNotes?: string;
}

interface Operator {
  id: string;
  name: string;
  status: "available" | "assigned" | "unavailable";
  currentShift?: string;
}

const shifts: Shift[] = [
  {
    id: "1",
    name: "Morning Shift",
    timeRange: "6:00 AM - 2:00 PM",
    status: "active",
    operators: ["OP001", "OP003", "OP005", "OP007"],
    operatorCount: 4,
    maxOperators: 5,
    handoverNotes: "Pump 3 nozzle needs attention. Tank 2 refilled at 5:30 AM.",
  },
  {
    id: "2",
    name: "Afternoon Shift",
    timeRange: "2:00 PM - 10:00 PM",
    status: "not-started",
    operators: ["OP002", "OP004", "OP006"],
    operatorCount: 3,
    maxOperators: 5,
  },
  {
    id: "3",
    name: "Night Shift",
    timeRange: "10:00 PM - 6:00 AM",
    status: "completed",
    operators: ["OP008", "OP009", "OP010"],
    operatorCount: 3,
    maxOperators: 4,
    handoverNotes: "All systems normal. Security patrol completed at 3:00 AM.",
  },
];

const operators: Operator[] = [
  { id: "OP001", name: "Rajesh Kumar", status: "assigned", currentShift: "1" },
  { id: "OP002", name: "Priya Sharma", status: "available" },
  { id: "OP003", name: "Amit Singh", status: "assigned", currentShift: "1" },
  { id: "OP004", name: "Sunita Devi", status: "available" },
  { id: "OP005", name: "Vikram Yadav", status: "assigned", currentShift: "1" },
  { id: "OP006", name: "Meera Patel", status: "available" },
  { id: "OP007", name: "Ravi Gupta", status: "assigned", currentShift: "1" },
  { id: "OP008", name: "Anjali Verma", status: "unavailable" },
  { id: "OP009", name: "Suresh Reddy", status: "unavailable" },
  { id: "OP010", name: "Kavita Joshi", status: "unavailable" },
];

const ShiftManagement: React.FC = () => {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case "not-started":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "not-started":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOperatorStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "unavailable":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Shift Management System
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage operator shifts and assignments
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create New Shift
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
            <Edit className="h-4 w-4 mr-2" />
            Modify Shift
          </Button>
        </div>
      </div>

      {/* Shift Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Shift Timeline - Today</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                6:00 AM
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                2:00 PM
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                10:00 PM
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                6:00 AM
              </span>
            </div>
            <div className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-1/3 bg-green-500 opacity-80"></div>
              <div className="absolute left-1/3 top-0 h-full w-1/3 bg-yellow-500 opacity-60"></div>
              <div className="absolute left-2/3 top-0 h-full w-1/3 bg-blue-500 opacity-80"></div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                Morning (Active)
              </span>
              <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                Afternoon (Pending)
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Night (Completed)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shift Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shifts.map((shift) => (
          <Card key={shift.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(shift.status)}
                  <div>
                    <CardTitle className="text-lg">{shift.name}</CardTitle>
                    <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{shift.timeRange}</span>
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(shift.status)}>
                  {shift.status.replace("-", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Operator Count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Operators
                    </span>
                  </div>
                  <div className="text-sm font-medium">
                    {shift.operatorCount}/{shift.maxOperators}
                  </div>
                </div>

                {/* Operator Assignment Progress */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(shift.operatorCount / shift.maxOperators) * 100}%`,
                    }}
                  ></div>
                </div>

                {/* Assigned Operators */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assigned Operators:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {shift.operators.map((opId) => {
                      const operator = operators.find((op) => op.id === opId);
                      return (
                        <Badge key={opId} variant="outline" className="text-xs">
                          {operator?.name.split(" ")[0]}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Handover Notes */}
                {shift.handoverNotes && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                      Handover Notes:
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-400">
                      {shift.handoverNotes}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedShift(shift)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Manage Shift
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Available Operators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Operator Availability</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {operators.map((operator) => (
              <div
                key={operator.id}
                className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700"
              >
                <div>
                  <div className="font-medium text-sm">{operator.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {operator.id}
                  </div>
                </div>
                <Badge className={getOperatorStatusColor(operator.status)}>
                  {operator.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShiftManagement;
