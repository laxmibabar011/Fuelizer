import React from "react";

interface Tab {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

interface SalesTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const tabs: Tab[] = [
  {
    id: "sales-entry",
    name: "Sales Entry",
    icon: "➕",
    description: "Create manual sales entries",
  },
  {
    id: "pos-export",
    name: "POS Export",
    icon: "📊",
    description: "Export POS transactions to sales",
  },
  {
    id: "all-sales",
    name: "All Sales",
    icon: "📋",
    description: "View and manage all sales records",
  },
  {
    id: "transactions",
    name: "Transactions",
    icon: "🖧",
    description: "Live POS transactions",
  },
];

const SalesTabs: React.FC<SalesTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors group ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{tab.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{tab.name}</div>
                  {tab.description && (
                    <div className="text-xs text-gray-400 group-hover:text-gray-500">
                      {tab.description}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default SalesTabs;
