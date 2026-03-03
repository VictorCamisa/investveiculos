import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileStack, FileText, ShoppingCart } from 'lucide-react';

export function ContractTemplatesPage() {
  const templates = [
    { name: 'Contrato de Venda', description: 'Modelo padrão para venda de veículos ao consumidor final', icon: FileText, type: 'venda' },
    { name: 'Contrato de Compra', description: 'Modelo para aquisição de veículos de terceiros', icon: ShoppingCart, type: 'compra' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2"><FileStack className="h-5 w-5" /> Modelos de Contrato</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map(t => (
          <Card key={t.type} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <t.icon className="h-5 w-5 text-primary" /> {t.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t.description}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Os modelos são gerados automaticamente com os dados do contrato preenchido. 
                O PDF inclui cabeçalho da loja, marca d'água e campos de assinatura.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
