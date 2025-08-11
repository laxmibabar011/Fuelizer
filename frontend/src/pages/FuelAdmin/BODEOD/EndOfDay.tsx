import React from "react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import {
  ClockIcon,
  FuelIcon,
  DollarLineIcon,
  ReportIcon,
} from "../../../icons";

const EndOfDay: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            End of Day (EOD)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Closing checklist and daily summary
          </p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700">
          <ReportIcon className="h-4 w-4 mr-2" />
          Close Day & Send Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Closing Meter Readings */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <ClockIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">Closing Meter Readings</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Nozzle P1 (Petrol)</h3>
              <p className="text-sm text-gray-600">Opening: 12,450.00</p>
              <div className="mt-2">
                <input
                  type="number"
                  placeholder="Enter closing reading"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Nozzle P2 (Diesel)</h3>
              <p className="text-sm text-gray-600">Opening: 8,962.00</p>
              <div className="mt-2">
                <input
                  type="number"
                  placeholder="Enter closing reading"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Closing Tank Stock */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <FuelIcon className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold">Closing Tank Stock</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Petrol Tank</h3>
              <p className="text-sm text-gray-600">Opening: 15,000 litres</p>
              <div className="mt-2">
                <input
                  type="number"
                  placeholder="Enter dip reading (cm)"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Diesel Tank</h3>
              <p className="text-sm text-gray-600">Opening: 12,000 litres</p>
              <div className="mt-2">
                <input
                  type="number"
                  placeholder="Enter dip reading (cm)"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Cash Reconciliation */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <DollarLineIcon className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold">Cash Reconciliation</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Opening Cash</h3>
              <p className="text-sm text-gray-600">₹5,000.00</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Total Sales (Calculated)</h3>
              <p className="text-sm text-gray-600">₹21,412.00</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Cash Collected</h3>
              <div className="mt-2">
                <input
                  type="number"
                  placeholder="Enter cash collected"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
              <h3 className="font-medium text-yellow-800">Variance</h3>
              <p className="text-sm text-yellow-700">₹0.00</p>
            </div>
          </div>
        </Card>

        {/* Daily Summary */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <ReportIcon className="h-6 w-6 text-red-600 mr-3" />
            <h2 className="text-xl font-semibold">Daily Summary</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Total Sales</h3>
              <p className="text-2xl font-bold text-green-600">₹21,412.00</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Total Litres Sold</h3>
              <p className="text-2xl font-bold text-blue-600">228.5</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Transactions</h3>
              <p className="text-2xl font-bold text-purple-600">45</p>
            </div>
            <div className="p-4 border rounded-lg bg-green-50 border-green-200">
              <h3 className="font-medium text-green-800">Status</h3>
              <p className="text-sm text-green-700">Ready to Close</p>
            </div>
          </div>
        </Card>
      </div>

      {/* EOD Checklist */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="text-center">
          <h3 className="text-lg font-medium text-blue-800 mb-4">
            End of Day Checklist
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm mx-auto mb-1">
                ✓
              </div>
              <p className="text-sm text-blue-700">Meter Readings</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm mx-auto mb-1">
                ✓
              </div>
              <p className="text-sm text-blue-700">Tank Stock</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm mx-auto mb-1">
                !
              </div>
              <p className="text-sm text-blue-700">Cash Reconciliation</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm mx-auto mb-1">
                -
              </div>
              <p className="text-sm text-blue-700">Generate Report</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Coming Soon Notice */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="text-center">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Daily Operations - End of Day
          </h3>
          <p className="text-yellow-700">
            This page will provide a comprehensive closing checklist and
            automatically generate daily sales reports. Full functionality
            coming soon.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default EndOfDay;
