import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSales, useDeleteSale } from '@/hooks/useSales';
import { SaleCard } from '@/components/sales/SaleCard';
import { SaleForm } from '@/components/sales/SaleForm';
import { useAuth } from '@/contexts/AuthContext';
import type { Sale } from '@/types/sales';

export function SalesListPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const { data: sales, isLoading } = useSales();
  const deleteSale = useDeleteSale();
  const { role } = useAuth();

  const isManager = role === 'gerente';

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta venda?')) {
      await deleteSale.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Todas as Vendas</h2>
          <p className="text-muted-foreground">
            {sales?.length || 0} vendas registradas
          </p>
        </div>
        {isManager && (
          <Button onClick={() => { setEditingSale(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nova Venda
          </Button>
        )}
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sales?.map((sale) => (
            <SaleCard
              key={sale.id}
              sale={sale}
              onEdit={isManager ? handleEdit : undefined}
              onDelete={isManager ? handleDelete : undefined}
            />
          ))}
          {sales?.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">
              Nenhuma venda registrada
            </p>
          )}
        </div>
      )}

      <SaleForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        sale={editingSale} 
      />
    </div>
  );
}
