import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import {
  GridIcon,
  BoltIcon,
  ClockIcon,
  DollarLineIcon,
  CalenderIcon,
  BuildingIcon,
} from "../../../icons";
import StationService, {
  BoothDTO,
  NozzleDTO,
} from "../../../services/stationService";
import OperationsService from "../../../services/operationsService";
import ProductMasterService from "../../../services/productMasterService";

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
  sale_price?: string;
}

const OpeningMeter: React.FC = () => {
  const [boothGroups, setBoothGroups] = useState<BoothGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meterReadings, setMeterReadings] = useState<
    Record<number, MeterReading>
  >({});
  const [yesterdayReadings] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [ended, setEnded] = useState<boolean>(false);
  const [shiftStatus, setShiftStatus] = useState<any>(null);

  // Load booth and nozzle data
  useEffect(() => {
    const initializeData = async () => {
      await loadBoothData();
      await loadUserShiftStatus();
      // loadTodayPrefills will be called after shiftStatus is updated
    };
    initializeData();
  }, []);

  // Load prefills after shift status is loaded
  useEffect(() => {
    if (shiftStatus !== null) {
      loadTodayPrefills();
    }
  }, [shiftStatus]);


  // Add a periodic refresh to catch shifts started after component mount
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if we don't have opening readings yet AND shift hasn't ended
      const hasOpeningReadings = Object.values(meterReadings).some(r => r.opening && r.opening !== '');
      if (!hasOpeningReadings && !ended) {
        console.log('Auto-refreshing prefills - no opening readings found');
        loadUserShiftStatus(); // This will trigger loadTodayPrefills via useEffect
      }
    }, 10000); // Check every 10 seconds (reduced frequency)

    return () => clearInterval(interval);
  }, [meterReadings, ended]);

  // Refresh prefills when component becomes visible (e.g., when switching tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadUserShiftStatus(); // This will trigger loadTodayPrefills via useEffect
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Refresh prefills when needed (e.g., after starting a shift)
  const refreshPrefills = async () => {
    await loadUserShiftStatus(); // This will trigger loadTodayPrefills via useEffect
  };

  const loadUserShiftStatus = async () => {
    try {
      const res = await OperationsService.getUserShiftStatus();
      const status = res.data?.data;
      setShiftStatus(status);
      
      // If user has an ended shift today, set the UI to ended state
      if (status?.hasEndedShift) {
        setEnded(true);
        console.log('User has ended shift today - setting UI to ended state');
      }
    } catch (err) {
      console.error('Failed to load user shift status:', err);
    }
  };

  const loadBoothData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch booths, nozzles, and products
      const [boothsRes, nozzlesRes, productsRes] = await Promise.all([
        StationService.listBooths(),
        StationService.listNozzles(),
        // Filter using category_id or status; remove unknown category_type filter to satisfy TS
        ProductMasterService.listProducts({ status: "active" }),
      ]);

      const booths = boothsRes.data?.data || [];
      const nozzles = nozzlesRes.data?.data || [];
      const fuelProducts = (productsRes.data?.data || []).map((p: any) => ({
        id: String(p.id),
        name: p.name,
        category_type: p.category_type,
        sale_price: p.sale_price,
      }));

      setProducts(fuelProducts as ProductInfo[]);

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
        .filter((group: BoothGroup) => group.nozzles.length > 0);

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

  const loadTodayPrefills = async () => {
    try {
      console.log('Loading today prefills...');
      
      // First check if user has ended shift today - if so, load those readings
      if (shiftStatus?.hasEndedShift && shiftStatus?.endedShift) {
        console.log('User has ended shift today, loading ended shift readings');
        const rRes = await OperationsService.getMeterReadings(shiftStatus.endedShift.id);
        const rows = rRes.data?.data || [];
        console.log('Ended shift meter readings:', rows);
        
        setMeterReadings((prev) => {
          const next = { ...prev } as Record<number, MeterReading>;
          rows.forEach((r: any) => {
            const id = Number(r.nozzle_id);
            const sales = Number(r.calculated_sales_litres ?? 0);
            const price = getProductPriceByNozzle(id);
            const amount = sales * price;
            
            next[id] = {
              nozzleId: id,
              opening: String(r.opening_reading ?? ''),
              test: String(r.test_litres ?? '5'),
              closing: String(r.closing_reading ?? ''),
              sales: sales,
              amount: amount,
            };
          });
          console.log('Updated meter readings from ended shift:', next);
          return next;
        });
        return;
      }
      
      // Get current operational day + active shift ledger
      const dayRes = await OperationsService.getCurrentOperationalDay();
      console.log('Operational day response:', dayRes.data);
      
      const ledger = dayRes.data?.data?.shiftLedgers?.find((l: any) => l.status === 'ACTIVE');
      console.log('Active ledger:', ledger);
      
      if (!ledger) {
        console.log('No active ledger found');
        return;
      }
      
      // Pull meter readings for this ledger (prefilled by backend)
      const rRes = await OperationsService.getMeterReadings(ledger.id);
      console.log('Full API response:', rRes);
      const rows = rRes.data?.data || [];
      console.log('Meter readings from backend:', rows);
      
      // Log each reading individually
      rows.forEach((r: any, index: number) => {
        console.log(`Reading ${index}:`, {
          nozzle_id: r.nozzle_id,
          opening_reading: r.opening_reading,
          test_litres: r.test_litres,
          closing_reading: r.closing_reading,
          calculated_sales_litres: r.calculated_sales_litres
        });
      });
      
      setMeterReadings((prev) => {
        const next = { ...prev } as Record<number, MeterReading>;
        rows.forEach((r: any) => {
          const id = Number(r.nozzle_id);
          next[id] = {
            nozzleId: id,
            opening: String(r.opening_reading ?? ''),
            test: String(r.test_litres ?? '5'),
            closing: String(r.closing_reading ?? ''),
            sales: Number(r.calculated_sales_litres ?? 0),
            amount: 0,
          };
        });
        console.log('Updated meter readings state:', next);
        console.log('Sample reading values:', {
          'nozzle 1': next[1]?.opening,
          'nozzle 2': next[2]?.opening,
          'nozzle 3': next[3]?.opening,
          'nozzle 4': next[4]?.opening
        });
        return next;
      });
    } catch (err) {
      console.error('Error loading today prefills:', err);
      // silently ignore; UI will still allow entry
    }
  };


  const handleMeterReadingChange = (
    nozzleId: number,
    field: keyof MeterReading,
    value: string
  ) => {
    setMeterReadings((prev) => {
      const current = prev[nozzleId] || { nozzleId, opening: "0", test: "0", closing: "", sales: 0, amount: 0 };
      const next: MeterReading = { ...current, [field]: value } as any;
      // Recalculate sales and amount
      const price = getProductPriceByNozzle(nozzleId);
      const sales = calculateSales(next.opening, next.closing, next.test);
      const amount = sales * price;
      next.sales = sales;
      next.amount = amount;
      return { ...prev, [nozzleId]: next };
    });
  };

  const calculateSales = (opening: string, closing: string, test: string): number => {
    const open = parseFloat(opening) || 0;
    const close = parseFloat(closing) || 0;
    const t = parseFloat(test) || 0;
    return Math.max(0, close - open - t);
  };

  const endShiftAndSaveAll = async () => {
    if (ended) return;
    // Confirm
    const proceed = window.confirm("End shift and save all readings? You won't be able to edit after this.");
    if (!proceed) return;
    // Build payload
    const readings = Object.values(meterReadings)
      .map((r) => ({
        nozzle_id: r.nozzleId,
        closing_reading: parseFloat(r.closing),
        test_litres: parseFloat(r.test) || 0,
        _open: r.opening,
      }))
      .filter((r) => !Number.isNaN(r.closing_reading) && r._open !== undefined && r._open !== null);
    if (readings.length === 0) {
      alert("Please enter closing readings before ending shift.");
      return;
    }
    try {
      // Attempt to end directly; if operational day missing, start shift automatically
      const end = async () => OperationsService.endManagerShift({ closingReadings: readings });
      try {
        await end();
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || '';
        if (String(msg).includes('No operational day')) {
          // Try to start manager shift automatically using current user's mapped shift
          // We don't have the shiftId in UI; load current shift status from backend or ask user.
          alert('No operational day found. Please start your manager shift first from the shift start endpoint.');
        return;
      }
        throw e;
      }
      setEnded(true);
      alert("Shift ended and readings saved. You cannot modify these readings anymore.");
      
      // Don't clear readings - keep them visible but disabled
      // Mark all readings as ended so they show in disabled state
      setMeterReadings(prev => {
        const updated = { ...prev };
        // Keep the readings but they'll be disabled due to ended=true
        return updated;
      });
      
      // Also refresh user shift status
      await loadUserShiftStatus();
    } catch (e) {
      alert("Failed to end shift. Please try again.");
    }
  };

  const getProductName = (productId: number | string | null): string => {
    if (!productId) return "No product assigned";
    const product = products.find((p) => p.id === productId.toString());
    return product ? product.name : `Product ID: ${productId}`;
  };

  const getProductPriceByNozzle = (nozzleId: number): number => {
    const nozzle = boothGroups.flatMap((g) => g.nozzles).find((n) => Number(n.id) === Number(nozzleId));
    const productId = nozzle?.productId;
    if (!productId) return 0;
    const product = products.find((p) => p.id === String(productId));
    return product && product.sale_price != null ? parseFloat(String(product.sale_price)) || 0 : 0;
  };

  // const getProductCategory = (productId: number | string | null): string => {
  //   if (!productId) return "";
  //   const product = products.find((p) => p.id === productId.toString());
  //   return product ? product.category_type : "";
  // };

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
          <div className="flex items-center gap-3">
            <button
              onClick={refreshPrefills}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Readings
            </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CalenderIcon className="h-4 w-4" />
            {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div>
        <div className="space-y-6">
              {/* Info Alert */}
              {Object.values(meterReadings).some(r => !r.opening) && !ended && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="text-blue-600">ℹ️</div>
                    <div className="text-sm text-blue-800">
                      <strong>Opening readings not loaded:</strong> If you just started a shift, click "Refresh Readings" above. 
                      Opening readings are automatically populated from the previous shift's closing readings.
                    </div>
                  </div>
                </div>
              )}
              
              {/* Shift Ended Alert */}
              {ended && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="text-green-600">✅</div>
                    <div className="text-sm text-green-800">
                      <strong>Shift Completed:</strong> Your shift has been ended and all readings have been saved. 
                      These readings are now readonly and cannot be modified.
                    </div>
                  </div>
                </div>
              )}
              
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
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={endShiftAndSaveAll} disabled={ended}>
                {ended ? "Shift Ended" : "End Shift & Save"}
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
                                    {getProductName(nozzle.productId as any)}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  step={0.01}
                                  className={`w-20 h-8 text-sm ${!reading.opening ? 'border-orange-300 bg-orange-50' : ''}`}
                                  placeholder={!reading.opening ? "Loading..." : "0.00"}
                                  value={reading.opening}
                                  disabled
                                />
                                {!reading.opening && (
                                  <div className="text-xs text-orange-600 mt-1">
                                    No opening reading found
                                  </div>
                                )}
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
                                  disabled={ended}
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
                                  disabled={ended}
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
                              {/* No per-row save after moving to single end-shift save */}
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

            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpeningMeter;
