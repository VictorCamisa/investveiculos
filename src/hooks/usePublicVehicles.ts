import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export interface PublicVehicle {
  id: string;
  brand: string;
  model: string;
  version: string | null;
  year_fabrication: number;
  year_model: number;
  color: string;
  km: number;
  fuel_type: string;
  transmission: string;
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
        .eq('featured', true)
        .order('created_at', { ascending: false });

      if (vehiclesError) throw vehiclesError;
      const vehicles = data as VehicleRow[] | null;
      if (!vehicles || vehicles.length === 0) return [];

      const vehicleIds = vehicles.map(v => v.id);

      const { data: imgData, error: imagesError } = await supabase
        .from('vehicle_images')
        .select('*')
        .in('vehicle_id', vehicleIds)
        .order('display_order', { ascending: true });

      if (imagesError) throw imagesError;
      const images = imgData as ImageRow[] | null;

      return vehicles.map(vehicle => ({
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        version: vehicle.version,
        year_fabrication: vehicle.year_fabrication,
        year_model: vehicle.year_model,
        color: vehicle.color,
        km: vehicle.km,
        fuel_type: vehicle.fuel_type,
        transmission: vehicle.transmission,
        doors: vehicle.doors,
        sale_price: vehicle.sale_price,
        featured: vehicle.featured,
        images: (images || [])
          .filter(img => img.vehicle_id === vehicle.id)
          .map(img => ({ id: img.id, image_url: img.image_url, is_cover: img.is_cover, display_order: img.display_order }))
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
      const vehicle = data as VehicleRow | null;
      if (!vehicle) throw new Error('Vehicle not found');

      const { data: imgData, error: imagesError } = await supabase
        .from('vehicle_images')
        .select('*')
        .eq('vehicle_id', id)
        .order('display_order', { ascending: true });

      if (imagesError) throw imagesError;
      const images = imgData as ImageRow[] | null;

      return {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        version: vehicle.version,
        year_fabrication: vehicle.year_fabrication,
        year_model: vehicle.year_model,
        color: vehicle.color,
        km: vehicle.km,
        fuel_type: vehicle.fuel_type,
        transmission: vehicle.transmission,
        doors: vehicle.doors,
        sale_price: vehicle.sale_price,
        featured: vehicle.featured,
        images: (images || []).map(img => ({ id: img.id, image_url: img.image_url, is_cover: img.is_cover, display_order: img.display_order }))
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
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (vehiclesError) throw vehiclesError;
      const vehicles = data as VehicleRow[] | null;
      if (!vehicles || vehicles.length === 0) return [];

      const vehicleIds = vehicles.map(v => v.id);

      const { data: imgData, error: imagesError } = await supabase
        .from('vehicle_images')
        .select('*')
        .in('vehicle_id', vehicleIds)
        .order('display_order', { ascending: true });

      if (imagesError) throw imagesError;
      const images = imgData as ImageRow[] | null;

      return vehicles.map(vehicle => ({
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        version: vehicle.version,
        year_fabrication: vehicle.year_fabrication,
        year_model: vehicle.year_model,
        color: vehicle.color,
        km: vehicle.km,
        fuel_type: vehicle.fuel_type,
        transmission: vehicle.transmission,
        doors: vehicle.doors,
        sale_price: vehicle.sale_price,
        featured: vehicle.featured,
        images: (images || [])
          .filter(img => img.vehicle_id === vehicle.id)
          .map(img => ({ id: img.id, image_url: img.image_url, is_cover: img.is_cover, display_order: img.display_order }))
      }));
    },
  });
}
