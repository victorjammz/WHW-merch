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
                className="text-muted-foreground hover:text-foreground transition-colors" 
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-xs text-left"
          style={{ maxWidth }}
        >
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};