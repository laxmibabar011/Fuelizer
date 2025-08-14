import React from "react";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import {
  ReportIcon,
  ChartIcon,
  FuelIcon,
  UsersIcon,
} from "../../../icons";

const Reports: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Business insights and performance analysis
          </p>
        </div>
        <div className="flex space-x-2">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <ReportIcon className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <ChartIcon className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Report */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <ReportIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">Daily Sales Report (DSR)</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Today's Summary</h3>
              <p className="text-sm text-gray-600">Date: 15 Dec 2024</p>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-lg font-semibold text-green-600">
                    ₹21,412
                  </p>
                  <p className="text-sm text-gray-600">Total Sales</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-blue-600">228.5L</p>
                  <p className="text-sm text-gray-600">Total Litres</p>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Nozzle Performance</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">P1 (Petrol)</span>
                  <span className="text-sm font-medium">₹12,450</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">P2 (Diesel)</span>
                  <span className="text-sm font-medium">₹8,962</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                View Details
              </Button>
              <Button size="sm" variant="outline">
                Download PDF
              </Button>
            </div>
          </div>
        </Card>

        {/* Stock Reconciliation */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <FuelIcon className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold">Stock Reconciliation</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Petrol Tank</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Opening Stock</span>
                  <span className="text-sm">15,000L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Closing Stock</span>
                  <span className="text-sm">14,771.5L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Meter Stock</span>
                  <span className="text-sm">128.5L</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-sm">Variance</span>
                  <span className="text-sm text-green-600">0.0L</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                View Details
              </Button>
              <Button size="sm" variant="outline">
                Download Report
              </Button>
            </div>
          </div>
        </Card>

        {/* Operator Performance */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <UsersIcon className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold">Operator Performance</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Rajesh Kumar</h3>
              <p className="text-sm text-gray-600">Nozzle P1 - Petrol</p>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-lg font-semibold text-green-600">
                    ₹12,450
                  </p>
                  <p className="text-sm text-gray-600">Sales</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-blue-600">128.5L</p>
                  <p className="text-sm text-gray-600">Litres</p>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Priya Sharma</h3>
              <p className="text-sm text-gray-600">Nozzle P2 - Diesel</p>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-lg font-semibold text-green-600">₹8,962</p>
                  <p className="text-sm text-gray-600">Sales</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-blue-600">100.0L</p>
                  <p className="text-sm text-gray-600">Litres</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                View Details
              </Button>
              <Button size="sm" variant="outline">
                Download Report
              </Button>
            </div>
          </div>
        </Card>

        {/* Sales Trends */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <ChartIcon className="h-6 w-6 text-orange-600 mr-3" />
            <h2 className="text-xl font-semibold">Sales Trends</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Weekly Overview</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Monday</span>
                  <span className="text-sm font-medium">₹18,500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Tuesday</span>
                  <span className="text-sm font-medium">₹19,200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Wednesday</span>
                  <span className="text-sm font-medium">₹20,100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Today</span>
                  <span className="text-sm font-medium text-green-600">
                    ₹21,412
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <h3 className="font-medium text-blue-800">Growth Trend</h3>
              <p className="text-sm text-blue-700">+15.7% vs last week</p>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                View Chart
              </Button>
              <Button size="sm" variant="outline">
                Export Data
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="text-center">
          <h3 className="text-lg font-medium text-blue-800 mb-4">
            Quick Report Actions
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="bg-white">
              <ReportIcon className="h-4 w-4 mr-2" />
              Daily Sales Report
            </Button>
            <Button variant="outline" className="bg-white">
              <FuelIcon className="h-4 w-4 mr-2" />
              Stock Reconciliation
            </Button>
            <Button variant="outline" className="bg-white">
              <UsersIcon className="h-4 w-4 mr-2" />
              Operator Performance
            </Button>
            <Button variant="outline" className="bg-white">
              <ChartIcon className="h-4 w-4 mr-2" />
              Sales Trends
            </Button>
          </div>
        </div>
      </Card>

      {/* Coming Soon Notice */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="text-center">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Reports & Analytics
          </h3>
          <p className="text-yellow-700">
            This page will provide comprehensive business insights with visual
            charts, performance analytics, and automated report generation. Full
            functionality coming soon.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Reports;
