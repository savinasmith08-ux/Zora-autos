import { Car } from "@/types/car";
import teslaModel3 from "@/assets/tesla-model3.jpg";
import bmwM3 from "@/assets/bmw-m3.jpg";
import fordF150 from "@/assets/ford-f150.jpg";
import audiQ7 from "@/assets/audi-q7.jpg";

export const cars: Car[] = [
  {
    id: "1",
    make: "Tesla",
    model: "Model 3",
    year: 2024,
    price: 42000,
    condition: "new",
    fuelType: "electric",
    transmission: "automatic",
    isHybrid: false,
    image: teslaModel3,
    images: [teslaModel3],
    videos: [
      "https://www.tesla.com/content/dam/tesla/videos/model-3/model-3-hero-video.mp4"
    ],
    description: "Experience the future of driving with the Tesla Model 3. This all-electric sedan combines performance, technology, and sustainability in one stunning package. With instant acceleration and industry-leading range, it's the perfect choice for modern drivers.",
    specifications: {
      engine: "Dual Motor All-Wheel Drive",
      transmission: "Single-Speed Fixed Gear",
      exteriorColor: "Pearl White Multi-Coat",
      interiorColor: "Black Premium Interior",
      vin: "5YJ3E1EA8PF123456",
      features: [
        "Autopilot Included",
        "15-inch Touchscreen",
        "Premium Audio",
        "Glass Roof",
        "Heated Seats",
        "Over-the-Air Updates"
      ]
    }
  },
  {
    id: "2",
    make: "BMW",
    model: "M3",
    year: 2022,
    price: 65000,
    condition: "used",
    fuelType: "petrol",
    transmission: "automatic",
    isHybrid: false,
    mileage: 18500,
    image: bmwM3,
    images: [bmwM3],
    videos: [
      "https://bmw-content.s3.amazonaws.com/videos/m3-performance-video.mp4"
    ],
    description: "The BMW M3 delivers pure driving excitement with its high-performance engine and precision handling. This luxury sports sedan has been meticulously maintained and offers an exhilarating driving experience that only BMW M can provide.",
    specifications: {
      engine: "3.0L Twin-Turbo I6",
      transmission: "8-Speed M Steptronic",
      exteriorColor: "Melbourne Red Metallic",
      interiorColor: "Black Merino Leather",
      vin: "WBS8M9C09NCE12345",
      features: [
        "M Sport Package",
        "Harman Kardon Sound",
        "Navigation System",
        "Adaptive LED Headlights",
        "Carbon Fiber Trim",
        "M Performance Exhaust"
      ]
    }
  },
  {
    id: "3",
    make: "Ford",
    model: "F-150",
    year: 2023,
    price: 55000,
    condition: "new",
    fuelType: "petrol",
    transmission: "automatic",
    isHybrid: false,
    image: fordF150,
    images: [fordF150],
    videos: [
      "https://ford-media.s3.amazonaws.com/videos/f150-capability-video.mp4"
    ],
    description: "America's best-selling truck for over 40 years. The Ford F-150 combines capability, technology, and comfort to handle any job. Whether for work or adventure, this truck is built Ford tough and ready for anything.",
    specifications: {
      engine: "3.5L EcoBoost V6",
      transmission: "10-Speed Automatic",
      exteriorColor: "Agate Black Metallic",
      interiorColor: "Black ActiveX",
      vin: "1FTFW1E84NFC12345",
      features: [
        "SYNC 4 Infotainment",
        "Pro Trailer Backup Assist",
        "Intelligent 4WD",
        "LED Box Lighting",
        "FordPass Connect",
        "Power Tailgate"
      ]
    }
  },
  {
    id: "4",
    make: "Audi",
    model: "Q7",
    year: 2021,
    price: 48000,
    condition: "used",
    fuelType: "diesel",
    transmission: "automatic",
    isHybrid: false,
    mileage: 35000,
    image: audiQ7,
    images: [audiQ7],
    videos: [
      "https://audi-content.s3.amazonaws.com/videos/q7-luxury-video.mp4"
    ],
    description: "The Audi Q7 represents the pinnacle of luxury SUV design. With its spacious interior, advanced technology features, and efficient diesel engine, it's perfect for families who demand both luxury and practicality.",
    specifications: {
      engine: "3.0L TDI V6",
      transmission: "8-Speed Tiptronic",
      exteriorColor: "Navarra Blue Metallic",
      interiorColor: "Cognac Brown Leather",
      vin: "WA1VAAF77LD123456",
      features: [
        "Virtual Cockpit Plus",
        "Quattro All-Wheel Drive",
        "Bang & Olufsen Sound",
        "Panoramic Sunroof",
        "Air Suspension",
        "Third Row Seating"
      ]
    }
  }
];

export const featuredCars = cars.slice(0, 3);