import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { LedgerAccountDTO, AccountType } from '../../../types/ledger';

interface CompactAccountSelectProps {
  accounts: LedgerAccountDTO[];
  value: number | null;
  onChange: (accountId: number, account: LedgerAccountDTO) => void;
  placeholder?: string;
  filterTypes?: AccountType[];
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

const CompactAccountSelect: React.FC<CompactAccountSelectProps> = ({
  accounts,
  value,
  onChange,
  placeholder = "Select account...",
  filterTypes,
  className = "",
  disabled = false,
  error = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
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

  // Focus search input when modal opens
  useEffect(() => {
    if (isModalOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isModalOpen]);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        setSearchTerm('');
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isModalOpen]);

  const handleSelect = (account: LedgerAccountDTO) => {
    if (account.id !== undefined) {
      onChange(account.id, account);
      setIsModalOpen(false);
      setSearchTerm('');
    }
  };

  const openModal = () => {
    if (!disabled) {
      setIsModalOpen(true);
      setSearchTerm('');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSearchTerm('');
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
    <>
      {/* Compact Trigger Button */}
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={openModal}
          disabled={disabled}
          className={`
            w-full px-2 py-1 border rounded text-sm text-left
            flex items-center justify-between
            transition-colors duration-200
            ${disabled 
              ? 'bg-gray-100 cursor-not-allowed text-gray-500' 
              : 'bg-white hover:border-gray-400 cursor-pointer'
            }
            ${error 
              ? 'border-red-500' 
              : 'border-gray-300 hover:border-blue-400'
            }
          `}
        >
          <span className="flex-1 min-w-0 truncate">
            {selectedAccount ? (
              <span className="font-medium text-gray-900">
                {selectedAccount.name}
              </span>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </span>
          <ChevronDown className="w-3 h-3 text-gray-400 ml-1 flex-shrink-0" />
        </button>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            ref={modalRef}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Select Account</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search accounts by name or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Account List */}
            <div className="flex-1 overflow-y-auto p-4">
              {Object.keys(groupedAccounts).length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No accounts found matching your search
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedAccounts).map(([accountType, accountsInType]) => (
                    <div key={accountType}>
                      {/* Account Type Header */}
                      <div className="flex items-center mb-2">
                        <span className={`
                          px-3 py-1 text-sm font-medium rounded-full
                          ${getAccountTypeColor(accountType as AccountType)}
                        `}>
                          {accountType}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({accountsInType.length} accounts)
                        </span>
                      </div>
                      
                      {/* Accounts Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                        {accountsInType.map((account) => (
                          <button
                            key={account.id}
                            onClick={() => handleSelect(account)}
                            className={`
                              p-3 text-left border rounded-lg transition-all duration-200
                              hover:border-blue-300 hover:bg-blue-50
                              ${value === account.id 
                                ? 'border-blue-500 bg-blue-100 ring-1 ring-blue-500' 
                                : 'border-gray-200'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {account.name}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  ID: {account.id}
                                  {account.is_system_account && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                                      System
                                    </span>
                                  )}
                                </div>
                              </div>
                              {value === account.id && (
                                <Check className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompactAccountSelect;