import React, { useState, useEffect } from "react";
import { Card } from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import { AccountSelect } from "../../../components/ui/Select";
import {
  ArrowUpRight,
} from "lucide-react";
import LedgerService from "../../../services/ledgerService";
import { LedgerAccountDTO } from "../../../types/ledger";
import { LedgerFormatters } from "../../../services/ledgerService";
import { generateVoucherNumber } from "../../../utils/voucherUtils";

interface ReceiptFormData {
  date: string;
  narration: string;
  reference_number: string;
  receipt_method: 'Cash' | 'Bank' | 'Cheque';
  bank_account_id: number | null;
  cash_account_id: number | null;
  income_account_id: number | null;
  amount: number;
  received_from: string;
  cheque_number?: string;
}

const ReceiptVoucher: React.FC = () => {
  const [accounts, setAccounts] = useState<LedgerAccountDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState<ReceiptFormData>({
    date: new Date().toISOString().split('T')[0],
    narration: '',
    reference_number: '',
    receipt_method: 'Cash',
    bank_account_id: null,
    cash_account_id: null,
    income_account_id: null,
    amount: 0,
    received_from: '',
    cheque_number: ''
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await LedgerService.getActiveAccounts();
      if (response.data.success) {
        setAccounts(response.data.data);
      }
    } catch (err) {
      setError('Failed to load accounts');
      console.error('Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ReceiptFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationErrors([]);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.date) {
      errors.push('Date is required');
    }

    if (!formData.narration.trim()) {
      errors.push('Narration is required');
    }

    if (!formData.received_from.trim()) {
      errors.push('Received from field is required');
    }

    if (formData.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!formData.income_account_id) {
      errors.push('Income account is required');
    }

    if (formData.receipt_method === 'Cash' && !formData.cash_account_id) {
      errors.push('Cash account is required for cash receipts');
    }

    if (formData.receipt_method === 'Bank' && !formData.bank_account_id) {
      errors.push('Bank account is required for bank receipts');
    }

    if (formData.receipt_method === 'Cheque') {
      if (!formData.bank_account_id) {
        errors.push('Bank account is required for cheque receipts');
      }
      if (!formData.cheque_number?.trim()) {
        errors.push('Cheque number is required for cheque receipts');
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      // Determine the debit account based on receipt method
      let debitAccountId: number;
      if (formData.receipt_method === 'Cash') {
        debitAccountId = formData.cash_account_id!;
      } else {
        debitAccountId = formData.bank_account_id!;
      }

      // Generate voucher number
      const voucherNumber = generateVoucherNumber('RV');
      
      const payload = {
        date: formData.date,
        voucher_type: 'Receipt' as const,
        voucher_number: voucherNumber,
        narration: `Receipt from ${formData.received_from} - ${formData.narration}`,
        reference_number: formData.reference_number || undefined,
        entries: [
          {
            ledger_account_id: debitAccountId,
            debit_amount: formData.amount,
            credit_amount: 0,
            narration: `${formData.receipt_method} receipt${formData.cheque_number ? ` - Cheque #${formData.cheque_number}` : ''}`
          },
          {
            ledger_account_id: formData.income_account_id!,
            debit_amount: 0,
            credit_amount: formData.amount,
            narration: `Receipt from ${formData.received_from}`
          }
        ]
      };

      const response = await LedgerService.createVoucher(payload);

      if (response.data.success) {
        // Reset form
        setFormData({
          date: new Date().toISOString().split('T')[0],
          narration: '',
          reference_number: '',
          receipt_method: 'Cash',
          bank_account_id: null,
          cash_account_id: null,
          income_account_id: null,
          amount: 0,
          received_from: '',
          cheque_number: ''
        });
        setValidationErrors([]);
        setError(null);
        
        alert('Receipt voucher created successfully!');
      }
    } catch (err) {
      setError('Failed to create receipt voucher');
      console.error('Error creating receipt voucher:', err);
    } finally {
      setIsSubmitting(false);
    }
  };





  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ArrowUpRight className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receipt Voucher</h1>
          <p className="text-gray-600">Record money received from customers, sales, and other incoming transactions</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Receipt Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Receipt Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Received From <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter customer/payer name"
                value={formData.received_from}
                onChange={(e) => handleInputChange('received_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt Method <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.receipt_method}
                onChange={(e) => handleInputChange('receipt_method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Deposit</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Income Account <span className="text-red-500">*</span>
              </label>
              <AccountSelect
                accounts={accounts}
                value={formData.income_account_id}
                onChange={(accountId) => handleInputChange('income_account_id', accountId)}
                placeholder="Select income account"
                filterTypes={['Customer', 'Liability']}
                error={validationErrors.some(err => err.includes('Income account'))}
              />
            </div>

            {formData.receipt_method === 'Cash' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cash Account <span className="text-red-500">*</span>
                </label>
                <AccountSelect
                  accounts={accounts}
                  value={formData.cash_account_id}
                  onChange={(accountId) => handleInputChange('cash_account_id', accountId)}
                  placeholder="Select cash account"
                  filterTypes={['Asset']}
                  error={validationErrors.some(err => err.includes('Cash account'))}
                />
              </div>
            )}

            {(formData.receipt_method === 'Bank' || formData.receipt_method === 'Cheque') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Account <span className="text-red-500">*</span>
                </label>
                <AccountSelect
                  accounts={accounts}
                  value={formData.bank_account_id}
                  onChange={(accountId) => handleInputChange('bank_account_id', accountId)}
                  placeholder="Select bank account"
                  filterTypes={['Bank']}
                  error={validationErrors.some(err => err.includes('Bank account'))}
                />
              </div>
            )}

            {formData.receipt_method === 'Cheque' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cheque Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter cheque number"
                  value={formData.cheque_number || ''}
                  onChange={(e) => handleInputChange('cheque_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                placeholder="Optional reference number"
                value={formData.reference_number}
                onChange={(e) => handleInputChange('reference_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Narration <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Describe the receipt purpose"
                value={formData.narration}
                onChange={(e) => handleInputChange('narration', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Receipt Summary */}
      {formData.amount > 0 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <h4 className="text-sm font-medium text-green-800 mb-2">Receipt Summary</h4>
          <div className="text-sm text-green-700 space-y-1">
            <div className="flex justify-between">
              <span>Received From:</span>
              <span className="font-medium">{formData.received_from || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-bold text-lg">{LedgerFormatters.formatCurrency(formData.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Receipt Method:</span>
              <span className="font-medium">{formData.receipt_method}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h4>
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
              setFormData({
                date: new Date().toISOString().split('T')[0],
                narration: '',
                reference_number: '',
                receipt_method: 'Cash',
                bank_account_id: null,
                cash_account_id: null,
                income_account_id: null,
                amount: 0,
                received_from: '',
                cheque_number: ''
              });
              setValidationErrors([]);
              setError(null);
            }}
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || formData.amount <= 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? 'Creating Receipt...' : 'Create Receipt Voucher'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ReceiptVoucher;