import { useState, useEffect } from "react";
import { Layout } from "react-grid-layout";

export interface WidgetConfig {
  id: string;
  title: string;
  type: "stats" | "inventory" | "barcode" | "pos";
  enabled: boolean;
}

const DEFAULT_LAYOUT: Layout[] = [
  { i: "total-inventory", x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  { i: "total-value", x: 2, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  { i: "active-products", x: 4, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  { i: "low-stock", x: 6, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  { i: "pending-orders", x: 8, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  { i: "inventory-table", x: 0, y: 2, w: 8, h: 6, minW: 6, minH: 4 },
  { i: "barcode-generator", x: 8, y: 2, w: 2, h: 3, minW: 2, minH: 3 },
  { i: "pos-connection", x: 8, y: 5, w: 2, h: 3, minW: 2, minH: 3 },
];

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "total-inventory", title: "Total Inventory", type: "stats", enabled: true },
  { id: "total-value", title: "Total Value", type: "stats", enabled: true },
  { id: "active-products", title: "Active Products", type: "stats", enabled: true },
  { id: "low-stock", title: "Low Stock Alerts", type: "stats", enabled: true },
  { id: "pending-orders", title: "Pending Orders", type: "stats", enabled: true },
  { id: "inventory-table", title: "Inventory Management", type: "inventory", enabled: true },
  { id: "barcode-generator", title: "Barcode Generator", type: "barcode", enabled: true },
  { id: "pos-connection", title: "POS Connection", type: "pos", enabled: true },
];

export const useWidgetLayout = () => {
  const [layout, setLayout] = useState<Layout[]>(() => {
    const saved = localStorage.getItem("dashboard-layout");
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });

  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem("dashboard-widgets");
    return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
  });

  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    localStorage.setItem("dashboard-layout", JSON.stringify(layout));
  }, [layout]);

  useEffect(() => {
    localStorage.setItem("dashboard-widgets", JSON.stringify(widgets));
  }, [widgets]);

  const onLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout);
  };

  const toggleWidget = (widgetId: string) => {
    setWidgets(prev =>
      prev.map(widget =>
        widget.id === widgetId
          ? { ...widget, enabled: !widget.enabled }
          : widget
      )
    );
  };

  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    setWidgets(DEFAULT_WIDGETS);
  };

  const enabledWidgets = widgets.filter(widget => widget.enabled);
  const enabledLayout = layout.filter(item => 
    enabledWidgets.some(widget => widget.id === item.i)
  );

  return {
    layout: enabledLayout,
    widgets,
    enabledWidgets,
    isEditMode,
    setIsEditMode,
    onLayoutChange,
    toggleWidget,
    resetLayout,
  };
};