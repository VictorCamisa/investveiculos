import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fuel, Gauge, Calendar, Settings2, ChevronLeft, ChevronRight } from 'lucide-react';
import { PublicVehicle } from '@/hooks/usePublicVehicles';
import { fuelTypeLabels, transmissionLabels } from '@/types/inventory';

interface PublicVehicleCardProps {
  vehicle: PublicVehicle;
  index?: number;
}

export function PublicVehicleCard({ vehicle, index = 0 }: PublicVehicleCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Sort images to show cover first
  const sortedImages = [...vehicle.images].sort((a, b) => {
    if (a.is_cover) return -1;
    if (b.is_cover) return 1;
    return 0;
  });
  
  const currentImage = sortedImages[currentImageIndex];
  const hasMultipleImages = sortedImages.length > 1;
  
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
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link 
        to={`/veiculos/${vehicle.id}`}
        className="group block bg-public-highlight border border-public-border rounded-xl overflow-hidden hover:shadow-xl hover:shadow-black/30 transition-all duration-300"
      >
        {/* Image with navigation */}
        <div className="relative aspect-[4/3] overflow-hidden bg-public-muted">
          {currentImage ? (
            <img
              src={currentImage.image_url}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-public-fg/30">
              <Settings2 className="h-16 w-16" />
            </div>
          )}
          
          {/* Image navigation arrows */}
          {hasMultipleImages && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              
              {/* Image indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {sortedImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      idx === currentImageIndex 
                        ? 'bg-public-primary w-4' 
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Featured badge */}
          {vehicle.featured && (
            <div className="absolute top-3 left-3 bg-black text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
              Destaque
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Brand */}
          <p className="text-public-primary text-sm font-semibold uppercase tracking-wide mb-1">
            {vehicle.brand}
          </p>
          
          {/* Model & Version */}
          <h3 className="text-public-highlight-foreground text-lg font-bold mb-1 group-hover:text-public-primary transition-colors">
            {vehicle.model}
            {vehicle.version && (
              <span className="font-normal text-public-fg/60 text-sm ml-2">
                {vehicle.version}
              </span>
            )}
          </h3>

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-sm text-public-fg/70">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-public-primary" />
              <span>{vehicle.year_fabrication}/{vehicle.year_model}</span>
            </div>
            {vehicle.km != null && (
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-public-primary" />
                <span>{formatKm(vehicle.km)}</span>
              </div>
            )}
            {vehicle.fuel_type && (
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-public-primary" />
                <span>{fuelTypeLabels[vehicle.fuel_type] || vehicle.fuel_type}</span>
              </div>
            )}
            {vehicle.transmission && (
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-public-primary" />
                <span>{transmissionLabels[vehicle.transmission] || vehicle.transmission}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="mt-4 pt-4 border-t border-public-border">
            <p className="text-2xl font-bold text-public-highlight-foreground">
              {formatPrice(vehicle.sale_price)}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
