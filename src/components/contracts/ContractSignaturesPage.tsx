import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContracts } from '@/hooks/useContracts';
import { FileSignature, CheckCircle2, Clock } from 'lucide-react';

export function ContractSignaturesPage() {
  const { contracts, updateContract } = useContracts();
  const pendingContracts = contracts.filter(c => c.status === 'pending');
  const signedContracts = contracts.filter(c => c.status === 'signed');

  const handleSign = (id: string) => {
    updateContract.mutate({ id, status: 'signed', signed_at: new Date().toISOString() });
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <FileSignature className="h-5 w-5" /> Assinaturas Pendentes ({pendingContracts.length})
      </h2>
      {pendingContracts.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma assinatura pendente</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {pendingContracts.map(c => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{c.contract_number}</p>
                  <p className="text-sm text-muted-foreground">{c.customer_name} - {c.vehicle_brand} {c.vehicle_model}</p>
                </div>
                <Button onClick={() => handleSign(c.id)} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Marcar como Assinado
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold flex items-center gap-2 mt-8">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Recém Assinados ({signedContracts.length})
      </h2>
      <div className="space-y-3">
        {signedContracts.slice(0, 10).map(c => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{c.contract_number}</p>
                <p className="text-sm text-muted-foreground">{c.customer_name}</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Assinado</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
