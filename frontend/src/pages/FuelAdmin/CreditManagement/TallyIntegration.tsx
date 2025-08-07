import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { FileText, Database, Clock } from "lucide-react";

const TallyIntegration: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tally Integration
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Connect with Tally ERP for real-time financial data synchronization
          </p>
        </div>
        <Button>
          <Database className="h-4 w-4 mr-2" />
          Sync Data
        </Button>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Connection Status
            </CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Connected</div>
            <p className="text-xs text-muted-foreground">
              Last sync: 2 minutes ago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sync Frequency
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 min</div>
            <p className="text-xs text-muted-foreground">Auto sync interval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Mapped</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12/15</div>
            <p className="text-xs text-muted-foreground">Fields synchronized</p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Configuration</CardTitle>
          <CardDescription>
            Configure data synchronization settings with Tally ERP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tally Server URL
                </label>
                <input
                  type="text"
                  value="http://localhost:9000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sync Interval
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white">
                  <option>5 minutes</option>
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Data Fields to Sync
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked className="rounded" />
                  <span className="text-sm">Customer Data</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked className="rounded" />
                  <span className="text-sm">Transactions</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked className="rounded" />
                  <span className="text-sm">Credit Limits</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Reports</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sync Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Activity</CardTitle>
          <CardDescription>
            Monitor recent data synchronization activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                time: "2 min ago",
                status: "Success",
                records: 45,
                type: "Customer Data",
              },
              {
                time: "7 min ago",
                status: "Success",
                records: 23,
                type: "Transactions",
              },
              {
                time: "12 min ago",
                status: "Success",
                records: 12,
                type: "Credit Limits",
              },
              {
                time: "17 min ago",
                status: "Success",
                records: 67,
                type: "Customer Data",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.type}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.records} records
                  </p>
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-600"
                  >
                    {activity.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Notice */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Advanced Tally Integration Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This will include real-time data sync, custom field mapping, error
              handling, and advanced reporting features.
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="outline">Real-time Sync</Badge>
              <Badge variant="outline">Custom Mapping</Badge>
              <Badge variant="outline">Error Handling</Badge>
              <Badge variant="outline">Advanced Reports</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TallyIntegration;
