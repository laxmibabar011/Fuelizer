import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import Button from "../ui/button/Button";
import {
  Link,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
} from "lucide-react";
import LedgerIntegrationService from "../services/ledgerIntegrationService";

interface PurchaseIntegrationProps {
  purchaseId: number;
  purchaseData?: any;
  onJournalCreated?: (voucher: any) => void;
  onError?: (error: string) => void;
}

const PurchaseIntegration: React.FC<PurchaseIntegrationProps> = ({
  purchaseId,
  purchaseData,
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
        await LedgerIntegrationService.getPurchaseIntegrationSettings();
      if (response.data.success) {
        setIntegrationEnabled(response.data.data.purchaseAutoEntries);
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
        await LedgerIntegrationService.createPurchaseJournalEntriesFromPurchase(
          purchaseId,
          {
            autoCreateEntries: true,
            narration: `Purchase journal entry for purchase #${purchaseId}`,
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

  const openIntegrationSettings = () => {
    // This would typically open a modal or navigate to settings
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
                Automatic journal entry creation is disabled for purchases
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link className="h-5 w-5 text-blue-600" />
          <div>
            <h4 className="font-medium text-gray-900">
              General Ledger Integration
            </h4>
            <p className="text-sm text-gray-600">
              {journalCreated
                ? "Journal entries have been created for this purchase"
                : "Create journal entries for this purchase"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {journalCreated && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Created</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Error</span>
            </div>
          )}

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
              "Create Journal Entries"
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}
    </Card>
  );
};

export default PurchaseIntegration;
