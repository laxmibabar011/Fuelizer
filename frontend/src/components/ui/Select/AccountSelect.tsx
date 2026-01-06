import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { LedgerAccountDTO, AccountType } from '../../../types/ledger';

interface AccountSelectProps {
  accounts: LedgerAccountDTO[];
  value: number | null;
  onChange: (accountId: number, account: LedgerAccountDTO) => void;
  placeholder?: string;
  filterTypes?: AccountType[];
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

const AccountSelect: React.FC<AccountSelectProps> = ({
  accounts,
  value,
  onChange,
  placeholder = "Select an account...",
  filterTypes,
  className = "",
  disabled = false,
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter accounts based on type filter and search term
  const filteredAccounts = accounts.filter(account => {
    const matchesType = !filterTypes || filterTypes.includes(account.account_type);
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.account_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Group accounts by type for better organization
  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
    const type = account.account_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(account);
    return groups;
  }, {} as Record<AccountType, LedgerAccountDTO[]>);

  const selectedAccount = accounts.find(acc => acc.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (account: LedgerAccountDTO) => {
    if (account.id !== undefined) {
      onChange(account.id, account);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
    }
  };

  const getAccountTypeColor = (accountType: AccountType): string => {
    const colors = {
      'Asset': 'bg-green-100 text-green-800',
      'Liability': 'bg-red-100 text-red-800',
      'Direct Expense': 'bg-orange-100 text-orange-800',
      'Indirect Expense': 'bg-yellow-100 text-yellow-800',
      'Customer': 'bg-blue-100 text-blue-800',
      'Vendor': 'bg-purple-100 text-purple-800',
      'Bank': 'bg-indigo-100 text-indigo-800'
    };
    return colors[accountType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected Value Display */}
      <div
        onClick={toggleDropdown}
        className={`
          w-full px-3 py-2 border rounded-md cursor-pointer
          flex items-center justify-between
          transition-colors duration-200
          ${disabled 
            ? 'bg-gray-100 cursor-not-allowed text-gray-500' 
            : 'bg-white hover:border-gray-400'
          }
          ${error 
            ? 'border-red-500 focus:border-red-500' 
            : 'border-gray-300 focus:border-blue-500'
          }
          ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
        `}
      >
        <div className="flex-1 min-w-0">
          {selectedAccount ? (
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 truncate">
                {selectedAccount.name}
              </span>
              <span className={`
                px-2 py-1 text-xs rounded-full font-medium
                ${getAccountTypeColor(selectedAccount.account_type)}
              `}>
                {selectedAccount.account_type}
              </span>
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown 
          className={`
            w-4 h-4 text-gray-400 transition-transform duration-200
            ${isOpen ? 'transform rotate-180' : ''}
          `} 
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Account List */}
          <div className="overflow-y-auto max-h-64">
            {Object.keys(groupedAccounts).length === 0 ? (
              <div className="p-3 text-center text-gray-500">
                No accounts found
              </div>
            ) : (
              Object.entries(groupedAccounts).map(([accountType, accountsInType]) => (
                <div key={accountType}>
                  {/* Account Type Header */}
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">
                      {accountType}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      ({accountsInType.length})
                    </span>
                  </div>
                  
                  {/* Accounts in this type */}
                  {accountsInType.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => handleSelect(account)}
                      className={`
                        px-3 py-2 cursor-pointer flex items-center justify-between
                        hover:bg-blue-50 transition-colors duration-150
                        ${value === account.id ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}
                      `}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {account.name}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-2">
                        {account.is_system_account && (
                          <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
                            System
                          </span>
                        )}
                        {value === account.id && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSelect;