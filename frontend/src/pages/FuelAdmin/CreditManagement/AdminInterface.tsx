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
import { Users, Database, Clock, Shield, Plus } from "lucide-react";

const AdminInterface: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Interface
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            System administration and configuration management
          </p>
        </div>
        <Button>
          <Shield className="h-4 w-4 mr-2" />
          System Settings
        </Button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4 GB</div>
            <p className="text-xs text-muted-foreground">+12% this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* System Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>
              Manage core system settings and parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Credit Limit
                </label>
                <input
                  type="text"
                  value="₹50,000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Timeout
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white">
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>2 hours</option>
                  <option>4 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Backup Frequency
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked className="rounded" />
                <span className="text-sm">Enable audit logging</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked className="rounded" />
                <span className="text-sm">Enable email notifications</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage system users and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Admin Users
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Super administrators
                  </p>
                </div>
                <Badge variant="outline">3 users</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Fuel Admins
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Credit management
                  </p>
                </div>
                <Badge variant="outline">8 users</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Partners
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    External partners
                  </p>
                </div>
                <Badge variant="outline">15 users</Badge>
              </div>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add New User
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Logs</CardTitle>
          <CardDescription>
            Monitor recent system activities and events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                time: "2 min ago",
                event: "User login",
                user: "admin@fuelizer.com",
                status: "Success",
              },
              {
                time: "5 min ago",
                event: "Credit limit updated",
                user: "john@abc.com",
                status: "Success",
              },
              {
                time: "12 min ago",
                event: "Database backup",
                user: "System",
                status: "Success",
              },
              {
                time: "15 min ago",
                event: "New customer added",
                user: "jane@xyz.com",
                status: "Success",
              },
              {
                time: "20 min ago",
                event: "Failed login attempt",
                user: "unknown@test.com",
                status: "Failed",
              },
            ].map((log, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`h-2 w-2 rounded-full ${log.status === "Success" ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.event}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {log.user}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {log.time}
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      log.status === "Success"
                        ? "text-green-600 border-green-600"
                        : "text-red-600 border-red-600"
                    }
                  >
                    {log.status}
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
            <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Advanced Admin Features Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This will include advanced user management, role-based access
              control, system monitoring, and security features.
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="outline">RBAC</Badge>
              <Badge variant="outline">Monitoring</Badge>
              <Badge variant="outline">Security</Badge>
              <Badge variant="outline">Analytics</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInterface;
