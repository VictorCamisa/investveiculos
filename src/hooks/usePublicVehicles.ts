import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export interface PublicVehicle {
  id: string;
  brand: string;
  model: string;
  version: string | null;
  year_fabrication: number | null;
  year_model: number | null;
  color: string | null;
  km: number | null;
  fuel_type: string | null;
  transmission: string | null;
  doors: number | null;
  sale_price: number | null;
  featured: boolean | null;
  images: {
    id: string;
    image_url: string;
    is_cover: boolean | null;
    display_order: number | null;
  }[];
}

type VehicleRow = Tables<'vehicles'>;
type ImageRow = Tables<'vehicle_images'>;

export function usePublicVehicles() {
  return useQuery({
    queryKey: ['public-vehicles'],
    queryFn: async (): Promise<PublicVehicle[]> => {
      const { data, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'disponivel')
        .order('created_at', { ascending: false });

      if (vehiclesError) throw vehiclesError;
      const vehicles = (data || []) as VehicleRow[];
      if (vehicles.length === 0) return [];

      const vehicleIds = vehicles.map(v => v.id);

      const { data: imgData, error: imagesError } = await supabase
        .from('vehicle_images')
        .select('*')
        .in('vehicle_id', vehicleIds)
        .order('order_index', { ascending: true });

      if (imagesError) throw imagesError;
      const images = (imgData || []) as ImageRow[];

      return vehicles.map(vehicle => ({
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        version: vehicle.version,
        year_fabrication: vehicle.year_manufacture,
        year_model: vehicle.year_model,
        color: vehicle.color,
        km: vehicle.mileage,
        fuel_type: vehicle.fuel_type,
        transmission: vehicle.transmission,
        doors: null,
        sale_price: vehicle.price_sale,
        featured: null,
        images: images
          .filter(img => img.vehicle_id === vehicle.id)
          .map(img => ({ 
            id: img.id, 
            image_url: img.url, 
            is_cover: img.is_main, 
            display_order: img.order_index 
          }))
      }));
    },
  });
}

export function usePublicVehicle(id: string) {
  return useQuery({
    queryKey: ['public-vehicle', id],
    queryFn: async (): Promise<PublicVehicle> => {
      const { data, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .eq('status', 'disponivel')
        .single();

      if (vehicleError) throw vehicleError;
      const vehicle = data as VehicleRow;
      if (!vehicle) throw new Error('Vehicle not found');

      const { data: imgData, error: imagesError } = await supabase
        .from('vehicle_images')
        .select('*')
        .eq('vehicle_id', id)
        .order('order_index', { ascending: true });

      if (imagesError) throw imagesError;
      const images = (imgData || []) as ImageRow[];

      return {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        version: vehicle.version,
        year_fabrication: vehicle.year_manufacture,
        year_model: vehicle.year_model,
        color: vehicle.color,
        km: vehicle.mileage,
        fuel_type: vehicle.fuel_type,
        transmission: vehicle.transmission,
        doors: null,
        sale_price: vehicle.price_sale,
        featured: null,
        images: images.map(img => ({ 
          id: img.id, 
          image_url: img.url, 
          is_cover: img.is_main, 
          display_order: img.order_index 
        }))
      };
    },
    enabled: !!id,
  });
}

export function useFeaturedVehicles(limit = 6) {
  return useQuery({
    queryKey: ['featured-vehicles', limit],
    queryFn: async (): Promise<PublicVehicle[]> => {
      const { data, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'disponivel')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (vehiclesError) throw vehiclesError;
      const vehicles = (data || []) as VehicleRow[];
      if (vehicles.length === 0) return [];

      const vehicleIds = vehicles.map(v => v.id);

      const { data: imgData, error: imagesError } = await supabase
        .from('vehicle_images')
        .select('*')
        .in('vehicle_id', vehicleIds)
        .order('order_index', { ascending: true });

      if (imagesError) throw imagesError;
      const images = (imgData || []) as ImageRow[];

      return vehicles.map(vehicle => ({
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        version: vehicle.version,
        year_fabrication: vehicle.year_manufacture,
        year_model: vehicle.year_model,
        color: vehicle.color,
        km: vehicle.mileage,
        fuel_type: vehicle.fuel_type,
        transmission: vehicle.transmission,
        doors: null,
        sale_price: vehicle.price_sale,
        featured: null,
        images: images
          .filter(img => img.vehicle_id === vehicle.id)
          .map(img => ({ 
            id: img.id, 
            image_url: img.url, 
            is_cover: img.is_main, 
            display_order: img.order_index 
          }))
      }));
    },
  });
}
