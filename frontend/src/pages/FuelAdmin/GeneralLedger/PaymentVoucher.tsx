import React, { useState, useEffect } from "react";
import { Card } from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import { AccountSelect } from "../../../components/ui/Select";
import {
  ArrowDownLeft,
} from "lucide-react";
import LedgerService from "../../../services/ledgerService";
import { LedgerAccountDTO } from "../../../types/ledger";
import { LedgerFormatters } from "../../../services/ledgerService";
import { generateVoucherNumber } from "../../../utils/voucherUtils";

interface PaymentFormData {
  date: string;
  narration: string;
  reference_number: string;
  payment_method: 'Cash' | 'Bank' | 'Cheque';
  bank_account_id: number | null;
  cash_account_id: number | null;
  expense_account_id: number | null;
  amount: number;
  payee_name: string;
  cheque_number?: string;
}

const PaymentVoucher: React.FC = () => {
  const [accounts, setAccounts] = useState<LedgerAccountDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState<PaymentFormData>({
    date: new Date().toISOString().split('T')[0],
    narration: '',
    reference_number: '',
    payment_method: 'Cash',
    bank_account_id: null,
    cash_account_id: null,
    expense_account_id: null,
    amount: 0,
    payee_name: '',
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

  const handleInputChange = (field: keyof PaymentFormData, value: any) => {
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

    if (!formData.payee_name.trim()) {
      errors.push('Payee name is required');
    }

    if (formData.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!formData.expense_account_id) {
      errors.push('Expense account is required');
    }

    if (formData.payment_method === 'Cash' && !formData.cash_account_id) {
      errors.push('Cash account is required for cash payments');
    }

    if (formData.payment_method === 'Bank' && !formData.bank_account_id) {
      errors.push('Bank account is required for bank payments');
    }

    if (formData.payment_method === 'Cheque') {
      if (!formData.bank_account_id) {
        errors.push('Bank account is required for cheque payments');
      }
      if (!formData.cheque_number?.trim()) {
        errors.push('Cheque number is required for cheque payments');
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      // Determine the credit account based on payment method
      let creditAccountId: number;
      if (formData.payment_method === 'Cash') {
        creditAccountId = formData.cash_account_id!;
      } else {
        creditAccountId = formData.bank_account_id!;
      }

      // Generate voucher number
      const voucherNumber = generateVoucherNumber('PV');
      
      const payload = {
        date: formData.date,
        voucher_type: 'Payment' as const,
        voucher_number: voucherNumber,
        narration: `Payment to ${formData.payee_name} - ${formData.narration}`,
        reference_number: formData.reference_number || undefined,
        entries: [
          {
            ledger_account_id: formData.expense_account_id!,
            debit_amount: formData.amount,
            credit_amount: 0,
            narration: `Payment to ${formData.payee_name}`
          },
          {
            ledger_account_id: creditAccountId,
            debit_amount: 0,
            credit_amount: formData.amount,
            narration: `${formData.payment_method} payment${formData.cheque_number ? ` - Cheque #${formData.cheque_number}` : ''}`
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
          payment_method: 'Cash',
          bank_account_id: null,
          cash_account_id: null,
          expense_account_id: null,
          amount: 0,
          payee_name: '',
          cheque_number: ''
        });
        setValidationErrors([]);
        setError(null);
        
        alert('Payment voucher created successfully!');
      }
    } catch (err) {
      setError('Failed to create payment voucher');
      console.error('Error creating payment voucher:', err);
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
        <ArrowDownLeft className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Voucher</h1>
          <p className="text-gray-600">Record payments made to vendors, expenses, and other outgoing transactions</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Payment Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Details</h3>
        
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
                Payee Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter payee name"
                value={formData.payee_name}
                onChange={(e) => handleInputChange('payee_name', e.target.value)}
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
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => handleInputChange('payment_method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expense Account <span className="text-red-500">*</span>
              </label>
              <AccountSelect
                accounts={accounts}
                value={formData.expense_account_id}
                onChange={(accountId) => handleInputChange('expense_account_id', accountId)}
                placeholder="Select expense account"
                filterTypes={['Direct Expense', 'Indirect Expense', 'Vendor']}
                error={validationErrors.some(err => err.includes('Expense account'))}
              />
            </div>

            {formData.payment_method === 'Cash' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cash Account <span className="text-red-500">*</span>
                </label>
                <AccountSelect
                  accounts={accounts}
                  value={formData.cash_account_id}
                  onChange={(accountId) => handleInputChange('cash_account_id', accountId)}
                  placeholder="Select cash account (Create Asset accounts in Chart of Accounts if empty)"
                  filterTypes={['Asset']}
                  error={validationErrors.some(err => err.includes('Cash account'))}
                />
                {/* Debug info */}
                <div className="text-xs text-gray-500 mt-1">
                  Asset accounts available: {accounts.filter(acc => acc.account_type === 'Asset').length}
                </div>
              </div>
            )}

            {(formData.payment_method === 'Bank' || formData.payment_method === 'Cheque') && (
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

            {formData.payment_method === 'Cheque' && (
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
                placeholder="Describe the payment purpose"
                value={formData.narration}
                onChange={(e) => handleInputChange('narration', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Summary */}
      {formData.amount > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Payment Summary</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div className="flex justify-between">
              <span>Payee:</span>
              <span className="font-medium">{formData.payee_name || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-bold text-lg">{LedgerFormatters.formatCurrency(formData.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span className="font-medium">{formData.payment_method}</span>
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
                payment_method: 'Cash',
                bank_account_id: null,
                cash_account_id: null,
                expense_account_id: null,
                amount: 0,
                payee_name: '',
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
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? 'Creating Payment...' : 'Create Payment Voucher'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PaymentVoucher;