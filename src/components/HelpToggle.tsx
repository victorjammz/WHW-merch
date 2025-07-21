import React from "react";
import { HelpCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHelp } from "@/contexts/HelpContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpToggleProps {
  position?: "fixed" | "relative";
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export const HelpToggle: React.FC<HelpToggleProps> = ({
  position = "fixed",
  size = "default",
  variant = "ghost"
}) => {
  const { isHelpEnabled, toggleHelp } = useHelp();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size === "sm" ? "sm" : "icon"}
            onClick={toggleHelp}
            className={`
              ${position === 'fixed' ? 'fixed bottom-20 right-4 z-50' : ''} 
              ${isHelpEnabled ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700' : 'bg-muted hover:bg-muted/80'}
              rounded-full shadow-lg hover:scale-105 transition-all duration-200
            `}
          >
            {isHelpEnabled ? (
              <Eye size={size === "sm" ? 16 : 20} />
            ) : (
              <EyeOff size={size === "sm" ? 16 : 20} />
            )}
            {size !== "default" && size !== "sm" && (
              <span className="ml-2">
                {isHelpEnabled ? "Hide Help" : "Show Help"}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-yellow-50 border-yellow-200 text-yellow-900 text-xs">
          <p>{isHelpEnabled ? "Hide help tooltips" : "Show help tooltips"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};