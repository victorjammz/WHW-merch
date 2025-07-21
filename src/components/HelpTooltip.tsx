import React from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpTooltipProps {
  content: string;
  children?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  showIcon?: boolean;
  iconSize?: number;
  maxWidth?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  children,
  side = "top",
  showIcon = true,
  iconSize = 16,
  maxWidth = "300px"
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 cursor-help">
            {children}
            {showIcon && (
              <HelpCircle 
                size={iconSize} 
                className="text-yellow-600 hover:text-yellow-700 transition-colors" 
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-xs text-left bg-yellow-50 border-yellow-200 text-yellow-900 text-xs px-2 py-1"
          style={{ maxWidth: "250px" }}
        >
          <p className="text-xs leading-tight">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};