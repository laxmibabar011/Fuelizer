import React, { useState, useEffect } from "react";
import { Card } from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import { AccountSelect } from "../../../components/ui/Select";
import {
  Settings,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Link,
} from "lucide-react";
import LedgerIntegrationService, {
  IntegrationSettings,
} from "../../../services/ledgerIntegrationService";
import LedgerService from "../../../services/ledgerService";
import { LedgerAccountDTO } from "../../../types/ledger";

const IntegrationSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<IntegrationSettings>({
    purchaseAutoEntries: false,
    salesAutoEntries: false,
    customerPaymentAutoEntries: false,
    defaultExpenseAccountId: undefined,
    defaultRevenueAccountId: undefined,
    defaultCashAccountId: undefined,
    defaultBankAccountId: undefined,
  });

  const [accounts, setAccounts] = useState<LedgerAccountDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [settingsResponse, accountsResponse] = await Promise.all([
        LedgerIntegrationService.getIntegrationSettings(),
        LedgerService.getAccounts(),
      ]);

      if (settingsResponse.data.success) {
        setSettings(settingsResponse.data.data);
      }

      if (accountsResponse.data.success) {
        setAccounts(accountsResponse.data.data);
      }
    } catch (err) {
      setError("Failed to load integration settings");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (
    key: keyof IntegrationSettings,
    value: boolean | number | null
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response =
        await LedgerIntegrationService.updateIntegrationSettings(settings);

      if (response.data.success) {
        setSuccess("Integration settings saved successfully!");
        setSettings(response.data.data);
      } else {
        setError(response.data.message || "Failed to save settings");
      }
    } catch (err) {
      setError("Failed to save integration settings");
      console.error("Error saving settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const testIntegration = async (
    type: "purchase" | "sales" | "customer_payment"
  ) => {
    try {
      setError(null);
      setSuccess(null);

      let testData;
      switch (type) {
        case "purchase":
          testData = {
            id: 1,
            vendor_id: 1,
            invoice_number: "TEST-INV-001",
            invoice_date: new Date().toISOString().split("T")[0],
            total_amount: 1000.0,
            cgst_amount: 90.0,
            sgst_amount: 90.0,
            igst_amount: 0.0,
            Vendor: { name: "Test Vendor" },
          };
          break;
        case "sales":
          testData = [
            {
              Date: new Date().toISOString().split("T")[0],
              "Bill Mode": "Cash",
              "Party Name": "Test Customer",
              "Invoice Value": 500.0,
              "Taxable Value": 450.0,
              CGST: 22.5,
              SGST: 22.5,
              IGST: 0.0,
            },
          ];
          break;
        case "customer_payment":
          testData = {
            id: 1,
            customerName: "Test Customer",
            amount: 500.0,
            paymentMethod: "Cash",
            paymentDate: new Date().toISOString().split("T")[0],
            referenceNumber: "TEST-PAY-001",
          };
          break;
      }

      const response = await LedgerIntegrationService.testIntegration(
        type,
        testData
      );

      if (response.data.success) {
        setSuccess(
          `${type.charAt(0).toUpperCase() + type.slice(1)} integration test completed successfully!`
        );
      } else {
        setError(response.data.message || "Integration test failed");
      }
    } catch (err) {
      setError(
        `${type.charAt(0).toUpperCase() + type.slice(1)} integration test failed`
      );
      console.error(`Error testing ${type} integration:`, err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading integration settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Integration Settings
          </h1>
          <p className="text-gray-600">
            Configure automatic journal entry creation for Purchase, Sales, and
            Credit Management modules
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}

      {/* Auto-Entry Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Link className="h-5 w-5" />
          Automatic Journal Entry Creation
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Purchase Module</h4>
              <p className="text-sm text-gray-600">
                Automatically create journal entries when purchases are created
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.purchaseAutoEntries}
                onChange={(e) =>
                  handleSettingChange("purchaseAutoEntries", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Sales Module</h4>
              <p className="text-sm text-gray-600">
                Automatically create journal entries when sales are recorded
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.salesAutoEntries}
                onChange={(e) =>
                  handleSettingChange("salesAutoEntries", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Customer Payments</h4>
              <p className="text-sm text-gray-600">
                Automatically create journal entries for customer payments
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.customerPaymentAutoEntries}
                onChange={(e) =>
                  handleSettingChange(
                    "customerPaymentAutoEntries",
                    e.target.checked
                  )
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Default Account Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Default Account Mappings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Expense Account
            </label>
            <AccountSelect
              accounts={accounts}
              value={settings.defaultExpenseAccountId || null}
              onChange={(accountId) =>
                handleSettingChange("defaultExpenseAccountId", accountId)
              }
              placeholder="Select default expense account"
              filterTypes={["Direct Expense", "Indirect Expense"]}
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for purchase transactions
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Revenue Account
            </label>
            <AccountSelect
              accounts={accounts}
              value={settings.defaultRevenueAccountId || null}
              onChange={(accountId) =>
                handleSettingChange("defaultRevenueAccountId", accountId)
              }
              placeholder="Select default revenue account"
              filterTypes={["Customer"]}
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for sales transactions
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Cash Account
            </label>
            <AccountSelect
              accounts={accounts}
              value={settings.defaultCashAccountId || null}
              onChange={(accountId) =>
                handleSettingChange("defaultCashAccountId", accountId)
              }
              placeholder="Select default cash account"
              filterTypes={["Asset"]}
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for cash transactions
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Bank Account
            </label>
            <AccountSelect
              accounts={accounts}
              value={settings.defaultBankAccountId || null}
              onChange={(accountId) =>
                handleSettingChange("defaultBankAccountId", accountId)
              }
              placeholder="Select default bank account"
              filterTypes={["Bank"]}
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for bank transactions
            </p>
          </div>
        </div>
      </Card>

      {/* Integration Testing */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Integration Testing
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => testIntegration("purchase")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Link className="h-4 w-4" />
            Test Purchase Integration
          </Button>

          <Button
            onClick={() => testIntegration("sales")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Link className="h-4 w-4" />
            Test Sales Integration
          </Button>

          <Button
            onClick={() => testIntegration("customer_payment")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Link className="h-4 w-4" />
            Test Customer Payment
          </Button>
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default IntegrationSettingsPage;
