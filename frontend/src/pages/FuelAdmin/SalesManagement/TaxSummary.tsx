interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  curStock: number;
  inLtr: number;
  quantity: number;
  rate: number;
  gst: number;
  cgst: number;
  sgst: number;
  amount: number;
  cess: number;
}

interface TaxSummaryProps {
  items: Item[];
  totalAmount: number;
  totalTax: number;
}

const TaxSummary: React.FC<TaxSummaryProps> = ({ items, totalAmount }) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const totalCess = items.reduce((sum, item) => sum + (item.quantity * item.rate * item.cess) / 100, 0);
  const totalCGST = items.reduce((sum, item) => sum + item.cgst, 0);
  const totalSGST = items.reduce((sum, item) => sum + item.sgst, 0);

  const gstRates = Array.from(new Set(items.map((i) => i.gst)));

  return (
    <div className="border rounded-lg bg-white dark:bg-gray-900">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Tax Summary</h2>
      </div>
      <div className="p-4 space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">CGST:</span><span>₹{totalCGST.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">SGST:</span><span>₹{totalSGST.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Cess:</span><span>₹{totalCess.toFixed(2)}</span></div>
        <div className="border-t pt-2 flex justify-between font-semibold text-base">
          <span>Total Amount:</span>
          <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
        </div>

        {items.length > 0 && (
          <div className="pt-3 border-t space-y-1">
            <h4 className="text-xs font-medium">Breakdown by Tax Rate</h4>
            {gstRates.map((rate) => {
              const itemsWithRate = items.filter((i) => i.gst === rate);
              const rateTotal = itemsWithRate.reduce((sum, i) => sum + i.amount, 0);
              return (
                <div key={rate} className="flex justify-between text-xs">
                  <span className="text-gray-500">GST {rate}% ({itemsWithRate.length} items):</span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">₹{rateTotal.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxSummary;


