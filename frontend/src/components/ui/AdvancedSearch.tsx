import React, { useState, useEffect } from 'react';
import { Card } from './card';
import Button from './button/Button';
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  User,
  FileText,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { LedgerAccountDTO, VoucherType } from '../../types/ledger';

export interface SearchFilters {
  searchTerm: string;
  voucherType: VoucherType | 'all';
  accountId: number | null;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  amountRange: {
    minAmount: number | null;
    maxAmount: number | null;
  };
  status: 'all' | 'active' | 'cancelled';
  referenceNumber: string;
  narration: string;
}

interface AdvancedSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  accounts: LedgerAccountDTO[];
  onSearch: () => void;
  onReset: () => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  resultCount?: number;
  isLoading?: boolean;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  filters,
  onFiltersChange,
  accounts,
  onSearch,
  onReset,
  isExpanded = false,
  onToggleExpanded,
  resultCount,
  isLoading = false
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    const newDateRange = { ...localFilters.dateRange, [field]: value };
    handleFilterChange('dateRange', newDateRange);
  };

  const handleAmountRangeChange = (field: 'minAmount' | 'maxAmount', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    const newAmountRange = { ...localFilters.amountRange, [field]: numValue };
    handleFilterChange('amountRange', newAmountRange);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.searchTerm) count++;
    if (localFilters.voucherType !== 'all') count++;
    if (localFilters.accountId) count++;
    if (localFilters.dateRange.startDate || localFilters.dateRange.endDate) count++;
    if (localFilters.amountRange.minAmount !== null || localFilters.amountRange.maxAmount !== null) count++;
    if (localFilters.status !== 'all') count++;
    if (localFilters.referenceNumber) count++;
    if (localFilters.narration) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card className="mb-6">
      {/* Basic Search Bar */}
      <div className="p-4">
        <div className="flex items-center space-x-4">
          {/* Main Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search vouchers by number, narration, or account..."
              value={localFilters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Quick Filters */}
          <select
            value={localFilters.voucherType}
            onChange={(e) => handleFilterChange('voucherType', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="Payment">Payment</option>
            <option value="Receipt">Receipt</option>
            <option value="Journal">Journal</option>
          </select>

          {/* Advanced Filters Toggle */}
          {onToggleExpanded && (
            <Button
              onClick={onToggleExpanded}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}

          {/* Search Button */}
          <Button
            onClick={onSearch}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>{isLoading ? 'Searching...' : 'Search'}</span>
          </Button>
        </div>

        {/* Results Summary */}
        {resultCount !== undefined && (
          <div className="mt-3 text-sm text-gray-600">
            {resultCount === 0 ? (
              <span>No vouchers found</span>
            ) : (
              <span>Found {resultCount} voucher{resultCount !== 1 ? 's' : ''}</span>
            )}
            {activeFilterCount > 0 && (
              <span className="ml-2">
                with {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
              </span>
            )}
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Account Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Account
              </label>
              <select
                value={localFilters.accountId || ''}
                onChange={(e) => handleFilterChange('accountId', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  placeholder="Start Date"
                  value={localFilters.dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  placeholder="End Date"
                  value={localFilters.dateRange.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Amount Range
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min Amount"
                  value={localFilters.amountRange.minAmount || ''}
                  onChange={(e) => handleAmountRangeChange('minAmount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max Amount"
                  value={localFilters.amountRange.maxAmount || ''}
                  onChange={(e) => handleAmountRangeChange('maxAmount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Reference Number
              </label>
              <input
                type="text"
                placeholder="Enter reference number"
                value={localFilters.referenceNumber}
                onChange={(e) => handleFilterChange('referenceNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Narration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Narration
              </label>
              <input
                type="text"
                placeholder="Search in narration"
                value={localFilters.narration}
                onChange={(e) => handleFilterChange('narration', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={localFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-300">
            <div className="text-sm text-gray-600">
              {activeFilterCount > 0 && (
                <span>{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied</span>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={onReset}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Clear All</span>
              </Button>
              <Button
                onClick={onSearch}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>{isLoading ? 'Searching...' : 'Apply Filters'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AdvancedSearch;