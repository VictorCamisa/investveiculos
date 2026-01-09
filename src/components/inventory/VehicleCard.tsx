import { Car, Calendar, Gauge, Fuel } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Vehicle } from '@/types/inventory';
import { vehicleStatusLabels, vehicleStatusColors, fuelTypeLabels } from '@/types/inventory';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick?: () => void;
}

export function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatKm = (km: number) => {
    return new Intl.NumberFormat('pt-BR').format(km) + ' km';
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{vehicle.brand} {vehicle.model}</h3>
              {vehicle.version && (
                <p className="text-sm text-muted-foreground">{vehicle.version}</p>
              )}
            </div>
          </div>
          <Badge className={vehicleStatusColors[vehicle.status]}>
            {vehicleStatusLabels[vehicle.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{vehicle.year_fabrication}/{vehicle.year_model}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gauge className="h-4 w-4" />
            <span>{formatKm(vehicle.km)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Fuel className="h-4 w-4" />
            <span>{fuelTypeLabels[vehicle.fuel_type] || vehicle.fuel_type}</span>
          </div>
          {vehicle.plate && (
            <div className="text-muted-foreground">
              <span className="font-mono">{vehicle.plate}</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t flex justify-between items-center">
          <div>
            <p className="text-xs text-muted-foreground">Preço de venda</p>
            <p className="font-semibold text-lg">
              {formatCurrency(vehicle.sale_price)}
            </p>
          </div>
          {vehicle.purchase_price && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Custo</p>
              <p className="text-sm">
                {formatCurrency(vehicle.purchase_price)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
