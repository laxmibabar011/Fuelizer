import React from "react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import {
  GridIcon,
  BoltIcon,
  ClockIcon,
  FuelIcon,
  DollarLineIcon,
  UsersIcon,
} from "../../../icons";

const TodaySetup: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Today's Setup (BOD)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Beginning of Day checklist and setup
          </p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <GridIcon className="h-4 w-4 mr-2" />
          Complete Setup
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Rate Manager */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <FuelIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">Fuel Rate Manager</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Petrol</h3>
              <p className="text-sm text-gray-600">Current Rate: ₹96.72</p>
              <div className="mt-2">
                <input
                  type="number"
                  placeholder="Enter today's rate"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Diesel</h3>
              <p className="text-sm text-gray-600">Current Rate: ₹89.62</p>
              <div className="mt-2">
                <input
                  type="number"
                  placeholder="Enter today's rate"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Shift & Staff Assignment */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <UsersIcon className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold">Shift & Staff Assignment</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Morning Shift (6:00 AM - 2:00 PM)</h3>
              <p className="text-sm text-gray-600">Staff: 3 assigned</p>
              <div className="mt-2 flex space-x-2">
                <Button size="sm" variant="outline">
                  Assign Staff
                </Button>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">
                Evening Shift (2:00 PM - 10:00 PM)
              </h3>
              <p className="text-sm text-gray-600">Staff: 2 assigned</p>
              <div className="mt-2 flex space-x-2">
                <Button size="sm" variant="outline">
                  Assign Staff
                </Button>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Nozzle Assignment */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <BoltIcon className="h-6 w-6 text-yellow-600 mr-3" />
            <h2 className="text-xl font-semibold">Nozzle Assignment</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Nozzle P1 (Petrol)</h3>
              <p className="text-sm text-gray-600">Assigned to: Rajesh Kumar</p>
              <div className="mt-2 flex space-x-2">
                <Button size="sm" variant="outline">
                  Reassign
                </Button>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Nozzle P2 (Diesel)</h3>
              <p className="text-sm text-gray-600">Assigned to: Priya Sharma</p>
              <div className="mt-2 flex space-x-2">
                <Button size="sm" variant="outline">
                  Reassign
                </Button>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Opening Readings */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <ClockIcon className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold">Opening Readings</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Meter Readings</h3>
              <p className="text-sm text-gray-600">All nozzles verified</p>
              <div className="mt-2 flex space-x-2">
                <Button size="sm" variant="outline">
                  View Details
                </Button>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Tank Stock</h3>
              <p className="text-sm text-gray-600">Dip readings entered</p>
              <div className="mt-2 flex space-x-2">
                <Button size="sm" variant="outline">
                  View Details
                </Button>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Opening Cash</h3>
              <p className="text-sm text-gray-600">₹5,000.00</p>
              <div className="mt-2 flex space-x-2">
                <Button size="sm" variant="outline">
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  Verify
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Setup Progress */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="text-center">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            Setup Progress
          </h3>
          <div className="flex justify-center space-x-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm mx-auto mb-1">
                ✓
              </div>
              <p className="text-sm text-blue-700">Fuel Rates</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm mx-auto mb-1">
                ✓
              </div>
              <p className="text-sm text-blue-700">Staff Assignment</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm mx-auto mb-1">
                ✓
              </div>
              <p className="text-sm text-blue-700">Nozzle Assignment</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm mx-auto mb-1">
                !
              </div>
              <p className="text-sm text-blue-700">Opening Readings</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Coming Soon Notice */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="text-center">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Daily Operations - Today's Setup
          </h3>
          <p className="text-yellow-700">
            This page will provide a step-by-step wizard for Beginning of Day
            setup. Full functionality coming soon.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TodaySetup;
