import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePublicVehicles } from '@/hooks/usePublicVehicles';
import { PublicVehicleCard } from '@/components/public/PublicVehicleCard';

export default function PublicEstoque() {
  const { data: vehicles, isLoading } = usePublicVehicles();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);

  const filteredVehicles = vehicles?.filter(v => {
    const searchLower = search.toLowerCase();
    return (
      v.brand.toLowerCase().includes(searchLower) ||
      v.model.toLowerCase().includes(searchLower) ||
      (v.version?.toLowerCase().includes(searchLower))
    );
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-asc': return (a.sale_price || 0) - (b.sale_price || 0);
      case 'price-desc': return (b.sale_price || 0) - (a.sale_price || 0);
      case 'year-desc': return b.year_model - a.year_model;
      case 'km-asc': return (a.km ?? Infinity) - (b.km ?? Infinity);
      default: return 0;
    }
  });

  return (
    <div className="bg-public-bg min-h-screen pt-16">
      {/* Header - Compact */}
      <section className="bg-black py-8">
        <div className="container mx-auto px-4">
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-public-fg font-['Oswald'] text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Nosso <span className="text-public-primary">Estoque</span>
          </motion.h1>
          <motion.p
            className="text-public-fg/50 text-sm text-center mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Encontre o veículo perfeito para você
          </motion.p>
        </div>
      </section>

      {/* Filters & Search - Compact */}
      <section className="sticky top-14 z-40 bg-black/90 backdrop-blur-xl border-b border-public-border py-3">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-public-fg/40" />
              <Input
                placeholder="Buscar por marca, modelo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm bg-public-muted border-public-border text-public-fg placeholder:text-public-fg/40 focus:border-public-primary"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-public-fg/40 hover:text-public-fg" />
                </button>
              )}
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-40 h-9 text-sm bg-public-muted border-public-border text-public-fg">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent className="bg-public-surface border-public-border">
                  <SelectItem value="recent" className="text-sm text-public-fg hover:bg-public-muted focus:bg-public-muted focus:text-public-fg">Mais recentes</SelectItem>
                  <SelectItem value="price-asc" className="text-sm text-public-fg hover:bg-public-muted focus:bg-public-muted focus:text-public-fg">Menor preço</SelectItem>
                  <SelectItem value="price-desc" className="text-sm text-public-fg hover:bg-public-muted focus:bg-public-muted focus:text-public-fg">Maior preço</SelectItem>
                  <SelectItem value="year-desc" className="text-sm text-public-fg hover:bg-public-muted focus:bg-public-muted focus:text-public-fg">Ano mais novo</SelectItem>
                  <SelectItem value="km-asc" className="text-sm text-public-fg hover:bg-public-muted focus:bg-public-muted focus:text-public-fg">Menor KM</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className="h-9 w-9 border-public-border bg-public-muted text-public-fg hover:bg-public-primary/10 hover:text-public-fg">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-public-muted rounded-xl h-[400px] animate-pulse" />
              ))}
            </div>
          ) : filteredVehicles && filteredVehicles.length > 0 ? (
            <>
              <p className="text-public-fg/60 mb-6">{filteredVehicles.length} veículo(s) encontrado(s)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVehicles.map((vehicle, index) => (
                  <PublicVehicleCard key={vehicle.id} vehicle={vehicle} index={index} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-public-fg/60 text-lg">Nenhum veículo encontrado.</p>
              {search && (
                <Button variant="link" onClick={() => setSearch('')} className="text-public-primary mt-2">
                  Limpar busca
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
