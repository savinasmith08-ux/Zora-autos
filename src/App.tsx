import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { PageTransition } from "@/components/PageTransition";
import { Layout } from "@/components/layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";


// Lazy load route components for code splitting
const Home = lazy(() => import("@/pages/Home").then(m => ({ default: m.Home })));
const CarListings = lazy(() => import("@/pages/CarListings").then(m => ({ default: m.CarListings })));
const CarDetails = lazy(() => import("@/pages/CarDetails").then(m => ({ default: m.CarDetails })));
const Contact = lazy(() => import("@/pages/Contact").then(m => ({ default: m.Contact })));
const ContactSuccess = lazy(() => import("@/pages/ContactSuccess").then(m => ({ default: m.ContactSuccess })));
const Auth = lazy(() => import("@/pages/Auth").then(m => ({ default: m.Auth })));
const ResetPassword = lazy(() => import("@/pages/ResetPassword").then(m => ({ default: m.ResetPassword })));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const SellYourCar = lazy(() => import("@/pages/SellYourCar").then(m => ({ default: m.SellYourCar })));
const MySubmissions = lazy(() => import("@/pages/MySubmissions").then(m => ({ default: m.MySubmissions })));
const Inquiries = lazy(() => import("@/pages/Inquiries").then(m => ({ default: m.Inquiries })));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Layout>
          <ErrorBoundary>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
              <PageTransition>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/" element={<Home />} />
                  <Route path="/cars" element={<CarListings />} />
                  <Route path="/cars/:id" element={<CarDetails />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/contact/success" element={<ContactSuccess />} />
                  <Route path="/sell" element={<SellYourCar />} />
                  <Route path="/my-submissions" element={<ProtectedRoute><MySubmissions /></ProtectedRoute>} />
                  <Route path="/inquiries" element={<ProtectedRoute><Inquiries /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PageTransition>
            </Suspense>
          </ErrorBoundary>
        </Layout>

      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
