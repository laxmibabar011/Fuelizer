import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import PageMeta from "../../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import ClientService from "../../services/clientService";

interface Client {
  id: number;
  client_key: string;
  client_name: string;
  client_email: string;
  client_status?: string;
  db_name: string;
}

export default function ClientList() {
  const { accessToken } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      if (!accessToken) {
        setError("No access token");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await ClientService.listClients(accessToken);
        const data = res.data;
        if (data.success && Array.isArray(data.data)) {
          setClients(data.data);
        } else {
          setError(data.message || "Failed to fetch clients");
        }
      } catch (err: any) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [accessToken]);

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white dark:bg-gray-900 rounded-lg shadow">
      <PageMeta
        title="Client List | FUELIZER"
        description="List of all registered clients"
      />
      <h1 className="text-2xl font-bold mb-6 text-brand-600">Client List</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Client Key
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Name
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Email
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      DB Name
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        {client.client_key}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {client.client_name}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {client.client_email}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {client.db_name}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 