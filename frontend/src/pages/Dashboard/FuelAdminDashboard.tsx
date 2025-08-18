import PageMeta from "../../components/common/PageMeta";
import {
  FuelIcon,
  ReportIcon,
  CogIcon,
  UsersIcon,
  ChartIcon,
  ClockIcon,
  DollarLineIcon,
  CreditCardIcon,
  BuildingIcon,
} from "../../icons";

export default function FuelAdminDashboard() {
  return (
    <>
      <PageMeta
        title="Fuel Admin Dashboard | FUELIZER"
        description="Fuel Admin Dashboard for FUELIZER platform"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <div className="p-8 rounded-lg bg-brand-50 dark:bg-gray-900 shadow text-center">
            <h1 className="text-3xl font-bold text-brand-600 mb-2">Welcome, Fuel Admin!</h1>
            <p className="text-lg text-gray-700 dark:text-gray-200">
              This is your Admin Dashboard.<br />
              Here you will manage your company's data and settings.
            </p>
          </div>
        </div>
        {/* Key stats - placeholders */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="p-5 rounded-lg bg-white dark:bg-gray-800 shadow relative overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 size-10">
                <FuelIcon className="size-5" />
              </span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Fuel Sold</p>
                <p className="text-2xl font-semibold">—</p>
              </div>
            </div>
            <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">Coming soon</span>
          </div>
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="p-5 rounded-lg bg-white dark:bg-gray-800 shadow relative overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 size-10">
                <DollarLineIcon className="size-5" />
              </span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
                <p className="text-2xl font-semibold">—</p>
              </div>
            </div>
            <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">Coming soon</span>
          </div>
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="p-5 rounded-lg bg-white dark:bg-gray-800 shadow relative overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 size-10">
                <BuildingIcon className="size-5" />
              </span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Stations</p>
                <p className="text-2xl font-semibold">—</p>
              </div>
            </div>
            <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">Coming soon</span>
          </div>
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="p-5 rounded-lg bg-white dark:bg-gray-800 shadow relative overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 size-10">
                <UsersIcon className="size-5" />
              </span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Approvals</p>
                <p className="text-2xl font-semibold">—</p>
              </div>
            </div>
            <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">Coming soon</span>
          </div>
        </div>

        {/* Quick Actions - demo only */}
        <div className="col-span-12">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold">Quick Actions</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10">Demo</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <button type="button" className="group flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-brand-50/50 dark:hover:bg-gray-700/50 transition cursor-not-allowed" disabled aria-disabled="true">
                <span className="inline-flex items-center justify-center size-10 rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/10">
                  <CogIcon className="size-5" />
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Set Fuel Price</span>
                <span className="text-[11px] text-gray-400">Coming soon</span>
              </button>
              <button type="button" className="group flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-brand-50/50 dark:hover:bg-gray-700/50 transition cursor-not-allowed" disabled aria-disabled="true">
                <span className="inline-flex items-center justify-center size-10 rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/10">
                  <ReportIcon className="size-5" />
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Daily Report</span>
                <span className="text-[11px] text-gray-400">Coming soon</span>
              </button>
              <button type="button" className="group flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-brand-50/50 dark:hover:bg-gray-700/50 transition cursor-not-allowed" disabled aria-disabled="true">
                <span className="inline-flex items-center justify-center size-10 rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/10">
                  <BuildingIcon className="size-5" />
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Manage Stations</span>
                <span className="text-[11px] text-gray-400">Coming soon</span>
              </button>
              <button type="button" className="group flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-brand-50/50 dark:hover:bg-gray-700/50 transition cursor-not-allowed" disabled aria-disabled="true">
                <span className="inline-flex items-center justify-center size-10 rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/10">
                  <CreditCardIcon className="size-5" />
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Add Credit Client</span>
                <span className="text-[11px] text-gray-400">Coming soon</span>
              </button>
              <button type="button" className="group flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-brand-50/50 dark:hover:bg-gray-700/50 transition cursor-not-allowed" disabled aria-disabled="true">
                <span className="inline-flex items-center justify-center size-10 rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/10">
                  <ClockIcon className="size-5" />
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Shift Schedule</span>
                <span className="text-[11px] text-gray-400">Coming soon</span>
              </button>
              <button type="button" className="group flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-brand-50/50 dark:hover:bg-gray-700/50 transition cursor-not-allowed" disabled aria-disabled="true">
                <span className="inline-flex items-center justify-center size-10 rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/10">
                  <ChartIcon className="size-5" />
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Sales Analytics</span>
                <span className="text-[11px] text-gray-400">Coming soon</span>
              </button>
            </div>
          </div>
        </div>

        {/* Placeholder content cards */}
        <div className="col-span-12 md:col-span-6">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow relative">
            <h2 className="text-xl font-semibold mb-2">Company Overview</h2>
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
            <h2 className="text-xl font-semibold mb-2">User Overview</h2>
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
            <h2 className="text-xl font-semibold mb-2">Live Monitoring</h2>
            <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">Coming soon</span>
            <div className="animate-pulse space-y-3 mt-4">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow relative">
            <h2 className="text-xl font-semibold mb-2">Inventory Snapshot</h2>
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
} 