import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsWidgetProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  borderColor: string;
  iconColor: string;
  valueColor?: string;
  onClick?: () => void;
}

export const StatsWidget = ({
  title,
  value,
  description,
  icon: Icon,
  borderColor,
  iconColor,
  valueColor = "text-foreground",
  onClick,
}: StatsWidgetProps) => {
  return (
    <Card
      className={`shadow-card border-l-4 ${borderColor} ${
        onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""
      } h-full`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
};