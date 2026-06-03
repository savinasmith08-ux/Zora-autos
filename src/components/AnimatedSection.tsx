import { useEffect, useRef, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

type AnimationVariant = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "zoom-in" | "blur-in";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  variant?: AnimationVariant;
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
}

const variantStyles: Record<AnimationVariant, { from: string; to: string }> = {
  "fade-up": {
    from: "opacity-0 translate-y-8",
    to: "opacity-100 translate-y-0",
  },
  "fade-down": {
    from: "opacity-0 -translate-y-8",
    to: "opacity-100 translate-y-0",
  },
  "fade-left": {
    from: "opacity-0 translate-x-8",
    to: "opacity-100 translate-x-0",
  },
  "fade-right": {
    from: "opacity-0 -translate-x-8",
    to: "opacity-100 translate-x-0",
  },
  "zoom-in": {
    from: "opacity-0 scale-95",
    to: "opacity-100 scale-100",
  },
  "blur-in": {
    from: "opacity-0 blur-sm scale-[0.97]",
    to: "opacity-100 blur-0 scale-100",
  },
};

export function AnimatedSection({
  children,
  className,
  variant = "fade-up",
  delay = 0,
  duration = 600,
  threshold = 0.15,
  once = true,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const styles = variantStyles[variant];

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all will-change-transform",
        isVisible ? styles.to : styles.from,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {children}
    </div>
  );
}

// Utility for staggered children
interface StaggerContainerProps {
  children: ReactNode[];
  className?: string;
  variant?: AnimationVariant;
  staggerDelay?: number;
  baseDelay?: number;
  duration?: number;
}

export function StaggerContainer({
  children,
  className,
  variant = "fade-up",
  staggerDelay = 100,
  baseDelay = 0,
  duration = 500,
}: StaggerContainerProps) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <AnimatedSection
          key={i}
          variant={variant}
          delay={baseDelay + i * staggerDelay}
          duration={duration}
        >
          {child}
        </AnimatedSection>
      ))}
    </div>
  );
}
