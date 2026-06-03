import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [stage, setStage] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    if (children !== displayChildren) {
      setStage("exit");
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setStage("enter");
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [children, displayChildren]);

  // Reset to enter on location change
  useEffect(() => {
    setStage("enter");
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div
      className="transition-all duration-300 ease-out"
      style={{
        opacity: stage === "enter" ? 1 : 0,
        transform: stage === "enter" ? "translateY(0)" : "translateY(12px)",
      }}
    >
      {displayChildren}
    </div>
  );
}
