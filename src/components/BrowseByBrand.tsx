import { Link } from "react-router-dom";
import { AnimatedSection } from "@/components/AnimatedSection";

import bmwLogo from "@/assets/brands/bmw.png";
import teslaLogo from "@/assets/brands/tesla.png";
import audiLogo from "@/assets/brands/audi.png";
import fordLogo from "@/assets/brands/ford.png";
import mercedesLogo from "@/assets/brands/mercedes.png";
import toyotaLogo from "@/assets/brands/toyota.png";
import hondaLogo from "@/assets/brands/honda.png";
import porscheLogo from "@/assets/brands/porsche.png";
import chevroletLogo from "@/assets/brands/chevrolet.png";
import lexusLogo from "@/assets/brands/lexus.png";
import nissanLogo from "@/assets/brands/nissan.png";
import hyundaiLogo from "@/assets/brands/hyundai.png";

const brands = [
  { name: "BMW", logo: bmwLogo },
  { name: "Tesla", logo: teslaLogo },
  { name: "Audi", logo: audiLogo },
  { name: "Ford", logo: fordLogo },
  { name: "Mercedes", logo: mercedesLogo },
  { name: "Toyota", logo: toyotaLogo },
  { name: "Honda", logo: hondaLogo },
  { name: "Porsche", logo: porscheLogo },
  { name: "Chevrolet", logo: chevroletLogo },
  { name: "Lexus", logo: lexusLogo },
  { name: "Nissan", logo: nissanLogo },
  { name: "Hyundai", logo: hyundaiLogo },
];

export function BrowseByBrand() {
  return (
    <section className="container mx-auto px-4">
      <AnimatedSection variant="fade-up">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-4">Browse by Brand</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find vehicles from your favourite manufacturer
          </p>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {brands.map((brand, i) => (
          <AnimatedSection key={brand.name} variant="zoom-in" delay={i * 60} duration={500}>
            <Link
              to={`/cars?search=${encodeURIComponent(brand.name)}`}
              className="group block"
            >
              <div className="rounded-xl border bg-card p-4 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40">
                <img
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  className="mx-auto mb-2 h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
                <span className="font-semibold text-xs sm:text-sm group-hover:text-primary transition-colors">
                  {brand.name}
                </span>
              </div>
            </Link>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
