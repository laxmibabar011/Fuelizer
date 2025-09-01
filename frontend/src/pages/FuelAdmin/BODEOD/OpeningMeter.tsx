import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import { GridIcon, BoltIcon, ClockIcon, DollarLineIcon, PlusIcon, CalenderIcon } from "../../../icons";

const OpeningMeter: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle>Opening Meter Readings</CardTitle>
              <p className="text-sm text-gray-600">Record opening meter readings for all nozzles</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CalenderIcon className="h-4 w-4" />
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Meter Readings Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Nozzles</p>
                  <p className="text-2xl font-bold text-blue-600">12</p>
                </div>
                <BoltIcon className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Readings Entered</p>
                  <p className="text-2xl font-bold text-green-600">8</p>
                </div>
                <ClockIcon className="h-8 w-8 text-green-400" />
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">4</p>
                </div>
                <GridIcon className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Yesterday's Total</p>
                  <p className="text-2xl font-bold text-purple-600">₹45,230</p>
                </div>
                <DollarLineIcon className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Meter Readings Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Today's Meter Readings</h3>
              <Button size="sm" variant="outline">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Reading
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">Pump (Nozzle)</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">Opening</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">Test</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">Closing</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">Sales (L)</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">Amount (₹)</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[{ code: "NO1", fuel: "Petrol" }, { code: "NO2", fuel: "Diesel" }, { code: "NO3", fuel: "Petrol" }].map((nz) => (
                    <tr key={nz.code} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                        <div>
                          <div className="font-medium">{nz.code}</div>
                          <div className="text-xs text-gray-500">{nz.fuel}</div>
                        </div>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                        <Input type="number" step={0.01} className="w-20 h-8 text-sm" placeholder="0.00" />
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                        <Input type="number" step={0.01} className="w-20 h-8 text-sm" placeholder="0.00" />
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                        <Input type="number" step={0.01} className="w-20 h-8 text-sm" placeholder="0.00" />
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                        <span className="text-sm font-medium">0.00</span>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                        <span className="text-sm font-medium">₹0.00</span>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                        <Button size="sm" variant="outline" className="h-8">Save</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Yesterday's Readings History */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <GridIcon className="h-6 w-6 text-purple-600" />
                <div>
                  <CardTitle>Yesterday's Readings History</CardTitle>
                  <p className="text-sm text-gray-600">Reference for today's readings</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">Pump</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">Opening</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">Closing</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">Sales (L)</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                        <div>
                          <div className="font-medium">NO1</div>
                          <div className="text-xs text-gray-500">Petrol</div>
                        </div>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm">1,250.50</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm">1,450.75</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium">200.25</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium">₹19,368.18</td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                        <div>
                          <div className="font-medium">NO2</div>
                          <div className="text-xs text-gray-500">Diesel</div>
                        </div>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm">2,100.00</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm">2,350.25</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium">250.25</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium">₹22,398.88</td>
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                        <div>
                          <div className="font-medium">NO3</div>
                          <div className="text-xs text-gray-500">Petrol</div>
                        </div>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm">800.00</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm">950.50</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium">150.50</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium">₹14,562.36</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpeningMeter;


