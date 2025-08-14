import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Modal } from "../../../components/ui/modal";
import {
  MapPin,
  Users,
  Plus,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

import { Operator, OperatorStatus, Booth, Nozzle } from "../../../types/common";
import { useEffect } from "react";
import StationService from "../../../services/stationService";

const BoothManagement: React.FC = () => {
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [showBoothAssignmentModal, setShowBoothAssignmentModal] =
    useState(false);
  const [selectedNozzle, setSelectedNozzle] = useState<Nozzle | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(
    null
  );

  // Load booths from Station Setup APIs
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await StationService.listBooths();
        const data = ((res as any)?.data?.data || []) as any[];
        const mapped: Booth[] = data.map((b: any) => ({
          id: String(b.id),
          name: b.name || b.code || `Booth ${b.id}`,
          status: b.active ? "online" : "offline",
          lastMaintenance:
            b.lastMaintenance || new Date().toISOString().slice(0, 10),
          nozzles: ((b.Nozzles || b.nozzles || []) as any[]).map((n: any) => ({
            id: String(n.id),
            fuelType: n.Product?.name || n.product?.name || "",
            previousReading: 0,
            currentReading: null,
            variance: 0,
            status: "pending",
            assignedOperators: [],
          })),
        }));
        if (mounted) {
          setBooths(mapped);
          setLoadError(null);
        }
      } catch (e: any) {
        if (mounted) setLoadError(e?.message || "Failed to load booths");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // TODO: Replace with real available operators endpoint when ready
  const operators: Operator[] = [] as any;

  // Calculate booth statistics
  const totalBooths = booths.length;
  const onlineBooths = booths.filter(
    (booth) => booth.status === "online"
  ).length;
  const totalNozzles = booths.reduce(
    (sum, booth) => sum + booth.nozzles.length,
    0
  );
  const assignedNozzles = booths.reduce(
    (sum, booth) =>
      sum +
      booth.nozzles.filter(
        (nozzle) =>
          (nozzle as any).assignedOperators?.length || nozzle.assignedOperator
      ).length,
    0
  );

  const handleOperatorAssignment = (
    operatorId: string,
    boothName: string,
    nozzleId: string
  ) => {
    console.log(
      `Assigned operator ${operatorId} to ${boothName} - Nozzle ${nozzleId}`
    );
    setShowBoothAssignmentModal(false);
    setSelectedBooth(null);
    setSelectedNozzle(null);
    setSelectedOperator(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "offline":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "maintenance":
        return <Settings className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Removed unused getStatusColor

  const availableOperators = operators.filter(
    (operator) => operator.status === OperatorStatus.AVAILABLE
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Booth & Nozzle Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Loading booths...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Booth & Nozzle Management
            </h2>
            <p className="text-red-600 dark:text-red-400">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Booth & Nozzle Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage booth assignments and nozzle configurations
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          Add New Booth
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Booths
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalBooths}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Online Booths
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {onlineBooths}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Nozzles
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalNozzles}
                </p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Assigned Nozzles
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {assignedNozzles}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booth Assignment Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Booth & Nozzle Assignment</span>
          </CardTitle>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Click on any nozzle to assign an operator to it
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Individual Booth Cards - two per row on xl screens */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {booths.map((booth) => (
                <div
                  key={booth.id}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 shadow-sm h-full"
                >
                  {/* Booth Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <span className="text-xl">🏬</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {booth.name}
                          </h3>
                          <div
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booth.status === "online"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : booth.status === "offline"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            }`}
                          >
                            {getStatusIcon(booth.status)}
                            <span className="ml-1 capitalize">
                              {booth.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {booth.nozzles.length} nozzle
                          {booth.nozzles.length !== 1 ? "s" : ""} • Last
                          maintenance: {booth.lastMaintenance}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nozzles Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-base">⛽</span>
                      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Nozzles in {booth.name}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {booth.nozzles.map((nozzle) => (
                        <div
                          key={nozzle.id}
                          className={`relative p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                            nozzle.assignedOperator
                              ? "border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
                              : "border-gray-200 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 hover:border-green-300"
                          }`}
                          onClick={() => {
                            setSelectedBooth(booth);
                            setSelectedNozzle(nozzle);
                            setSelectedOperator(null);
                            setShowBoothAssignmentModal(true);
                          }}
                        >
                          {/* Nozzle Icon */}
                          <div className="absolute top-2 right-2">
                            <span className="text-base">⛽</span>
                          </div>

                          {/* Nozzle ID Badge */}
                          <div className="mb-2">
                            <div
                              className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${
                                nozzle.assignedOperator
                                  ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                                  : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {nozzle.id}
                            </div>
                          </div>

                          {/* Fuel Type */}
                          <div className="mb-2">
                            <div className="text-[13px] font-medium text-gray-900 dark:text-white">
                              {nozzle.fuelType}
                            </div>
                          </div>

                          {/* Assignment Status */}
                          <div className="space-y-2">
                            {nozzle.assignedOperator ? (
                              <div className="space-y-2">
                                <Badge className="w-full justify-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-[11px] font-medium">
                                  Assigned •{" "}
                                  {(nozzle as any).assignedOperators?.length ||
                                    1}{" "}
                                  operator
                                  {((nozzle as any).assignedOperators?.length ||
                                    1) > 1
                                    ? "s"
                                    : ""}
                                </Badge>
                                <div className="text-[11px] text-blue-700 dark:text-blue-300 font-medium text-center">
                                  View or update assignments
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Badge className="w-full justify-center bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-[11px] font-medium">
                                  Available
                                </Badge>
                                <div className="text-xs text-green-600 dark:text-green-400 font-medium text-center p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                  Click to assign operator
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Assignment Instructions */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">💡</span>
                <div className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                  How to assign operators:
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700 dark:text-blue-400">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">1️⃣</span>
                  <span>Click on any available nozzle (green badge)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">2️⃣</span>
                  <span>Select an available operator from the list</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">3️⃣</span>
                  <span>Complete the assignment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">4️⃣</span>
                  <span>Each nozzle can have a different operator</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booth Assignment Modal */}
      {showBoothAssignmentModal && selectedBooth && selectedNozzle && (
        <Modal
          isOpen={showBoothAssignmentModal}
          onClose={() => {
            setShowBoothAssignmentModal(false);
            setSelectedBooth(null);
            setSelectedNozzle(null);
            setSelectedOperator(null);
          }}
          className="max-w-md mx-4"
        >
          <div className="p-4">
            {/* Modal Title */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Assign Operator to {selectedNozzle.id}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedNozzle.fuelType}
              </p>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Current Assignment */}
              <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Assignment:
                </div>
                {(selectedNozzle as any).assignedOperators?.length ||
                selectedNozzle.assignedOperator ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {(selectedNozzle as any).assignedOperators?.length
                          ? `${(selectedNozzle as any).assignedOperators.length} operators assigned`
                          : "No operator currently assigned"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {(selectedNozzle as any).assignedOperators?.length
                          ? "Multiple operators"
                          : `${selectedNozzle.assignedOperator} • ${selectedNozzle.assignedOperator ? "attendant" : ""}`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No operator currently assigned
                  </div>
                )}
              </div>

              {/* Available Operators */}
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Available Operators:
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableOperators.map((operator) => (
                    <div
                      key={operator.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedOperator?.id === operator.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setSelectedOperator(operator)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-gray-600 dark:text-gray-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {operator.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {operator.id} •{" "}
                              {(operator as any)?.duty || "attendant"}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs">
                          Available
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBoothAssignmentModal(false);
                    setSelectedBooth(null);
                    setSelectedNozzle(null);
                    setSelectedOperator(null);
                  }}
                  className="text-sm px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    handleOperatorAssignment(
                      selectedOperator?.id || "",
                      selectedBooth?.name || "",
                      selectedNozzle?.id || ""
                    )
                  }
                  disabled={!selectedOperator}
                  className="text-sm px-4 py-2"
                >
                  {selectedNozzle.assignedOperator ? "Reassign" : "Assign"}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BoothManagement;
