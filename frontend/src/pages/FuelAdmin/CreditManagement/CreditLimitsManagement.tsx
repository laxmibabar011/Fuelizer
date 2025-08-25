import React from "react";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Progress } from "../../../components/ui/progress";
import {
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Shield,
  Plus,
} from "lucide-react";

interface CreditLimitsManagementProps {
  creditStats: {
    totalPartners: number;
    totalCreditLimit: number;
    totalOutstanding: number;
  };
  recentPartners: Array<{
    id: number;
    companyName: string;
    contactEmail: string;
    creditLimit: number;
    status?: string;
  }>;
}

const CreditLimitsManagement: React.FC<CreditLimitsManagementProps> = ({
  creditStats,
  recentPartners,
}) => {
  const navigate = useNavigate();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "Suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Credit Limits Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage customer credit limits and risk assessment
          </p>
        </div>
        <Button onClick={() => navigate("/fuel-admin/credit-onboarding")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Credit Limits
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{Number(creditStats.totalCreditLimit).toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Credit Limit
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹
              {creditStats.totalPartners > 0
                ? Number(
                    creditStats.totalCreditLimit / creditStats.totalPartners
                  ).toLocaleString("en-IN")
                : "0"}
            </div>
            <p className="text-xs text-muted-foreground">Per customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilization Rate
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creditStats.totalCreditLimit > 0
                ? Math.round(
                    (creditStats.totalOutstanding /
                      creditStats.totalCreditLimit) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Credit utilization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Low</div>
            <p className="text-xs text-muted-foreground">
              Overall risk assessment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credit Limits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Credit Limits</CardTitle>
          <CardDescription>
            Manage and monitor individual customer credit limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Credit Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Utilization
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
                {recentPartners.slice(0, 3).map((partner) => {
                  const utilization =
                    partner.creditLimit > 0
                      ? Math.round((0 / partner.creditLimit) * 100)
                      : 0;
                  return (
                    <tr
                      key={partner.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {partner.companyName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            {partner.contactEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ₹{Number(partner.creditLimit).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ₹0
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Progress value={utilization} className="w-16 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {utilization}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={getStatusColor(partner.status)}
                        >
                          {partner.status || "Active"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/fuel-admin/credit-partners/${partner.id}`)}>
                          Adjust Limit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Notice */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Advanced Credit Management Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This will include risk assessment, credit scoring, automated limit
              adjustments, and compliance features.
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="outline">Risk Assessment</Badge>
              <Badge variant="outline">Credit Scoring</Badge>
              <Badge variant="outline">Auto Adjustments</Badge>
              <Badge variant="outline">Compliance</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditLimitsManagement;
