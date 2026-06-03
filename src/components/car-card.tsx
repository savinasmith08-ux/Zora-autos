import { Card, CardContent } from "@/components/ui/card";
import { FuelBadge, ConditionBadge } from "@/components/ui/badge-variant";
import { Car } from "@/types/car";
import { Link } from "react-router-dom";

interface CarCardProps {
  car: Car;
}

export function CarCard({ car }: CarCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-US').format(mileage);
  };

  return (
    <Link to={`/cars/${car.id}`}>
      <Card className="group overflow-hidden border-0 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 hover:scale-105">
        <div className="relative overflow-hidden">
          <img
            src={car.image}
            alt={`${car.year} ${car.make} ${car.model}`}
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <ConditionBadge condition={car.condition} />
            <FuelBadge fuelType={car.fuelType} />
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                {car.year} {car.make} {car.model}
              </h3>
              <p className="text-2xl font-bold text-primary mt-1">
                {formatPrice(car.price)}
              </p>
            </div>
            
            {car.condition === "used" && car.mileage && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm">
                  {formatMileage(car.mileage)} miles
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}