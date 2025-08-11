import React from "react";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";

interface Operator {
  name: string;
  email: string;
  phone: string;
  status: "available" | "assigned" | "on-break" | "unavailable";
}

const operators: Operator[] = [
  {
    name: "Rajesh Kumar",
    email: "rajesh.kumar@fuelizer.com",
    phone: "+91 98765 43210",
    status: "assigned",
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@fuelizer.com",
    phone: "+91 87654 32109",
    status: "available",
  },
  {
    name: "Amit Singh",
    email: "amit.singh@fuelizer.com",
    phone: "+91 76543 21098",
    status: "assigned",
  },
  {
    name: "Sunita Devi",
    email: "sunita.devi@fuelizer.com",
    phone: "+91 65432 10987",
    status: "on-break",
  },
  {
    name: "Vikram Yadav",
    email: "vikram.yadav@fuelizer.com",
    phone: "+91 54321 09876",
    status: "assigned",
  },
  {
    name: "Meera Patel",
    email: "meera.patel@fuelizer.com",
    phone: "+91 43210 98765",
    status: "available",
  },
];

const statusColor = (status: Operator["status"]) => {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-800";
    case "assigned":
      return "bg-blue-100 text-blue-800";
    case "on-break":
      return "bg-yellow-100 text-yellow-800";
    case "unavailable":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const OperatorList: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {operators.map((op, idx) => (
        <Card key={idx} className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-lg">{op.name}</div>
            <Badge className={statusColor(op.status)}>{op.status}</Badge>
          </div>
          <div className="text-sm text-gray-700">{op.email}</div>
          <div className="text-sm text-gray-700">{op.phone}</div>
        </Card>
      ))}
    </div>
  );
};

export default OperatorList;
