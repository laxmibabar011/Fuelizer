import React from "react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { BoltIcon, FuelIcon, DollarLineIcon, ClockIcon } from "../../../icons";

const LiveMonitoring: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Live Sales Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time view of sales happening right now
          </p>
        </div>
        <div className="flex space-x-2">
          <Button className="bg-green-600 hover:bg-green-700">
            <ClockIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <BoltIcon className="h-4 w-4 mr-2" />
            Auto Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nozzle P1 - Petrol */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <FuelIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">Nozzle P1 (Petrol)</h2>
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">₹12,450</p>
              <p className="text-sm text-gray-600">Total Sales Today</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold">128.5</p>
                <p className="text-sm text-gray-600">Litres Sold</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">₹96.72</p>
                <p className="text-sm text-gray-600">Rate</p>
              </div>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">Active - Rajesh Kumar</p>
            </div>
          </div>
        </Card>

        {/* Nozzle P2 - Diesel */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <FuelIcon className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold">Nozzle P2 (Diesel)</h2>
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">₹8,962</p>
              <p className="text-sm text-gray-600">Total Sales Today</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold">100.0</p>
                <p className="text-sm text-gray-600">Litres Sold</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">₹89.62</p>
                <p className="text-sm text-gray-600">Rate</p>
              </div>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">Active - Priya Sharma</p>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <DollarLineIcon className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold">Today's Summary</h2>
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">₹21,412</p>
              <p className="text-sm text-gray-600">Total Sales</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold">228.5</p>
                <p className="text-sm text-gray-600">Total Litres</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">2</p>
                <p className="text-sm text-gray-600">Active Nozzles</p>
              </div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">Last Updated: 2:30 PM</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <p className="font-medium">Nozzle P1 - Petrol</p>
              <p className="text-sm text-gray-600">15.5 litres @ ₹96.72</p>
            </div>
            <div className="text-right">
              <p className="font-medium">₹1,499.16</p>
              <p className="text-sm text-gray-600">2:28 PM</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <p className="font-medium">Nozzle P2 - Diesel</p>
              <p className="text-sm text-gray-600">20.0 litres @ ₹89.62</p>
            </div>
            <div className="text-right">
              <p className="font-medium">₹1,792.40</p>
              <p className="text-sm text-gray-600">2:25 PM</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <p className="font-medium">Nozzle P1 - Petrol</p>
              <p className="text-sm text-gray-600">12.0 litres @ ₹96.72</p>
            </div>
            <div className="text-right">
              <p className="font-medium">₹1,160.64</p>
              <p className="text-sm text-gray-600">2:22 PM</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Coming Soon Notice */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="text-center">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Daily Operations - Live Monitoring
          </h3>
          <p className="text-yellow-700">
            This page will show real-time sales data with periodic updates. Full
            functionality coming soon.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LiveMonitoring;
