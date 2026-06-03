import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Car, FuelType, Condition, TransmissionType } from "@/types/car";

// Transform database car to frontend Car type
export function transformDbCar(dbCar: Tables<"cars">): Car {
  return {
    id: dbCar.id,
    make: dbCar.make,
    model: dbCar.model,
    year: dbCar.year,
    price: Number(dbCar.price),
    condition: dbCar.condition as Condition,
    fuelType: dbCar.fuel_type as FuelType,
    transmission: (dbCar.transmission as TransmissionType) || "automatic",
    isHybrid: dbCar.is_hybrid ?? false,
    mileage: dbCar.mileage ?? undefined,
    image: dbCar.image_url,
    images: dbCar.images ?? [],
    videos: dbCar.videos ?? undefined,
    description: dbCar.description,
    specifications: {
      engine: dbCar.engine,
      transmission: dbCar.transmission,
      exteriorColor: dbCar.exterior_color,
      interiorColor: dbCar.interior_color,
      vin: dbCar.vin,
      features: dbCar.features ?? [],
    },
  };
}

export function useCars() {
  return useQuery({
    queryKey: ["cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map(transformDbCar);
    },
  });
}

export function useFeaturedCars() {
  return useQuery({
    queryKey: ["featured-cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data.map(transformDbCar);
    },
  });
}

export function useCar(id: string) {
  return useQuery({
    queryKey: ["car", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return transformDbCar(data);
    },
    enabled: !!id,
  });
}
