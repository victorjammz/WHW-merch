import React, { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHelp } from "@/contexts/HelpContext";

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
  const { isHelpEnabled } = useHelp();

  // Don't render the button if help is disabled
  if (!isHelpEnabled) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowHelp(!showHelp)}
        className={`
          ${position === 'fixed' ? 'fixed bottom-4 right-4 z-50' : ''} 
          rounded-full shadow-lg hover:scale-105 transition-transform bg-yellow-100 hover:bg-yellow-200 text-yellow-700
        `}
        title="Get Help"
      >
        <HelpCircle size={20} />
      </Button>

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-yellow-50">
              <CardTitle className="text-lg text-yellow-900">Platform Help</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHelp(false)}
                className="h-6 w-6 text-yellow-700 hover:text-yellow-900"
              >
                <X size={14} />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 bg-yellow-50">
              <p className="text-sm text-yellow-800">
                Hover over sections throughout the platform to see helpful tooltips, or browse the guide below:
              </p>
              
              {helpItems.map((item, index) => (
                <div key={index} className="border-l-2 border-yellow-300 pl-3">
                  <h4 className="font-medium text-sm text-yellow-900">{item.title}</h4>
                  <p className="text-xs text-yellow-700 mt-1">
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