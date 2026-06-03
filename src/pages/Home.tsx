import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CarCard } from "@/components/car-card";
import { Car3D } from "@/components/Car3D";
import { useFeaturedCars } from "@/hooks/useCars";
import { Search, Shield, CreditCard, CheckCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";
import { AnimatedSection } from "@/components/AnimatedSection";
import { CounterAnimation } from "@/components/CounterAnimation";
import { BrowseByBrand } from "@/components/BrowseByBrand";
import { WhyChooseUs } from "@/components/WhyChooseUs";

export function Home() {
  const { data: featuredCars = [], isLoading: isFeaturedLoading } = useFeaturedCars();
  const [searchTerm, setSearchTerm] = useState("");
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();

  // Parallax scroll tracking with RAF for smooth performance
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/cars?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate("/cars");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        {/* Parallax wrapper for background */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translateY(${scrollY * 0.35}px)` }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center animate-ken-burns will-change-transform"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
        </div>

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        {/* Shimmer light sweep */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/8 to-transparent animate-shimmer" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { left: "10%", bottom: "-5%", delay: "0s", size: "3px" },
            { left: "25%", bottom: "-8%", delay: "1.2s", size: "2px" },
            { left: "45%", bottom: "-3%", delay: "2.5s", size: "4px" },
            { left: "65%", bottom: "-6%", delay: "0.8s", size: "2px" },
            { left: "80%", bottom: "-4%", delay: "3.2s", size: "3px" },
            { left: "92%", bottom: "-7%", delay: "1.8s", size: "2px" },
          ].map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/60 animate-float-up"
              style={{
                left: p.left,
                bottom: p.bottom,
                width: p.size,
                height: p.size,
                animationDelay: p.delay,
                animationDuration: `${5 + i * 0.8}s`,
              }}
            />
          ))}
        </div>

        {/* Vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_150px_40px_rgba(0,0,0,0.5)]" />

        {/* Accent glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-accent/10 rounded-full blur-[100px] animate-pulse-glow" />

        {/* Content */}
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <AnimatedSection variant="fade-down" duration={800}>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight drop-shadow-lg">
              Find Your Next 
              <span className="bg-gradient-to-r from-accent via-accent/90 to-warning bg-clip-text text-transparent"> Drive</span>
            </h1>
          </AnimatedSection>
          <AnimatedSection variant="fade-up" delay={200} duration={700}>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 drop-shadow-md">
              Discover premium vehicles with certified quality and exceptional service
            </p>
          </AnimatedSection>
          
          {/* Search Bar */}
          <AnimatedSection variant="zoom-in" delay={400} duration={600}>
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search by make, model, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-12 text-base bg-white/90 backdrop-blur-sm border-0 shadow-lg text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button variant="hero" size="lg" className="h-12 px-8" onClick={handleSearch}>
                Search Cars
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { end: 500, suffix: "+", label: "Cars Sold" },
            { end: 1200, suffix: "+", label: "Happy Customers" },
            { end: 50, suffix: "+", label: "Dealer Partners" },
            { end: 98, suffix: "%", label: "Satisfaction Rate" },
          ].map((stat, i) => (
            <AnimatedSection key={stat.label} variant="fade-up" delay={i * 100} duration={600}>
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-primary">
                  <CounterAnimation end={stat.end} suffix={stat.suffix} />
                </div>
                <p className="text-sm md:text-base text-muted-foreground font-medium">{stat.label}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: "Verified Dealers", desc: "All our vehicles are inspected and certified for quality and safety" },
            { icon: CreditCard, title: "Easy Financing", desc: "Flexible financing options with competitive rates and quick approval" },
            { icon: CheckCircle, title: "Quality Guaranteed", desc: "Every vehicle comes with our comprehensive quality guarantee" },
          ].map((badge, i) => (
            <AnimatedSection key={badge.title} variant="fade-up" delay={i * 150} duration={600}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <badge.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{badge.title}</h3>
                <p className="text-muted-foreground">{badge.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Browse by Brand */}
      <BrowseByBrand />

      {/* Featured Listings with 3D Animation */}
      <section className="container mx-auto px-4">
        <AnimatedSection variant="fade-up">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Featured Vehicles</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover our handpicked selection of premium vehicles across Electric, Petrol, and Diesel categories
            </p>
          </div>
        </AnimatedSection>
        
        {/* 3D Car Animation Section */}
        <AnimatedSection variant="blur-in" delay={100} duration={800}>
          <div className="mb-16">
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 mb-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold mb-2">Experience Our Vehicles in 3D</h3>
                <p className="text-muted-foreground">Interactive 3D models of our premium collection</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <Car3D height={400} carColor="#1f2937" autoRotate={true} />
                </div>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xl font-semibold">Premium 3D Showcase</h4>
                    <p className="text-muted-foreground">
                      Get a comprehensive view of our vehicles with our interactive 3D models. 
                      Rotate, zoom, and explore every detail before making your decision.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        360° Interactive Viewing
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        Detailed Interior & Exterior
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        Real-time Lighting Effects
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
        
        {isFeaturedLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : featuredCars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCars.map((car, i) => (
              <AnimatedSection key={car.id} variant="fade-up" delay={i * 120} duration={500}>
                <CarCard car={car} />
              </AnimatedSection>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">
            No featured vehicles available. Check back soon!
          </p>
        )}
        
        <AnimatedSection variant="zoom-in" delay={200}>
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link to="/cars">
                View All Cars
              </Link>
            </Button>
          </div>
        </AnimatedSection>
      </section>

      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* Call to Action */}
      <AnimatedSection variant="fade-up" duration={700}>
        <section className="bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-16 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Find Your Perfect Car?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Browse our extensive inventory or contact our experts for personalized assistance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="accent" size="lg" asChild>
                <Link to="/cars">
                  Browse Inventory
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20" asChild>
                <Link to="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
}
