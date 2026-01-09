import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSales, useSaleProfitReports, useDeleteSale } from '@/hooks/useSales';
import { SaleCard } from '@/components/sales/SaleCard';
import { SaleForm } from '@/components/sales/SaleForm';
import { ProfitReportCard } from '@/components/sales/ProfitReportCard';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import type { Sale } from '@/types/sales';

export default function Sales() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const { data: sales, isLoading } = useSales();
  const { data: profitReports } = useSaleProfitReports();
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
          <h1 className="text-3xl font-bold">Vendas</h1>
          <p className="text-muted-foreground">Gerencie vendas e visualize lucros</p>
        </div>
        {isManager && (
          <Button onClick={() => { setEditingSale(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nova Venda
          </Button>
        )}
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="profit">Lucro Real</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4">
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
        </TabsContent>

        <TabsContent value="profit" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {profitReports?.map((report) => (
              <ProfitReportCard key={report.id} report={report} />
            ))}
            {profitReports?.length === 0 && (
              <p className="text-muted-foreground col-span-full text-center py-8">
                Nenhum relatório de lucro disponível
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <SaleForm open={formOpen} onOpenChange={setFormOpen} sale={editingSale} />
    </div>
  );
}
