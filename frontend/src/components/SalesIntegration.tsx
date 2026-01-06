import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import Button from "../ui/button/Button";
import {
  Link,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  DollarSign,
} from "lucide-react";
import LedgerIntegrationService from "../services/ledgerIntegrationService";

interface SalesIntegrationProps {
  salesData: any[];
  onJournalCreated?: (vouchers: any[]) => void;
  onError?: (error: string) => void;
}

const SalesIntegration: React.FC<SalesIntegrationProps> = ({
  salesData,
  onJournalCreated,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [journalCreated, setJournalCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [integrationEnabled, setIntegrationEnabled] = useState(false);

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    try {
      const response =
        await LedgerIntegrationService.getSalesIntegrationSettings();
      if (response.data.success) {
        setIntegrationEnabled(response.data.data.salesAutoEntries);
      }
    } catch (err) {
      console.error("Error checking integration status:", err);
    }
  };

  const createJournalEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await LedgerIntegrationService.createSalesJournalEntriesFromSales(
          salesData,
          {
            autoCreateEntries: true,
            narration: `Sales journal entries for ${salesData.length} transactions`,
          }
        );

      if (response.data.success) {
        setJournalCreated(true);
        onJournalCreated?.(response.data.data);
      } else {
        const errorMsg =
          response.data.message || "Failed to create journal entries";
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to create journal entries";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const createCustomerPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Group sales by customer and payment method
      const customerPayments = groupSalesByCustomer(salesData);

      const vouchers = [];
      for (const payment of customerPayments) {
        const response =
          await LedgerIntegrationService.createCustomerPaymentFromSales(
            payment,
            {
              autoCreateEntries: true,
              narration: `Customer payment from ${payment.customerName}`,
            }
          );

        if (response.data.success) {
          vouchers.push(response.data.data);
        }
      }

      if (vouchers.length > 0) {
        setJournalCreated(true);
        onJournalCreated?.(vouchers);
      }
    } catch (err: any) {
      const errorMsg =
        err.message || "Failed to create customer payment entries";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const groupSalesByCustomer = (sales: any[]) => {
    const grouped: { [key: string]: any } = {};

    sales.forEach((sale) => {
      const customerName = sale["Party Name"] || "Cash";
      const paymentMethod = sale["Bill Mode"] || "Cash";
      const key = `${customerName}|${paymentMethod}`;

      if (!grouped[key]) {
        grouped[key] = {
          customerName,
          paymentMethod,
          amount: 0,
          sales: [],
        };
      }

      grouped[key].amount += parseFloat(sale["Invoice Value"] || 0);
      grouped[key].sales.push(sale);
    });

    return Object.values(grouped).map((group) => ({
      id: Date.now() + Math.random(),
      customerName: group.customerName,
      amount: group.amount,
      paymentMethod: group.paymentMethod,
      paymentDate: group.sales[0].Date,
      referenceNumber: `PAY-${Date.now()}`,
    }));
  };

  const openIntegrationSettings = () => {
    window.open("/fuel-admin/general-ledger/integration-settings", "_blank");
  };

  if (!integrationEnabled) {
    return (
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <h4 className="font-medium text-yellow-800">
                Ledger Integration Disabled
              </h4>
              <p className="text-sm text-yellow-700">
                Automatic journal entry creation is disabled for sales
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={openIntegrationSettings}
            className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
          >
            <Settings className="h-4 w-4 mr-1" />
            Enable
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link className="h-5 w-5 text-blue-600" />
          <div>
            <h4 className="font-medium text-gray-900">
              General Ledger Integration
            </h4>
            <p className="text-sm text-gray-600">
              Create journal entries for {salesData.length} sales transactions
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        {journalCreated && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Journal entries created successfully
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={createJournalEntries}
            disabled={loading || journalCreated}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                Creating...
              </>
            ) : journalCreated ? (
              "Journal Created"
            ) : (
              "Create Sales Journal"
            )}
          </Button>

          <Button
            onClick={createCustomerPayment}
            disabled={loading || journalCreated}
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
          >
            <DollarSign className="h-4 w-4" />
            Create Customer Payment
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SalesIntegration;
