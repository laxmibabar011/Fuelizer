import React from "react";
import PageMeta from "../../components/common/PageMeta";

const Transactions: React.FC = () => {
  return (
    <>
      <PageMeta
        title="Transactions | FUELIZER"
        description="Manage and view all fuel transactions"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <div className="p-8 rounded-lg bg-brand-50 dark:bg-gray-900 shadow text-center">
            <h1 className="text-3xl font-bold text-brand-600 mb-2">Transactions</h1>
            <p className="text-lg text-gray-700 dark:text-gray-200">
              Manage and view all fuel transactions.<br />
              Track sales, payments, and transaction history.
            </p>
          </div>
        </div>

        <div className="col-span-12">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow relative">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold">Transaction Management</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10">Coming Soon</span>
            </div>
            
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Transaction Management Coming Soon
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                This page is under development. Your friend will implement the transaction management features here including transaction lists, details, and reporting.
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder cards for future features */}
        <div className="col-span-12 md:col-span-6">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow relative">
            <h2 className="text-xl font-semibold mb-2">Transaction List</h2>
            <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">Coming soon</span>
            <div className="animate-pulse space-y-3 mt-4">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
        
        <div className="col-span-12 md:col-span-6">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow relative">
            <h2 className="text-xl font-semibold mb-2">Transaction Filters</h2>
            <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">Coming soon</span>
            <div className="animate-pulse space-y-3 mt-4">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
        
        <div className="col-span-12 lg:col-span-8">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow relative">
            <h2 className="text-xl font-semibold mb-2">Transaction Analytics</h2>
            <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">Coming soon</span>
            <div className="animate-pulse space-y-3 mt-4">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
        
        <div className="col-span-12 lg:col-span-4">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow relative">
            <h2 className="text-xl font-semibold mb-2">Quick Stats</h2>
            <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">Coming soon</span>
            <div className="animate-pulse space-y-3 mt-4">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Transactions;
