import { Loader2 } from "lucide-react";

export const PageLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-[200px] w-full">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading page...</p>
      </div>
    </div>
  );
};