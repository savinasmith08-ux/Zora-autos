import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Car, LayoutDashboard, Upload, X, Loader2, Video, FileText, CheckCircle, XCircle, Clock, Eye, ImageIcon, ChevronLeft, ChevronRight, ZoomIn, Filter, CalendarIcon, Search, Download } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CarFormData {
  make: string;
  model: string;
  year: number;
  price: number;
  condition: "new" | "used";
  fuel_type: "electric" | "petrol" | "diesel";
  mileage?: number;
  image_url: string;
  images: string[];
  videos: string[];
  description: string;
  engine: string;
  transmission: "automatic" | "manual";
  exterior_color: string;
  interior_color: string;
  vin: string;
  features: string[];
  is_featured: boolean;
  is_hybrid: boolean;
}

const defaultFormData: CarFormData = {
  make: "",
  model: "",
  year: new Date().getFullYear(),
  price: 0,
  condition: "new",
  fuel_type: "petrol",
  mileage: undefined,
  image_url: "",
  images: [],
  videos: [],
  description: "",
  engine: "",
  transmission: "automatic",
  exterior_color: "",
  interior_color: "",
  vin: "",
  features: [],
  is_featured: false,
  is_hybrid: false,
};

interface SubmissionData {
  id: string;
  make: string;
  model: string;
  year: number;
  asking_price: number;
  condition: string;
  fuel_type: string;
  transmission: string;
  is_hybrid: boolean | null;
  mileage: number | null;
  images: string[] | null;
  description: string | null;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
}

export const AdminDashboard = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<string | null>(null);
  const [formData, setFormData] = useState<CarFormData>(defaultFormData);
  const [featuresInput, setFeaturesInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isUploadingVideos, setIsUploadingVideos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Confirmation dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "approve" | "reject" | "delete";
    submissionId: string | null;
  }>({ open: false, type: "approve", submissionId: null });

  // Edit submission before approval states
  const [editSubmissionDialog, setEditSubmissionDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionData | null>(null);
  const [editedSubmissionData, setEditedSubmissionData] = useState<{
    engine: string;
    exterior_color: string;
    interior_color: string;
    vin: string;
    features: string;
    is_featured: boolean;
    description: string;
  }>({
    engine: "",
    exterior_color: "",
    interior_color: "",
    vin: "",
    features: "",
    is_featured: false,
    description: "",
  });

  // View images dialog state
  const [viewImagesDialog, setViewImagesDialog] = useState<{
    open: boolean;
    images: string[];
    title: string;
  }>({ open: false, images: [], title: "" });

  // Lightbox state for zooming images
  const [lightbox, setLightbox] = useState<{
    open: boolean;
    images: string[];
    currentIndex: number;
  }>({ open: false, images: [], currentIndex: 0 });

  // Bulk selection state
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [bulkConfirmDialog, setBulkConfirmDialog] = useState<{
    open: boolean;
    type: "approve" | "reject";
  }>({ open: false, type: "approve" });

  // Filter and search state for submissions
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('car-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData({ ...formData, image_url: url });
      toast({ title: "Image uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Error uploading image", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingGallery(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file));
      const urls = await Promise.all(uploadPromises);
      setFormData({ ...formData, images: [...formData.images, ...urls] });
      toast({ title: `${urls.length} image(s) uploaded successfully` });
    } catch (error: any) {
      toast({ title: "Error uploading images", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const uploadVideo = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `videos/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('car-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('car-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingVideos(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadVideo(file));
      const urls = await Promise.all(uploadPromises);
      setFormData({ ...formData, videos: [...formData.videos, ...urls] });
      toast({ title: `${urls.length} video(s) uploaded successfully` });
    } catch (error: any) {
      toast({ title: "Error uploading videos", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingVideos(false);
    }
  };

  const removeVideo = (index: number) => {
    const newVideos = formData.videos.filter((_, i) => i !== index);
    setFormData({ ...formData, videos: newVideos });
  };

  const { data: cars, isLoading } = useQuery({
    queryKey: ["admin-cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ["admin-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      additionalData 
    }: { 
      id: string; 
      status: "approved" | "rejected";
      additionalData?: {
        engine: string;
        exterior_color: string;
        interior_color: string;
        vin: string;
        features: string[];
        is_featured: boolean;
        description: string;
      };
    }) => {
      const { data, error } = await supabase.functions.invoke("submission-status", {
        body: {
          submissionId: id,
          newStatus: status,
          convertToListing: status === "approved",
          additionalData,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-cars"] });
      setConfirmDialog({ open: false, type: "approve", submissionId: null });
      setEditSubmissionDialog(false);
      setSelectedSubmission(null);
      if (variables.status === "approved") {
        toast({ 
          title: "Submission approved", 
          description: data?.carListingId 
            ? "Car has been added to listings and user notified via email." 
            : "User has been notified via email."
        });
      } else {
        toast({ title: "Submission rejected", description: "User has been notified via email." });
      }
    },
    onError: (error) => {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    },
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("car_submissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-submissions"] });
      setConfirmDialog({ open: false, type: "approve", submissionId: null });
      toast({ title: "Submission deleted" });
    },
    onError: (error) => {
      toast({ title: "Error deleting submission", description: error.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CarFormData) => {
      const { error } = await supabase.from("cars").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cars"] });
      toast({ title: "Car added successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error adding car", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CarFormData }) => {
      const { error } = await supabase.from("cars").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cars"] });
      toast({ title: "Car updated successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error updating car", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cars").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cars"] });
      toast({ title: "Car deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting car", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setFeaturesInput("");
    setEditingCar(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (car: any) => {
    setFormData({
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
      condition: car.condition,
      fuel_type: car.fuel_type,
      mileage: car.mileage,
      image_url: car.image_url,
      images: car.images || [],
      videos: car.videos || [],
      description: car.description,
      engine: car.engine,
      transmission: car.transmission || "automatic",
      exterior_color: car.exterior_color,
      interior_color: car.interior_color,
      vin: car.vin,
      features: car.features || [],
      is_featured: car.is_featured,
      is_hybrid: car.is_hybrid || false,
    });
    setFeaturesInput((car.features || []).join(", "));
    setEditingCar(car.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const features = featuresInput.split(",").map((f) => f.trim()).filter(Boolean);
    const submitData = { ...formData, features };

    if (editingCar) {
      updateMutation.mutate({ id: editingCar, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  // Handler for opening edit submission dialog
  const handleEditSubmission = (submission: SubmissionData) => {
    setSelectedSubmission(submission);
    setEditedSubmissionData({
      engine: "",
      exterior_color: "",
      interior_color: "",
      vin: `VIN-${submission.id.substring(0, 8).toUpperCase()}`,
      features: "",
      is_featured: false,
      description: submission.description || `${submission.year} ${submission.make} ${submission.model}`,
    });
    setEditSubmissionDialog(true);
  };

  // Handler for approving with edits
  const handleApproveWithEdits = () => {
    if (!selectedSubmission) return;
    
    const features = editedSubmissionData.features.split(",").map((f) => f.trim()).filter(Boolean);
    
    updateSubmissionMutation.mutate({
      id: selectedSubmission.id,
      status: "approved",
      additionalData: {
        engine: editedSubmissionData.engine || "To be updated",
        exterior_color: editedSubmissionData.exterior_color || "To be updated",
        interior_color: editedSubmissionData.interior_color || "To be updated",
        vin: editedSubmissionData.vin,
        features,
        is_featured: editedSubmissionData.is_featured,
        description: editedSubmissionData.description,
      },
    });
  };

  // Handler for confirmation actions
  const handleConfirmAction = () => {
    if (!confirmDialog.submissionId) return;
    
    if (confirmDialog.type === "approve") {
      // Open edit dialog for approval
      const submission = submissions?.find(s => s.id === confirmDialog.submissionId);
      if (submission) {
        handleEditSubmission(submission as SubmissionData);
      }
      setConfirmDialog({ open: false, type: "approve", submissionId: null });
    } else if (confirmDialog.type === "reject") {
      updateSubmissionMutation.mutate({ id: confirmDialog.submissionId, status: "rejected" });
    } else if (confirmDialog.type === "delete") {
      deleteSubmissionMutation.mutate(confirmDialog.submissionId);
    }
  };

  // Bulk action mutations
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: "approved" | "rejected" }) => {
      const results = await Promise.allSettled(
        ids.map(id => 
          supabase.functions.invoke("submission-status", {
            body: {
              submissionId: id,
              newStatus: status,
              convertToListing: status === "approved",
            },
          })
        )
      );
      const failures = results.filter(r => r.status === "rejected");
      if (failures.length > 0) {
        throw new Error(`${failures.length} of ${ids.length} operations failed`);
      }
      return results;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-cars"] });
      setSelectedSubmissions(new Set());
      setBulkConfirmDialog({ open: false, type: "approve" });
      toast({ 
        title: `Bulk ${variables.status === "approved" ? "approval" : "rejection"} complete`, 
        description: `${variables.ids.length} submission(s) ${variables.status}. Users have been notified.`
      });
    },
    onError: (error) => {
      toast({ title: "Bulk operation partially failed", description: error.message, variant: "destructive" });
    },
  });

  // Handle bulk action confirmation
  const handleBulkConfirmAction = () => {
    const ids = Array.from(selectedSubmissions);
    bulkUpdateMutation.mutate({ ids, status: bulkConfirmDialog.type === "approve" ? "approved" : "rejected" });
  };

  // Toggle submission selection
  const toggleSubmissionSelection = (id: string) => {
    setSelectedSubmissions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle all pending submissions
  const toggleAllPending = () => {
    const pendingIds = submissions?.filter(s => s.status === 'pending').map(s => s.id) || [];
    const allSelected = pendingIds.every(id => selectedSubmissions.has(id));
    if (allSelected) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(pendingIds));
    }
  };

  // Lightbox navigation
  const openLightbox = (images: string[], index: number) => {
    setLightbox({ open: true, images, currentIndex: index });
  };

  const nextImage = () => {
    setLightbox(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length
    }));
  };

  const prevImage = () => {
    setLightbox(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
    }));
  };

  // Filter submissions based on status, date range, and search query
  const filteredSubmissions = submissions?.filter(submission => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const searchableFields = [
        submission.name,
        submission.email,
        submission.make,
        submission.model,
        `${submission.year}`,
        `${submission.make} ${submission.model}`,
        `${submission.year} ${submission.make} ${submission.model}`,
      ].map(f => f?.toLowerCase() || '');
      
      if (!searchableFields.some(field => field.includes(query))) {
        return false;
      }
    }
    
    // Status filter
    if (statusFilter !== "all" && submission.status !== statusFilter) {
      return false;
    }
    
    // Date range filter
    const submissionDate = new Date(submission.created_at);
    if (dateFrom && submissionDate < dateFrom) {
      return false;
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      if (submissionDate > endOfDay) {
        return false;
      }
    }
    
    return true;
  });

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchQuery("");
  };

  const hasActiveFilters = statusFilter !== "all" || dateFrom || dateTo || searchQuery.trim();

  // Export submissions to CSV
  const exportToCSV = () => {
    const dataToExport = filteredSubmissions || [];
    if (dataToExport.length === 0) {
      toast({ title: "No data to export", description: "There are no submissions matching your filters.", variant: "destructive" });
      return;
    }

    const headers = [
      "ID",
      "Submitted Date",
      "Name",
      "Email",
      "Phone",
      "Make",
      "Model",
      "Year",
      "Asking Price",
      "Condition",
      "Fuel Type",
      "Transmission",
      "Hybrid",
      "Mileage",
      "Status",
      "Description"
    ];

    const csvRows = [
      headers.join(","),
      ...dataToExport.map(submission => [
        submission.id,
        new Date(submission.created_at).toLocaleDateString(),
        `"${submission.name.replace(/"/g, '""')}"`,
        submission.email,
        submission.phone || "",
        submission.make,
        submission.model,
        submission.year,
        submission.asking_price,
        submission.condition,
        submission.fuel_type,
        submission.transmission,
        submission.is_hybrid ? "Yes" : "No",
        submission.mileage || "",
        submission.status,
        `"${(submission.description || "").replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ].join(","))
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `submissions_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: "Export successful", description: `${dataToExport.length} submission(s) exported to CSV.` });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        <Tabs defaultValue="cars" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cars" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Car Listings
            </TabsTrigger>
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Submissions
              {submissions && submissions.filter(s => s.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {submissions.filter(s => s.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Car Listings Tab */}
          <TabsContent value="cars">
            <div className="flex justify-end mb-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Car
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingCar ? "Edit Car" : "Add New Car"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="make">Make</Label>
                        <Input
                          id="make"
                          value={formData.make}
                          onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="model">Model</Label>
                        <Input
                          id="model"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="year">Year</Label>
                        <Input
                          id="year"
                          type="number"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="price">Price ($)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="mileage">Mileage</Label>
                        <Input
                          id="mileage"
                          type="number"
                          value={formData.mileage || ""}
                          onChange={(e) => setFormData({ ...formData, mileage: e.target.value ? parseInt(e.target.value) : undefined })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Condition</Label>
                        <Select
                          value={formData.condition}
                          onValueChange={(value: "new" | "used") => setFormData({ ...formData, condition: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="used">Used</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Fuel Type</Label>
                        <Select
                          value={formData.fuel_type}
                          onValueChange={(value: "electric" | "petrol" | "diesel") => setFormData({ ...formData, fuel_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="electric">Electric</SelectItem>
                            <SelectItem value="petrol">Petrol</SelectItem>
                            <SelectItem value="diesel">Diesel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Main Image</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          placeholder="Enter URL or upload image"
                          className="flex-1"
                        />
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleMainImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </Button>
                      </div>
                      {formData.image_url && (
                        <div className="relative w-32 h-24 rounded-md overflow-hidden border">
                          <img src={formData.image_url} alt="Main" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, image_url: "" })}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label>Gallery Images</Label>
                      <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*" multiple className="hidden" />
                      <Button type="button" variant="outline" onClick={() => galleryInputRef.current?.click()} disabled={isUploadingGallery} className="w-full">
                        {isUploadingGallery ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />Upload Gallery Images</>}
                      </Button>
                      {formData.images.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.images.map((url, index) => (
                            <div key={index} className="relative w-20 h-16 rounded-md overflow-hidden border">
                              <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeGalleryImage(index)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label>Videos</Label>
                      <input type="file" ref={videoInputRef} onChange={handleVideoUpload} accept="video/*" multiple className="hidden" />
                      <Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()} disabled={isUploadingVideos} className="w-full">
                        {isUploadingVideos ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading Videos...</> : <><Video className="h-4 w-4 mr-2" />Upload Videos</>}
                      </Button>
                      {formData.videos.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.videos.map((url, index) => (
                            <div key={index} className="relative w-32 h-20 rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                              <video src={url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Video className="h-6 w-6 text-white" />
                              </div>
                              <button type="button" onClick={() => removeVideo(index)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="engine">Engine</Label>
                        <Input id="engine" value={formData.engine} onChange={(e) => setFormData({ ...formData, engine: e.target.value })} required />
                      </div>
                      <div>
                        <Label>Transmission</Label>
                        <Select value={formData.transmission} onValueChange={(value: "automatic" | "manual") => setFormData({ ...formData, transmission: value })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="automatic">Automatic</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="exterior_color">Exterior Color</Label>
                        <Input id="exterior_color" value={formData.exterior_color} onChange={(e) => setFormData({ ...formData, exterior_color: e.target.value })} required />
                      </div>
                      <div>
                        <Label htmlFor="interior_color">Interior Color</Label>
                        <Input id="interior_color" value={formData.interior_color} onChange={(e) => setFormData({ ...formData, interior_color: e.target.value })} required />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="vin">VIN</Label>
                      <Input id="vin" value={formData.vin} onChange={(e) => setFormData({ ...formData, vin: e.target.value })} required />
                    </div>

                    <div>
                      <Label htmlFor="features">Features (comma-separated)</Label>
                      <Textarea id="features" value={featuresInput} onChange={(e) => setFeaturesInput(e.target.value)} placeholder="Feature 1, Feature 2, Feature 3" rows={2} />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox id="is_featured" checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked === true })} />
                        <Label htmlFor="is_featured">Featured Car</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="is_hybrid" checked={formData.is_hybrid} onCheckedChange={(checked) => setFormData({ ...formData, is_hybrid: checked === true })} />
                        <Label htmlFor="is_hybrid">Hybrid Vehicle</Label>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {editingCar ? "Update Car" : "Add Car"}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Car Listings ({cars?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : cars?.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No cars added yet. Click "Add New Car" to get started.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Make</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Featured</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cars?.map((car) => (
                        <TableRow key={car.id}>
                          <TableCell className="font-medium">{car.make}</TableCell>
                          <TableCell>{car.model}</TableCell>
                          <TableCell>{car.year}</TableCell>
                          <TableCell>${car.price.toLocaleString()}</TableCell>
                          <TableCell className="capitalize">{car.condition}</TableCell>
                          <TableCell>{car.is_featured ? "Yes" : "No"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(car)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(car.id)} disabled={deleteMutation.isPending}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            {/* Filters Section */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-end gap-4">
                  {/* Search Input */}
                  <div className="space-y-2 flex-1 min-w-[200px] max-w-[300px]">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Name, email, make, model..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={(value: "all" | "pending" | "approved" | "rejected") => setStatusFilter(value)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date From */}
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "PP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Date To */}
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "PP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                      <X className="h-4 w-4 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Car Submissions ({filteredSubmissions?.length || 0})
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2">
                      Filtered
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Export CSV Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToCSV}
                    disabled={!filteredSubmissions || filteredSubmissions.length === 0}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                  
                  {selectedSubmissions.size > 0 && (
                    <>
                      <span className="text-sm text-muted-foreground">{selectedSubmissions.size} selected</span>
                      <Button
                        size="sm"
                        onClick={() => setBulkConfirmDialog({ open: true, type: "approve" })}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={bulkUpdateMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBulkConfirmDialog({ open: true, type: "reject" })}
                        className="text-red-600 hover:text-red-700"
                        disabled={bulkUpdateMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject All
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSubmissions ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredSubmissions?.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    {hasActiveFilters ? "No submissions match the current filters." : "No submissions yet."}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={filteredSubmissions?.filter(s => s.status === 'pending').length > 0 && 
                              filteredSubmissions?.filter(s => s.status === 'pending').every(s => selectedSubmissions.has(s.id))}
                            onCheckedChange={toggleAllPending}
                          />
                        </TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Images</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions?.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSubmissions.has(submission.id)}
                              onCheckedChange={() => toggleSubmissionSelection(submission.id)}
                              disabled={submission.status !== 'pending'}
                            />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(submission.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {submission.images && submission.images.length > 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewImagesDialog({
                                  open: true,
                                  images: submission.images || [],
                                  title: `${submission.year} ${submission.make} ${submission.model}`
                                })}
                                className="flex items-center gap-1"
                              >
                                <ImageIcon className="h-4 w-4" />
                                <span>{submission.images.length}</span>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-sm">None</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{submission.name}</TableCell>
                          <TableCell>
                            {submission.year} {submission.make} {submission.model}
                          </TableCell>
                          <TableCell>${Number(submission.asking_price).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{submission.email}</p>
                              {submission.phone && <p className="text-muted-foreground">{submission.phone}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              submission.status === 'approved' ? 'default' :
                              submission.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {submission.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {submission.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {submission.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                              {submission.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {submission.status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setConfirmDialog({
                                      open: true,
                                      type: "approve",
                                      submissionId: submission.id
                                    })}
                                    disabled={updateSubmissionMutation.isPending}
                                    className="text-green-600 hover:text-green-700"
                                    title="Approve and add to listings"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setConfirmDialog({
                                      open: true,
                                      type: "reject",
                                      submissionId: submission.id
                                    })}
                                    disabled={updateSubmissionMutation.isPending}
                                    className="text-red-600 hover:text-red-700"
                                    title="Reject submission"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  type: "delete",
                                  submissionId: submission.id
                                })}
                                disabled={deleteSubmissionMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialog */}
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmDialog.type === "approve" && "Approve Submission?"}
                {confirmDialog.type === "reject" && "Reject Submission?"}
                {confirmDialog.type === "delete" && "Delete Submission?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDialog.type === "approve" && "You'll be able to edit car details before publishing to listings. The user will be notified via email."}
                {confirmDialog.type === "reject" && "This will reject the submission and notify the user via email. This action cannot be undone."}
                {confirmDialog.type === "delete" && "This will permanently delete the submission. This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmAction}
                className={
                  confirmDialog.type === "approve" ? "bg-green-600 hover:bg-green-700" :
                  confirmDialog.type === "reject" ? "bg-orange-600 hover:bg-orange-700" :
                  "bg-destructive hover:bg-destructive/90"
                }
              >
                {confirmDialog.type === "approve" && "Proceed to Edit"}
                {confirmDialog.type === "reject" && "Reject"}
                {confirmDialog.type === "delete" && "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Submission Before Approval Dialog */}
        <Dialog open={editSubmissionDialog} onOpenChange={setEditSubmissionDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Car Details Before Publishing</DialogTitle>
              <DialogDescription>
                Review and complete the car details before adding to listings.
              </DialogDescription>
            </DialogHeader>
            
            {selectedSubmission && (
              <div className="space-y-4">
                {/* Submission Info */}
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold">Submitted Vehicle</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><span className="text-muted-foreground">Vehicle:</span> {selectedSubmission.year} {selectedSubmission.make} {selectedSubmission.model}</p>
                    <p><span className="text-muted-foreground">Price:</span> ${Number(selectedSubmission.asking_price).toLocaleString()}</p>
                    <p><span className="text-muted-foreground">Condition:</span> {selectedSubmission.condition}</p>
                    <p><span className="text-muted-foreground">Fuel:</span> {selectedSubmission.fuel_type}</p>
                    <p><span className="text-muted-foreground">Transmission:</span> {selectedSubmission.transmission}</p>
                    <p><span className="text-muted-foreground">Mileage:</span> {selectedSubmission.mileage?.toLocaleString() || 'N/A'}</p>
                  </div>
                  
                  {/* Show submission images */}
                  {selectedSubmission.images && selectedSubmission.images.length > 0 && (
                    <div className="pt-2">
                      <p className="text-muted-foreground text-sm mb-2">Submitted Images:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSubmission.images.map((url, index) => (
                          <div key={index} className="relative w-20 h-16 rounded-md overflow-hidden border">
                            <img src={url} alt={`Submission ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Details Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editedSubmissionData.description}
                      onChange={(e) => setEditedSubmissionData({ ...editedSubmissionData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-engine">Engine</Label>
                      <Input
                        id="edit-engine"
                        value={editedSubmissionData.engine}
                        onChange={(e) => setEditedSubmissionData({ ...editedSubmissionData, engine: e.target.value })}
                        placeholder="e.g., 2.0L Turbo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-vin">VIN</Label>
                      <Input
                        id="edit-vin"
                        value={editedSubmissionData.vin}
                        onChange={(e) => setEditedSubmissionData({ ...editedSubmissionData, vin: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-exterior">Exterior Color</Label>
                      <Input
                        id="edit-exterior"
                        value={editedSubmissionData.exterior_color}
                        onChange={(e) => setEditedSubmissionData({ ...editedSubmissionData, exterior_color: e.target.value })}
                        placeholder="e.g., Pearl White"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-interior">Interior Color</Label>
                      <Input
                        id="edit-interior"
                        value={editedSubmissionData.interior_color}
                        onChange={(e) => setEditedSubmissionData({ ...editedSubmissionData, interior_color: e.target.value })}
                        placeholder="e.g., Black Leather"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-features">Features (comma-separated)</Label>
                    <Textarea
                      id="edit-features"
                      value={editedSubmissionData.features}
                      onChange={(e) => setEditedSubmissionData({ ...editedSubmissionData, features: e.target.value })}
                      placeholder="Navigation, Sunroof, Leather Seats"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit-featured"
                      checked={editedSubmissionData.is_featured}
                      onCheckedChange={(checked) => setEditedSubmissionData({ ...editedSubmissionData, is_featured: checked === true })}
                    />
                    <Label htmlFor="edit-featured">Feature this car on homepage</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditSubmissionDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleApproveWithEdits}
                    disabled={updateSubmissionMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updateSubmissionMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve & Publish
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Images Dialog with Lightbox */}
        <Dialog open={viewImagesDialog.open} onOpenChange={(open) => setViewImagesDialog({ ...viewImagesDialog, open })}>
          <DialogContent className="max-w-5xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Submission Images - {viewImagesDialog.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">{viewImagesDialog.images.length} image(s) submitted - Click to enlarge</p>
            </DialogHeader>
            <ScrollArea className="max-h-[75vh]">
              <div className="flex flex-col gap-6 p-2">
                {viewImagesDialog.images.map((url, index) => (
                  <div 
                    key={index} 
                    className="w-full rounded-lg overflow-hidden border bg-muted/30 group cursor-pointer relative"
                    onClick={() => openLightbox(viewImagesDialog.images, index)}
                  >
                    <img
                      src={url}
                      alt={`Submission image ${index + 1}`}
                      className="w-full h-auto object-contain max-h-[500px]"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ZoomIn className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-2 text-center text-sm text-muted-foreground border-t">
                      Image {index + 1} of {viewImagesDialog.images.length}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Lightbox for full-screen image viewing */}
        <Dialog open={lightbox.open} onOpenChange={(open) => setLightbox({ ...lightbox, open })}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
            <div className="relative w-full h-[90vh] flex items-center justify-center">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                onClick={() => setLightbox({ ...lightbox, open: false })}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Previous button */}
              {lightbox.images.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}

              {/* Image */}
              <img
                src={lightbox.images[lightbox.currentIndex]}
                alt={`Image ${lightbox.currentIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain"
              />

              {/* Next button */}
              {lightbox.images.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                {lightbox.currentIndex + 1} / {lightbox.images.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Action Confirmation Dialog */}
        <AlertDialog open={bulkConfirmDialog.open} onOpenChange={(open) => setBulkConfirmDialog({ ...bulkConfirmDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {bulkConfirmDialog.type === "approve" ? "Approve Multiple Submissions?" : "Reject Multiple Submissions?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {bulkConfirmDialog.type === "approve" 
                  ? `This will approve ${selectedSubmissions.size} submission(s) and add them to listings. Note: Bulk approval uses default values for additional details (engine, colors, etc.). All users will be notified via email.`
                  : `This will reject ${selectedSubmissions.size} submission(s). All users will be notified via email. This action cannot be undone.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleBulkConfirmAction}
                disabled={bulkUpdateMutation.isPending}
                className={
                  bulkConfirmDialog.type === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"
                }
              >
                {bulkUpdateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {bulkConfirmDialog.type === "approve" ? <CheckCircle className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                    {bulkConfirmDialog.type === "approve" ? `Approve ${selectedSubmissions.size}` : `Reject ${selectedSubmissions.size}`}
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};