import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Car, Phone, Menu, LogOut, User, LayoutDashboard, DollarSign, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/useAdmin";

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error: any) {
      toast.error("Error signing out");
    }
  };

  const navItems: Array<{ label: string; to: any; requiresAuth?: boolean }> = [
    { label: "Home", to: "/" },
    { label: "All Cars", to: "/cars" },
    { label: "Electric", to: { pathname: "/cars", search: "?fuel=electric" } },
    { label: "Petrol", to: { pathname: "/cars", search: "?fuel=petrol" } },
    { label: "Diesel", to: { pathname: "/cars", search: "?fuel=diesel" } },
    { label: "Sell Your Car", to: user ? "/sell" : "/auth", requiresAuth: true },
    ...(user ? [{ label: "My Submissions", to: "/my-submissions" }] : []),
    ...(user ? [{ label: "Messages", to: "/inquiries" }] : []),
    { label: "Contact", to: "/contact" },
  ];

  const isActive = (to: any) => {
    if (typeof to === "string") {
      if (to === "/") return location.pathname === "/";
      if (to === "/cars") return location.pathname === "/cars" && !location.search;
      return location.pathname.startsWith(to) && !location.search;
    }

    return location.pathname === to.pathname && location.search === to.search;
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Car className="h-9 w-9 text-primary transition-transform group-hover:scale-110" />
              <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold tracking-tight text-primary">ZORA</span>
              <span className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">Autos</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`text-sm font-medium transition-colors hover:text-primary relative ${
                  isActive(item.to)
                    ? "text-primary after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Contact Button & Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">
                  <LayoutDashboard className="h-4 w-4" />
                  Admin
                </Link>
              </Button>
            )}
            {user ? (
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link to="/auth">
                  <User className="h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background p-4">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(item.to) ? "text-primary" : "text-muted-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/contact"
                className="text-sm font-medium text-muted-foreground hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact Us
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-muted-foreground hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
              {user ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-primary text-left"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="text-sm font-medium text-muted-foreground hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}