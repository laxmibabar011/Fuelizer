import React, { useState, useEffect } from "react";
import { Card } from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Download,
  Settings,
  TrendingUp,
  Database,
  FileText,
  DollarSign,
} from "lucide-react";
import {
  dataIntegrity,
  ValidationResult,
} from "../../../utils/dataIntegrity";
import LedgerService from "../../../services/ledgerService";
import { LedgerAccountDTO, JournalEntryDTO, JournalEntryWithLinesDTO } from "../../../types/ledger";

const DataIntegrity: React.FC = () => {
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [accounts, setAccounts] = useState<LedgerAccountDTO[]>([]);
  const [vouchers, setVouchers] = useState<JournalEntryWithLinesDTO[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryDTO[]>([]);

  const [checkOptions, setCheckOptions] = useState({
    checkBalances: true,
    checkDuplicates: true,
    checkReferences: true,
    checkBusinessRules: true,
    checkAccountingPrinciples: true,
    includeWarnings: true,
  });

  const [selectedTab, setSelectedTab] = useState<
    "overview" | "errors" | "warnings" | "settings"
  >("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountsResponse, vouchersResponse] = await Promise.all([
        LedgerService.getAccounts(),
        LedgerService.getVouchers(),
      ]);

      // Extract data from API responses
      const accountsData = accountsResponse.data || [];
      const vouchersData = vouchersResponse.data || [];
      
      // Extract journal entries from vouchers
      const journalEntriesData: JournalEntryDTO[] = vouchersData.map(voucher => ({
        id: voucher.id,
        voucher_number: voucher.voucher_number,
        voucher_type: voucher.voucher_type,
        voucher_date: voucher.voucher_date,
        reference_number: voucher.reference_number,
        description: voucher.description,
        total_amount: voucher.total_amount,
        status: voucher.status,
        createdAt: voucher.createdAt,
        updatedAt: voucher.updatedAt
      }));

      setAccounts(accountsData);
      setVouchers(vouchersData);
      setJournalEntries(journalEntriesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const runIntegrityCheck = async () => {
    setLoading(true);
    try {
      const result = await dataIntegrity.performIntegrityCheck(
        accounts,
        vouchers,
        journalEntries,
        checkOptions
      );

      setValidationResult(result);
      setLastCheckTime(new Date());
    } catch (error) {
      console.error("Integrity check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!validationResult) return;

    const reportData = {
      timestamp: new Date().toISOString(),
      score: validationResult.score,
      isValid: validationResult.isValid,
      summary: {
        totalErrors: validationResult.errors.length,
        totalWarnings: validationResult.warnings.length,
        criticalErrors: validationResult.errors.filter(
          (e) => e.severity === "error"
        ).length,
      },
      errors: validationResult.errors,
      warnings: validationResult.warnings,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `data-integrity-report-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return "bg-green-100 border-green-200";
    if (score >= 70) return "bg-yellow-100 border-yellow-200";
    if (score >= 50) return "bg-orange-100 border-orange-200";
    return "bg-red-100 border-red-200";
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "warning":
        return <Info className="w-4 h-4 text-yellow-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "BALANCE_MISMATCH":
        return <DollarSign className="w-4 h-4" />;
      case "DUPLICATE_DATA":
        return <FileText className="w-4 h-4" />;
      case "REFERENTIAL_INTEGRITY":
        return <Database className="w-4 h-4" />;
      case "BUSINESS_RULE":
        return <Settings className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Data Integrity</h1>
        </div>
        <div className="flex space-x-3">
          {validationResult && (
            <Button
              onClick={exportReport}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </Button>
          )}
          <Button
            onClick={runIntegrityCheck}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Checking..." : "Run Check"}</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Accounts</p>
              <p className="text-2xl font-bold text-gray-900">
                {accounts.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Vouchers</p>
              <p className="text-2xl font-bold text-gray-900">
                {vouchers.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Journal Entries</p>
              <p className="text-2xl font-bold text-gray-900">
                {journalEntries.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Last Check</p>
              <p className="text-sm font-medium text-gray-900">
                {lastCheckTime ? lastCheckTime.toLocaleString() : "Never"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Integrity Score */}
      {validationResult && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${getScoreBackground(
                  validationResult.score
                )}`}
              >
                <span
                  className={`text-2xl font-bold ${getScoreColor(
                    validationResult.score
                  )}`}
                >
                  {validationResult.score}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Data Integrity Score
                </h3>
                <p className="text-gray-600">
                  {validationResult.isValid
                    ? "All critical checks passed"
                    : "Issues found that need attention"}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  <span className="flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>
                      {
                        validationResult.errors.filter(
                          (e) => e.severity === "error"
                        ).length
                      }{" "}
                      Errors
                    </span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Info className="w-4 h-4 text-yellow-600" />
                    <span>{validationResult.warnings.length} Warnings</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600">Checked on</p>
              <p className="font-medium">{lastCheckTime?.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      {validationResult && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "overview", label: "Overview", icon: TrendingUp },
              {
                id: "errors",
                label: `Errors (${
                  validationResult.errors.filter((e) => e.severity === "error")
                    .length
                })`,
                icon: AlertTriangle,
              },
              {
                id: "warnings",
                label: `Warnings (${validationResult.warnings.length})`,
                icon: Info,
              },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Tab Content */}
      {validationResult && (
        <div>
          {selectedTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Error Categories */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Issues by Category
                </h3>
                <div className="space-y-3">
                  {Object.entries(
                    [
                      ...validationResult.errors,
                      ...validationResult.warnings,
                    ].reduce((acc, item) => {
                      acc[item.category] = (acc[item.category] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(category)}
                        <span className="text-sm font-medium">
                          {category.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent Issues */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Critical Issues
                </h3>
                <div className="space-y-3">
                  {validationResult.errors
                    .filter((e) => e.severity === "error")
                    .slice(0, 5)
                    .map((error, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200"
                      >
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900">
                            {error.message}
                          </p>
                          {error.suggestion && (
                            <p className="text-xs text-red-700 mt-1">
                              {error.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  {validationResult.errors.filter((e) => e.severity === "error")
                    .length === 0 && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">No critical issues found</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {selectedTab === "errors" && (
            <Card>
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Errors</h3>
                <p className="text-sm text-gray-600">
                  Critical issues that need immediate attention
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {validationResult.errors
                  .filter((e) => e.severity === "error")
                  .map((error, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(error.severity)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {getCategoryIcon(error.category)}
                            <span className="text-sm font-medium text-gray-900">
                              {error.category.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 mb-2">
                            {error.message}
                          </p>
                          {error.suggestion && (
                            <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                              <strong>Suggestion:</strong> {error.suggestion}
                            </p>
                          )}
                          {error.affectedRecords &&
                            error.affectedRecords.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-600">
                                  Affected records:{" "}
                                  {error.affectedRecords.join(", ")}
                                </p>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                {validationResult.errors.filter((e) => e.severity === "error")
                  .length === 0 && (
                  <div className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">No errors found</p>
                    <p className="text-sm text-gray-500">
                      Your data integrity is excellent!
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {selectedTab === "warnings" && (
            <Card>
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Warnings
                </h3>
                <p className="text-sm text-gray-600">
                  Issues that should be reviewed but don't prevent normal
                  operation
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {validationResult.warnings.map((warning, index) => (
                  <div key={index} className="p-4">
                    <div className="flex items-start space-x-3">
                      <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {getCategoryIcon(warning.category)}
                          <span className="text-sm font-medium text-gray-900">
                            {warning.category.replace(/_/g, " ")}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              warning.impact === "high"
                                ? "bg-red-100 text-red-800"
                                : warning.impact === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {warning.impact} impact
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-2">
                          {warning.message}
                        </p>
                        <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                          <strong>Suggestion:</strong> {warning.suggestion}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {validationResult.warnings.length === 0 && (
                  <div className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">No warnings found</p>
                    <p className="text-sm text-gray-500">
                      Your data follows all best practices!
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {selectedTab === "settings" && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Check Settings
              </h3>
              <div className="space-y-4">
                {Object.entries(checkOptions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </label>
                      <p className="text-xs text-gray-600">
                        {key === "checkBalances" &&
                          "Verify that all vouchers are balanced (debits = credits)"}
                        {key === "checkDuplicates" &&
                          "Look for duplicate account names, codes, and voucher numbers"}
                        {key === "checkReferences" &&
                          "Ensure all references between records are valid"}
                        {key === "checkBusinessRules" &&
                          "Validate business logic and accounting rules"}
                        {key === "checkAccountingPrinciples" &&
                          "Check adherence to accounting principles"}
                        {key === "includeWarnings" &&
                          "Include warnings in addition to errors"}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) =>
                          setCheckOptions((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* No Results State */}
      {!validationResult && !loading && (
        <Card className="p-12 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Data Integrity Check
          </h3>
          <p className="text-gray-600 mb-6">
            Run a comprehensive check to validate your accounting data integrity
          </p>
          <Button
            onClick={runIntegrityCheck}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Run Integrity Check
          </Button>
        </Card>
      )}
    </div>
  );
};

export default DataIntegrity;
