import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fuel, Gauge, Calendar, Settings2, ChevronLeft, ChevronRight, Car } from 'lucide-react';
import { PublicVehicle } from '@/hooks/usePublicVehicles';
import { fuelTypeLabels, transmissionLabels } from '@/types/inventory';

interface PublicVehicleCardProps {
  vehicle: PublicVehicle;
  index?: number;
}

export function PublicVehicleCard({ vehicle, index = 0 }: PublicVehicleCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  
  // Sort images to show cover first
  const sortedImages = [...(vehicle.images || [])].sort((a, b) => {
    if (a.is_cover) return -1;
    if (b.is_cover) return 1;
    return 0;
  });
  
  const currentImage = sortedImages[currentImageIndex];
  const hasMultipleImages = sortedImages.length > 1;
  const currentImageFailed = imageError[currentImageIndex];
  
  const formatPrice = (price: number | null) => {
    if (!price) return 'Consulte';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatKm = (km: number) => {
    return new Intl.NumberFormat('pt-BR').format(km) + ' km';
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => 
      prev === 0 ? sortedImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => 
      prev === sortedImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link 
        to={`/veiculos/${vehicle.id}`}
        className="group block bg-public-highlight border border-public-border rounded-lg sm:rounded-xl overflow-hidden hover:shadow-xl hover:shadow-black/30 transition-all duration-300"
      >
        {/* Image with navigation */}
        <div className="relative aspect-[4/3] overflow-hidden bg-public-muted">
          {currentImage && !currentImageFailed ? (
            <img
              src={currentImage.image_url}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              crossOrigin="anonymous"
              onError={() => setImageError(prev => ({ ...prev, [currentImageIndex]: true }))}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-public-fg/40 bg-gradient-to-br from-public-muted to-public-highlight gap-2">
              <Car className="h-12 w-12 sm:h-16 sm:w-16" />
              <span className="text-xs sm:text-sm">{vehicle.brand} {vehicle.model}</span>
            </div>
          )}
          
          {/* Image navigation arrows - visible on mobile */}
          {hasMultipleImages && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              
              {/* Image indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-1.5">
                {sortedImages.slice(0, 5).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-200 ${
                      idx === currentImageIndex 
                        ? 'bg-public-primary w-3 sm:w-4' 
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
                {sortedImages.length > 5 && (
                  <span className="text-white/70 text-[10px] ml-1">+{sortedImages.length - 5}</span>
                )}
              </div>
            </>
          )}
          
          {/* Featured badge */}
          {vehicle.featured && (
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-black text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wide">
              Destaque
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 md:p-5">
          {/* Brand */}
          <p className="text-public-primary text-xs sm:text-sm font-semibold uppercase tracking-wide mb-0.5 sm:mb-1">
            {vehicle.brand}
          </p>
          
          {/* Model & Version */}
          <h3 className="text-public-highlight-foreground text-base sm:text-lg font-bold mb-0.5 sm:mb-1 group-hover:text-public-primary transition-colors line-clamp-1">
            {vehicle.model}
            {vehicle.version && (
              <span className="font-normal text-public-fg/60 text-xs sm:text-sm ml-1 sm:ml-2">
                {vehicle.version}
              </span>
            )}
          </h3>

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2 sm:mt-4 text-xs sm:text-sm text-public-fg/70">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-public-primary flex-shrink-0" />
              <span className="truncate">{vehicle.year_fabrication}/{vehicle.year_model}</span>
            </div>
            {vehicle.km != null && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Gauge className="h-3 w-3 sm:h-4 sm:w-4 text-public-primary flex-shrink-0" />
                <span className="truncate">{formatKm(vehicle.km)}</span>
              </div>
            )}
            {vehicle.fuel_type && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Fuel className="h-3 w-3 sm:h-4 sm:w-4 text-public-primary flex-shrink-0" />
                <span className="truncate">{fuelTypeLabels[vehicle.fuel_type] || vehicle.fuel_type}</span>
              </div>
            )}
            {vehicle.transmission && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Settings2 className="h-3 w-3 sm:h-4 sm:w-4 text-public-primary flex-shrink-0" />
                <span className="truncate">{transmissionLabels[vehicle.transmission] || vehicle.transmission}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-public-border">
            <p className="text-xl sm:text-2xl font-bold text-public-highlight-foreground">
              {formatPrice(vehicle.sale_price)}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
