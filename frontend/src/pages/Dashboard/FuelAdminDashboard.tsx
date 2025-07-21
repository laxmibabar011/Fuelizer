import PageMeta from "../../components/common/PageMeta";

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
              This is your FUELIZER Fuel Admin Dashboard.<br />
              Here you will manage your company's data and settings.
            </p>
          </div>
        </div>
        {/* Placeholder for future widgets/sections */}
        <div className="col-span-12 md:col-span-6">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow">
            <h2 className="text-xl font-semibold mb-2">Company Overview</h2>
            <p className="text-gray-500 dark:text-gray-400">Company stats and management coming soon...</p>
          </div>
        </div>
        <div className="col-span-12 md:col-span-6">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow">
            <h2 className="text-xl font-semibold mb-2">User Overview</h2>
            <p className="text-gray-500 dark:text-gray-400">User stats and management coming soon...</p>
          </div>
        </div>
      </div>
    </>
  );
} 