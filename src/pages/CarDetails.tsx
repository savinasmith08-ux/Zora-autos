import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FuelBadge, ConditionBadge } from "@/components/ui/badge-variant";
import { Car3D } from "@/components/Car3D";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ImageGallery } from "@/components/ImageGallery";
import { useCar } from "@/hooks/useCars";
import { Phone, Mail, ArrowLeft, Car, Calendar, Gauge, Palette, Settings, Play, Loader2, Images, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function CarDetails() {
  const { id } = useParams();
  const { toast } = useToast();
  const { data: car, isLoading } = useCar(id || "");
  const navigate = useNavigate();
  const [showContactForm, setShowContactForm] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!car) {
    return <Navigate to="/cars" replace />;
  }

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

  const startChat = async () => {
    if (!car) return;
    setStartingChat(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate(`/auth?redirect=/cars/${car.id}`);
        return;
      }
      const { data: existing } = await supabase
        .from("inquiry_threads")
        .select("id")
        .eq("user_id", user.id)
        .eq("car_id", car.id)
        .maybeSingle();
      let threadId = existing?.id;
      if (!threadId) {
        const { data: created, error } = await supabase
          .from("inquiry_threads")
          .insert({ user_id: user.id, car_id: car.id })
          .select("id")
          .single();
        if (error) throw error;
        threadId = created.id;
        await supabase.from("inquiry_messages").insert({
          thread_id: threadId,
          sender_id: user.id,
          body: `Hi, I'm interested in the ${car.year} ${car.make} ${car.model}. Is it still available?`,
          read_by_user: true,
        });
      }
      navigate(`/inquiries?thread=${threadId}`);
    } catch (err) {
      console.error("startChat error", err);
      toast({ title: "Could not start chat", description: "Please try again.", variant: "destructive" });
    } finally {
      setStartingChat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const getEdgeErrorMessage = async (err: unknown) => {
      const anyErr: any = err;
      const ctx = anyErr?.context;

      // Supabase FunctionsHttpError includes `context` with the fetch Response.
      if (ctx && typeof ctx?.json === "function") {
        try {
          const body = await ctx.json();
          if (body?.details) {
            return Array.isArray(body.details) ? body.details.join("\n") : String(body.details);
          }
          if (body?.error) return String(body.error);
        } catch {
          // ignore
        }
      }

      return anyErr?.message ? String(anyErr.message) : "Something went wrong. Please try again or call us directly.";
    };

    try {
      const message = (formData.message || "").trim();
      if (message.length < 10) {
        toast({
          title: "Message too short",
          description: "Please write at least 10 characters so we can help you properly.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('contact', {
        body: {
          ...formData,
          message,
          subject: `Vehicle Inquiry: ${car.year} ${car.make} ${car.model}`
        }
      });

      if (error) {
        const msg = await getEdgeErrorMessage(error);
        console.error('Vehicle inquiry error:', error);
        toast({
          title: "Error Sending Message",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      if (data && data.success === false) {
        toast({
          title: "Error Sending Message",
          description: data.error || "Something went wrong. Please try again or call us directly.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Inquiry Sent Successfully!",
        description: "We'll contact you within 24 hours regarding this vehicle.",
      });
      setFormData({ name: "", email: "", phone: "", message: "" });
      setShowContactForm(false);
    } catch (error) {
      const msg = await getEdgeErrorMessage(error);
      console.error('Unexpected inquiry error:', error);
      toast({
        title: "Error Sending Message",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link to="/cars">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Images className="h-5 w-5" />
                Photo Gallery ({[car.image, ...(car.images || [])].filter(Boolean).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <ImageGallery 
                  images={[car.image, ...(car.images || [])].filter(Boolean)} 
                  alt={`${car.year} ${car.make} ${car.model}`}
                />
                <div className="absolute top-4 left-4 flex gap-2 z-10">
                  <ConditionBadge condition={car.condition} />
                  <FuelBadge fuelType={car.fuelType} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3D Model Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                3D Interactive Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-secondary/20 to-accent/10 rounded-lg p-4">
                <Car3D 
                  height={350} 
                  carColor={car.specifications.exteriorColor.toLowerCase().includes('red') ? '#dc2626' : 
                           car.specifications.exteriorColor.toLowerCase().includes('blue') ? '#2563eb' :
                           car.specifications.exteriorColor.toLowerCase().includes('white') ? '#f8fafc' : '#1f2937'} 
                  autoRotate={true} 
                />
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Click and drag to rotate • Scroll to zoom
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Video Section */}
          {car.videos && car.videos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Vehicle Videos ({car.videos.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {car.videos.map((videoUrl, index) => (
                  <div key={index} className="space-y-2">
                    <VideoPlayer 
                      src={videoUrl} 
                      poster={car.image}
                      className="w-full h-[300px] rounded-lg"
                    />
                    <p className="text-center text-sm text-muted-foreground">
                      Video {index + 1} of {car.videos!.length}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Title and Key Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {car.condition === "used" ? "Used" : "New"} {car.year} {car.make} {car.model}
              </h1>
              <p className="text-3xl font-bold text-primary">
                {formatPrice(car.price)}
              </p>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Year</p>
                  <p className="font-semibold">{car.year}</p>
                </div>
              </div>

              {car.condition === "used" && car.mileage && (
                <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                  <Gauge className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Mileage</p>
                    <p className="font-semibold">{formatMileage(car.mileage)} mi</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                <Car className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Condition</p>
                  <p className="font-semibold capitalize">{car.condition}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                <Settings className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Fuel Type</p>
                  <p className="font-semibold capitalize">
                    {car.fuelType === "electric" ? "Electric" : car.fuelType}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {car.description}
              </p>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Engine</span>
                    <span className="font-medium">{car.specifications.engine}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Transmission</span>
                    <span className="font-medium">{car.specifications.transmission}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Exterior Color</span>
                    <span className="font-medium">{car.specifications.exteriorColor}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Interior Color</span>
                    <span className="font-medium">{car.specifications.interiorColor}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">VIN</span>
                    <span className="font-medium text-sm">{car.specifications.vin}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {car.specifications.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Card */}
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Interested in this vehicle?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(car.price)}
                </div>
                
                {!showContactForm ? (
                  <div className="space-y-3">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={startChat}
                      disabled={startingChat}
                    >
                      {startingChat ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4 mr-2" />
                      )}
                      Message Seller (Live Chat)
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      size="lg"
                      onClick={() => setShowContactForm(true)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Inquiry by Email
                    </Button>

                    <Button variant="outline" className="w-full" size="lg" asChild>
                      <a href="tel:+15551234567">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Dealer +1 (555) 123-4567
                      </a>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder={`I'm interested in the ${car.year} ${car.make} ${car.model}...`}
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        rows={3}
                        required
                        minLength={10}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Inquiry"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowContactForm(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stock ID</span>
                <span>{car.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VIN</span>
                <span className="text-xs">{car.specifications.vin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Body Type</span>
                <span>
                  {car.model.toLowerCase().includes('f-150') ? 'Pickup Truck' :
                   car.model.toLowerCase().includes('q7') ? 'SUV' : 'Sedan'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}