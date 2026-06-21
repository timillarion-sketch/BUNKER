import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "glass";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const CyberButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    
    const variants = {
      primary: "bg-primary/10 text-primary border border-primary/50 hover:bg-primary/20 hover:border-primary hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]",
      secondary: "bg-secondary/10 text-secondary border border-secondary/50 hover:bg-secondary/20 hover:border-secondary hover:shadow-[0_0_15px_rgba(255,0,255,0.4)]",
      destructive: "bg-destructive/10 text-destructive border border-destructive/50 hover:bg-destructive/20 hover:border-destructive hover:shadow-[0_0_15px_rgba(255,0,0,0.4)]",
      ghost: "bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/10",
      glass: "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-11 px-6 text-sm",
      lg: "h-14 px-8 text-base",
      icon: "h-10 w-10 flex items-center justify-center",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative inline-flex items-center justify-center font-tech font-bold uppercase tracking-widest rounded-none transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none overflow-hidden group",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {/* Cyberpunk accent lines */}
        <span className="absolute top-0 left-0 w-2 h-[1px] bg-current opacity-50" />
        <span className="absolute bottom-0 right-0 w-2 h-[1px] bg-current opacity-50" />
        <span className="absolute top-0 left-0 w-[1px] h-2 bg-current opacity-50" />
        <span className="absolute bottom-0 right-0 w-[1px] h-2 bg-current opacity-50" />
        
        {/* Glitch overlay on hover */}
        <span className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 transition-opacity mix-blend-overlay" />

        {isLoading ? (
          <span className="animate-pulse">PROCESSING...</span>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);
CyberButton.displayName = "CyberButton";
