import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedGradient } from "@/components/ui/animated-gradient";

// Default dark gray colors for consistent brand styling
const DEFAULT_CARD_COLORS = ["#2A2A2A", "#3A3A3A", "#4A4A4A"];

interface BentoCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  colors?: string[];
  delay?: number;
  className?: string;
  icon?: React.ReactNode;
}

const BentoCard: React.FC<BentoCardProps> = ({
  title,
  value,
  subtitle,
  colors = DEFAULT_CARD_COLORS,
  delay = 0,
  className,
  icon,
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay + 0.3,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden h-full rounded-xl border border-border/30 bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]",
        className
      )}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <AnimatedGradient colors={colors} speed={0.03} blur="medium" />
      <motion.div
        className="relative z-10 p-6 h-full flex flex-col justify-between"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="flex items-start justify-between gap-3">
          <motion.h3 
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80" 
            variants={item}
          >
            {title}
          </motion.h3>
          {icon && (
            <motion.div variants={item} className="shrink-0 opacity-80">
              {icon}
            </motion.div>
          )}
        </div>
        <div className="mt-4">
          <motion.p
            className="text-2xl font-semibold tracking-tight text-foreground/90"
            variants={item}
          >
            {value}
          </motion.p>
          {subtitle && (
            <motion.p 
              className="text-sm text-muted-foreground/70 mt-2 leading-relaxed" 
              variants={item}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export { BentoCard };
