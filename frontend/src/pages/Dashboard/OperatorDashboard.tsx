import { useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import {
  FuelIcon,
  ReportIcon,
  CogIcon,
  ChartIcon,
  ClockIcon,
  DollarLineIcon,
  CreditCardIcon,
  BuildingIcon,
} from "../../icons";

export default function OperatorDashboard() {
  const navigate = useNavigate();

  const handlePOSModeClick = () => {
    navigate("/operator/pos");
  };

  return (
    <>
      <PageMeta
        title="Operator Dashboard | FUELIZER"
        description="Operator Dashboard for FUELIZER POS system"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <div className="p-8 rounded-lg bg-brand-50 dark:bg-gray-900 shadow text-center">
            <h1 className="text-3xl font-bold text-brand-600 mb-2">
              Welcome, Operator!
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-200">
              This is your POS Dashboard.
              <br />
              Manage transactions and fuel dispensing operations efficiently.
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
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Today's Transactions
                </p>
                <p className="text-2xl font-semibold">0</p>
              </div>
            </div>
            <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
              Live
            </span>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="p-5 rounded-lg bg-white dark:bg-gray-800 shadow relative overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 size-10">
                <DollarLineIcon className="size-5" />
              </span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Today's Revenue
                </p>
                <p className="text-2xl font-semibold">₹0</p>
              </div>
            </div>
            <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
              Live
            </span>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="p-5 rounded-lg bg-white dark:bg-gray-800 shadow relative overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 size-10">
                <BuildingIcon className="size-5" />
              </span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Available Booths
                </p>
                <p className="text-2xl font-semibold">0</p>
              </div>
            </div>
            <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
              Live
            </span>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="p-5 rounded-lg bg-white dark:bg-gray-800 shadow relative overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 size-10">
                <ClockIcon className="size-5" />
              </span>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Current Shift
                </p>
                <p className="text-lg font-semibold">Not Assigned</p>
              </div>
            </div>
            <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
              Status
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-12">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold">Quick Actions</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10">
                POS
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {/* POS Mode Button - Primary Action */}
              <button
                type="button"
                onClick={handlePOSModeClick}
                className="group flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 transition-all transform hover:scale-105"
              >
                <span className="inline-flex items-center justify-center size-12 rounded-md bg-blue-500 text-white">
                  <CogIcon className="size-6" />
                </span>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  POS Mode
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400">
                  Start transactions
                </span>
              </button>

              <button
                type="button"
                className="group flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-brand-50/50 dark:hover:bg-gray-700/50 transition"
              >
                <span className="inline-flex items-center justify-center size-10 rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/10">
                  <FuelIcon className="size-5" />
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  New Transaction
                </span>
                <span className="text-[11px] text-gray-400">Start sale</span>
              </button>

              <button
                type="button"
                className="group flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-brand-50/50 dark:hover:bg-gray-700/50 transition"
              >
                <span className="inline-flex items-center justify-center size-10 rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/10">
                  <ReportIcon className="size-5" />
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  View Reports
                </span>
                <span className="text-[11px] text-gray-400">Daily summary</span>
              </button>

              <button
                type="button"
                className="group flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-brand-50/50 dark:hover:bg-gray-700/50 transition"
              >
                <span className="inline-flex items-center justify-center size-10 rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/10">
                  <BuildingIcon className="size-5" />
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Booth Status
                </span>
                <span className="text-[11px] text-gray-400">
                  Check availability
                </span>
              </button>

              <button
                type="button"
                className="group flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-brand-50/50 dark:hover:bg-gray-700/50 transition"
              >
                <span className="inline-flex items-center justify-center size-10 rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/10">
                  <CreditCardIcon className="size-5" />
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Payment Methods
                </span>
                <span className="text-[11px] text-gray-400">
                  Cash, Card, UPI
                </span>
              </button>

              <button
                type="button"
                className="group flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-brand-50/50 dark:hover:bg-gray-700/50 transition"
              >
                <span className="inline-flex items-center justify-center size-10 rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/10">
                  <ClockIcon className="size-5" />
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Shift Info
                </span>
                <span className="text-[11px] text-gray-400">
                  Current schedule
                </span>
              </button>

              <button
                type="button"
                className="group flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-brand-50/50 dark:hover:bg-gray-700/50 transition"
              >
                <span className="inline-flex items-center justify-center size-10 rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/10">
                  <ChartIcon className="size-5" />
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  My Performance
                </span>
                <span className="text-[11px] text-gray-400">
                  Personal stats
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Placeholder content cards */}
        <div className="col-span-12 md:col-span-6">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow relative">
            <h2 className="text-xl font-semibold mb-2">Recent Transactions</h2>
            <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
              Coming soon
            </span>
            <div className="animate-pulse space-y-3 mt-4">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-6">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow relative">
            <h2 className="text-xl font-semibold mb-2">Booth Status</h2>
            <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
              Coming soon
            </span>
            <div className="animate-pulse space-y-3 mt-4">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow relative">
            <h2 className="text-xl font-semibold mb-2">
              Live Transaction Monitor
            </h2>
            <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
              Coming soon
            </span>
            <div className="animate-pulse space-y-3 mt-4">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow relative">
            <h2 className="text-xl font-semibold mb-2">Fuel Levels</h2>
            <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
              Coming soon
            </span>
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
