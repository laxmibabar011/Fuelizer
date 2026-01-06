import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import Button from "../../../components/ui/button/Button";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Building2,
  CreditCard,
  Wallet,
  Users,
  Truck,
  Banknote,
  Receipt,
} from "lucide-react";
import ledgerService from "../../../services/ledgerService";
import { LedgerAccountDTO, AccountType, AccountStatus } from "../../../types/ledger";
import { LedgerError, handleLedgerError } from "../../../services/ledgerService";

interface ChartOfAccountsProps {}

type FilterType = "all" | "Direct Expense" | "Indirect Expense" | "Asset" | "Liability" | "Customer" | "Vendor" | "Bank";

const ChartOfAccounts: React.FC<ChartOfAccountsProps> = () => {
  const [accounts, setAccounts] = useState<LedgerAccountDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<LedgerAccountDTO | null>(null);

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ledgerService.getAccounts();
      if (response.data.success) {
        setAccounts(response.data.data);
      } else {
        setError(response.data.message || "Failed to load accounts");
      }
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.account_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Filter by account type
    if (filterType !== "all" && account.account_type !== filterType) {
      return false;
    }

    // Filter by status
    if (!showInactive && account.status === 'inactive') {
      return false;
    }

    return true;
  });

  // Group accounts by type
  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
    const type = account.account_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(account);
    return groups;
  }, {} as Record<AccountType, LedgerAccountDTO[]>);

  // Get icon for account type
  const getAccountTypeIcon = (accountType: AccountType) => {
    switch (accountType) {
      case 'Direct Expense':
      case 'Indirect Expense':
        return <Receipt className="h-4 w-4" />;
      case 'Asset':
        return <Building2 className="h-4 w-4" />;
      case 'Liability':
        return <CreditCard className="h-4 w-4" />;
      case 'Customer':
        return <Users className="h-4 w-4" />;
      case 'Vendor':
        return <Truck className="h-4 w-4" />;
      case 'Bank':
        return <Banknote className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  // Get color for account type
  const getAccountTypeColor = (accountType: AccountType) => {
    switch (accountType) {
      case 'Direct Expense':
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300";
      case 'Indirect Expense':
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300";
      case 'Asset':
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300";
      case 'Liability':
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300";
      case 'Customer':
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300";
      case 'Vendor':
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300";
      case 'Bank':
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const handleCreateAccount = () => {
    setSelectedAccount(null);
    setShowCreateModal(true);
  };

  const handleEditAccount = (account: LedgerAccountDTO) => {
    setSelectedAccount(account);
    setShowEditModal(true);
  };

  const handleDeleteAccount = async (account: LedgerAccountDTO) => {
    if (account.is_system_account) {
      alert("System accounts cannot be deleted");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${account.name}"?`)) {
      return;
    }

    try {
      const response = await ledgerService.deleteAccount(account.id!);
      if (response.data.success) {
        await loadAccounts(); // Reload accounts
      } else {
        alert(response.data.message || "Failed to delete account");
      }
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      alert(ledgerError.message);
    }
  };

  const handleToggleStatus = async (account: LedgerAccountDTO) => {
    const newStatus: AccountStatus = account.status === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await ledgerService.updateAccount(account.id!, { status: newStatus });
      if (response.data.success) {
        await loadAccounts(); // Reload accounts
      } else {
        alert(response.data.message || "Failed to update account status");
      }
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      alert(ledgerError.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Chart of Accounts
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your accounting structure and categories
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            {filteredAccounts.length} of {accounts.length} accounts
          </Badge>
          <Button onClick={handleCreateAccount} startIcon={<Plus className="h-4 w-4" />}>
            Add Account
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-600 dark:text-red-400 mt-1">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAccounts}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="w-full sm:w-48 pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          >
            <option value="all">All Types</option>
            <option value="Direct Expense">Direct Expense</option>
            <option value="Indirect Expense">Indirect Expense</option>
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Customer">Customer</option>
            <option value="Vendor">Vendor</option>
            <option value="Bank">Bank</option>
          </select>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowInactive(!showInactive)}
          startIcon={showInactive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        >
          {showInactive ? "Hide Inactive" : "Show Inactive"}
        </Button>
      </div>

      {/* Accounts Display */}
      {Object.keys(groupedAccounts).length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No accounts found</h3>
          <p className="text-sm">
            {searchTerm || filterType !== "all" 
              ? "Try adjusting your search or filter criteria"
              : "Create your first account to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAccounts).map(([accountType, accountList]) => (
            <Card key={accountType}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  {getAccountTypeIcon(accountType as AccountType)}
                  <span>{accountType}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {accountList.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {accountList.map((account) => (
                    <div
                      key={account.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        account.status === 'inactive' 
                          ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60' 
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      } transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${getAccountTypeColor(account.account_type)}`}>
                          {getAccountTypeIcon(account.account_type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {account.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {account.is_system_account && (
                              <Badge variant="outline" className="text-xs">
                                System Account
                              </Badge>
                            )}
                            <Badge 
                              variant={account.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {account.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAccount(account)}
                          startIcon={<Edit className="h-3 w-3" />}
                        >
                          Edit
                        </Button>
                        {!account.is_system_account && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAccount(account)}
                            startIcon={<Trash2 className="h-3 w-3" />}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(account)}
                          startIcon={account.status === 'active' ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        >
                          {account.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals will be added in the next step */}
      {showCreateModal && (
        <AccountModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={loadAccounts}
          account={null}
        />
      )}
      
      {showEditModal && selectedAccount && (
        <AccountModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={loadAccounts}
          account={selectedAccount}
        />
      )}
    </div>
  );
};

// Account Modal Component (Create/Edit)
interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  account: LedgerAccountDTO | null;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onSave, account }) => {
  const [formData, setFormData] = useState({
    name: '',
    account_type: 'Direct Expense' as AccountType,
    status: 'active' as AccountStatus,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        account_type: account.account_type,
        status: account.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        account_type: 'Direct Expense',
        status: 'active',
      });
    }
    setError(null);
  }, [account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (account) {
        // Update existing account
        const response = await ledgerService.updateAccount(account.id!, formData);
        if (response.data.success) {
          onSave();
          onClose();
        } else {
          setError(response.data.message || "Failed to update account");
        }
      } else {
        // Create new account
        const response = await ledgerService.createAccount(formData);
        if (response.data.success) {
          onSave();
          onClose();
        } else {
          setError(response.data.message || "Failed to create account");
        }
      }
    } catch (err) {
      const ledgerError = handleLedgerError(err);
      setError(ledgerError.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {account ? 'Edit Account' : 'Create New Account'}
        </h3>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter account name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account Type *
            </label>
            <select
              value={formData.account_type}
              onChange={(e) => setFormData({ ...formData, account_type: e.target.value as AccountType })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="Direct Expense">Direct Expense</option>
              <option value="Indirect Expense">Indirect Expense</option>
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Customer">Customer</option>
              <option value="Vendor">Vendor</option>
              <option value="Bank">Bank</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as AccountStatus })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : (account ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChartOfAccounts;