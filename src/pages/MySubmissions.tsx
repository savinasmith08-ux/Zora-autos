import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle, Car } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface CarSubmission {
  id: string;
  make: string;
  model: string;
  year: number;
  asking_price: number;
  status: string;
  condition: string;
  fuel_type: string;
  transmission: string;
  is_hybrid: boolean;
  mileage: number | null;
  description: string | null;
  images: string[];
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending: { label: "Pending Review", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Approved", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: "Rejected", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

export const MySubmissions = () => {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("car_submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CarSubmission[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">My Submissions</h1>
          </div>
          <p className="text-muted-foreground">Track the status of your car listings</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : submissions?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Car className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Submissions Yet</h3>
                <p className="text-muted-foreground mb-6 text-center">
                  You haven't submitted any cars for sale yet. Start selling your car today!
                </p>
                <Button asChild>
                  <Link to="/sell">Sell Your Car</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {submissions?.map((submission) => {
                const status = statusConfig[submission.status] || statusConfig.pending;
                return (
                  <Card key={submission.id} className="overflow-hidden">
                    {submission.images?.[0] && (
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={submission.images[0]}
                          alt={`${submission.make} ${submission.model}`}
                          className="w-full h-full object-cover"
                        />
                        <Badge 
                          variant={status.variant} 
                          className="absolute top-3 right-3 flex items-center gap-1"
                        >
                          {status.icon}
                          {status.label}
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{submission.year} {submission.make} {submission.model}</span>
                        {!submission.images?.[0] && (
                          <Badge 
                            variant={status.variant} 
                            className="flex items-center gap-1"
                          >
                            {status.icon}
                            {status.label}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-primary">
                            ${submission.asking_price.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span className="capitalize">{submission.condition}</span>
                          <span>•</span>
                          <span className="capitalize">{submission.fuel_type}</span>
                          <span>•</span>
                          <span className="capitalize">{submission.transmission}</span>
                          {submission.is_hybrid && (
                            <>
                              <span>•</span>
                              <span className="text-green-600">Hybrid</span>
                            </>
                          )}
                        </div>
                        {submission.mileage && (
                          <p className="text-sm text-muted-foreground">
                            {submission.mileage.toLocaleString()} miles
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Submitted on {new Date(submission.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
