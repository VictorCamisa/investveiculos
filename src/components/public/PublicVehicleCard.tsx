import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fuel, Gauge, Calendar, Settings2 } from 'lucide-react';
import { PublicVehicle } from '@/hooks/usePublicVehicles';
import { fuelTypeLabels, transmissionLabels } from '@/types/inventory';

interface PublicVehicleCardProps {
  vehicle: PublicVehicle;
  index?: number;
}

export function PublicVehicleCard({ vehicle, index = 0 }: PublicVehicleCardProps) {
  const coverImage = vehicle.images.find(img => img.is_cover) || vehicle.images[0];
  
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link 
        to={`/veiculos/${vehicle.id}`}
        className="group block bg-public-bg border border-public-border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-public-muted">
          {coverImage ? (
            <img
              src={coverImage.image_url}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-public-fg/30">
              <Settings2 className="h-16 w-16" />
            </div>
          )}
          
          {/* Featured badge */}
          {vehicle.featured && (
            <div className="absolute top-3 left-3 bg-public-primary text-public-primary-foreground px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
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
          <h3 className="text-public-fg text-lg font-bold mb-1 group-hover:text-public-primary transition-colors">
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
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-public-primary" />
              <span>{formatKm(vehicle.km)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-public-primary" />
              <span>{fuelTypeLabels[vehicle.fuel_type] || vehicle.fuel_type}</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-public-primary" />
              <span>{transmissionLabels[vehicle.transmission] || vehicle.transmission}</span>
            </div>
          </div>

          {/* Price */}
          <div className="mt-4 pt-4 border-t border-public-border">
            <p className="text-2xl font-bold text-public-fg">
              {formatPrice(vehicle.sale_price)}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
