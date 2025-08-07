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
import { CheckCircle, Clock, AlertTriangle, Calendar } from "lucide-react";

const ApprovalsWorkflow: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Approvals Workflow
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Maker-checker workflow for credit approvals and requests
          </p>
        </div>
        <Button>
          <CheckCircle className="h-4 w-4 mr-2" />
          Review Pending
        </Button>
      </div>

      {/* Approval Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">12</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">8</div>
            <p className="text-xs text-muted-foreground">+2 from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rejected Today
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <p className="text-xs text-muted-foreground">-1 from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5h</div>
            <p className="text-xs text-muted-foreground">Within SLA</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>
            Review and approve pending credit requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {[
                  {
                    id: "CR-001",
                    customer: "ABC Transport",
                    type: "Credit Limit Increase",
                    amount: "₹50,000",
                    requestedBy: "John Doe",
                    status: "Pending",
                    time: "2h ago",
                  },
                  {
                    id: "CR-002",
                    customer: "XYZ Logistics",
                    type: "New Customer",
                    amount: "₹25,000",
                    requestedBy: "Jane Smith",
                    status: "Pending",
                    time: "4h ago",
                  },
                  {
                    id: "CR-003",
                    customer: "DEF Cargo",
                    type: "Credit Limit Increase",
                    amount: "₹75,000",
                    requestedBy: "Mike Johnson",
                    status: "Pending",
                    time: "6h ago",
                  },
                ].map((request, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {request.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {request.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {request.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {request.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {request.requestedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className="text-orange-600 border-orange-600"
                      >
                        {request.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Approval Workflow Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Configuration</CardTitle>
          <CardDescription>
            Configure approval workflow settings and rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auto-approval Limit
                </label>
                <input
                  type="text"
                  value="₹10,000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SLA Time
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white">
                  <option>4 hours</option>
                  <option>8 hours</option>
                  <option>24 hours</option>
                  <option>48 hours</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Approval Levels
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked className="rounded" />
                  <span className="text-sm">
                    Level 1: Credit Officer (₹0 - ₹25,000)
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked className="rounded" />
                  <span className="text-sm">
                    Level 2: Senior Manager (₹25,000 - ₹100,000)
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked className="rounded" />
                  <span className="text-sm">Level 3: Director (₹100,000+)</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Notice */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Advanced Approval Workflow Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This will include multi-level approvals, automated routing, audit
              trails, and compliance features.
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="outline">Multi-level</Badge>
              <Badge variant="outline">Auto Routing</Badge>
              <Badge variant="outline">Audit Trail</Badge>
              <Badge variant="outline">Compliance</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalsWorkflow;
