import { useEffect, useMemo, useState } from "react";
import transactionService from "../../../../services/transactionService";

interface TxnRow {
  id: number;
  time: string;
  ts: number;
  product: string;
  qty: number;
  price: number;
  amount: number;
  payment: string;
  operator?: string;
  nozzle?: string;
}

const LiveTransactions: React.FC = () => {
  const [rows, setRows] = useState<TxnRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [search, setSearch] = useState("");
  const [operatorFilter, setOperatorFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const load = async () => {
    try {
      setLoading(true);
      const res = await transactionService.getAllTransactions();
      const list = res.data?.data || res.data || [];
      const txns = (Array.isArray(list) ? list : []).map((t: any) => ({
        id: t.id,
        time: new Date(t.transaction_time).toLocaleTimeString(),
        ts: new Date(t.transaction_time).getTime(),
        product: t.Nozzle?.Product?.name || "-",
        qty: Number(t.litres_sold || 0),
        price: Number(t.price_per_litre_at_sale || 0),
        amount: Number(t.total_amount || 0),
        payment: t.PaymentMethod?.name || "-",
        operator: t.Operator?.UserDetails?.full_name || t.Operator?.email,
        nozzle: t.Nozzle?.code || undefined,
      }));
      setRows(txns);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const operators = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.operator && set.add(r.operator));
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(() => {
    let r = rows;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (x) =>
          x.product.toLowerCase().includes(q) ||
          String(x.id).includes(q) ||
          (x.operator || "").toLowerCase().includes(q) ||
          (x.payment || "").toLowerCase().includes(q) ||
          (x.nozzle || "").toLowerCase().includes(q)
      );
    }
    if (operatorFilter !== "all") {
      r = r.filter((x) => (x.operator || "") === operatorFilter);
    }
    r = [...r].sort((a, b) =>
      sortOrder === "desc" ? b.ts - a.ts : a.ts - b.ts
    );
    return r;
  }, [rows, search, operatorFilter, sortOrder]);

  const total = useMemo(
    () => filtered.reduce((s, r) => s + r.amount, 0),
    [filtered]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Live Transactions</h2>
          <div className="text-xs text-gray-500">
            Last updated:{" "}
            {lastUpdated ? lastUpdated.toLocaleTimeString() : "--"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="px-3 py-1 border rounded-md text-sm"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`px-3 py-1 rounded-md text-sm ${autoRefresh ? "bg-blue-600 text-white" : "border"}`}
          >
            {autoRefresh ? "Auto Refresh ON" : "Auto Refresh"}
          </button>
        </div>
      </div>
      <div className="border rounded-lg bg-white dark:bg-gray-900">
        <div className="p-2 border-b text-sm flex items-center gap-2">
          <input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 px-2 border rounded-md"
          />
          <select
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className="h-8 px-2 border rounded-md"
          >
            <option value="all">All Operators</option>
            {operators.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="h-8 px-2 border rounded-md"
          >
            <option value="desc">Sort by Time (newest)</option>
            <option value="asc">Sort by Time (oldest)</option>
          </select>
          <div className="ml-auto text-xs text-gray-500">
            Showing {filtered.length} of {rows.length} transactions
          </div>
        </div>
        <div className="p-2 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-right">Amount</th>
                <th className="p-2 text-right">Litres</th>
                <th className="p-2 text-left">Product</th>
                <th className="p-2 text-left">Operator</th>
                <th className="p-2 text-left">Nozzle</th>
                <th className="p-2 text-left">Payment</th>
                <th className="p-2 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={r.id}
                  className={`border-b ${i % 2 ? "bg-gray-50 dark:bg-gray-800/50" : ""}`}
                >
                  <td className="p-2">#{r.id}</td>
                  <td className="p-2 text-right">₹{r.amount.toFixed(2)}</td>
                  <td className="p-2 text-right">{r.qty.toFixed(2)} L</td>
                  <td className="p-2">{r.product}</td>
                  <td className="p-2">{r.operator || "-"}</td>
                  <td className="p-2">{r.nozzle || "-"}</td>
                  <td className="p-2">
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100">
                      {r.payment}
                    </span>
                  </td>
                  <td className="p-2">{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-right mt-2 text-sm font-semibold">
            Total: ₹{total.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTransactions;
