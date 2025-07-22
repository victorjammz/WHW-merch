import { useState, useEffect } from "react";
import { DashboardWidgets } from "@/components/DashboardWidgets";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const getStockStatus = (quantity: number): "low" | "medium" | "high" => {
  if (quantity <= 0) return 'low';
  if (quantity < 20) return 'medium';
  return 'high';
};

const Index = () => {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInventory = async () => {
      const {
        data,
        error
      } = await supabase.from('inventory').select('*');
      if (error) {
        toast({
          title: "Error fetching inventory",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      setInventoryData(data.map(item => ({
        ...item,
        status: getStockStatus(item.quantity)
      })));
    };
    const fetchPendingOrders = async () => {
      // Placeholder until Supabase types are updated
      // Will fetch from event_orders table once types are regenerated
      setPendingOrdersCount(3);
    };
    fetchInventory();
    fetchPendingOrders();
  }, [toast]);

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Welcome to Warehouse Worship CRM</p>
        </div>
      </div>

      {/* Dashboard Widgets */}
      <DashboardWidgets 
        inventoryData={inventoryData} 
        pendingOrdersCount={pendingOrdersCount} 
      />
    </div>
  );
};

export default Index;
