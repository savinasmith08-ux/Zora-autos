import { CheckCircle, X } from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";

const features = [
  "Certified Vehicle Inspections",
  "Transparent Pricing",
  "Flexible Financing Options",
  "7-Day Money Back Guarantee",
  "Free Vehicle History Report",
  "24/7 Customer Support",
  "Home Delivery Available",
  "Extended Warranty Options",
];

const competitors = [
  { name: "Zora Autos", values: [true, true, true, true, true, true, true, true] },
  { name: "Traditional Dealers", values: [false, false, true, false, false, false, false, true] },
  { name: "Private Sellers", values: [false, false, false, false, false, false, false, false] },
];

export function WhyChooseUs() {
  return (
    <section className="container mx-auto px-4">
      <AnimatedSection variant="fade-up">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Why Choose Us</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how Zora Autos compares to other car buying options
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection variant="fade-up" delay={150}>
        <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                  {competitors.map((c) => (
                    <th
                      key={c.name}
                      className={`p-4 text-center font-semibold ${
                        c.name === "Zora Autos" ? "text-primary bg-primary/5" : "text-muted-foreground"
                      }`}
                    >
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, i) => (
                  <tr key={feature} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium text-foreground">{feature}</td>
                    {competitors.map((c) => (
                      <td
                        key={c.name}
                        className={`p-4 text-center ${c.name === "Zora Autos" ? "bg-primary/5" : ""}`}
                      >
                        {c.values[i] ? (
                          <CheckCircle className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-destructive/50 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y">
            {features.map((feature) => (
              <div key={feature} className="p-4 space-y-2">
                <p className="font-medium text-foreground text-sm">{feature}</p>
                <div className="flex gap-4">
                  {competitors.map((c, ci) => (
                    <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {c.values[features.indexOf(feature)] ? (
                        <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-destructive/50 shrink-0" />
                      )}
                      <span className={ci === 0 ? "font-semibold text-primary" : ""}>{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
