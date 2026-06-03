import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { ReactNode, useEffect } from "react";
import { useInquiryNotifications, requestNotificationPermission } from "@/hooks/useInquiryNotifications";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  useInquiryNotifications();

  useEffect(() => {
    const ask = () => {
      requestNotificationPermission();
      window.removeEventListener("pointerdown", ask);
    };
    window.addEventListener("pointerdown", ask, { once: true });
    return () => window.removeEventListener("pointerdown", ask);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
