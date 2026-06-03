import { Badge } from "@/components/ui/badge";
import { FuelType, Condition } from "@/types/car";
import { Zap, Fuel, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface FuelBadgeProps {
  fuelType: FuelType;
  className?: string;
}

export function FuelBadge({ fuelType, className }: FuelBadgeProps) {
  const getVariantAndIcon = () => {
    switch (fuelType) {
      case "electric":
        return { 
          variant: "default" as const, 
          icon: Zap, 
          label: "Electric",
          className: "bg-electric text-electric-foreground"
        };
      case "petrol":
        return { 
          variant: "default" as const, 
          icon: Fuel, 
          label: "Petrol",
          className: "bg-petrol text-petrol-foreground"
        };
      case "diesel":
        return { 
          variant: "default" as const, 
          icon: Settings, 
          label: "Diesel",
          className: "bg-diesel text-diesel-foreground"
        };
    }
  };

  const { icon: Icon, label, className: variantClassName } = getVariantAndIcon();

  return (
    <Badge className={cn(variantClassName, "flex items-center gap-1", className)}>
      <Icon size={12} />
      {label}
    </Badge>
  );
}

interface ConditionBadgeProps {
  condition: Condition;
  className?: string;
}

export function ConditionBadge({ condition, className }: ConditionBadgeProps) {
  const isNew = condition === "new";
  
  return (
    <Badge 
      className={cn(
        isNew 
          ? "bg-new-car text-new-car-foreground" 
          : "bg-used-car text-used-car-foreground",
        "font-semibold",
        className
      )}
    >
      {isNew ? "NEW" : "USED"}
    </Badge>
  );
}