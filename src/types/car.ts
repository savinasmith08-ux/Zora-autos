export type FuelType = "electric" | "petrol" | "diesel";
export type Condition = "new" | "used";
export type TransmissionType = "automatic" | "manual";

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  condition: Condition;
  fuelType: FuelType;
  transmission: TransmissionType;
  isHybrid: boolean;
  mileage?: number; // Only for used cars
  image: string;
  images: string[]; // Multiple images for detail page
  videos?: string[]; // Video URLs for the car
  description: string;
  specifications: {
    engine: string;
    transmission: string;
    exteriorColor: string;
    interiorColor: string;
    vin: string;
    features: string[];
  };
}