import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatedSection } from "@/components/AnimatedSection";

export function ContactSuccess() {
  return (
    <div className="container mx-auto px-4 py-16 min-h-[60vh] flex items-center justify-center">
      <AnimatedSection variant="zoom-in" duration={500}>
        <Card className="max-w-lg mx-auto text-center border-none shadow-2xl">
          <CardContent className="pt-10 pb-8 px-8 space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Message Sent!</h1>
              <p className="text-muted-foreground text-lg">
                Thank you for reaching out. Our team will get back to you within 24 hours.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button asChild variant="outline" size="lg">
                <Link to="/contact">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Send Another
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>
  );
}
