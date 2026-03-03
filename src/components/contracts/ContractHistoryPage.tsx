import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useContracts } from '@/hooks/useContracts';
import { downloadContractPDF } from '@/lib/contractPdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Download, FileText, History } from 'lucide-react';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function ContractHistoryPage() {
  const { contracts } = useContracts();

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2"><History className="h-5 w-5" /> Histórico de Contratos</h2>
      {contracts.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum contrato encontrado</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {contracts.map(c => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">{c.contract_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.customer_name} • {c.vehicle_brand} {c.vehicle_model} • {formatCurrency(c.vehicle_value)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.created_at ? format(new Date(c.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{c.contract_type === 'venda' ? 'Venda' : 'Compra'}</Badge>
                  <Button variant="outline" size="icon" onClick={() => downloadContractPDF(c)}><Download className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
