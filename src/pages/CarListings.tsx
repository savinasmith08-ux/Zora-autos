import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { CarCard } from "@/components/car-card";
import { useCars } from "@/hooks/useCars";
import { FuelType, Condition } from "@/types/car";
import { Search, Filter, SlidersHorizontal, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { AnimatedSection } from "@/components/AnimatedSection";

export function CarListings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: cars = [], isLoading } = useCars();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState("price-low");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<FuelType[]>(
    searchParams.get("fuel") ? [searchParams.get("fuel") as FuelType] : []
  );
  const [selectedConditions, setSelectedConditions] = useState<Condition[]>(
    searchParams.get("condition") ? [searchParams.get("condition") as Condition] : []
  );
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [mileageRange, setMileageRange] = useState([0, 500000]);

  // Update filters when URL parameters change
  useEffect(() => {
    const fuelParam = searchParams.get("fuel");
    const conditionParam = searchParams.get("condition");
    const searchParam = searchParams.get("search");
    
    setSelectedFuelTypes(fuelParam ? [fuelParam as FuelType] : []);
    setSelectedConditions(conditionParam ? [conditionParam as Condition] : []);
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);

  const filteredAndSortedCars = useMemo(() => {
    let filtered = cars.filter((car) => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matches = 
          car.make.toLowerCase().includes(searchLower) ||
          car.model.toLowerCase().includes(searchLower) ||
          `${car.year}`.includes(searchLower);
        if (!matches) return false;
      }
      if (selectedFuelTypes.length > 0 && !selectedFuelTypes.includes(car.fuelType)) return false;
      if (selectedConditions.length > 0 && !selectedConditions.includes(car.condition)) return false;
      if (car.price < priceRange[0] || car.price > priceRange[1]) return false;
      if (car.condition === "used" && car.mileage) {
        if (car.mileage < mileageRange[0] || car.mileage > mileageRange[1]) return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low": return a.price - b.price;
        case "price-high": return b.price - a.price;
        case "mileage-low":
          if (a.condition === "used" && b.condition === "used") return (a.mileage || 0) - (b.mileage || 0);
          return a.condition === "new" ? -1 : 1;
        case "year-new": return b.year - a.year;
        default: return 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedFuelTypes, selectedConditions, priceRange, mileageRange, sortBy]);

  const handleFuelTypeChange = (fuelType: FuelType, checked: boolean) => {
    if (checked) setSelectedFuelTypes([...selectedFuelTypes, fuelType]);
    else setSelectedFuelTypes(selectedFuelTypes.filter(f => f !== fuelType));
  };

  const handleConditionChange = (condition: Condition, checked: boolean) => {
    if (checked) setSelectedConditions([...selectedConditions, condition]);
    else setSelectedConditions(selectedConditions.filter(c => c !== condition));
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchTerm("");
    setSelectedFuelTypes([]);
    setSelectedConditions([]);
    setPriceRange([0, 5000000]);
    setMileageRange([0, 500000]);
    setSortBy("price-low");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <AnimatedSection variant="fade-down" duration={600}>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Our Vehicle Inventory</h1>
          <p className="text-xl text-muted-foreground">
            Browse our complete selection of {cars.length} quality vehicles
          </p>
        </div>
      </AnimatedSection>

      {/* Search and Controls */}
      <AnimatedSection variant="fade-up" delay={100} duration={500}>
        <div className="bg-card rounded-lg border shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search by make, model, or year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="mileage-low">Mileage: Low to High</SelectItem>
                <SelectItem value="year-new">Year: Newest First</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="border-t pt-6 space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Fuel Type</h4>
                  {(["electric", "petrol", "diesel"] as FuelType[]).map((fuelType) => (
                    <div key={fuelType} className="flex items-center space-x-2">
                      <Checkbox
                        id={fuelType}
                        checked={selectedFuelTypes.includes(fuelType)}
                        onCheckedChange={(checked) => handleFuelTypeChange(fuelType, checked as boolean)}
                      />
                      <label htmlFor={fuelType} className="text-sm capitalize cursor-pointer">
                        {fuelType === "electric" ? "Electric" : fuelType}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Condition</h4>
                  {(["new", "used"] as Condition[]).map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={condition}
                        checked={selectedConditions.includes(condition)}
                        onCheckedChange={(checked) => handleConditionChange(condition, checked as boolean)}
                      />
                      <label htmlFor={condition} className="text-sm capitalize cursor-pointer">
                        {condition}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Price Range</h4>
                  <div className="px-2">
                    <Slider value={priceRange} onValueChange={setPriceRange} max={5000000} min={0} step={10000} className="w-full" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>${priceRange[0].toLocaleString()}</span>
                      <span>${priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Mileage Range</h4>
                  <div className="px-2">
                    <Slider value={mileageRange} onValueChange={setMileageRange} max={500000} min={0} step={10000} className="w-full" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{mileageRange[0].toLocaleString()}</span>
                      <span>{mileageRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={clearFilters}>Clear All Filters</Button>
              </div>
            </div>
          )}
        </div>
      </AnimatedSection>

      {/* Results */}
      <AnimatedSection variant="fade-up" delay={200}>
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredAndSortedCars.length} of {cars.length} vehicles
          </p>
        </div>
      </AnimatedSection>

      {/* Car Grid */}
      {filteredAndSortedCars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAndSortedCars.map((car, i) => (
            <AnimatedSection key={car.id} variant="fade-up" delay={Math.min(i * 80, 400)} duration={500}>
              <CarCard car={car} />
            </AnimatedSection>
          ))}
        </div>
      ) : (
        <AnimatedSection variant="zoom-in">
          <div className="text-center py-16">
            <SlidersHorizontal className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No vehicles found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search criteria or filters</p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        </AnimatedSection>
      )}
    </div>
  );
}
