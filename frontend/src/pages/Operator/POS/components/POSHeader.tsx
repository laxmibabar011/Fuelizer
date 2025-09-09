/**
 * POS Header Component
 * Displays booth info, cashier details, time, and system status
 */

import React, { useState, useEffect } from "react";
import Button from "../../../../components/ui/button/Button";
import {
  BuildingIcon,
  ClockIcon,
  BoltIcon,
  CloseIcon,
} from "../../../../icons";
import type { BoothInfo } from "../types";

interface POSHeaderProps {
  booth: BoothInfo | null;
  cashier: any;
  onExit: () => void;
  isFullscreen?: boolean;
  onEnterFullscreen?: () => void;
}

const POSHeader: React.FC<POSHeaderProps> = ({
  booth,
  cashier,
  onExit,
  isFullscreen = false,
  onEnterFullscreen,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-IN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <header className="h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section - Booth Info */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <BuildingIcon className="h-6 w-6" />
            <div>
              <div className="font-semibold">
                {booth ? `${booth.name} (${booth.code})` : "Loading..."}
              </div>
              <div className="text-xs text-blue-100">
                {booth ? `${booth.nozzles.length} Nozzles` : "Booth Info"}
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-blue-400" />

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">
                {cashier?.UserDetails?.full_name?.charAt(0) ||
                  cashier?.email?.charAt(0) ||
                  "C"}
              </span>
            </div>
            <div>
              <div className="font-medium">
                {cashier?.UserDetails?.full_name || cashier?.email || "Cashier"}
              </div>
              <div className="text-xs text-blue-100">POS Operator</div>
            </div>
          </div>
        </div>

        {/* Center Section - Date & Time */}
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-lg font-mono font-semibold">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs text-blue-100">
              {formatDate(currentTime)}
            </div>
          </div>
        </div>

        {/* Right Section - Status & Controls */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <BoltIcon
              className={`h-5 w-5 ${isOnline ? "text-green-300" : "text-red-300"}`}
            />
            <span className="text-sm">{isOnline ? "Online" : "Offline"}</span>
          </div>

          {/* Sync Status */}
          <div className="flex items-center space-x-1">
            <div
              className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400" : "bg-yellow-400"}`}
            />
            <span className="text-xs text-blue-100">
              {isOnline ? "Synced" : "Pending"}
            </span>
          </div>

          {/* Fullscreen Status */}
          <div className="flex items-center space-x-1">
            <div
              className={`w-2 h-2 rounded-full ${isFullscreen ? "bg-blue-400" : "bg-gray-400"}`}
            />
            <span className="text-xs text-blue-100">
              {isFullscreen ? "Fullscreen" : "Windowed"}
            </span>
          </div>

          <div className="h-6 w-px bg-blue-400" />

          {/* Fullscreen Button - Only show when not in fullscreen mode */}
          {!isFullscreen && onEnterFullscreen && (
            <button
              onClick={onEnterFullscreen}
              className="px-4 py-2 text-sm font-medium text-white border border-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors flex items-center"
            >
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
              Fullscreen
            </button>
          )}

          {/* Exit Button */}
          <button
            onClick={onExit}
            className="px-4 py-2 text-sm font-medium text-white border border-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors flex items-center"
          >
            <CloseIcon className="h-4 w-4 mr-1" />
            Exit POS
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-1 bg-gradient-to-r from-green-400 to-blue-400" />
    </header>
  );
};

export default POSHeader;
