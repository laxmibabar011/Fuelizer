import React, { useState } from "react";
import SalesService, {
  POSPreview,
  POSGroup,
} from "../../../services/salesService";

const POSExport: React.FC = () => {
  const [preview, setPreview] = useState<POSPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [exporting, setExporting] = useState(false);
  const [threshold, setThreshold] = useState<number>(30000);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const loadPreview = async () => {
    try {
      setLoading(true);
      const response = await SalesService.previewPosGroups({
        date: selectedDate,
        threshold,
      });
      setPreview(response.data);
    } catch (error) {
      console.error("Failed to load POS preview:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToSales = async () => {
    if (!preview) return;

    try {
      setExporting(true);
      const groupsToExport = preview.groups.filter((g, idx) => {
        const key = `${g.product_id}:${g.payment_method_id}:${idx}`;
        // if any selected, export only selected; else export all
        const anySelected = Object.values(selected).some(Boolean);
        return anySelected ? !!selected[key] : true;
      });
      const response = await SalesService.exportPosGroups({
        groups: groupsToExport,
        threshold,
      });

      alert(`Successfully exported ${response.data.count} sales records`);
      setPreview(null); // Clear preview after export
    } catch (error) {
      console.error("Failed to export POS groups:", error);
      alert("Failed to export POS groups");
    } finally {
      setExporting(false);
    }
  };

  // UI helpers for payment method visuals
  const getPaymentBadge = (billMode: string) => {
    const mode = (billMode || "").toLowerCase();
    switch (mode) {
      case "cash":
        return {
          label: "CASH",
          classes: "bg-green-100 text-green-800 border-green-200",
          border: "border-l-4 border-green-400",
          icon: "💰",
        };
      case "credit":
        return {
          label: "CREDIT",
          classes: "bg-purple-100 text-purple-800 border-purple-200",
          border: "border-l-4 border-purple-400",
          icon: "🏦",
        };
      case "card":
        return {
          label: "CARD",
          classes: "bg-orange-100 text-orange-800 border-orange-200",
          border: "border-l-4 border-orange-400",
          icon: "💳",
        };
      case "cash_party":
        return {
          label: "CASH PARTY",
          classes: "bg-blue-100 text-blue-800 border-blue-200",
          border: "border-l-4 border-blue-400",
          icon: "🏪",
        };
      default:
        return {
          label: billMode?.toUpperCase() || "OTHER",
          classes: "bg-gray-100 text-gray-800 border-gray-200",
          border: "border-l-4 border-gray-400",
          icon: "🧾",
        };
    }
  };

  const renderSplitPreview = (group: POSGroup) => {
    const thresholdLocal = threshold;
    const isFuel = !!group.is_fuel;
    const rows: {
      idx: number;
      qty: number;
      rate: number;
      amount: number;
      note?: string;
    }[] = [];
    if (!group.needs_split) return null;

    if (isFuel) {
      const rate = group.avg_rate || 0;
      const maxQty = rate > 0 ? Math.floor(thresholdLocal / rate) : 0;
      let remainingQty = group.total_qty;
      let builtAmount = 0;
      let idx = 1;
      while (remainingQty > 0 && maxQty > 0) {
        const qty = Math.min(remainingQty, maxQty);
        const amount = Number((qty * rate).toFixed(2));
        rows.push({ idx, qty, rate, amount });
        remainingQty -= qty;
        builtAmount += amount;
        idx++;
      }
      const adjust = Number((group.total_amount - builtAmount).toFixed(2));
      if (Math.abs(adjust) >= 0.01 && rows.length > 0) {
        const last = rows[rows.length - 1];
        rows[rows.length - 1] = {
          ...last,
          amount: Number((last.amount + adjust).toFixed(2)),
          note: `Adjusted ₹${adjust.toFixed(2)}`,
        };
      }
    } else {
      const n = Math.ceil(group.total_amount / thresholdLocal);
      if (n > 0) {
        const per = group.total_amount / n;
        for (let i = 0; i < n; i++) {
          const isLast = i === n - 1;
          const amount = isLast
            ? Number((group.total_amount - per * (n - 1)).toFixed(2))
            : Number(per.toFixed(2));
          const qty =
            group.total_amount > 0
              ? Number(
                  ((amount / group.total_amount) * group.total_qty).toFixed(3)
                )
              : 0;
          rows.push({ idx: i + 1, qty, rate: group.avg_rate, amount });
        }
      }
    }

    return (
      <div className="mt-3 text-xs">
        <div className="mb-1 font-medium">Split preview</div>
        <div className="grid grid-cols-5 gap-2">
          <div className="text-gray-500">#</div>
          <div className="text-gray-500 text-right">Qty</div>
          <div className="text-gray-500 text-right">Rate</div>
          <div className="text-gray-500 text-right">Amount</div>
          <div className="text-gray-500">Notes</div>
          {rows.map((r) => (
            <React.Fragment key={r.idx}>
              <div>{r.idx}</div>
              <div className="text-right">{r.qty.toFixed(2)}</div>
              <div className="text-right">₹{r.rate.toFixed(2)}</div>
              <div className="text-right font-medium">
                ₹{r.amount.toFixed(2)}
              </div>
              <div className="text-orange-600">{r.note || ""}</div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border rounded-lg bg-white dark:bg-gray-900">
        <div className="p-4 border-b">
          <h2 className="font-semibold">POS Transaction Export</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Group POS transactions by product and payment method, then export to
            Sales
          </p>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Threshold (₹)
              </label>
              <input
                type="number"
                value={threshold}
                min={1000}
                step={500}
                onChange={(e) => setThreshold(Number(e.target.value) || 0)}
                className="w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
            </div>
            <button
              onClick={loadPreview}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Preview Groups"}
            </button>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            <span className="px-2 py-0.5 border rounded bg-green-100 text-green-800">
              💰 Cash
            </span>
            <span className="px-2 py-0.5 border rounded bg-purple-100 text-purple-800">
              🏦 Credit
            </span>
            <span className="px-2 py-0.5 border rounded bg-orange-100 text-orange-800">
              💳 Card
            </span>
            <span className="px-2 py-0.5 border rounded bg-blue-100 text-blue-800">
              🏪 Cash Party
            </span>
            <span className="ml-2">
              Threshold: ₹{threshold.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Preview Results */}
      {preview && (
        <div className="border rounded-lg bg-white dark:bg-gray-900">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Grouping Preview</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap gap-4">
              <span>{preview.total_transactions} transactions</span>
              <span>{preview.total_groups} groups</span>
              {preview.groups_needing_split > 0 && (
                <span className="text-orange-600 ml-2">
                  ({preview.groups_needing_split} groups need splitting)
                </span>
              )}
            </div>
          </div>

          <div className="p-4">
            <div className="space-y-3">
              {preview.groups.map((group, index) => {
                const badge = getPaymentBadge(group.bill_mode || "");
                const key = `${group.product_id}:${group.payment_method_id}:${index}`;
                return (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg ${
                      group.needs_split
                        ? "border-orange-200 bg-orange-50 dark:bg-orange-900/20"
                        : "border-gray-200"
                    } ${badge.border}`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={!!selected[key]}
                          onChange={(e) =>
                            setSelected((s) => ({
                              ...s,
                              [key]: e.target.checked,
                            }))
                          }
                          className="mt-1"
                        />
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 border rounded-full ${badge.classes}`}
                          >
                            {badge.icon} {badge.label}
                          </span>
                          <div className="font-medium">
                            {group.product_name}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          {group.payment_method_name}
                          {group.credit_customer_id && (
                            <span className="ml-2 text-gray-500">
                              •{" "}
                              {group.credit_customer_name || "Credit Customer"}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Qty: {group.total_qty.toFixed(2)} | Rate: ₹
                          {group.avg_rate.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ₹{group.total_amount.toFixed(2)}
                        </div>
                        {group.needs_split && (
                          <div className="text-xs text-orange-600">
                            Will split into{" "}
                            {Math.ceil(group.total_amount / threshold)} invoices
                          </div>
                        )}
                        <button
                          onClick={() =>
                            setExpanded((ex) => ({ ...ex, [key]: !ex[key] }))
                          }
                          className="mt-2 text-xs underline text-blue-700"
                        >
                          {expanded[key] ? "Hide details" : "View details"}
                        </button>
                      </div>
                    </div>
                    {group.needs_split &&
                      expanded[key] &&
                      renderSplitPreview(group)}
                  </div>
                );
              })}
            </div>

            {preview.groups.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-gray-600">
                    {Object.values(selected).some(Boolean)
                      ? `${Object.values(selected).filter(Boolean).length} selected`
                      : "No selection (all)"}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // select all
                        const next: Record<string, boolean> = {};
                        preview.groups.forEach((g, idx) => {
                          next[
                            `${g.product_id}:${g.payment_method_id}:${idx}`
                          ] = true;
                        });
                        setSelected(next);
                      }}
                      className="px-3 py-2 border rounded-md"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelected({})}
                      className="px-3 py-2 border rounded-md"
                    >
                      Clear
                    </button>
                    <button
                      onClick={exportToSales}
                      disabled={exporting}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {exporting ? "Exporting..." : "Export to Sales"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {preview && preview.groups.length === 0 && (
        <div className="border rounded-lg bg-white dark:bg-gray-900">
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-2">
              No transactions found for {selectedDate}
            </div>
            <div className="text-sm text-gray-400">
              Try selecting a different date
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSExport;
