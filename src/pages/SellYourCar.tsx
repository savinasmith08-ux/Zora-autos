import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Car, Upload, X, Loader2, CheckCircle, DollarSign, FileText, Phone, User, LogIn } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { AnimatedSection } from "@/components/AnimatedSection";

interface SellCarFormData {
  name: string;
  email: string;
  phone: string;
  make: string;
  model: string;
  year: number;
  mileage: number | undefined;
  condition: "new" | "used";
  fuel_type: "electric" | "petrol" | "diesel";
  transmission: "automatic" | "manual";
  is_hybrid: boolean;
  asking_price: number;
  description: string;
  images: string[];
}

const defaultFormData: SellCarFormData = {
  name: "",
  email: "",
  phone: "",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  mileage: undefined,
  condition: "used",
  fuel_type: "petrol",
  transmission: "automatic",
  is_hybrid: false,
  asking_price: 0,
  description: "",
  images: [],
};

export const SellYourCar = () => {
  const [formData, setFormData] = useState<SellCarFormData>(defaultFormData);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const uploadImage = async (file: File): Promise<string> => {
    if (!user) {
      throw new Error("Please sign in before uploading images.");
    }
    const fileExt = file.name.split('.').pop();
    const fileName = `submissions/${crypto.randomUUID()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('car-images').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('car-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file));
      const urls = await Promise.all(uploadPromises);
      setFormData({ ...formData, images: [...formData.images, ...urls] });
      toast({ title: `${urls.length} image(s) uploaded successfully` });
    } catch (error: any) {
      toast({ title: "Error uploading images", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const submitMutation = useMutation({
    mutationFn: async (data: SellCarFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Please sign in before submitting your car.");
      }
      const { error } = await supabase.from("car_submissions").insert([{
        user_id: user.id, name: data.name, email: data.email, phone: data.phone || null,
        make: data.make, model: data.model, year: data.year, mileage: data.mileage || null,
        condition: data.condition, fuel_type: data.fuel_type, transmission: data.transmission,
        is_hybrid: data.is_hybrid, asking_price: data.asking_price, description: data.description || null, images: data.images,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({ title: "Submission received!", description: "We'll review your car and get back to you soon." });
    },
    onError: (error) => {
      toast({ title: "Error submitting", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <AnimatedSection variant="zoom-in" duration={500}>
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-10 pb-10">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Submission Received!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for submitting your car. Our team will review your listing and contact you within 24-48 hours.
              </p>
              <Button onClick={() => { setIsSubmitted(false); setFormData(defaultFormData); }}>
                Submit Another Car
              </Button>
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
        {/* Login Prompt Banner */}
        {!user && (
          <AnimatedSection variant="fade-down" duration={500}>
            <div className="bg-primary/5 border-b border-primary/20">
              <div className="max-w-4xl mx-auto px-4 py-4">
                <Alert className="bg-primary/10 border-primary/30">
                  <User className="h-5 w-5 text-primary" />
                  <AlertTitle className="text-primary font-semibold">Create an Account for a Better Experience</AlertTitle>
                  <AlertDescription className="text-foreground/80">
                    <p className="mb-3">
                      Sign up to track your submission status, get faster responses, and manage all your listings in one place.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild size="sm"><Link to="/auth"><User className="h-4 w-4 mr-2" />Create Account</Link></Button>
                      <Button variant="outline" size="sm" asChild><Link to="/auth"><LogIn className="h-4 w-4 mr-2" />Sign In</Link></Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <AnimatedSection variant="zoom-in" duration={600}>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                <Car className="h-5 w-5" />
                <span className="font-medium">Sell Your Car</span>
              </div>
            </AnimatedSection>
            <AnimatedSection variant="fade-up" delay={100} duration={600}>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Get the Best Price for Your Car
              </h1>
            </AnimatedSection>
            <AnimatedSection variant="fade-up" delay={200} duration={600}>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                List your car with us and reach thousands of potential buyers. Our simple process makes selling your car easy and hassle-free.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 px-4 border-b">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: DollarSign, title: "Best Market Price", desc: "We help you get the best value for your vehicle based on current market trends." },
                { icon: FileText, title: "Simple Process", desc: "Fill out the form below and our team will handle the rest." },
                { icon: Phone, title: "Quick Response", desc: "Expect a call from us within 24-48 hours of your submission." },
              ].map((item, i) => (
                <AnimatedSection key={item.title} variant="fade-up" delay={i * 150} duration={500}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection variant="blur-in" delay={100} duration={700}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    Car Details
                  </CardTitle>
                  <CardDescription>
                    Please provide accurate information about your vehicle to help us give you the best offer.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground border-b pb-2">Contact Information</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" required />
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" required />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground border-b pb-2">Vehicle Information</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="make">Make *</Label>
                          <Input id="make" value={formData.make} onChange={(e) => setFormData({ ...formData, make: e.target.value })} placeholder="e.g., Toyota" required />
                        </div>
                        <div>
                          <Label htmlFor="model">Model *</Label>
                          <Input id="model" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} placeholder="e.g., Camry" required />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="year">Year *</Label>
                          <Input id="year" type="number" min="1900" max={new Date().getFullYear() + 1} value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} required />
                        </div>
                        <div>
                          <Label htmlFor="mileage">Mileage</Label>
                          <Input id="mileage" type="number" value={formData.mileage || ""} onChange={(e) => setFormData({ ...formData, mileage: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="e.g., 50000" />
                        </div>
                        <div>
                          <Label htmlFor="asking_price">Asking Price ($) *</Label>
                          <Input id="asking_price" type="number" min="0" value={formData.asking_price || ""} onChange={(e) => setFormData({ ...formData, asking_price: parseFloat(e.target.value) || 0 })} placeholder="e.g., 25000" required />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Condition *</Label>
                          <Select value={formData.condition} onValueChange={(value: "new" | "used") => setFormData({ ...formData, condition: value })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="used">Used</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Fuel Type *</Label>
                          <Select value={formData.fuel_type} onValueChange={(value: "electric" | "petrol" | "diesel") => setFormData({ ...formData, fuel_type: value })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="electric">Electric</SelectItem>
                              <SelectItem value="petrol">Petrol</SelectItem>
                              <SelectItem value="diesel">Diesel</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Transmission *</Label>
                          <Select value={formData.transmission} onValueChange={(value: "automatic" | "manual") => setFormData({ ...formData, transmission: value })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="automatic">Automatic</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end pb-2">
                          <div className="flex items-center gap-2">
                            <Checkbox id="is_hybrid" checked={formData.is_hybrid} onCheckedChange={(checked) => setFormData({ ...formData, is_hybrid: checked === true })} />
                            <Label htmlFor="is_hybrid" className="cursor-pointer">Hybrid Vehicle</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground border-b pb-2">Additional Details</h3>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your car's condition, features, service history, etc." rows={4} />
                      </div>
                    </div>

                    {/* Images */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground border-b pb-2">Photos</h3>
                      <div>
                        <Label>Upload Car Images</Label>
                        <p className="text-sm text-muted-foreground mb-3">Add clear photos of your car from different angles to attract more buyers.</p>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading || !user} className="w-full border-dashed">
                          {isUploading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>) : (<><Upload className="h-4 w-4 mr-2" />Upload Images</>)}
                        </Button>
                      </div>
                      {formData.images.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {formData.images.map((url, index) => (
                            <div key={index} className="relative w-24 h-20 rounded-lg overflow-hidden border bg-muted">
                              <img src={url} alt={`Car ${index + 1}`} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit */}
                    <div className="pt-4">
                      <Button type="submit" size="lg" className="w-full" disabled={submitMutation.isPending || !user}>
                        {submitMutation.isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>) : "Submit Your Car"}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-3">By submitting, you agree to our terms and conditions.</p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </section>
      </div>
  );
};
