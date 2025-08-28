import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SuperAdminSignIn from "./pages/AuthPages/SuperAdminSignIn";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/auth/PrivateRoute";
import SuperAdminDashboard from "./pages/Dashboard/SuperAdminDashboard";
import CreateClient from "./pages/SuperAdmin/CreateClient";
import ClientList from "./pages/SuperAdmin/ClientList";
import FuelAdminDashboard from "./pages/Dashboard/FuelAdminDashboard";
import CreditOnboarding from "./pages/FuelAdmin/CreditManagement/CreditOnboarding";
import CreditDashboard from "./pages/FuelAdmin/CreditManagement/CreditDashboard";
import CreditPartners from "./pages/FuelAdmin/CreditManagement/CreditPartners";
import PartnerDetails from "./pages/FuelAdmin/CreditManagement/PartnerDetails";
import VehicleOnboardingStep from "./pages/FuelAdmin/CreditManagement/VehicleOnboardingStep";
import DispenseStockDashboard from "./pages/FuelAdmin/Dispense&Stock/DispenseStockDashboard";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import PartnerDashboard from "./pages/Dashboard/CreditCustomerDashboard";
import ProductMasterDashboard from "./pages/FuelAdmin/ProductMaster/ProductMasterDashboard";
import ManageNozzles from "./pages/FuelAdmin/StationSetup/ManageNozzles";
import FuelRequest from "./pages/CreditCustomer/FuelRequest";
import RequestHistory from "./pages/CreditCustomer/RequestHistory";

// New Configuration Hub pages
import StationSetup from "./pages/FuelAdmin/StationSetup/StationSetup";
import ShiftStaffDashboard from "./pages/FuelAdmin/StaffShifts/ShiftStaffDashboard";

// New Daily Operations pages
import TodaySetup from "./pages/FuelAdmin/BODEOD/TodaySetup";
import LiveMonitoring from "./pages/FuelAdmin/LiveMonitoring/LiveMonitoring";
import EndOfDay from "./pages/FuelAdmin/BODEOD/EndOfDay";

// New Reports page
import ReportsDashboard from "./pages/FuelAdmin/Reports/ReportsDashboard";

// Operator pages
import OperatorDashboard from "./pages/Dashboard/OperatorDashboard";
import Transactions from "./pages/Operator/Transactions";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Public Welcome Page */}
          <Route path="/" element={<Blank />} />

          {/* Auth Layout */}
          <Route path="/login" element={<SignIn />} />
          <Route path="/super-admin-login" element={<SuperAdminSignIn />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* // --- ROUTE ASSIGNMENT START ---
// Assign new routes for each role below. 
// For shared routes, include both roles in allowedRoles.
// Example: allowedRoles={['super-admin', 'fuel-admin']} */}

          {/* Super Admin Protected Routes */}
          <Route
            element={
              <PrivateRoute allowedRoles={["super_admin"]}>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route
              path="/super-admin-dashboard"
              element={<SuperAdminDashboard />}
            />
            <Route
              path="/super-admin/create-client"
              element={<CreateClient />}
            />
            <Route path="/super-admin/clients" element={<ClientList />} />
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
          </Route>

          {/* Fuel Admin Protected Routes */}
          <Route
            element={
              <PrivateRoute allowedRoles={["fuel-admin"]}>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route
              path="/fuel-admin-dashboard"
              element={<FuelAdminDashboard />}
            />
            <Route path="/fuel-admin/credit" element={<CreditDashboard />} />

            {/* Configuration Hub Routes */}
            <Route
              path="/fuel-admin/configuration/station-setup"
              element={<StationSetup />}
            />
            <Route
              path="/fuel-admin/configuration/station-setup/:boothId/nozzles"
              element={<ManageNozzles />}
            />
            <Route
              path="/fuel-admin/configuration/product-master"
              element={<ProductMasterDashboard />}
            />
            <Route
              path="/fuel-admin/configuration/staff-shifts"
              element={<ShiftStaffDashboard />}
            />

            {/* Daily Operations Routes */}
            <Route
              path="/fuel-admin/operations/today-setup"
              element={<TodaySetup />}
            />
            <Route
              path="/fuel-admin/operations/live-monitoring"
              element={<LiveMonitoring />}
            />
            <Route
              path="/fuel-admin/operations/end-of-day"
              element={<EndOfDay />}
            />

            {/* Reports Route */}
            <Route path="/fuel-admin/reports" element={<ReportsDashboard />} />

            <Route
              path="/fuel-admin/credit-partners"
              element={<CreditPartners />}
            />
            <Route
              path="/fuel-admin/credit-partners/:id"
              element={<PartnerDetails />}
            />
            <Route
              path="/fuel-admin/credit-onboarding"
              element={<CreditOnboarding />}
            />
            <Route
              path="/fuel-admin/vehicle-onboarding/:partnerId"
              element={<VehicleOnboardingStep />}
            />
            <Route path="/fuel-admin/profile" element={<UserProfiles />} />
            <Route path="/fuel-admin/calendar" element={<Calendar />} />
            <Route
              path="/fuel-admin/product-master"
              element={<ProductMasterDashboard />}
            />
            <Route
              path="/fuel-admin/dispense-stock"
              element={<DispenseStockDashboard />}
            />
          </Route>

          {/* Partner Protected Routes */}
          <Route
            element={
              <PrivateRoute allowedRoles={["partner"]}>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route path="/partner-dashboard" element={<PartnerDashboard />} />
            <Route path="/partner/fuel-request" element={<FuelRequest />} />
            <Route
              path="/partner/request-history"
              element={<RequestHistory />}
            />
            <Route path="/partner/profile" element={<UserProfiles />} />
          </Route>

          {/* Operator Protected Routes */}
          <Route
            element={
              <PrivateRoute allowedRoles={["operator"]}>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route path="/operator" element={<OperatorDashboard />} />
            <Route path="/operator/transactions" element={<Transactions />} />
            <Route path="/operator/profile" element={<UserProfiles />} />
          </Route>

          {/* Forms */}
          <Route path="/form-elements" element={<FormElements />} />

          {/* Tables */}
          <Route path="/basic-tables" element={<BasicTables />} />

          {/* Ui Elements */}
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/avatars" element={<Avatars />} />
          <Route path="/badge" element={<Badges />} />
          <Route path="/buttons" element={<Buttons />} />
          <Route path="/images" element={<Images />} />
          <Route path="/videos" element={<Videos />} />

          {/* Charts */}
          <Route path="/line-chart" element={<LineChart />} />
          <Route path="/bar-chart" element={<BarChart />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
