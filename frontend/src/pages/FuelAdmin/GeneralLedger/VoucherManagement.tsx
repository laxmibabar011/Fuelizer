import React, { useState, useEffect } from "react";
import { Card } from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import { CompactAccountSelect } from "../../../components/ui/Select";
import LedgerService from "../../../services/ledgerService";
import { LedgerAccountDTO, VoucherType } from "../../../types/ledger";
import { LedgerFormatters } from "../../../services/ledgerService";
import { generateVoucherNumber } from "../../../utils/voucherUtils";

interface VoucherFilters {
  startDate: string;
  endDate: string;
  voucherType: VoucherType | "All";
  search: string;
}

interface JournalEntryLine {
  id?: number;
  ledger_account_id: number;
  account_name?: string;
  debit_amount: number;
  credit_amount: number;
  narration?: string;
}

const VoucherManagement: React.FC = () => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<LedgerAccountDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View states
  const [currentView, setCurrentView] = useState<"list" | "detail" | "create">(
    "list"
  );
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);

  // Filters
  const [filters, setFilters] = useState<VoucherFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    voucherType: "All",
    search: "",
  });

  // Journal Entry Form State
  const [journalForm, setJournalForm] = useState({
    date: new Date().toISOString().split("T")[0],
    narration: "",
    reference_number: "",
    entries: [
      {
        ledger_account_id: 0,
        account_name: "",
        debit_amount: 0,
        credit_amount: 0,
        narration: "",
      },
      {
        ledger_account_id: 0,
        account_name: "",
        debit_amount: 0,
        credit_amount: 0,
        narration: "",
      },
    ] as JournalEntryLine[],
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadVouchers();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [vouchersResponse, accountsResponse] = await Promise.all([
        LedgerService.getVouchers({
          start_date: filters.startDate,
          end_date: filters.endDate,
        }),
        LedgerService.getActiveAccounts(),
      ]);

      if (vouchersResponse.data.success) {
        setVouchers(vouchersResponse.data.data);
      }

      if (accountsResponse.data.success) {
        setAccounts(accountsResponse.data.data);
      }
    } catch (err) {
      setError("Failed to load data");
      console.error("Error loading initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadVouchers = async () => {
    try {
      const params: any = {
        start_date: filters.startDate,
        end_date: filters.endDate,
      };

      if (filters.voucherType !== "All") {
        params.voucher_type = filters.voucherType;
      }

      if (filters.search) {
        params.search = filters.search;
      }

      const response = await LedgerService.getVouchers(params);

      if (response.data.success) {
        setVouchers(response.data.data);
      }
    } catch (err) {
      console.error("Error loading vouchers:", err);
    }
  };

  const handleFilterChange = (key: keyof VoucherFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleViewVoucher = async (voucherId: number) => {
    try {
      const response = await LedgerService.getVoucher(voucherId);
      if (response.data.success) {
        // Enrich entries with account names
        const voucherData = response.data.data;
        const entries = getVoucherEntries(voucherData);
        if (entries && entries.length > 0) {
          const enrichedEntries = entries.map((entry: any) => ({
            ...entry,
            account_name:
              accounts.find((acc) => acc.id === entry.ledger_account_id)
                ?.name || `Account ID: ${entry.ledger_account_id}`,
          }));
          // Set the enriched entries back to the voucher data
          if ("entries" in voucherData) {
            (voucherData as any).entries = enrichedEntries;
          } else if ("lines" in voucherData) {
            (voucherData as any).lines = enrichedEntries;
          } else {
            (voucherData as any).entries = enrichedEntries;
          }
        }
        setSelectedVoucher(voucherData);
        setCurrentView("detail");
      }
    } catch (err) {
      setError("Failed to load voucher details");
      console.error("Error loading voucher:", err);
    }
  };

  const handleCancelVoucher = async (voucherId: number) => {
    if (
      !confirm(
        "Are you sure you want to cancel this voucher? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await LedgerService.cancelVoucher(voucherId);
      if (response.data.success) {
        await loadVouchers();
        setCurrentView("list");
        setSelectedVoucher(null);
      }
    } catch (err) {
      setError("Failed to cancel voucher");
      console.error("Error cancelling voucher:", err);
    }
  };

  // Journal Entry Form Handlers
  const addJournalEntryLine = () => {
    setJournalForm((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        {
          ledger_account_id: 0,
          account_name: "",
          debit_amount: 0,
          credit_amount: 0,
          narration: "",
        },
      ],
    }));
  };

  const removeJournalEntryLine = (index: number) => {
    if (journalForm.entries.length <= 2) return; // Minimum 2 entries required

    setJournalForm((prev) => ({
      ...prev,
      entries: prev.entries.filter((_, i) => i !== index),
    }));
  };

  const updateJournalEntryLine = (
    index: number,
    field: keyof JournalEntryLine,
    value: any
  ) => {
    setJournalForm((prev) => ({
      ...prev,
      entries: prev.entries.map((entry, i) => {
        if (i === index) {
          const updatedEntry = { ...entry, [field]: value };

          // If account is selected, update account name
          if (field === "ledger_account_id") {
            const account = accounts.find((acc) => acc.id === value);
            updatedEntry.account_name = account?.name || "";
          }

          // Ensure only debit OR credit has value
          if (field === "debit_amount" && value > 0) {
            updatedEntry.credit_amount = 0;
          } else if (field === "credit_amount" && value > 0) {
            updatedEntry.debit_amount = 0;
          }

          return updatedEntry;
        }
        return entry;
      }),
    }));
  };

  const validateJournalForm = (): boolean => {
    const errors: string[] = [];

    if (!journalForm.date) {
      errors.push("Date is required");
    }

    if (!journalForm.narration.trim()) {
      errors.push("Narration is required");
    }

    if (journalForm.entries.length < 2) {
      errors.push("At least 2 entries are required");
    }

    let totalDebits = 0;
    let totalCredits = 0;

    journalForm.entries.forEach((entry, index) => {
      if (!entry.ledger_account_id) {
        errors.push(`Entry ${index + 1}: Account is required`);
      }

      if (entry.debit_amount === 0 && entry.credit_amount === 0) {
        errors.push(
          `Entry ${index + 1}: Either debit or credit amount is required`
        );
      }

      if (entry.debit_amount > 0 && entry.credit_amount > 0) {
        errors.push(
          `Entry ${index + 1}: Cannot have both debit and credit amounts`
        );
      }

      totalDebits += entry.debit_amount;
      totalCredits += entry.credit_amount;
    });

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      errors.push(
        `Total debits (${LedgerFormatters.formatCurrency(
          totalDebits
        )}) must equal total credits (${LedgerFormatters.formatCurrency(
          totalCredits
        )})`
      );
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmitJournalEntry = async () => {
    if (!validateJournalForm()) return;

    try {
      setIsSubmitting(true);

      // Generate voucher number
      const voucherNumber = generateVoucherNumber('JV');
      
      const payload = {
        date: journalForm.date,
        voucher_type: "Journal" as VoucherType,
        voucher_number: voucherNumber,
        narration: journalForm.narration,
        reference_number: journalForm.reference_number || undefined,
        entries: journalForm.entries.map((entry) => ({
          ledger_account_id: entry.ledger_account_id,
          debit_amount: entry.debit_amount || undefined,
          credit_amount: entry.credit_amount || undefined,
          narration: entry.narration || undefined,
        })),
      };

      const response = await LedgerService.createVoucher(payload);

      if (response.data.success) {
        // Reset form
        setJournalForm({
          date: new Date().toISOString().split("T")[0],
          narration: "",
          reference_number: "",
          entries: [
            {
              ledger_account_id: 0,
              account_name: "",
              debit_amount: 0,
              credit_amount: 0,
              narration: "",
            },
            {
              ledger_account_id: 0,
              account_name: "",
              debit_amount: 0,
              credit_amount: 0,
              narration: "",
            },
          ],
        });
        setValidationErrors([]);

        // Refresh vouchers list and go back to list view
        await loadVouchers();
        setCurrentView("list");
      }
    } catch (err) {
      setError("Failed to create journal entry");
      console.error("Error creating journal entry:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotals = () => {
    const totalDebits = journalForm.entries.reduce(
      (sum, entry) => sum + (entry.debit_amount || 0),
      0
    );
    const totalCredits = journalForm.entries.reduce(
      (sum, entry) => sum + (entry.credit_amount || 0),
      0
    );
    return { totalDebits, totalCredits };
  };

  // Helper functions to handle different field names from backend
  const getVoucherDate = (voucher: any) => voucher.date || voucher.voucher_date;
  const getVoucherNarration = (voucher: any) =>
    voucher.narration || voucher.description;
  const getVoucherEntries = (voucher: any) =>
    voucher.entries || voucher.lines || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading vouchers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentView === "list" && "Voucher Management"}
            {currentView === "detail" && "Voucher Details"}
            {currentView === "create" && "Create Complex Journal Entry"}
          </h1>
          {currentView === "list" && (
            <p className="text-gray-600 mt-1">
              View, search, and manage all vouchers. Create complex journal
              entries for advanced transactions.
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {currentView !== "list" && (
            <Button
              variant="outline"
              onClick={() => {
                setCurrentView("list");
                setSelectedVoucher(null);
                setValidationErrors([]);
              }}
            >
              ← Back to List
            </Button>
          )}

          {currentView === "list" && (
            <Button
              onClick={() => setCurrentView("create")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              + Create Complex Journal Entry
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Voucher List View */}
      {currentView === "list" && (
        <>
          {/* Filters */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voucher Type
                </label>
                <select
                  value={filters.voucherType}
                  onChange={(e) =>
                    handleFilterChange("voucherType", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Types</option>
                  <option value="Payment">Payment</option>
                  <option value="Receipt">Receipt</option>
                  <option value="Journal">Journal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by narration or voucher number..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Vouchers Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voucher No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Narration
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vouchers.map((voucher) => (
                    <tr key={voucher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {LedgerFormatters.formatDate(getVoucherDate(voucher))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {voucher.voucher_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            voucher.voucher_type === "Payment"
                              ? "bg-red-100 text-red-800"
                              : voucher.voucher_type === "Receipt"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {voucher.voucher_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {getVoucherNarration(voucher) || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {LedgerFormatters.formatCurrency(voucher.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            voucher.status === "Posted"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {voucher.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewVoucher(voucher.id!)}
                          className="mr-2"
                        >
                          View
                        </Button>
                        {voucher.status === "Posted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelVoucher(voucher.id!)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {vouchers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No vouchers found for the selected criteria.
                </div>
              )}
            </div>
          </Card>
        </>
      )}
      {/* Voucher Detail View */}
      {currentView === "detail" && selectedVoucher && (
        <div className="space-y-6">
          {/* Voucher Header */}
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Voucher Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Voucher Number:</span>
                    <span className="font-medium">
                      {selectedVoucher.voucher_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {LedgerFormatters.formatDate(
                        getVoucherDate(selectedVoucher)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedVoucher.voucher_type === "Payment"
                          ? "bg-red-100 text-red-800"
                          : selectedVoucher.voucher_type === "Receipt"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {selectedVoucher.voucher_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedVoucher.status === "Posted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedVoucher.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Transaction Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference Number:</span>
                    <span className="font-medium">
                      {selectedVoucher.reference_number || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-lg text-green-600">
                      {(() => {
                        console.log('Total amount raw value:', selectedVoucher.total_amount, typeof selectedVoucher.total_amount);
                        return LedgerFormatters.formatCurrency(selectedVoucher.total_amount);
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Narration:</span>
                    <span className="font-medium text-right max-w-xs">
                      {getVoucherNarration(selectedVoucher) || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Journal Entries */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Journal Entries
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debit Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Narration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getVoucherEntries(selectedVoucher)?.map(
                    (entry: any, index: number) => (
                      <tr key={entry.id || index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.account_name ||
                            `Account ID: ${
                              entry.ledger_account_id || entry.account_id
                            }`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {entry.debit_amount
                            ? LedgerFormatters.formatCurrency(
                                entry.debit_amount
                              )
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {entry.credit_amount
                            ? LedgerFormatters.formatCurrency(
                                entry.credit_amount
                              )
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {entry.narration || entry.description || "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-6 py-3 text-sm font-bold text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">
                      {LedgerFormatters.formatCurrency(
                        getVoucherEntries(selectedVoucher)?.reduce(
                          (sum: number, entry: any) =>
                            sum + (entry.debit_amount || 0),
                          0
                        ) || 0
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">
                      {LedgerFormatters.formatCurrency(
                        getVoucherEntries(selectedVoucher)?.reduce(
                          (sum: number, entry: any) =>
                            sum + (entry.credit_amount || 0),
                          0
                        ) || 0
                      )}
                    </td>
                    <td className="px-6 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Actions */}
          {selectedVoucher.status === "Posted" && (
            <Card className="p-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleCancelVoucher(selectedVoucher.id!)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Cancel Voucher
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Journal Entry Creation Form */}
      {currentView === "create" && (
        <div className="space-y-6">
          {/* Form Header */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Create Journal Entry
                </h3>
                <p className="text-sm text-gray-600">
                  Create complex multi-line journal entries for advanced
                  accounting transactions
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={journalForm.date}
                  onChange={(e) =>
                    setJournalForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  placeholder="Optional reference number"
                  value={journalForm.reference_number}
                  onChange={(e) =>
                    setJournalForm((prev) => ({
                      ...prev,
                      reference_number: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Narration <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Brief description of the transaction"
                  value={journalForm.narration}
                  onChange={(e) =>
                    setJournalForm((prev) => ({
                      ...prev,
                      narration: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Journal Entries Grid */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Journal Entries
              </h3>
              <Button
                variant="outline"
                onClick={addJournalEntryLine}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                + Add Line
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">
                      Account <span className="text-red-500">*</span>
                    </th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">
                      Debit Amount
                    </th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-700">
                      Credit Amount
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">
                      Narration
                    </th>
                    <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {journalForm.entries.map((entry, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-3">
                        <CompactAccountSelect
                          accounts={accounts}
                          value={entry.ledger_account_id || null}
                          onChange={(accountId) =>
                            updateJournalEntryLine(
                              index,
                              "ledger_account_id",
                              accountId
                            )
                          }
                          placeholder="Select Account"
                          className="min-w-[200px]"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={entry.debit_amount || ""}
                          onChange={(e) =>
                            updateJournalEntryLine(
                              index,
                              "debit_amount",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={entry.credit_amount || ""}
                          onChange={(e) =>
                            updateJournalEntryLine(
                              index,
                              "credit_amount",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={entry.narration || ""}
                          onChange={(e) =>
                            updateJournalEntryLine(
                              index,
                              "narration",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Optional description"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        {journalForm.entries.length > 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeJournalEntryLine(index)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td className="py-3 px-3 font-bold text-sm">Total</td>
                    <td className="py-3 px-3 font-bold text-sm text-right">
                      {LedgerFormatters.formatCurrency(
                        calculateTotals().totalDebits
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-sm text-right">
                      {LedgerFormatters.formatCurrency(
                        calculateTotals().totalCredits
                      )}
                    </td>
                    <td className="py-3 px-3"></td>
                    <td className="py-3 px-3"></td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="py-2 px-3">
                      <div
                        className={`text-sm font-medium ${
                          Math.abs(
                            calculateTotals().totalDebits -
                              calculateTotals().totalCredits
                          ) < 0.01
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {Math.abs(
                          calculateTotals().totalDebits -
                            calculateTotals().totalCredits
                        ) < 0.01
                          ? "✓ Entries are balanced"
                          : `⚠ Difference: ${LedgerFormatters.formatCurrency(
                              Math.abs(
                                calculateTotals().totalDebits -
                                  calculateTotals().totalCredits
                              )
                            )}`}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card className="p-4 bg-red-50 border-red-200">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Please fix the following errors:
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Form Actions */}
          <Card className="p-4">
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentView("list");
                  setValidationErrors([]);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitJournalEntry}
                disabled={isSubmitting || calculateTotals().totalDebits === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Creating..." : "Create Journal Entry"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VoucherManagement;
