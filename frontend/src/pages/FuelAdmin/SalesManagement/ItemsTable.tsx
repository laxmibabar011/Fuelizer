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

interface ItemsTableProps {
  items: Item[];
  onRemoveItem: (id: string) => void;
}

const ItemsTable: React.FC<ItemsTableProps> = ({ items, onRemoveItem }) => {
  if (items.length === 0) {
    return (
      <div className="border rounded-lg bg-white dark:bg-gray-900">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Items</h2>
        </div>
        <div className="p-6 text-center text-gray-500">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800" />
          <p>No items added yet</p>
          <p className="text-sm">Add items using the form above</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white dark:bg-gray-900">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Items ({items.length})</h2>
      </div>
      <div className="p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Item Code</th>
              <th className="text-left p-2">Item Name</th>
              <th className="text-right p-2">Stock</th>
              <th className="text-right p-2">LTR</th>
              <th className="text-right p-2">Qty</th>
              <th className="text-right p-2">Rate</th>
              <th className="text-right p-2">GST%</th>
              <th className="text-right p-2">CGST</th>
              <th className="text-right p-2">SGST</th>
              <th className="text-right p-2">Cess%</th>
              <th className="text-right p-2">Amount</th>
              <th className="text-center p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className={`border-b ${index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/50"}`}>
                <td className="p-2 font-mono text-xs">{item.itemCode}</td>
                <td className="p-2 font-medium">{item.itemName}</td>
                <td className="p-2 text-right">{item.curStock}</td>
                <td className="p-2 text-right">{item.inLtr}</td>
                <td className="p-2 text-right">{item.quantity}</td>
                <td className="p-2 text-right">₹{item.rate.toFixed(2)}</td>
                <td className="p-2 text-right">{item.gst}%</td>
                <td className="p-2 text-right">₹{item.cgst.toFixed(2)}</td>
                <td className="p-2 text-right">₹{item.sgst.toFixed(2)}</td>
                <td className="p-2 text-right">{item.cess}%</td>
                <td className="p-2 text-right font-semibold">₹{item.amount.toFixed(2)}</td>
                <td className="p-2 text-center">
                  <button
                    className="px-2 py-1 text-red-600 hover:text-red-700"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemsTable;


