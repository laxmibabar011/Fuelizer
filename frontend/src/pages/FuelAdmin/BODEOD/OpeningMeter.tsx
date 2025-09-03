import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import {
  GridIcon,
  BoltIcon,
  ClockIcon,
  DollarLineIcon,
  PlusIcon,
  CalenderIcon,
  BuildingIcon,
} from "../../../icons";
import StationService, {
  BoothDTO,
  NozzleDTO,
} from "../../../services/stationService";
import ProductMasterService, {
  ProductMasterDTO,
} from "../../../services/productMasterService";

interface MeterReading {
  nozzleId: number;
  opening: string;
  test: string;
  closing: string;
  sales: number;
  amount: number;
}

interface BoothGroup {
  booth: BoothDTO;
  nozzles: NozzleDTO[];
}

interface ProductInfo {
  id: string;
  name: string;
  category_type: string;
}

const OpeningMeter: React.FC = () => {
  const [boothGroups, setBoothGroups] = useState<BoothGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meterReadings, setMeterReadings] = useState<
    Record<number, MeterReading>
  >({});
  const [yesterdayReadings, setYesterdayReadings] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);

  // Load booth and nozzle data
  useEffect(() => {
    loadBoothData();
    loadYesterdayReadings();
  }, []);

  const loadBoothData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch booths, nozzles, and products
      const [boothsRes, nozzlesRes, productsRes] = await Promise.all([
        StationService.listBooths(),
        StationService.listNozzles(),
        ProductMasterService.listProducts({ category_type: "Fuel" }),
      ]);

      const booths = boothsRes.data?.data || [];
      const nozzles = nozzlesRes.data?.data || [];
      const fuelProducts = productsRes.data?.data || [];

      setProducts(fuelProducts);

      // Group nozzles by booth
      const groupedBooths: BoothGroup[] = booths
        .filter((booth: BoothDTO) => booth.active !== false)
        .map((booth: BoothDTO) => ({
          booth,
          nozzles: nozzles.filter(
            (nozzle: NozzleDTO) =>
              nozzle.boothId === booth.id ||
              nozzle.boothId === booth.id?.toString()
          ),
        }))
        .filter((group) => group.nozzles.length > 0);

      setBoothGroups(groupedBooths);

      // Initialize meter readings for all nozzles
      const initialReadings: Record<number, MeterReading> = {};
      nozzles.forEach((nozzle: NozzleDTO) => {
        if (nozzle.id) {
          initialReadings[Number(nozzle.id)] = {
            nozzleId: Number(nozzle.id),
            opening: "",
            test: "5", // Default value is 5 litres
            closing: "",
            sales: 0,
            amount: 0,
          };
        }
      });
      setMeterReadings(initialReadings);
    } catch (err: any) {
      console.error("Failed to load booth data:", err);
      setError(
        err?.response?.data?.error || "Failed to load booth and nozzle data"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadYesterdayReadings = async () => {
    try {
      // Mock data for yesterday's readings - replace with actual API call
      const mockYesterdayReadings = [
        {
          nozzleId: 1,
          opening: 1250.5,
          closing: 1450.75,
          sales: 200.25,
          amount: 19368.18,
        },
        {
          nozzleId: 2,
          opening: 2100.0,
          closing: 2350.25,
          sales: 250.25,
          amount: 22398.88,
        },
        {
          nozzleId: 3,
          opening: 800.0,
          closing: 950.5,
          sales: 150.5,
          amount: 14562.36,
        },
      ];
      setYesterdayReadings(mockYesterdayReadings);
    } catch (err) {
      console.error("Failed to load yesterday readings:", err);
    }
  };

  const handleMeterReadingChange = (
    nozzleId: number,
    field: keyof MeterReading,
    value: string
  ) => {
    setMeterReadings((prev) => ({
      ...prev,
      [nozzleId]: {
        ...prev[nozzleId],
        [field]: value,
      },
    }));
  };

  const calculateSales = (opening: string, closing: string): number => {
    const open = parseFloat(opening) || 0;
    const close = parseFloat(closing) || 0;
    return Math.max(0, close - open);
  };

  const saveMeterReading = async (nozzleId: number) => {
    try {
      const reading = meterReadings[nozzleId];
      if (!reading) return;

      // Validate required fields
      if (!reading.opening || !reading.closing) {
        alert("Please enter both opening and closing readings");
        return;
      }

      // Calculate sales
      const sales = calculateSales(reading.opening, reading.closing);

      // Update local state
      setMeterReadings((prev) => ({
        ...prev,
        [nozzleId]: {
          ...prev[nozzleId],
          sales,
          amount: sales * 100, // Mock calculation - replace with actual fuel rate
        },
      }));

      // TODO: Save to backend API
      console.log("Saving meter reading:", {
        nozzleId,
        reading: { ...reading, sales, amount: sales * 100 },
      });

      alert("Meter reading saved successfully!");
    } catch (err) {
      console.error("Failed to save meter reading:", err);
      alert("Failed to save meter reading");
    }
  };

  const getProductName = (productId: number | string | null): string => {
    if (!productId) return "No product assigned";
    const product = products.find((p) => p.id === productId.toString());
    return product ? product.name : `Product ID: ${productId}`;
  };

  const getProductCategory = (productId: number | string | null): string => {
    if (!productId) return "";
    const product = products.find((p) => p.id === productId.toString());
    return product ? product.category_type : "";
  };

  const getTotalNozzles = () =>
    boothGroups.reduce((total, group) => total + group.nozzles.length, 0);

  const getReadingsEntered = () => {
    return Object.values(meterReadings).filter(
      (reading) => reading.opening && reading.closing
    ).length;
  };

  const getPendingReadings = () => getTotalNozzles() - getReadingsEntered();

  const getYesterdayTotal = () => {
    return yesterdayReadings.reduce(
      (total, reading) => total + reading.amount,
      0
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Loading booth and nozzle data...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">⚠️ Error Loading Data</div>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <Button onClick={loadBoothData} className="mt-4" variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-6 w-6 text-purple-600" />
            <div>
              <CardTitle>Opening Meter Readings</CardTitle>
              <p className="text-sm text-gray-600">
                Record opening meter readings for all nozzles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CalenderIcon className="h-4 w-4" />
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Meter Readings Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Nozzles</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {getTotalNozzles()}
                  </p>
                </div>
                <BoltIcon className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Readings Entered</p>
                  <p className="text-2xl font-bold text-green-600">
                    {getReadingsEntered()}
                  </p>
                </div>
                <ClockIcon className="h-8 w-8 text-green-400" />
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {getPendingReadings()}
                  </p>
                </div>
                <GridIcon className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
            <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Yesterday's Total</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ₹{getYesterdayTotal().toLocaleString()}
                  </p>
                </div>
                <DollarLineIcon className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Booth-Grouped Meter Readings */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Today's Meter Readings</h3>
              <Button size="sm" variant="outline">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Reading
              </Button>
            </div>

            {boothGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No booths or nozzles found. Please configure them in Station
                Setup first.
              </div>
            ) : (
              boothGroups.map((boothGroup) => (
                <div
                  key={boothGroup.booth.id}
                  className="border rounded-lg overflow-hidden"
                >
                  {/* Booth Header */}
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b">
                    <div className="flex items-center gap-3">
                      <BuildingIcon className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {boothGroup.booth.name} ({boothGroup.booth.code})
                      </h4>
                      <span className="text-sm text-gray-500 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                        {boothGroup.nozzles.length} nozzle
                        {boothGroup.nozzles.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Nozzles Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          <th className="px-4 py-2 text-left text-sm font-medium border-b">
                            Pump (Nozzle)
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium border-b">
                            Opening
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium border-b">
                            Test
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium border-b">
                            Closing
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium border-b">
                            Sales (L)
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium border-b">
                            Amount (₹)
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium border-b">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {boothGroup.nozzles.map((nozzle) => {
                          const reading = meterReadings[Number(nozzle.id)] || {
                            nozzleId: Number(nozzle.id),
                            opening: "",
                            test: "0.00",
                            closing: "",
                            sales: 0,
                            amount: 0,
                          };

                          return (
                            <tr
                              key={nozzle.id}
                              className="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <td className="px-4 py-3">
                                <div>
                                  <div className="font-medium">
                                    {nozzle.code}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {getProductName(nozzle.productId)}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  step={0.01}
                                  className="w-20 h-8 text-sm"
                                  placeholder="0.00"
                                  value={reading.opening}
                                  onChange={(e) =>
                                    handleMeterReadingChange(
                                      Number(nozzle.id),
                                      "opening",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  step={0.01}
                                  className="w-20 h-8 text-sm"
                                  placeholder="0.00"
                                  value={reading.test}
                                  onChange={(e) =>
                                    handleMeterReadingChange(
                                      Number(nozzle.id),
                                      "test",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  step={0.01}
                                  className="w-20 h-8 text-sm"
                                  placeholder="0.00"
                                  value={reading.closing}
                                  onChange={(e) =>
                                    handleMeterReadingChange(
                                      Number(nozzle.id),
                                      "closing",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-medium">
                                  {reading.sales.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-medium">
                                  ₹{reading.amount.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8"
                                  onClick={() =>
                                    saveMeterReading(Number(nozzle.id))
                                  }
                                >
                                  Save
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Yesterday's Readings History */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <GridIcon className="h-6 w-6 text-purple-600" />
                <div>
                  <CardTitle>Yesterday's Readings History</CardTitle>
                  <p className="text-sm text-gray-600">
                    Reference for today's readings
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">
                        Pump
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">
                        Opening
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">
                        Closing
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">
                        Sales (L)
                      </th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium">
                        Amount (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {yesterdayReadings.map((reading) => (
                      <tr
                        key={reading.nozzleId}
                        className="border-b border-gray-200 dark:border-gray-700"
                      >
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                          <div>
                            <div className="font-medium">
                              NO{reading.nozzleId}
                            </div>
                            <div className="text-xs text-gray-500">Fuel</div>
                          </div>
                        </td>
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm">
                          {reading.opening.toLocaleString()}
                        </td>
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm">
                          {reading.closing.toLocaleString()}
                        </td>
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium">
                          {reading.sales.toFixed(2)}
                        </td>
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium">
                          ₹{reading.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpeningMeter;
