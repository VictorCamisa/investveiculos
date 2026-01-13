import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [fuelFilter, setFuelFilter] = useState<string>('all');

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    if (!vehicles) return { brands: [], years: [], fuels: [] };
    
    const brands = [...new Set(vehicles.map(v => v.brand))].sort();
    const years = [...new Set(vehicles.map(v => v.year_model))].sort((a, b) => b - a);
    const fuels = [...new Set(vehicles.map(v => v.fuel_type).filter(Boolean))].sort();
    
    return { brands, years, fuels };
  }, [vehicles]);

  const filteredVehicles = vehicles?.filter(v => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      v.brand.toLowerCase().includes(searchLower) ||
      v.model.toLowerCase().includes(searchLower) ||
      (v.version?.toLowerCase().includes(searchLower));
    
    const matchesBrand = brandFilter === 'all' || v.brand === brandFilter;
    const matchesYear = yearFilter === 'all' || v.year_model === Number(yearFilter);
    const matchesFuel = fuelFilter === 'all' || v.fuel_type === fuelFilter;
    
    return matchesSearch && matchesBrand && matchesYear && matchesFuel;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-asc': return (a.sale_price || 0) - (b.sale_price || 0);
      case 'price-desc': return (b.sale_price || 0) - (a.sale_price || 0);
      case 'year-desc': return b.year_model - a.year_model;
      case 'km-asc': return (a.km ?? Infinity) - (b.km ?? Infinity);
      default: return 0;
    }
  });

  const hasActiveFilters = brandFilter !== 'all' || yearFilter !== 'all' || fuelFilter !== 'all';

  const clearFilters = () => {
    setBrandFilter('all');
    setYearFilter('all');
    setFuelFilter('all');
  };

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
      <section className="sticky top-14 z-40 bg-black/90 backdrop-blur-xl border-b border-public-border">
        <div className="container mx-auto px-4 py-3">
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
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setShowFilters(!showFilters)} 
                className={`h-9 w-9 border-public-border text-public-fg hover:bg-public-primary/10 hover:text-public-fg ${
                  showFilters || hasActiveFilters ? 'bg-public-primary text-white' : 'bg-public-muted'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-public-border"
            >
              <div className="container mx-auto px-4 py-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger className="w-full sm:w-40 h-9 text-sm bg-public-muted border-public-border text-public-fg">
                      <SelectValue placeholder="Marca" />
                    </SelectTrigger>
                    <SelectContent className="bg-public-surface border-public-border max-h-60">
                      <SelectItem value="all" className="text-sm text-public-fg hover:bg-public-muted focus:bg-public-muted focus:text-public-fg">Todas as marcas</SelectItem>
                      {filterOptions.brands.map(brand => (
                        <SelectItem key={brand} value={brand} className="text-sm text-public-fg hover:bg-public-muted focus:bg-public-muted focus:text-public-fg">
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-full sm:w-32 h-9 text-sm bg-public-muted border-public-border text-public-fg">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent className="bg-public-surface border-public-border max-h-60">
                      <SelectItem value="all" className="text-sm text-public-fg hover:bg-public-muted focus:bg-public-muted focus:text-public-fg">Todos os anos</SelectItem>
                      {filterOptions.years.map(year => (
                        <SelectItem key={year} value={String(year)} className="text-sm text-public-fg hover:bg-public-muted focus:bg-public-muted focus:text-public-fg">
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={fuelFilter} onValueChange={setFuelFilter}>
                    <SelectTrigger className="w-full sm:w-36 h-9 text-sm bg-public-muted border-public-border text-public-fg">
                      <SelectValue placeholder="Combustível" />
                    </SelectTrigger>
                    <SelectContent className="bg-public-surface border-public-border">
                      <SelectItem value="all" className="text-sm text-public-fg hover:bg-public-muted focus:bg-public-muted focus:text-public-fg">Todos</SelectItem>
                      {filterOptions.fuels.map(fuel => (
                        <SelectItem key={fuel} value={fuel} className="text-sm text-public-fg hover:bg-public-muted focus:bg-public-muted focus:text-public-fg">
                          {fuel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="h-9 text-sm text-public-primary hover:text-public-primary hover:bg-public-primary/10"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              {(search || hasActiveFilters) && (
                <Button 
                  variant="link" 
                  onClick={() => { setSearch(''); clearFilters(); }} 
                  className="text-public-primary mt-2"
                >
                  Limpar busca e filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
