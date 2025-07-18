import { Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryTable } from "@/components/InventoryTable";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  size: string | null;
  color: string | null;
  quantity: number;
  price: number;
  status: "low" | "medium" | "high";
}

interface InventoryWidgetProps {
  data: InventoryItem[];
}

export const InventoryWidget = ({ data }: InventoryWidgetProps) => {
  return (
    <Card className="shadow-card h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          Inventory Management
        </CardTitle>
        <CardDescription className="text-sm">
          Manage your clothing inventory, track stock levels, and monitor product performance
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        <InventoryTable data={data} />
      </CardContent>
    </Card>
  );
};