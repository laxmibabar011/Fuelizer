import React from "react";

// Mock data for demonstration
const partnerInfo = {
  companyName: "Acme Corp",
  contactName: "John Doe",
  contactEmail: "john.doe@acme.com",
  creditLimit: 500000,
  currentBalance: 120000,
  status: "Active",
};

const recentTransactions = [
  {
    id: 1,
    date: "2024-07-01",
    description: "Fuel Purchase",
    amount: -20000,
    balance: 130000,
  },
  {
    id: 2,
    date: "2024-06-28",
    description: "Credit Payment",
    amount: 30000,
    balance: 150000,
  },
  {
    id: 3,
    date: "2024-06-25",
    description: "Fuel Purchase",
    amount: -30000,
    balance: 120000,
  },
];

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

const PartnerDashboard: React.FC = () => {
  const availableCredit = partnerInfo.creditLimit - partnerInfo.currentBalance;
  const utilization =
    partnerInfo.creditLimit > 0
      ? (partnerInfo.currentBalance / partnerInfo.creditLimit) * 100
      : 0;

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome, {partnerInfo.contactName}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here is your credit account overview
        </p>
      </div>

      {/* Credit Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Credit Limit
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ₹{partnerInfo.creditLimit.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Current Balance
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            ₹{partnerInfo.currentBalance.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Available Credit
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            ₹{availableCredit.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Credit Utilization Bar */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Credit Utilization
        </label>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className="bg-brand-600 h-4 rounded-full"
            style={{ width: `${utilization}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>0%</span>
          <span>{utilization.toFixed(1)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Status */}
      <div className="mb-8">
        <span
          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
            partnerInfo.status
          )}`}
        >
          {partnerInfo.status}
        </span>
      </div>

      {/* Recent Transactions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Transactions
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {tx.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {tx.description}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${tx.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                    >
                      {tx.amount < 0 ? "-" : "+"}₹
                      {Math.abs(tx.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ₹{tx.balance.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile/Account Details */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Account Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Company Name
            </p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {partnerInfo.companyName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Contact Name
            </p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {partnerInfo.contactName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Contact Email
            </p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {partnerInfo.contactEmail}
            </p>
          </div>
        </div>
      </div>

      {/* Support/Help */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Need Help?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          If you have any questions or need assistance, please contact support.
        </p>
        <a
          href="mailto:support@fuelizer.com"
          className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
};

export default PartnerDashboard;
