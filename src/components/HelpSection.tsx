import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpSectionProps {
  helpText: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  highlightOnHover?: boolean;
}

export const HelpSection: React.FC<HelpSectionProps> = ({
  helpText,
  children,
  side = "top",
  className = "",
  highlightOnHover = true
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`
              ${highlightOnHover ? 'hover:bg-muted/30 hover:border-primary/20 transition-all duration-200 rounded-md p-1' : ''} 
              ${className}
            `}
          >
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-sm text-left z-50"
        >
          <p>{helpText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};