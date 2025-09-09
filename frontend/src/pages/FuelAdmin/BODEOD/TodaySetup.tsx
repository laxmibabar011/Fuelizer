import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import { Modal } from "../../../components/ui/modal";
import {
  GridIcon,
  BoltIcon,
  ClockIcon,
  FuelIcon,
  DollarLineIcon,
  CalenderIcon,
} from "../../../icons";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs/Tabs";
import { useLocation } from "react-router-dom";
import BoothManagement from "../StaffShifts/BoothManagement";
import { Badge } from "../../../components/ui/badge";
import OperationsService from "../../../services/operationsService";
import staffshiftService from "../../../services/staffshiftService";
import OpeningMeter from "./OpeningMeter";

interface FuelProduct {
  id: string;
  name: string;
  category: string;
}

interface FuelRate {
  id: string;
  productId: string;
  productName: string;
  rate: number;
  date: string;
  isToday: boolean;
}

const TodaySetup: React.FC = () => {
  // Note: In future, auto-detect current user's assigned manager shift from auth context
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get("tab") || "fuel-rates";

  // Fuel Rate Manager State
  const [fuelProducts, setFuelProducts] = useState<FuelProduct[]>([]);
  const [fuelRates, setFuelRates] = useState<FuelRate[]>([]);
  const [yesterdayRates, setYesterdayRates] = useState<FuelRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [rateModal, setRateModal] = useState({
    open: false,
    product: null as FuelProduct | null,
    todayRate: "",
    yesterdayRate: 0,
  });
  const [userShiftStatus, setUserShiftStatus] = useState<any>(null);

  // Load fuel products and rates
  useEffect(() => {
    loadFuelData();
    loadUserShiftStatus();
  }, []);

  const loadUserShiftStatus = async () => {
    try {
      const res = await OperationsService.getUserShiftStatus();
      setUserShiftStatus(res.data?.data);
    } catch (err) {
      console.error('Failed to load user shift status:', err);
    }
  };

  const loadFuelData = async () => {
    setLoading(true);
    try {
      // Load fuel products from Product Master
      const { default: ProductMasterService } = await import("../../../services/productMasterService");
      const productsRes = await ProductMasterService.listProducts({ category_type: "Fuel" });
      const products = productsRes.data?.data || [];
      setFuelProducts(products);

      // Load today's rates (mock data for now - will be replaced with API)
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Mock data - replace with actual API calls
      const mockTodayRates: FuelRate[] = products.map((p: any) => ({
        id: `today-${p.id}`,
        productId: p.id,
        productName: p.name,
        rate: 0, // Will be set by user
        date: today,
        isToday: true,
      }));

      const mockYesterdayRates: FuelRate[] = products.map((p: any) => ({
        id: `yesterday-${p.id}`,
        productId: p.id,
        productName: p.name,
        rate: Math.round((Math.random() * 20 + 80) * 100) / 100, // Random rate between 80-100
        date: yesterday,
        isToday: false,
      }));

      setFuelRates(mockTodayRates);
      setYesterdayRates(mockYesterdayRates);
    } catch (err) {
      console.error("Failed to load fuel data:", err);
    } finally {
      setLoading(false);
    }
  };

  const openRateModal = (product: FuelProduct) => {
    const yesterdayRate = yesterdayRates.find(r => r.productId === product.id)?.rate || 0;
    const todayRate = fuelRates.find(r => r.productId === product.id)?.rate || 0;
    
    setRateModal({
      open: true,
      product,
      todayRate: todayRate > 0 ? todayRate.toString() : "",
      yesterdayRate,
    });
  };

  const saveFuelRate = () => {
    if (!rateModal.product || !rateModal.todayRate) return;

    const newRate = parseFloat(rateModal.todayRate);
    if (isNaN(newRate) || newRate <= 0) return;

    setFuelRates(prev => prev.map(rate => 
      rate.productId === rateModal.product!.id 
        ? { ...rate, rate: newRate }
        : rate
    ));

    setRateModal({ open: false, product: null, todayRate: "", yesterdayRate: 0 });
  };

  const setSameAsYesterday = () => {
    if (!rateModal.product) return;
    
    setRateModal(prev => ({
      ...prev,
      todayRate: prev.yesterdayRate.toFixed(2),
    }));
  };

  const getRateChange = (productId: string) => {
    const todayRate = fuelRates.find(r => r.productId === productId)?.rate || 0;
    const yesterdayRate = yesterdayRates.find(r => r.productId === productId)?.rate || 0;
    
    if (todayRate === 0) return null;
    if (yesterdayRate === 0) return { change: todayRate, percentage: 0, isIncrease: true };
    
    const change = todayRate - yesterdayRate;
    const percentage = (change / yesterdayRate) * 100;
    
    return {
      change: Math.abs(change),
      percentage: Math.abs(percentage),
      isIncrease: change > 0,
    };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Today's Setup (BOD)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Beginning of Day checklist and setup
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-green-600 hover:bg-green-700">
            <GridIcon className="h-4 w-4 mr-2" />
            Complete Setup
          </Button>
          <Button
            className={
              userShiftStatus?.hasActiveShift 
                ? "bg-green-600 hover:bg-green-700" 
                : userShiftStatus?.hasEndedShift 
                  ? "bg-gray-600 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700"
            }
            disabled={userShiftStatus?.hasEndedShift}
            onClick={async () => {
              if (userShiftStatus?.hasActiveShift) {
                alert('You already have an active shift running today.');
                return;
              }
              if (userShiftStatus?.hasEndedShift) {
                alert('You have already completed a shift today. Cannot start another shift.');
                return;
              }

              try {
                // Try auto-start first (uses user's assigned shift and current time)
                await OperationsService.autoStartManagerShift({});
                alert('Manager shift started successfully using your assigned shift.');
                // Refresh shift status
                await loadUserShiftStatus();
              } catch (e: any) {
                // Fallback to manual shift selection if auto-start fails
                const errorMsg = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Failed to start manager shift';
                if (errorMsg.includes('No manager shift assigned') || errorMsg.includes('Outside shift window')) {
                  alert(`${errorMsg}\n\nPlease assign a manager shift first or check if current time is within shift window.`);
                } else {
                  // Try manual shift selection as fallback
                  let autoShiftId: string | null = null;
                  try {
                    const res = await staffshiftService.listManagers();
                    const mgrs = (res.data?.data || []) as any[];
                    const withDefault = mgrs.filter((m: any) => m.DefaultManagerShift?.id);
                    if (withDefault.length === 1) autoShiftId = String(withDefault[0].DefaultManagerShift.id);
                  } catch (_) { /* ignore */ }
                  let shiftId = autoShiftId || window.prompt('Enter your Manager Shift ID to start the shift') || '';
                  if (!shiftId) return;
                  await OperationsService.startManagerShift({ shiftId });
                  alert('Manager shift started successfully.');
                  // Refresh shift status
                  await loadUserShiftStatus();
                }
              }
            }}
          >
            {userShiftStatus?.hasActiveShift 
              ? "Shift Active" 
              : userShiftStatus?.hasEndedShift 
                ? "Shift Completed Today" 
                : "Start Manager Shift"
            }
          </Button>
        </div>
      </div>

      {/* Tabbed BOD Workflow */}
      <Tabs defaultValue={initialTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="fuel-rates" className="flex items-center gap-2">
            <FuelIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Fuel Rates</span>
          </TabsTrigger>
          <TabsTrigger value="nozzles" className="flex items-center gap-2">
            <BoltIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Booths</span>
          </TabsTrigger>
          <TabsTrigger value="opening-meter" className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Opening Meter</span>
          </TabsTrigger>
          <TabsTrigger value="opening-stock" className="flex items-center gap-2">
            <GridIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Opening Stock</span>
          </TabsTrigger>
          <TabsTrigger value="opening-cash" className="flex items-center gap-2">
            <DollarLineIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Opening Cash</span>
          </TabsTrigger>
        </TabsList>

        {/* Fuel Rate Manager */}
        <TabsContent value="fuel-rates" className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading fuel rates...</p>
            </div>
          ) : (
            <>
              {/* Today's Rates Dashboard */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FuelIcon className="h-6 w-6 text-blue-600" />
                      <div>
                        <CardTitle>Today's Fuel Rates</CardTitle>
                        <p className="text-sm text-gray-600">Set today's rates for all fuel products</p>
                      </div>
                    </div>
                                         <div className="flex items-center gap-2 text-sm text-gray-500">
                       <CalenderIcon className="h-4 w-4" />
                       {new Date().toLocaleDateString()}
                     </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fuelProducts.map((product) => {
                      const todayRate = fuelRates.find(r => r.productId === product.id)?.rate || 0;
                      const rateChange = getRateChange(product.id);
                      
                      return (
                        <Card key={product.id} className="p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                              <p className="text-sm text-gray-500">Fuel Product</p>
                            </div>
                            {rateChange && (
                              <Badge className={`text-xs ${rateChange.isIncrease ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {rateChange.isIncrease ? '+' : '-'}₹{rateChange.change.toFixed(2)}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Today's Rate:</span>
                              <span className="font-semibold text-lg">
                                {todayRate > 0 ? `₹${todayRate.toFixed(2)}` : 'Not Set'}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Yesterday's Rate:</span>
                              <span className="text-sm">
                                ₹{yesterdayRates.find(r => r.productId === product.id)?.rate.toFixed(2) || '0.00'}
                              </span>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRateModal(product)}
                              className="w-full"
                            >
                              {todayRate > 0 ? 'Update Rate' : 'Set Rate'}
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Yesterday's Rates History */}
              <Card>
                                 <CardHeader>
                   <div className="flex items-center gap-3">
                     <GridIcon className="h-6 w-6 text-purple-600" />
                     <div>
                       <CardTitle>Yesterday's Rates History</CardTitle>
                       <p className="text-sm text-gray-600">Reference for setting today's rates</p>
                     </div>
                   </div>
                 </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {yesterdayRates.map((rate) => (
                      <div key={rate.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{rate.productName}</h4>
                          <span className="text-sm text-gray-500">{rate.date}</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          ₹{rate.rate.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Booths */}
        <TabsContent value="nozzles" className="space-y-6">
          <BoothManagement />
        </TabsContent>

        {/* Opening Meter Readings */}
        <TabsContent value="opening-meter" className="space-y-6">
          <OpeningMeter />
        </TabsContent>

        {/* Opening Tank Stock */}
        <TabsContent value="opening-stock" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <GridIcon className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-xl font-semibold">Opening Tank Stock</h2>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">Coming soon</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-white dark:bg-gray-800">
                <h3 className="font-medium mb-1">Tank A</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dip reading</p>
                <div className="mt-3 animate-pulse h-20 bg-gray-100 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="p-4 border rounded-lg bg-white dark:bg-gray-800">
                <h3 className="font-medium mb-1">Tank B</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dip reading</p>
                <div className="mt-3 animate-pulse h-20 bg-gray-100 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="p-4 border rounded-lg bg-white dark:bg-gray-800">
                <h3 className="font-medium mb-1">Tank C</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dip reading</p>
                <div className="mt-3 animate-pulse h-20 bg-gray-100 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled className="cursor-not-allowed opacity-60">Record Dip</Button>
              <Button size="sm" variant="outline" disabled className="cursor-not-allowed opacity-60">Upload Gauge</Button>
              <Button size="sm" variant="outline" disabled className="cursor-not-allowed opacity-60">Download Template</Button>
            </div>
          </Card>
        </TabsContent>

        {/* Opening Cash */}
        <TabsContent value="opening-cash" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <DollarLineIcon className="h-6 w-6 text-purple-600 mr-3" />
                <h2 className="text-xl font-semibold">Opening Cash</h2>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">Coming soon</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-white dark:bg-gray-800">
                <h3 className="font-medium mb-1">Opening Cash</h3>
                <div className="mt-2 h-8 w-32 rounded bg-gray-100 dark:bg-gray-700 animate-pulse"></div>
              </div>
              <div className="p-4 border rounded-lg bg-white dark:bg-gray-800">
                <h3 className="font-medium mb-1">Denominations</h3>
                <div className="space-y-2 mt-2">
                  <div className="h-3 rounded bg-gray-100 dark:bg-gray-700 animate-pulse w-3/4"></div>
                  <div className="h-3 rounded bg-gray-100 dark:bg-gray-700 animate-pulse w-2/3"></div>
                  <div className="h-3 rounded bg-gray-100 dark:bg-gray-700 animate-pulse w-1/2"></div>
                </div>
              </div>
              <div className="p-4 border rounded-lg bg-white dark:bg-gray-800">
                <h3 className="font-medium mb-1">Notes</h3>
                <div className="mt-2 h-16 rounded bg-gray-100 dark:bg-gray-700 animate-pulse"></div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled className="cursor-not-allowed opacity-60">Edit</Button>
              <Button size="sm" variant="outline" disabled className="cursor-not-allowed opacity-60">Verify</Button>
              <Button size="sm" variant="outline" disabled className="cursor-not-allowed opacity-60">Upload Receipt</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Setup Progress */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="text-center">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            Setup Progress
          </h3>
          <div className="flex justify-center space-x-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm mx-auto mb-1">
                ✓
              </div>
              <p className="text-sm text-blue-700">Fuel Rates</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm mx-auto mb-1">
                ✓
              </div>
              <p className="text-sm text-blue-700">Booths</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm mx-auto mb-1">
                !
              </div>
              <p className="text-sm text-blue-700">Opening Readings</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Fuel Rate Modal */}
      <Modal isOpen={rateModal.open} onClose={() => setRateModal({ open: false, product: null, todayRate: "", yesterdayRate: 0 })} className="max-w-md w-full">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">
            Set Rate for {rateModal.product?.name}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Yesterday's Rate</label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-lg font-semibold">₹{rateModal.yesterdayRate.toFixed(2)}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Today's Rate (₹)</label>
              <Input
                type="number"
                step={0.01}
                min="0"
                value={rateModal.todayRate}
                onChange={(e) => setRateModal(prev => ({ ...prev, todayRate: e.target.value }))}
                placeholder="Enter today's rate"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={setSameAsYesterday}
              className="w-full"
            >
              Set Same as Yesterday (₹{rateModal.yesterdayRate.toFixed(2)})
            </Button>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setRateModal({ open: false, product: null, todayRate: "", yesterdayRate: 0 })}
            >
              Cancel
            </Button>
            <Button onClick={saveFuelRate}>
              Save Rate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TodaySetup;
