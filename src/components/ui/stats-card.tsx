import { memo } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { AnimatedCounter } from './animated-counter';

interface StatsCardProps {
  value: number;
  suffix?: string;
  label: string;
  icon: LucideIcon;
  index: number;
}

export const StatsCard = memo(function StatsCard({ value, suffix = '', label, icon: Icon, index }: StatsCardProps) {
  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 overflow-hidden transition-all duration-200 group-hover:border-[#E59935]/20">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-bl from-[#E59935]/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        
        <div className="relative z-10">
          {/* Icon container */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-3 sm:mb-4 md:mb-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#E59935]/20 to-[#E59935]/5 border border-[#E59935]/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#E59935]" />
          </div>
          
          {/* Value with animated counter */}
          <div className="mb-1 sm:mb-2">
            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white tracking-tight">
              <AnimatedCounter value={value} suffix={suffix} duration={1200} />
            </span>
          </div>
          
          {/* Label */}
          <p className="text-[10px] sm:text-xs md:text-sm text-white/50 uppercase tracking-wider sm:tracking-widest font-medium leading-tight">
            {label}
          </p>
        </div>
        
        {/* Bottom line accent */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E59935] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
    </motion.div>
  );
});
