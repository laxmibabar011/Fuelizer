import React, { useState, useEffect, useCallback } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../components/ui/tabs/Tabs";
import { Button } from "../../../components/ui/button";
import { BoltIcon, ClockIcon } from "../../../icons";
import DashboardOverview from "./DashboardOverview";
import BoothMonitoring from "./BoothMonitoring";
import NozzleTracking from "./NozzleTracking";
import LiveTransactions from "./LiveTransactions";
import OperatorStatus from "./OperatorStatus";

const LiveMonitoring: React.FC = () => {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Global refresh handler for all tabs
  const handleGlobalRefresh = useCallback(() => {
    setLastUpdated(new Date());
    // Trigger refresh in all tab components
    window.dispatchEvent(new CustomEvent("liveMonitoringRefresh"));
  }, []);

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (autoRefresh) {
      interval = setInterval(handleGlobalRefresh, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, handleGlobalRefresh]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Live Sales Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time view of sales and operations
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleGlobalRefresh}
              className="bg-green-600 hover:bg-green-700"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={toggleAutoRefresh}
              className={
                autoRefresh
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            >
              <BoltIcon className="h-4 w-4 mr-2" />
              {autoRefresh ? "Stop Auto" : "Auto Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              Auto-refreshing every 30 seconds
            </span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger
            value="dashboard"
            className="flex items-center space-x-2"
          >
            <span>📊</span>
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="booths" className="flex items-center space-x-2">
            <span>🏪</span>
            <span>Booths</span>
          </TabsTrigger>
          <TabsTrigger value="nozzles" className="flex items-center space-x-2">
            <span>⛽</span>
            <span>Nozzles</span>
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="flex items-center space-x-2"
          >
            <span>💳</span>
            <span>Transactions</span>
          </TabsTrigger>
          <TabsTrigger
            value="operators"
            className="flex items-center space-x-2"
          >
            <span>👥</span>
            <span>Operators</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="dashboard" className="mt-6">
          <DashboardOverview />
        </TabsContent>

        <TabsContent value="booths" className="mt-6">
          <BoothMonitoring />
        </TabsContent>

        <TabsContent value="nozzles" className="mt-6">
          <NozzleTracking />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <LiveTransactions />
        </TabsContent>

        <TabsContent value="operators" className="mt-6">
          <OperatorStatus />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiveMonitoring;
