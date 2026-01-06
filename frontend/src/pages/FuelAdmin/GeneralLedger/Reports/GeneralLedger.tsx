import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../../components/ui/card';
import Button from '../../../../components/ui/button/Button';
import {
  Download,
  RefreshCw,
  Calendar,
  Search,
  Filter,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import LedgerService from '../../../../services/ledgerService';
import { LedgerAccountDTO } from '../../../../types/ledger';
import { LedgerFormatters } from '../../../../services/ledgerService';
import CompactAccountSelect from '../../../../components/ui/Select/CompactAccountSelect';

interface GeneralLedgerEntry {
  date: string;
  voucher_number: string;
  voucher_type: string;
  narration: string;
  debit_amount: number;
  credit_amount: number;
  balance: number;
}

const GeneralLedger: React.FC = () => {
  const [accounts, setAccounts] = useState<LedgerAccountDTO[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<GeneralLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Start of current month
    endDate: new Date().toISOString().split('T')[0] // Today
  });

  // Fetch accounts on component mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await LedgerService.getAccounts();
        setAccounts(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
      }
    };
    fetchAccounts();
  }, []);

  const fetchGeneralLedger = useCallback(async () => {
    if (!selectedAccountId) {
      setError('Please select an account to view its general ledger');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get general ledger data for the selected account
      const response = await LedgerService.getGeneralLedger(
        selectedAccountId,
        dateRange.startDate,
        dateRange.endDate
      );

      // Transform the response data to match our component's expected format
      const transactions = response.data?.data?.transactions || [];
      const transformedEntries: GeneralLedgerEntry[] = transactions.map(transaction => ({
        date: transaction.date,
        voucher_number: transaction.voucher_number,
        voucher_type: transaction.voucher_type,
        narration: transaction.narration,
        debit_amount: transaction.debit_amount,
        credit_amount: transaction.credit_amount,
        balance: transaction.running_balance
      }));

      setLedgerEntries(transformedEntries);
    } catch (err: unknown) {
      let message = 'Failed to fetch general ledger';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const errWithResponse = err as { response?: { data?: { message?: string } } };
        if (errWithResponse.response?.data?.message) {
          message = errWithResponse.response.data.message;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    if (selectedAccountId) {
      fetchGeneralLedger();
    }
  }, [selectedAccountId, fetchGeneralLedger]);

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleRefresh = () => {
    fetchGeneralLedger();
  };

  const handleAccountChange = (accountId: number | null) => {
    setSelectedAccountId(accountId);
    setLedgerEntries([]);
    setError(null);
  };

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  const calculateTotals = () => {
    const totalDebit = ledgerEntries.reduce((sum, entry) => sum + entry.debit_amount, 0);
    const totalCredit = ledgerEntries.reduce((sum, entry) => sum + entry.credit_amount, 0);
    const closingBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : 0;
    return { totalDebit, totalCredit, closingBalance };
  };

  const { totalDebit, totalCredit, closingBalance } = calculateTotals();

  const exportToCSV = () => {
    if (!selectedAccount || ledgerEntries.length === 0) return;

    const headers = ['Date', 'Voucher Number', 'Voucher Type', 'Narration', 'Debit', 'Credit', 'Balance'];
    const csvData = ledgerEntries.map(entry => [
      entry.date,
      entry.voucher_number,
      entry.voucher_type,
      entry.narration,
      entry.debit_amount.toFixed(2),
      entry.credit_amount.toFixed(2),
      entry.balance.toFixed(2)
    ]);
    
    // Add totals row
    csvData.push(['TOTAL', '', '', '', totalDebit.toFixed(2), totalCredit.toFixed(2), closingBalance.toFixed(2)]);
    
    const csvContent = [
      [`General Ledger - ${selectedAccount.name}`],
      [`Period: ${dateRange.startDate} to ${dateRange.endDate}`],
      [''],
      headers,
      ...csvData
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `general-ledger-${selectedAccount.name.replace(/\s+/g, '-')}-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Account
            </label>
            <CompactAccountSelect
              accounts={accounts}
              value={selectedAccountId}
              onChange={handleAccountChange}
              placeholder="Choose an account to view its general ledger"
              error={false}
            />
          </div>

          {/* Date Range and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Date Range */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Period:</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleRefresh}
                disabled={loading || !selectedAccountId}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Button
                onClick={exportToCSV}
                variant="outline"
                disabled={!selectedAccount || ledgerEntries.length === 0}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Summary */}
      {selectedAccount && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  {selectedAccount.name}
                </h3>
                <p className="text-sm text-blue-700">
                  {selectedAccount.account_type} • Account Code: {selectedAccount.account_code || 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">Closing Balance</p>
              <p className="text-xl font-bold text-blue-900">
                {LedgerFormatters.formatCurrency(closingBalance)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      {selectedAccount && ledgerEntries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Debits */}
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Debits</p>
                <p className="text-2xl font-bold text-green-900">
                  {LedgerFormatters.formatCurrency(totalDebit)}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">+</span>
              </div>
            </div>
          </Card>

          {/* Total Credits */}
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Credits</p>
                <p className="text-2xl font-bold text-red-900">
                  {LedgerFormatters.formatCurrency(totalCredit)}
                </p>
              </div>
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">-</span>
              </div>
            </div>
          </Card>

          {/* Net Movement */}
          <Card className="p-6 bg-purple-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Net Movement</p>
                <p className="text-2xl font-bold text-purple-900">
                  {LedgerFormatters.formatCurrency(totalDebit - totalCredit)}
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">=</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading General Ledger</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* General Ledger Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            General Ledger {selectedAccount ? `- ${selectedAccount.name}` : ''}
          </h3>
          <p className="text-sm text-gray-600">
            {selectedAccount ? (
              <>Period: {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}</>
            ) : (
              'Select an account to view its general ledger'
            )}
          </p>
        </div>

        {!selectedAccount ? (
          <div className="p-8 text-center">
            <Search className="w-8 h-8 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Please select an account to view its general ledger</p>
          </div>
        ) : loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Loading general ledger...</p>
          </div>
        ) : ledgerEntries.length === 0 ? (
          <div className="p-8 text-center">
            <Filter className="w-8 h-8 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No transactions found for the selected account and period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voucher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Narration
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ledgerEntries.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.voucher_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.voucher_type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={entry.narration}>
                        {entry.narration}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {entry.debit_amount > 0 ? LedgerFormatters.formatCurrency(entry.debit_amount) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {entry.credit_amount > 0 ? LedgerFormatters.formatCurrency(entry.credit_amount) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {LedgerFormatters.formatCurrency(entry.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr className="font-semibold">
                  <td className="px-6 py-4 text-sm text-gray-900" colSpan={3}>
                    TOTAL
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {LedgerFormatters.formatCurrency(totalDebit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {LedgerFormatters.formatCurrency(totalCredit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {LedgerFormatters.formatCurrency(closingBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default GeneralLedger;
