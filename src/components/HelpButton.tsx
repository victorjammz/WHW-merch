import React, { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HelpItem {
  title: string;
  description: string;
  section: string;
}

interface HelpButtonProps {
  helpItems?: HelpItem[];
  position?: "fixed" | "relative";
}

const defaultHelpItems: HelpItem[] = [
  {
    title: "Inventory Management",
    description: "View and manage your product inventory. Add new items, update quantities, and track stock levels.",
    section: "inventory"
  },
  {
    title: "Order Processing",
    description: "Create and manage orders for events. Track order status and payment information.",
    section: "orders"
  },
  {
    title: "Event Management",
    description: "Set up events and allocate inventory to specific events for better organization.",
    section: "events"
  },
  {
    title: "Barcode System",
    description: "Generate and scan barcodes for quick inventory management and order processing.",
    section: "barcodes"
  }
];

export const HelpButton: React.FC<HelpButtonProps> = ({
  helpItems = defaultHelpItems,
  position = "fixed"
}) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowHelp(!showHelp)}
        className={`
          ${position === 'fixed' ? 'fixed bottom-4 right-4 z-50' : ''} 
          rounded-full shadow-lg hover:scale-105 transition-transform
        `}
        title="Get Help"
      >
        <HelpCircle size={20} />
      </Button>

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Platform Help</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHelp(false)}
                className="h-6 w-6"
              >
                <X size={14} />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Hover over sections throughout the platform to see helpful tooltips, or browse the guide below:
              </p>
              
              {helpItems.map((item, index) => (
                <div key={index} className="border-l-2 border-primary/20 pl-3">
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};