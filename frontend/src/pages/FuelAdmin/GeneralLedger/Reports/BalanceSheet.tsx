import React, { useState, useEffect } from 'react';
import { Card } from '../../../../components/ui/card';
import Button from '../../../../components/ui/button/Button';
import {
  Download,
  RefreshCw,
  Calendar,
  Building,
  CreditCard,
  PieChart,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import LedgerService from '../../../../services/ledgerService';
import { LedgerFormatters } from '../../../../services/ledgerService';

interface BalanceSheetData {
  assets: {
    current_assets: Array<{
      account_name: string;
      account_type: string;
      amount: number;
    }>;
    fixed_assets: Array<{
      account_name: string;
      account_type: string;
      amount: number;
    }>;
    total_assets: number;
  };
  liabilities: {
    current_liabilities: Array<{
      account_name: string;
      account_type: string;
      amount: number;
    }>;
    long_term_liabilities: Array<{
      account_name: string;
      account_type: string;
      amount: number;
    }>;
    total_liabilities: number;
  };
  equity: {
    accounts: Array<{
      account_name: string;
      account_type: string;
      amount: number;
    }>;
    total_equity: number;
  };
  total_liabilities_equity: number;
}

const BalanceSheet: React.FC = () => {
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await LedgerService.getBalanceSheet(asOfDate);
      setBalanceSheetData(response.data.data);
    } catch (err: unknown) {
      let message = 'Failed to fetch balance sheet';
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
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, []);

  const handleDateChange = (value: string) => {
    setAsOfDate(value);
  };

  const handleRefresh = () => {
    fetchBalanceSheet();
  };

  const isBalanced = balanceSheetData ? 
    Math.abs(balanceSheetData.assets.total_assets - balanceSheetData.total_liabilities_equity) < 0.01 : false;

  const exportToCSV = () => {
    if (!balanceSheetData) return;

    const headers = ['Category', 'Account Name', 'Account Type', 'Amount'];
    const csvData: string[][] = [];

    // Assets section
    csvData.push(['ASSETS', '', '', '']);
    csvData.push(['Current Assets', '', '', '']);
    balanceSheetData.assets.current_assets.forEach(account => {
      csvData.push(['', account.account_name, account.account_type, account.amount.toFixed(2)]);
    });
    csvData.push(['Fixed Assets', '', '', '']);
    balanceSheetData.assets.fixed_assets.forEach(account => {
      csvData.push(['', account.account_name, account.account_type, account.amount.toFixed(2)]);
    });
    csvData.push(['', 'Total Assets', '', balanceSheetData.assets.total_assets.toFixed(2)]);
    csvData.push(['', '', '', '']); // Empty row

    // Liabilities section
    csvData.push(['LIABILITIES', '', '', '']);
    csvData.push(['Current Liabilities', '', '', '']);
    balanceSheetData.liabilities.current_liabilities.forEach(account => {
      csvData.push(['', account.account_name, account.account_type, account.amount.toFixed(2)]);
    });
    csvData.push(['Long-term Liabilities', '', '', '']);
    balanceSheetData.liabilities.long_term_liabilities.forEach(account => {
      csvData.push(['', account.account_name, account.account_type, account.amount.toFixed(2)]);
    });
    csvData.push(['', 'Total Liabilities', '', balanceSheetData.liabilities.total_liabilities.toFixed(2)]);
    csvData.push(['', '', '', '']); // Empty row

    // Equity section
    csvData.push(['EQUITY', '', '', '']);
    balanceSheetData.equity.accounts.forEach(account => {
      csvData.push(['', account.account_name, account.account_type, account.amount.toFixed(2)]);
    });
    csvData.push(['', 'Total Equity', '', balanceSheetData.equity.total_equity.toFixed(2)]);
    csvData.push(['', '', '', '']); // Empty row

    csvData.push(['TOTAL LIABILITIES & EQUITY', '', '', balanceSheetData.total_liabilities_equity.toFixed(2)]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance-sheet-${asOfDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Date Selection */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">As of Date:</span>
            </div>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={exportToCSV}
              variant="outline"
              disabled={!balanceSheetData}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Balance Status */}
      {balanceSheetData && (
        <Card className={`p-4 ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center space-x-3">
            {isBalanced ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <h3 className={`font-semibold ${isBalanced ? 'text-green-900' : 'text-red-900'}`}>
                {isBalanced ? 'Balance Sheet is Balanced' : 'Balance Sheet is Out of Balance'}
              </h3>
              <p className={`text-sm ${isBalanced ? 'text-green-700' : 'text-red-700'}`}>
                Total Assets: {LedgerFormatters.formatCurrency(balanceSheetData.assets.total_assets)} | 
                Total Liabilities & Equity: {LedgerFormatters.formatCurrency(balanceSheetData.total_liabilities_equity)}
                {!isBalanced && (
                  <span className="ml-2 font-medium">
                    Difference: {LedgerFormatters.formatCurrency(Math.abs(balanceSheetData.assets.total_assets - balanceSheetData.total_liabilities_equity))}
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      {balanceSheetData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Assets */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Assets</p>
                <p className="text-2xl font-bold text-blue-900">
                  {LedgerFormatters.formatCurrency(balanceSheetData.assets.total_assets)}
                </p>
              </div>
              <Building className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          {/* Total Liabilities */}
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Liabilities</p>
                <p className="text-2xl font-bold text-red-900">
                  {LedgerFormatters.formatCurrency(balanceSheetData.liabilities.total_liabilities)}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-red-600" />
            </div>
          </Card>

          {/* Total Equity */}
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Equity</p>
                <p className="text-2xl font-bold text-green-900">
                  {LedgerFormatters.formatCurrency(balanceSheetData.equity.total_equity)}
                </p>
              </div>
              <PieChart className="w-8 h-8 text-green-600" />
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
              <h3 className="font-semibold text-red-900">Error Loading Balance Sheet</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Detailed Balance Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets Side */}
        <div className="space-y-6">
          {/* Current Assets */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-900">Assets</h3>
              <p className="text-sm text-blue-700">
                As of {new Date(asOfDate).toLocaleDateString()}
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Loading assets...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Current Assets */}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900" colSpan={2}>
                        Current Assets
                      </td>
                    </tr>
                    {balanceSheetData?.assets.current_assets.map((account, index) => (
                      <tr key={`current-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 ml-4">
                            {account.account_name}
                          </div>
                          <div className="text-sm text-gray-500 ml-4">
                            {account.account_type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {LedgerFormatters.formatCurrency(account.amount)}
                        </td>
                      </tr>
                    ))}

                    {/* Fixed Assets */}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900" colSpan={2}>
                        Fixed Assets
                      </td>
                    </tr>
                    {balanceSheetData?.assets.fixed_assets.map((account, index) => (
                      <tr key={`fixed-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 ml-4">
                            {account.account_name}
                          </div>
                          <div className="text-sm text-gray-500 ml-4">
                            {account.account_type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {LedgerFormatters.formatCurrency(account.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-50">
                    <tr className="font-semibold">
                      <td className="px-6 py-4 text-sm text-blue-900">
                        Total Assets
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-blue-900">
                        {balanceSheetData ? LedgerFormatters.formatCurrency(balanceSheetData.assets.total_assets) : '-'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Liabilities & Equity Side */}
        <div className="space-y-6">
          {/* Liabilities */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <h3 className="text-lg font-semibold text-red-900">Liabilities & Equity</h3>
              <p className="text-sm text-red-700">
                As of {new Date(asOfDate).toLocaleDateString()}
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Loading liabilities & equity...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Current Liabilities */}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900" colSpan={2}>
                        Current Liabilities
                      </td>
                    </tr>
                    {balanceSheetData?.liabilities.current_liabilities.map((account, index) => (
                      <tr key={`current-liab-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 ml-4">
                            {account.account_name}
                          </div>
                          <div className="text-sm text-gray-500 ml-4">
                            {account.account_type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {LedgerFormatters.formatCurrency(account.amount)}
                        </td>
                      </tr>
                    ))}

                    {/* Long-term Liabilities */}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900" colSpan={2}>
                        Long-term Liabilities
                      </td>
                    </tr>
                    {balanceSheetData?.liabilities.long_term_liabilities.map((account, index) => (
                      <tr key={`longterm-liab-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 ml-4">
                            {account.account_name}
                          </div>
                          <div className="text-sm text-gray-500 ml-4">
                            {account.account_type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {LedgerFormatters.formatCurrency(account.amount)}
                        </td>
                      </tr>
                    ))}

                    {/* Equity */}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900" colSpan={2}>
                        Equity
                      </td>
                    </tr>
                    {balanceSheetData?.equity.accounts.map((account, index) => (
                      <tr key={`equity-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 ml-4">
                            {account.account_name}
                          </div>
                          <div className="text-sm text-gray-500 ml-4">
                            {account.account_type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {LedgerFormatters.formatCurrency(account.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-red-50">
                    <tr className="font-semibold">
                      <td className="px-6 py-4 text-sm text-red-900">
                        Total Liabilities & Equity
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-900">
                        {balanceSheetData ? LedgerFormatters.formatCurrency(balanceSheetData.total_liabilities_equity) : '-'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;