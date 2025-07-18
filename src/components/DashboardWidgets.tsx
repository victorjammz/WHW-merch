import { useState, useEffect } from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import { Package, ShoppingCart, TrendingUp, AlertTriangle, Calendar, Settings, Grid, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatsWidget } from "@/components/widgets/StatsWidget";
import { InventoryWidget } from "@/components/widgets/InventoryWidget";
import { BarcodeWidget } from "@/components/widgets/BarcodeWidget";
import { POSWidget } from "@/components/widgets/POSWidget";
import { useWidgetLayout } from "@/hooks/useWidgetLayout";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

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

interface DashboardWidgetsProps {
  inventoryData: InventoryItem[];
  pendingOrdersCount: number;
}

export const DashboardWidgets = ({ inventoryData, pendingOrdersCount }: DashboardWidgetsProps) => {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const {
    layout,
    widgets,
    enabledWidgets,
    isEditMode,
    setIsEditMode,
    onLayoutChange,
    toggleWidget,
    resetLayout,
  } = useWidgetLayout();

  const stats = {
    totalItems: inventoryData.reduce((sum, item) => sum + item.quantity, 0),
    totalValue: inventoryData.reduce((sum, item) => sum + item.quantity * item.price, 0),
    lowStockItems: inventoryData.filter(item => item.status === "low").length,
    totalProducts: inventoryData.length
  };

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case "total-inventory":
        return (
          <StatsWidget
            title="Total Inventory"
            value={stats.totalItems}
            description="Items in stock"
            icon={Package}
            borderColor="border-l-primary"
            iconColor="text-primary"
          />
        );
      case "total-value":
        return (
          <StatsWidget
            title="Total Value"
            value={formatPrice(stats.totalValue)}
            description="+12% from last month"
            icon={TrendingUp}
            borderColor="border-l-success"
            iconColor="text-success"
          />
        );
      case "active-products":
        return (
          <StatsWidget
            title="Active Products"
            value={stats.totalProducts}
            description="Unique SKUs"
            icon={ShoppingCart}
            borderColor="border-l-accent"
            iconColor="text-accent-foreground"
          />
        );
      case "low-stock":
        return (
          <StatsWidget
            title="Low Stock Alerts"
            value={stats.lowStockItems}
            description="Need immediate attention"
            icon={AlertTriangle}
            borderColor="border-l-warning"
            iconColor="text-warning"
            valueColor="text-warning"
          />
        );
      case "pending-orders":
        return (
          <StatsWidget
            title="Pending Orders"
            value={pendingOrdersCount}
            description="Click to view orders"
            icon={Calendar}
            borderColor="border-l-info"
            iconColor="text-info"
            onClick={() => navigate('/event-orders')}
          />
        );
      case "inventory-table":
        return <InventoryWidget data={inventoryData} />;
      case "barcode-generator":
        return <BarcodeWidget />;
      case "pos-connection":
        return <POSWidget />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Widget Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="flex items-center gap-2"
          >
            <Grid className="h-4 w-4" />
            {isEditMode ? "Exit Edit Mode" : "Customize Layout"}
          </Button>
          {isEditMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={resetLayout}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Reset Layout
              </Button>
              <Badge variant="secondary" className="animate-pulse">
                Drag widgets to rearrange
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Widget Configuration Panel */}
      {isEditMode && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Widget Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {widgets.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm font-medium">{widget.title}</span>
                  <Switch
                    checked={widget.enabled}
                    onCheckedChange={() => toggleWidget(widget.id)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 10, md: 8, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={(layout) => onLayoutChange(layout)}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {enabledWidgets.map((widget) => (
          <div key={widget.id} className={isEditMode ? "border-2 border-dashed border-primary/50" : ""}>
            {renderWidget(widget.id)}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};