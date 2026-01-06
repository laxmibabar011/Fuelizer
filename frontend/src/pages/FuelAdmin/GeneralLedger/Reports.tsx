import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/card';
import Button from '../../../components/ui/button/Button';
import { 
  FileText, 
  TrendingUp, 
  BarChart3, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import LedgerService from '../../../services/ledgerService';
import { LedgerAccountDTO } from '../../../types/ledger';
import AccountSelect from '../../../components/ui/Select/AccountSelect';

type ReportType = 'trial-balance' | 'profit-loss' | 'balance-sheet' | 'general-ledger' | 'cash-flow';

interface ReportFilters {
  startDate: string;
  endDate: string;
  accountId?: number | string;
}

const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('trial-balance');
  const [accounts, setAccounts] = useState<LedgerAccountDTO[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, []);

  // Load report data when active report or filters change
  useEffect(() => {
    loadReportData();
  }, [activeReport, filters]);

  const loadAccounts = async () => {
    try {
      const response = await LedgerService.getAccounts();
      setAccounts(response.data.data || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      setAccounts([]);
    }
  };

  const loadReportData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      switch (activeReport) {
        case 'trial-balance':
          response = await LedgerService.getTrialBalance(filters.startDate, filters.endDate);
          break;
        case 'profit-loss':
          response = await LedgerService.getProfitLoss(filters.startDate, filters.endDate);
          break;
        case 'balance-sheet':
          response = await LedgerService.getBalanceSheet(filters.endDate);
          break;
        case 'general-ledger':
          if (typeof filters.accountId === 'number') {
            response = await LedgerService.getGeneralLedger(filters.accountId, filters.startDate, filters.endDate);
          }
          break;
        case 'cash-flow':
          response = await LedgerService.getCashFlow(filters.startDate, filters.endDate);
          break;
        default:
          response = null;
      }
      setReportData(response?.data || null);
    } catch (error: any) {
      setError(error.message || 'Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ReportFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportReport = () => {
    // TODO: Implement export functionality
    console.log('Exporting report:', activeReport, reportData);
  };

  const reportTypes = [
    {
      id: 'trial-balance' as ReportType,
      name: 'Trial Balance',
      description: 'Summary of all account balances',
      icon: BarChart3,
      color: 'bg-blue-500'
    },
    {
      id: 'profit-loss' as ReportType,
      name: 'Profit & Loss',
      description: 'Income vs expenses for the period',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      id: 'balance-sheet' as ReportType,
      name: 'Balance Sheet',
      description: 'Assets, liabilities, and equity',
      icon: FileText,
      color: 'bg-purple-500'
    },
    {
      id: 'general-ledger' as ReportType,
      name: 'General Ledger',
      description: 'Detailed account transactions',
      icon: FileText,
      color: 'bg-orange-500'
    },
    {
      id: 'cash-flow' as ReportType,
      name: 'Cash Flow',
      description: 'Cash inflows and outflows',
      icon: DollarSign,
      color: 'bg-indigo-500'
    }
  ];

  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          <span className="text-gray-600">Loading report...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="text-red-500 mb-2">Error loading report</div>
          <div className="text-gray-600 text-sm">{error}</div>
          <Button 
            onClick={loadReportData} 
            className="mt-4"
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="text-center py-12 text-gray-500">
          {activeReport === 'general-ledger' && !filters.accountId 
            ? 'Please select an account to view the General Ledger report'
            : 'No data available for the selected period'
          }
        </div>
      );
    }

    // Render specific report content based on activeReport
    switch (activeReport) {
      case 'trial-balance':
        return <TrialBalanceReport data={reportData} />;
      case 'profit-loss':
        return <ProfitLossReport data={reportData} />;
      case 'balance-sheet':
        return <BalanceSheetReport data={reportData} />;
      case 'general-ledger':
        return <GeneralLedgerReport data={reportData} />;
      case 'cash-flow':
        return <CashFlowReport data={reportData} />;
      default:
        return <div>Report not implemented</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">Generate and view comprehensive financial reports</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={loadReportData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportReport} disabled={!reportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Report Type Selection */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 text-left
                  ${activeReport === report.id 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className={`w-10 h-10 rounded-lg ${report.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{report.name}</h3>
                <p className="text-sm text-gray-600">{report.description}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Report Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
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
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {activeReport === 'general-ledger' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account
              </label>
              <select
                value={filters.accountId || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange('accountId', value ? parseInt(value) : '');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.account_type})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex items-end">
            <Button onClick={loadReportData} className="w-full">
              <Calendar className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Content */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {reportTypes.find(r => r.id === activeReport)?.name} Report
          </h2>
          <div className="text-sm text-gray-500">
            Period: {filters.startDate} to {filters.endDate}
          </div>
        </div>
        
        {renderReportContent()}
      </Card>
    </div>
  );
};

// Individual Report Components
const TrialBalanceReport: React.FC<{ data: any }> = ({ data }) => {
  if (!data || !data.accounts) {
    return <div className="text-center py-8 text-gray-500">No trial balance data available</div>;
  }

  const { accounts, totals } = data;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              ₹{totals?.total_debits?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-600">Total Debits</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              ₹{totals?.total_credits?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-600">Total Credits</div>
          </div>
        </div>
        {totals?.total_debits !== totals?.total_credits && (
          <div className="mt-2 text-center text-red-500 text-sm">
            ⚠️ Trial Balance is not balanced! Difference: ₹{Math.abs((totals?.total_debits || 0) - (totals?.total_credits || 0)).toLocaleString()}
          </div>
        )}
      </div>

      {/* Trial Balance Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Debit Balance
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credit Balance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts.map((account: any, index: number) => (
              <tr key={account.id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{account.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    account.account_type === 'Asset' ? 'bg-green-100 text-green-800' :
                    account.account_type === 'Liability' ? 'bg-red-100 text-red-800' :
                    account.account_type === 'Direct Expense' ? 'bg-orange-100 text-orange-800' :
                    account.account_type === 'Indirect Expense' ? 'bg-yellow-100 text-yellow-800' :
                    account.account_type === 'Customer' ? 'bg-blue-100 text-blue-800' :
                    account.account_type === 'Vendor' ? 'bg-purple-100 text-purple-800' :
                    account.account_type === 'Bank' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {account.account_type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {account.debit_balance > 0 ? `₹${account.debit_balance.toLocaleString()}` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {account.credit_balance > 0 ? `₹${account.credit_balance.toLocaleString()}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr className="font-semibold">
              <td colSpan={2} className="px-6 py-4 text-sm text-gray-900">TOTAL</td>
              <td className="px-6 py-4 text-right text-sm text-gray-900">
                ₹{totals?.total_debits?.toLocaleString() || '0'}
              </td>
              <td className="px-6 py-4 text-right text-sm text-gray-900">
                ₹{totals?.total_credits?.toLocaleString() || '0'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

const ProfitLossReport: React.FC<{ data: any }> = ({ data }) => {
  if (!data) {
    return <div className="text-center py-8 text-gray-500">No profit & loss data available</div>;
  }

  const { income, expenses, net_profit } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            ₹{income?.total?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-green-700">Total Income</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">
            ₹{expenses?.total?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-red-700">Total Expenses</div>
        </div>
        <div className={`p-4 rounded-lg border ${
          (net_profit || 0) >= 0 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className={`text-2xl font-bold ${
            (net_profit || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
          }`}>
            ₹{Math.abs(net_profit || 0).toLocaleString()}
          </div>
          <div className={`text-sm ${
            (net_profit || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'
          }`}>
            {(net_profit || 0) >= 0 ? 'Net Profit' : 'Net Loss'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Section */}
        <div className="bg-white border rounded-lg">
          <div className="bg-green-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-green-800">Income</h3>
          </div>
          <div className="p-6">
            {income?.accounts && income.accounts.length > 0 ? (
              <div className="space-y-3">
                {income.accounts.map((account: any, index: number) => (
                  <div key={account.id || index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="font-medium text-gray-900">{account.name}</div>
                      <div className="text-sm text-gray-500">{account.account_type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        ₹{account.amount?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t-2 border-green-200 font-bold text-green-800">
                  <span>Total Income</span>
                  <span>₹{income.total?.toLocaleString() || '0'}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No income accounts found</div>
            )}
          </div>
        </div>

        {/* Expenses Section */}
        <div className="bg-white border rounded-lg">
          <div className="bg-red-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-red-800">Expenses</h3>
          </div>
          <div className="p-6">
            {expenses?.accounts && expenses.accounts.length > 0 ? (
              <div className="space-y-3">
                {expenses.accounts.map((account: any, index: number) => (
                  <div key={account.id || index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="font-medium text-gray-900">{account.name}</div>
                      <div className="text-sm text-gray-500">{account.account_type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">
                        ₹{account.amount?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t-2 border-red-200 font-bold text-red-800">
                  <span>Total Expenses</span>
                  <span>₹{expenses.total?.toLocaleString() || '0'}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No expense accounts found</div>
            )}
          </div>
        </div>
      </div>

      {/* Net Result */}
      <div className={`p-6 rounded-lg border-2 ${
        (net_profit || 0) >= 0 
          ? 'bg-blue-50 border-blue-300' 
          : 'bg-orange-50 border-orange-300'
      }`}>
        <div className="text-center">
          <div className={`text-3xl font-bold mb-2 ${
            (net_profit || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
          }`}>
            {(net_profit || 0) >= 0 ? 'NET PROFIT' : 'NET LOSS'}
          </div>
          <div className={`text-4xl font-bold ${
            (net_profit || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'
          }`}>
            ₹{Math.abs(net_profit || 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            {(net_profit || 0) >= 0 
              ? 'Your business generated a profit during this period' 
              : 'Your business incurred a loss during this period'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

const BalanceSheetReport: React.FC<{ data: any }> = ({ data }) => {
  if (!data) {
    return <div className="text-center py-8 text-gray-500">No balance sheet data available</div>;
  }

  const { assets, liabilities, equity } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            ₹{assets?.total?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-green-700">Total Assets</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">
            ₹{liabilities?.total?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-red-700">Total Liabilities</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">
            ₹{equity?.total?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-blue-700">Total Equity</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets Section */}
        <div className="space-y-4">
          <div className="bg-white border rounded-lg">
            <div className="bg-green-50 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-green-800">Assets</h3>
            </div>
            <div className="p-6">
              {assets?.accounts && assets.accounts.length > 0 ? (
                <div className="space-y-3">
                  {assets.accounts.map((account: any, index: number) => (
                    <div key={account.id || index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <div className="font-medium text-gray-900">{account.name}</div>
                        <div className="text-sm text-gray-500">{account.account_type}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          ₹{account.amount?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-green-200 font-bold text-green-800">
                    <span>Total Assets</span>
                    <span>₹{assets.total?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No asset accounts found</div>
              )}
            </div>
          </div>
        </div>

        {/* Liabilities & Equity Section */}
        <div className="space-y-4">
          {/* Liabilities */}
          <div className="bg-white border rounded-lg">
            <div className="bg-red-50 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-red-800">Liabilities</h3>
            </div>
            <div className="p-6">
              {liabilities?.accounts && liabilities.accounts.length > 0 ? (
                <div className="space-y-3">
                  {liabilities.accounts.map((account: any, index: number) => (
                    <div key={account.id || index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <div className="font-medium text-gray-900">{account.name}</div>
                        <div className="text-sm text-gray-500">{account.account_type}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-red-600">
                          ₹{account.amount?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-red-200 font-bold text-red-800">
                    <span>Total Liabilities</span>
                    <span>₹{liabilities.total?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No liability accounts found</div>
              )}
            </div>
          </div>

          {/* Equity */}
          <div className="bg-white border rounded-lg">
            <div className="bg-blue-50 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-blue-800">Equity</h3>
            </div>
            <div className="p-6">
              {equity?.accounts && equity.accounts.length > 0 ? (
                <div className="space-y-3">
                  {equity.accounts.map((account: any, index: number) => (
                    <div key={account.id || index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <div className="font-medium text-gray-900">{account.name}</div>
                        <div className="text-sm text-gray-500">{account.account_type}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600">
                          ₹{account.amount?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-blue-200 font-bold text-blue-800">
                    <span>Total Equity</span>
                    <span>₹{equity.total?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No equity accounts found</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Balance Check */}
      <div className={`p-6 rounded-lg border-2 ${
        Math.abs((assets?.total || 0) - ((liabilities?.total || 0) + (equity?.total || 0))) < 0.01
          ? 'bg-green-50 border-green-300' 
          : 'bg-red-50 border-red-300'
      }`}>
        <div className="text-center">
          <div className={`text-2xl font-bold mb-2 ${
            Math.abs((assets?.total || 0) - ((liabilities?.total || 0) + (equity?.total || 0))) < 0.01
              ? 'text-green-600' : 'text-red-600'
          }`}>
            {Math.abs((assets?.total || 0) - ((liabilities?.total || 0) + (equity?.total || 0))) < 0.01
              ? '✓ BALANCE SHEET IS BALANCED' : '⚠️ BALANCE SHEET IS NOT BALANCED'
            }
          </div>
          <div className="text-sm text-gray-600">
            Assets: ₹{assets?.total?.toLocaleString() || '0'} | 
            Liabilities + Equity: ₹{((liabilities?.total || 0) + (equity?.total || 0)).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

const GeneralLedgerReport: React.FC<{ data: any }> = ({ data }) => {
  if (!data || !data.transactions) {
    return <div className="text-center py-8 text-gray-500">No general ledger data available</div>;
  }

  const { account, transactions, opening_balance, closing_balance } = data;

  return (
    <div className="space-y-6">
      {/* Account Header */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{account?.name}</h3>
            <p className="text-gray-600">{account?.account_type} Account</p>
            {account?.description && (
              <p className="text-sm text-gray-500 mt-1">{account.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Opening Balance</div>
            <div className={`text-lg font-semibold ${
              (opening_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ₹{Math.abs(opening_balance || 0).toLocaleString()}
              <span className="text-sm ml-1">
                {(opening_balance || 0) >= 0 ? 'Dr' : 'Cr'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voucher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
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
              {/* Opening Balance Row */}
              <tr className="bg-blue-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">
                  Opening Balance
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">-</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">-</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-900">
                  ₹{Math.abs(opening_balance || 0).toLocaleString()}
                  <span className="ml-1">{(opening_balance || 0) >= 0 ? 'Dr' : 'Cr'}</span>
                </td>
              </tr>
              
              {/* Transaction Rows */}
              {transactions.map((transaction: any, index: number) => (
                <tr key={transaction.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">{transaction.voucher_number}</div>
                    <div className="text-xs text-gray-500">{transaction.voucher_type}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{transaction.narration}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {transaction.debit_amount > 0 ? `₹${transaction.debit_amount.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {transaction.credit_amount > 0 ? `₹${transaction.credit_amount.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span className={transaction.running_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{Math.abs(transaction.running_balance).toLocaleString()}
                      <span className="ml-1">{transaction.running_balance >= 0 ? 'Dr' : 'Cr'}</span>
                    </span>
                  </td>
                </tr>
              ))}
              
              {/* Closing Balance Row */}
              <tr className="bg-green-50 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-900">
                  Closing Balance
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">-</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">-</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-900">
                  ₹{Math.abs(closing_balance || 0).toLocaleString()}
                  <span className="ml-1">{(closing_balance || 0) >= 0 ? 'Dr' : 'Cr'}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-lg font-semibold text-blue-600">
            ₹{Math.abs(opening_balance || 0).toLocaleString()}
          </div>
          <div className="text-sm text-blue-700">Opening Balance</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-lg font-semibold text-gray-600">
            {transactions.length}
          </div>
          <div className="text-sm text-gray-700">Total Transactions</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-lg font-semibold text-green-600">
            ₹{Math.abs(closing_balance || 0).toLocaleString()}
          </div>
          <div className="text-sm text-green-700">Closing Balance</div>
        </div>
      </div>
    </div>
  );
};

const CashFlowReport: React.FC<{ data: any }> = ({ data }) => {
  if (!data) {
    return <div className="text-center py-8 text-gray-500">No cash flow data available</div>;
  }

  const { operating, investing, financing, net_cash_flow, opening_cash, closing_cash } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-lg font-bold text-blue-600">
            ₹{operating?.total?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-blue-700">Operating Activities</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-lg font-bold text-green-600">
            ₹{investing?.total?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-green-700">Investing Activities</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-lg font-bold text-purple-600">
            ₹{financing?.total?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-purple-700">Financing Activities</div>
        </div>
        <div className={`p-4 rounded-lg border ${
          (net_cash_flow || 0) >= 0 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className={`text-lg font-bold ${
            (net_cash_flow || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            ₹{Math.abs(net_cash_flow || 0).toLocaleString()}
          </div>
          <div className={`text-sm ${
            (net_cash_flow || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'
          }`}>
            Net Cash Flow
          </div>
        </div>
      </div>

      {/* Cash Flow Sections */}
      <div className="space-y-6">
        {/* Operating Activities */}
        <div className="bg-white border rounded-lg">
          <div className="bg-blue-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-blue-800">Cash Flow from Operating Activities</h3>
          </div>
          <div className="p-6">
            {operating?.items && operating.items.length > 0 ? (
              <div className="space-y-3">
                {operating.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="font-medium text-gray-900">{item.description}</div>
                    <div className={`font-semibold ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.amount >= 0 ? '+' : ''}₹{item.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t-2 border-blue-200 font-bold text-blue-800">
                  <span>Net Cash from Operating Activities</span>
                  <span className={operating.total >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {operating.total >= 0 ? '+' : ''}₹{operating.total.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No operating activities found</div>
            )}
          </div>
        </div>

        {/* Investing Activities */}
        <div className="bg-white border rounded-lg">
          <div className="bg-green-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-green-800">Cash Flow from Investing Activities</h3>
          </div>
          <div className="p-6">
            {investing?.items && investing.items.length > 0 ? (
              <div className="space-y-3">
                {investing.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="font-medium text-gray-900">{item.description}</div>
                    <div className={`font-semibold ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.amount >= 0 ? '+' : ''}₹{item.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t-2 border-green-200 font-bold text-green-800">
                  <span>Net Cash from Investing Activities</span>
                  <span className={investing.total >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {investing.total >= 0 ? '+' : ''}₹{investing.total.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No investing activities found</div>
            )}
          </div>
        </div>

        {/* Financing Activities */}
        <div className="bg-white border rounded-lg">
          <div className="bg-purple-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-purple-800">Cash Flow from Financing Activities</h3>
          </div>
          <div className="p-6">
            {financing?.items && financing.items.length > 0 ? (
              <div className="space-y-3">
                {financing.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="font-medium text-gray-900">{item.description}</div>
                    <div className={`font-semibold ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.amount >= 0 ? '+' : ''}₹{item.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t-2 border-purple-200 font-bold text-purple-800">
                  <span>Net Cash from Financing Activities</span>
                  <span className={financing.total >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {financing.total >= 0 ? '+' : ''}₹{financing.total.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No financing activities found</div>
            )}
          </div>
        </div>
      </div>

      {/* Net Cash Flow Summary */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Cash at Beginning of Period</span>
            <span className="font-semibold text-gray-900">₹{opening_cash?.toLocaleString() || '0'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Net Cash Flow</span>
            <span className={`font-semibold ${(net_cash_flow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(net_cash_flow || 0) >= 0 ? '+' : ''}₹{Math.abs(net_cash_flow || 0).toLocaleString()}
            </span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Cash at End of Period</span>
              <span className="text-lg font-bold text-gray-900">₹{closing_cash?.toLocaleString() || '0'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;