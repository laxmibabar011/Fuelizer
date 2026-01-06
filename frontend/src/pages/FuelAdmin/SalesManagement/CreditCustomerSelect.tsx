import { useEffect, useState } from "react";
import SalesService, { CreditCustomer } from "../../../services/salesService";

interface Props {
  value: CreditCustomer | null;
  onChange: (c: CreditCustomer | null) => void;
}

export default function CreditCustomerSelect({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CreditCustomer[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!open) return;
      try {
        setLoading(true);
        const res = await SalesService.searchCreditCustomers({
          q: query,
          limit: 10,
        });
        if (!active) return;
        setResults(res.data || []);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [query, open]);

  return (
    <div className="relative">
      <label className="text-sm text-gray-600">Credit Customer</label>
      <input
        value={value?.name || query}
        onChange={(e) => {
          onChange(null);
          setQuery(e.target.value);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search customer..."
        className="w-full px-3 py-2 border rounded-md bg-transparent"
      />
      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow max-h-60 overflow-auto">
          {loading ? (
            <div className="p-2 text-sm text-gray-500">Loading...</div>
          ) : results.length === 0 ? (
            <div className="p-2 text-sm text-gray-500">No results</div>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {c.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
