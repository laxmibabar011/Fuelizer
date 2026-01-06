import { useEffect, useMemo, useState } from "react";
import SalesService, { SalesData } from "../../../services/salesService";

interface SalesTransaction {
  id: string;
  date: string;
  billNo: string;
  billMode: string;
  partyName: string;
  registrationType: string;
  gstin: string;
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
  gstRate: number;
  taxableValue: number;
  sgst: number;
  cgst: number;
  igst: number;
  cessRate: number;
  cessAmt: number;
  tcsRate: number;
  tcsAmt: number;
  invoiceValue: number;
}

const toRow = (r: SalesData): SalesTransaction => ({
  id: String(r.id || `${r.Date}-${r.BillNo}`),
  date: r.Date,
  billNo: r.BillNo,
  billMode: r["Bill Mode"],
  partyName: r["Party Name"],
  registrationType: r["Registration Type"] || "unregistered/consumer",
  gstin: r.GSTIN || "",
  itemName: r["Item Name"],
  qty: Number(r.Qty || 0),
  rate: Number(r.Rate || 0),
  amount: Number(r.Amount || 0),
  gstRate: Number(r["GST Rate"] || 0),
  taxableValue: Number(r["Taxable Value"] || 0),
  sgst: Number(r.SGST || 0),
  cgst: Number(r.CGST || 0),
  igst: Number(r.IGST || 0),
  cessRate: Number(r["Cess Rate"] || 0),
  cessAmt: Number(r["Cess Amt"] || 0),
  tcsRate: Number(r["TCS Rate"] || 0),
  tcsAmt: Number(r["TCS Amt"] || 0),
  invoiceValue: Number(r["Invoice Value"] || 0),
});

const TransactionsView: React.FC = () => {
  const [salesTransactions, setSalesTransactions] = useState<
    SalesTransaction[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [billModeFilter, setBillModeFilter] = useState<string>("all");
  const [itemFilter, setItemFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const load = async () => {
    const res = await SalesService.listSales({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      limit: 500,
    });
    const rows: SalesData[] = res.data || [];
    setSalesTransactions(rows.map(toRow));
  };

  useEffect(() => {
    load();
  }, []);

  const filteredTransactions = useMemo(() => {
    return salesTransactions.filter((transaction) => {
      const matchesSearch =
        transaction.partyName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.itemName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBillMode =
        billModeFilter === "all" || transaction.billMode === billModeFilter;
      const matchesItem =
        itemFilter === "all" || transaction.itemName === itemFilter;

      return matchesSearch && matchesBillMode && matchesItem;
    });
  }, [salesTransactions, searchTerm, billModeFilter, itemFilter]);

  const totalInvoiceValue = filteredTransactions.reduce(
    (sum, t) => sum + t.invoiceValue,
    0
  );
  const totalQuantity = filteredTransactions.reduce((sum, t) => sum + t.qty, 0);

  const exportToExcel = () => {
    const headers = [
      "Date",
      "BillNo",
      "Bill Mode",
      "Party Name",
      "Registration Type",
      "GSTIN",
      "Item Name",
      "Qty",
      "Rate",
      "Amount",
      "GST Rate",
      "Taxable Value",
      "SGST",
      "CGST",
      "IGST",
      "Cess Rate",
      "Cess Amt",
      "TCS Rate",
      "TCS Amt",
      "Invoice Value",
    ];

    const escape = (val: any) => {
      const s = String(val ?? "");
      if (s.includes(",") || s.includes("\n") || s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    const fmtDate = (iso: string) => {
      const parts = (iso || "").split("-");
      const text =
        parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : iso;
      return "'" + text;
    };

    // compute totals
    const totals = filteredTransactions.reduce(
      (acc, r) => {
        acc.qty += r.qty || 0;
        acc.amount += r.amount || 0;
        acc.taxable += r.taxableValue || 0;
        acc.sgst += r.sgst || 0;
        acc.cgst += r.cgst || 0;
        acc.igst += r.igst || 0;
        acc.cess += r.cessAmt || 0;
        acc.tcs += r.tcsAmt || 0;
        acc.invoice += r.invoiceValue || 0;
        return acc;
      },
      {
        qty: 0,
        amount: 0,
        taxable: 0,
        sgst: 0,
        cgst: 0,
        igst: 0,
        cess: 0,
        tcs: 0,
        invoice: 0,
      }
    );

    const rowsCsv = filteredTransactions.map((r) =>
      [
        fmtDate(r.date),
        r.billNo,
        r.billMode,
        r.partyName,
        r.registrationType,
        r.gstin,
        r.itemName,
        r.qty,
        r.rate,
        r.amount,
        r.gstRate,
        r.taxableValue,
        r.sgst,
        r.cgst,
        r.igst,
        r.cessRate,
        r.cessAmt,
        r.tcsRate,
        r.tcsAmt,
        r.invoiceValue,
      ]
        .map(escape)
        .join(",")
    );

    const totalRow = [
      "TOTAL",
      "",
      "",
      "",
      "",
      "",
      "",
      totals.qty.toFixed(2),
      "",
      totals.amount.toFixed(2),
      "",
      totals.taxable.toFixed(2),
      totals.sgst.toFixed(2),
      totals.cgst.toFixed(2),
      totals.igst.toFixed(2),
      "",
      totals.cess.toFixed(2),
      "",
      totals.tcs.toFixed(2),
      totals.invoice.toFixed(2),
    ]
      .map(escape)
      .join(",");

    // Heading similar to your register sheet
    const parseDMY = (iso: string) => {
      const p = (iso || "").split("-");
      return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : iso;
    };
    const startDate = dateFrom || filteredTransactions[0]?.date || "";
    const endDate =
      dateTo ||
      filteredTransactions[filteredTransactions.length - 1]?.date ||
      "";
    const heading = `SALES REGISTER FROM ${parseDMY(startDate)} TO ${parseDMY(endDate)}`;

    // Build HTML workbook to keep formatting (bold heading and header)
    const ths = headers.map((h) => `<th>${h}</th>`).join("");
    const trs = filteredTransactions
      .map((r) => {
        const tds = [
          fmtDate(r.date),
          r.billNo,
          r.billMode,
          r.partyName,
          r.registrationType,
          r.gstin,
          r.itemName,
          r.qty,
          r.rate,
          r.amount,
          r.gstRate,
          r.taxableValue,
          r.sgst,
          r.cgst,
          r.igst,
          r.cessRate,
          r.cessAmt,
          r.tcsRate,
          r.tcsAmt,
          r.invoiceValue,
        ]
          .map((v) => `<td>${escape(v)}</td>`)
          .join("");
        return `<tr>${tds}</tr>`;
      })
      .join("");

    const totalTds = [
      "TOTAL",
      "",
      "",
      "",
      "",
      "",
      "",
      totals.qty.toFixed(2),
      "",
      totals.amount.toFixed(2),
      "",
      totals.taxable.toFixed(2),
      totals.sgst.toFixed(2),
      totals.cgst.toFixed(2),
      totals.igst.toFixed(2),
      "",
      totals.cess.toFixed(2),
      "",
      totals.tcs.toFixed(2),
      totals.invoice.toFixed(2),
    ]
      .map((v) => `<td>${escape(v)}</td>`)
      .join("");

    const html = `<!DOCTYPE html>
    <html><head><meta charset="utf-8" />
    <style>
      table { border-collapse: collapse; }
      td, th { border: 1px solid #999; padding: 4px; font-family: Arial; font-size: 12px; }
      thead th { font-weight: bold; background: #f3f3f3; }
      .heading { font-weight: bold; text-align: center; font-size: 14px; }
    </style>
    </head><body>
      <table>
        <tr><th class="heading" colspan="${headers.length}">${heading}</th></tr>
        <thead><tr>${ths}</tr></thead>
        <tbody>${trs}<tr>${totalTds}</tr></tbody>
      </table>
    </body></html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_register_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 overflow-x-hidden">
      {/* Compact metric cards (refer Product Master style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg bg-white dark:bg-gray-900">
          <div className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Sales
            </p>
            <p className="text-2xl font-bold">{filteredTransactions.length}</p>
          </div>
        </div>
        <div className="border rounded-lg bg-white dark:bg-gray-900">
          <div className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Quantity
            </p>
            <p className="text-2xl font-bold text-green-600">
              {totalQuantity.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="border rounded-lg bg-white dark:bg-gray-900">
          <div className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Value
            </p>
            <p className="text-2xl font-bold">
              ₹{totalInvoiceValue.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="border rounded-lg bg-white dark:bg-gray-900">
          <div className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Avg. Sale Value
            </p>
            <p className="text-2xl font-bold">
              ₹
              {filteredTransactions.length > 0
                ? (totalInvoiceValue / filteredTransactions.length).toFixed(2)
                : "0.00"}
            </p>
          </div>
        </div>
      </div>

      <div className="border rounded-lg bg-white dark:bg-gray-900">
        <div className="p-3 border-b">
          <h2 className="font-semibold text-sm">Filters & Search</h2>
        </div>
        <div className="p-3 grid grid-cols-1 md:grid-cols-12 gap-2">
          <div>
            <input
              placeholder="Search sales records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 px-2 text-sm border rounded-md bg-transparent"
            />
          </div>
          <input
            type="date"
            className="h-9 px-2 text-sm border rounded-md"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            type="date"
            className="h-9 px-2 text-sm border rounded-md"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <select
            className="h-9 px-2 text-sm border rounded-md md:col-span-3"
            value={billModeFilter}
            onChange={(e) => setBillModeFilter(e.target.value)}
          >
            <option value="all">All Bill Modes</option>
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
            <option value="card">Card</option>
            <option value="cash_party">Cash Party</option>
          </select>
          <select
            className="h-9 px-2 text-sm border rounded-md md:col-span-3"
            value={itemFilter}
            onChange={(e) => setItemFilter(e.target.value)}
          >
            <option value="all">All Items</option>
            <option value="DIESEL">DIESEL</option>
            <option value="PETROL">PETROL</option>
          </select>
          <div className="md:col-span-5 flex md:justify-end">
            <button
              onClick={load}
              className="h-9 px-3 text-sm border rounded-md mr-2"
            >
              Refresh
            </button>
            <button
              onClick={exportToExcel}
              className="h-9 px-3 text-sm border rounded-md"
            >
              Export to Excel
            </button>
          </div>
        </div>
      </div>

      <div className="border rounded-lg bg-white dark:bg-gray-900">
        <div className="p-2 sm:p-3 border-b">
          <h2 className="font-semibold text-sm">All Fuel Pump Sales Records</h2>
        </div>
        <div className="p-2 sm:p-3">
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full table-fixed text-[11px]">
              <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                <tr className="border-b">
                  <th className="text-left p-1 sm:p-2 w-20 sm:w-24">Date</th>
                  <th className="text-left p-1 sm:p-2 w-20 sm:w-24">Bill No</th>
                  <th className="text-left p-1 sm:p-2 hidden md:table-cell w-20 sm:w-24">
                    Bill Mode
                  </th>
                  <th className="text-left p-1 sm:p-2">Party</th>
                  <th className="text-left p-1 sm:p-2 hidden lg:table-cell">
                    Item
                  </th>
                  <th className="text-right p-1 sm:p-2 w-14 sm:w-16">Qty</th>
                  <th className="text-right p-1 sm:p-2 w-16 sm:w-20">Rate</th>
                  <th className="text-right p-1 sm:p-2 w-20 sm:w-24">Amount</th>
                  <th className="text-left p-1 sm:p-2 hidden xl:table-cell">
                    Reg Type
                  </th>
                  <th className="text-left p-1 sm:p-2 hidden xl:table-cell">
                    GSTIN
                  </th>
                  <th className="text-right p-1 sm:p-2 hidden 2xl:table-cell">
                    GST%
                  </th>
                  <th className="text-right p-1 sm:p-2 hidden 2xl:table-cell">
                    Taxable
                  </th>
                  <th className="text-right p-1 sm:p-2 hidden 2xl:table-cell">
                    SGST
                  </th>
                  <th className="text-right p-1 sm:p-2 hidden 2xl:table-cell">
                    CGST
                  </th>
                  <th className="text-right p-1 sm:p-2 hidden 2xl:table-cell">
                    IGST
                  </th>
                  <th className="text-right p-1 sm:p-2 hidden 2xl:table-cell">
                    Cess%
                  </th>
                  <th className="text-right p-1 sm:p-2 hidden 2xl:table-cell">
                    Cess Amt
                  </th>
                  <th className="text-right p-1 sm:p-2 hidden 2xl:table-cell">
                    TCS%
                  </th>
                  <th className="text-right p-1 sm:p-2 hidden 2xl:table-cell">
                    TCS Amt
                  </th>
                  <th className="text-right p-1 sm:p-2 w-24 sm:w-28">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t, index) => (
                  <tr
                    key={t.id}
                    className={`border-b ${index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/50"}`}
                  >
                    <td className="p-1 sm:p-2 truncate">{t.date}</td>
                    <td className="p-1 sm:p-2 font-mono text-[10px] font-semibold truncate">
                      {t.billNo}
                    </td>
                    <td className="p-1 sm:p-2 truncate hidden md:table-cell">
                      {t.billMode}
                    </td>
                    <td className="p-1 sm:p-2 font-medium truncate">
                      {t.partyName}
                    </td>
                    <td className="p-1 sm:p-2 truncate hidden lg:table-cell">
                      {t.itemName}
                    </td>
                    <td className="p-1 sm:p-2 text-right font-medium">
                      {t.qty}
                    </td>
                    <td className="p-1 sm:p-2 text-right">
                      ₹{t.rate.toFixed(2)}
                    </td>
                    <td className="p-1 sm:p-2 text-right font-semibold">
                      ₹{t.amount.toFixed(2)}
                    </td>
                    <td className="p-1 sm:p-2 text-[10px] text-gray-500 truncate hidden xl:table-cell">
                      {t.registrationType}
                    </td>
                    <td className="p-1 sm:p-2 font-mono text-[10px] truncate hidden xl:table-cell">
                      {t.gstin || "-"}
                    </td>
                    <td className="p-1 sm:p-2 text-right hidden 2xl:table-cell">
                      {t.gstRate}%
                    </td>
                    <td className="p-1 sm:p-2 text-right hidden 2xl:table-cell">
                      ₹{t.taxableValue.toFixed(2)}
                    </td>
                    <td className="p-1 sm:p-2 text-right hidden 2xl:table-cell">
                      ₹{t.sgst.toFixed(2)}
                    </td>
                    <td className="p-1 sm:p-2 text-right hidden 2xl:table-cell">
                      ₹{t.cgst.toFixed(2)}
                    </td>
                    <td className="p-1 sm:p-2 text-right hidden 2xl:table-cell">
                      ₹{t.igst.toFixed(2)}
                    </td>
                    <td className="p-1 sm:p-2 text-right hidden 2xl:table-cell">
                      {t.cessRate}%
                    </td>
                    <td className="p-1 sm:p-2 text-right hidden 2xl:table-cell">
                      ₹{t.cessAmt.toFixed(2)}
                    </td>
                    <td className="p-1 sm:p-2 text-right hidden 2xl:table-cell">
                      {t.tcsRate}%
                    </td>
                    <td className="p-1 sm:p-2 text-right hidden 2xl:table-cell">
                      ₹{t.tcsAmt.toFixed(2)}
                    </td>
                    <td className="p-1 sm:p-2 text-right font-bold text-green-600">
                      ₹{t.invoiceValue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No sales records found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsView;
